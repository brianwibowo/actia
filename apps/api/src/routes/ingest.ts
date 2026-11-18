import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import {
  evaluateReadingAlerts,
  resolveAlertsForMetric,
  type AlertTransition,
  type DeviceThresholdRow,
} from '../services/alert-evaluator.js';
import { hashDeviceKey } from '../services/device-key.js';
import { eventBus } from '../services/events.js';
import { sendTelegramAlert } from '../services/notifier.js';

const sensorSchema = z.object({
  temperature_c: z.number().finite().nullable().optional(),
  soil_moisture_pct: z.number().finite().nullable().optional(),
  soil_temp_c: z.number().finite().nullable().optional(),
  ec: z.number().finite().nullable().optional(),
  ph: z.number().finite().nullable().optional(),
});

const powerSchema = z.object({
  solar_voltage_v: z.number().finite().nullable().optional(),
  solar_current_a: z.number().finite().nullable().optional(),
  battery_voltage_v: z.number().finite().nullable().optional(),
  battery_current_a: z.number().finite().nullable().optional(),
  power_w: z.number().finite().nullable().optional(),
  battery_pct: z.number().finite().nullable().optional(),
});

const readingItemSchema = z
  .object({
    ts: z.string().datetime({ offset: true }).optional(),
    sensor: sensorSchema.optional(),
    power: powerSchema.optional(),
  })
  .refine((item) => item.sensor !== undefined || item.power !== undefined, {
    message: 'Minimal sensor atau power harus diisi',
  });

const ingestBodySchema = z.union([
  readingItemSchema,
  z.array(readingItemSchema).min(1).max(200),
]);

const MAX_FUTURE_DRIFT_MS = 5 * 60 * 1000;

export function resolveTimestamp(rawTs: string | undefined, now: Date): Date {
  if (!rawTs) return now;
  const parsed = new Date(rawTs);
  if (Number.isNaN(parsed.getTime())) return now;
  if (parsed.getTime() - now.getTime() > MAX_FUTURE_DRIFT_MS) return now;
  return parsed;
}

export async function ingestRoutes(
  app: FastifyInstance,
  opts: { telegramBotToken: string; telegramChatId: string },
) {
  const handleIngest = async (request: FastifyRequest, reply: FastifyReply) => {
    const rawKey = request.headers['x-device-key'];
      if (typeof rawKey !== 'string' || !rawKey.trim()) {
        return reply.code(401).send({ error: 'Header X-Device-Key wajib diisi' });
      }

      const parsed = ingestBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Format payload tidak valid' });
      }

      const keyHash = hashDeviceKey(rawKey.trim());
      const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

      const deviceRes = await query<{
        id: string;
        code: string;
        name: string;
        status: string;
        battery_pct_min: number | null;
        battery_voltage_min: number | null;
        offline_after_s: number | null;
      }>(
        `SELECT d.id, d.code, d.name, d.status,
                dt.battery_pct_min, dt.battery_voltage_min, dt.offline_after_s
         FROM devices d
         LEFT JOIN device_thresholds dt ON dt.device_id = d.id
         WHERE d.api_key_hash = $1
         LIMIT 1`,
        [keyHash],
      );

      const device = deviceRes.rows[0];
      if (!device) {
        return reply.code(401).send({ error: 'Device key tidak dikenal' });
      }

      const sysRes = await query<{
        default_battery_pct_min: number;
        default_battery_voltage_min: number;
        default_offline_after_s: number;
      }>(
        `SELECT default_battery_pct_min, default_battery_voltage_min, default_offline_after_s
         FROM system_settings WHERE id = 1`,
      );
      const defaults = sysRes.rows[0];
      const thresholds: DeviceThresholdRow = {
        battery_pct_min: device.battery_pct_min ?? defaults?.default_battery_pct_min ?? 20,
        battery_voltage_min:
          device.battery_voltage_min ?? defaults?.default_battery_voltage_min ?? 11.6,
        offline_after_s: device.offline_after_s ?? defaults?.default_offline_after_s ?? 900,
      };

      const now = new Date();
      let latestTs = new Date(0);
      const allTransitions: AlertTransition[] = [];

      await withTransaction(async (client) => {
        const sortedItems = [...items].sort((a, b) => {
          const ta = resolveTimestamp(a.ts, now).getTime();
          const tb = resolveTimestamp(b.ts, now).getTime();
          return ta - tb;
        });

        for (const item of sortedItems) {
          const ts = resolveTimestamp(item.ts, now);
          if (ts > latestTs) latestTs = ts;

          if (item.sensor) {
            await client.query(
              `INSERT INTO sensor_readings (
                device_id, ts, temperature_c, soil_moisture_pct, soil_temp_c, ec, ph, received_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (device_id, ts) DO UPDATE SET
                temperature_c = COALESCE(EXCLUDED.temperature_c, sensor_readings.temperature_c),
                soil_moisture_pct = COALESCE(EXCLUDED.soil_moisture_pct, sensor_readings.soil_moisture_pct),
                soil_temp_c = COALESCE(EXCLUDED.soil_temp_c, sensor_readings.soil_temp_c),
                ec = COALESCE(EXCLUDED.ec, sensor_readings.ec),
                ph = COALESCE(EXCLUDED.ph, sensor_readings.ph)`,
              [
                device.id,
                ts,
                item.sensor.temperature_c ?? null,
                item.sensor.soil_moisture_pct ?? null,
                item.sensor.soil_temp_c ?? null,
                item.sensor.ec ?? null,
                item.sensor.ph ?? null,
                now,
              ],
            );
          }

          if (item.power) {
            await client.query(
              `INSERT INTO power_readings (
                device_id, ts, solar_voltage_v, solar_current_a, battery_voltage_v,
                battery_current_a, power_w, battery_pct, received_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (device_id, ts) DO UPDATE SET
                solar_voltage_v = COALESCE(EXCLUDED.solar_voltage_v, power_readings.solar_voltage_v),
                solar_current_a = COALESCE(EXCLUDED.solar_current_a, power_readings.solar_current_a),
                battery_voltage_v = COALESCE(EXCLUDED.battery_voltage_v, power_readings.battery_voltage_v),
                battery_current_a = COALESCE(EXCLUDED.battery_current_a, power_readings.battery_current_a),
                power_w = COALESCE(EXCLUDED.power_w, power_readings.power_w),
                battery_pct = COALESCE(EXCLUDED.battery_pct, power_readings.battery_pct)`,
              [
                device.id,
                ts,
                item.power.solar_voltage_v ?? null,
                item.power.solar_current_a ?? null,
                item.power.battery_voltage_v ?? null,
                item.power.battery_current_a ?? null,
                item.power.power_w ?? null,
                item.power.battery_pct ?? null,
                now,
              ],
            );
          }

          const transitions = await evaluateReadingAlerts(
            client,
            device.id,
            thresholds,
            item.sensor,
            item.power,
          );
          allTransitions.push(...transitions);
        }

        const offlineResolved = await resolveAlertsForMetric(client, device.id, 'offline', 'heartbeat');
        if (offlineResolved) {
          allTransitions.push({
            action: 'resolved',
            type: 'offline',
            metric: 'heartbeat',
            value: null,
            threshold: null,
          });
        }

        const nextStatus = device.status === 'maintenance' ? 'maintenance' : 'online';
        await client.query(
          `UPDATE devices
           SET last_seen = GREATEST(COALESCE(last_seen, $2), $2),
               status = $3
           WHERE id = $1`,
          [device.id, now, nextStatus],
        );
      });

      eventBus.publish({
        type: 'reading',
        deviceId: device.id,
        ts: latestTs.toISOString(),
      });
      if (device.status !== 'online' && device.status !== 'maintenance') {
        eventBus.publish({ type: 'device_status', deviceId: device.id, status: 'online' });
      }

      for (const tr of allTransitions) {
        eventBus.publish({
          type: 'alert',
          action: tr.action,
          deviceId: device.id,
          alertType: tr.type,
        });
        const label = tr.action === 'opened' ? 'ALERT BARU' : 'ALERT PULIH';
        const detail =
          tr.value !== null && tr.threshold !== null
            ? ` (${tr.metric}: ${tr.value}, batas: ${tr.threshold})`
            : tr.metric
              ? ` (${tr.metric})`
              : '';
        void sendTelegramAlert(
          opts.telegramBotToken,
          opts.telegramChatId,
          `[${label}] ${device.code} ${device.name}: ${tr.type}${detail}`,
        );
      }

      return { ok: true };
  };

  app.post('/api/v1/ingest', handleIngest);
}
