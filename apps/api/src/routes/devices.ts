import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { clearDemoDevices, seedDemoDevices } from '../db/seed.js';
import { query, withTransaction } from '../db/pool.js';
import { isUuid } from '../lib/validate.js';
import { requireAdmin, requireAuth } from '../plugins/auth.js';
import { generateDeviceKey } from '../services/device-key.js';

const createDeviceSchema = z.object({
  code: z.string().trim().min(2).max(32),
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().max(200).default(''),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  report_interval_s: z.number().int().min(10).max(86400).default(300),
  thresholds: z
    .object({
      battery_pct_min: z.number().min(0).max(100),
      battery_voltage_min: z.number().min(0).max(60),
      offline_after_s: z.number().int().min(30).max(604800),
    })
    .optional(),
});

const updateDeviceSchema = z.object({
  code: z.string().trim().min(2).max(32).optional(),
  name: z.string().trim().min(2).max(100).optional(),
  location: z.string().trim().max(200).optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  status: z.enum(['online', 'offline', 'maintenance']).optional(),
  report_interval_s: z.number().int().min(10).max(86400).optional(),
  thresholds: z
    .object({
      battery_pct_min: z.number().min(0).max(100),
      battery_voltage_min: z.number().min(0).max(60),
      offline_after_s: z.number().int().min(30).max(604800),
    })
    .optional(),
});

export async function deviceRoutes(app: FastifyInstance) {
  app.get('/api/v1/devices', { preHandler: requireAuth }, async () => {
    const res = await query(
      `SELECT d.id, d.code, d.name, d.location, d.lat, d.lng, d.status, d.last_seen,
              d.report_interval_s, d.created_at,
              dt.battery_pct_min, dt.battery_voltage_min, dt.offline_after_s,
              sr.ts AS sensor_ts, sr.temperature_c, sr.soil_moisture_pct,
              sr.soil_temp_c, sr.ec, sr.ph,
              pr.ts AS power_ts, pr.solar_voltage_v, pr.solar_current_a,
              pr.battery_voltage_v, pr.battery_current_a, pr.power_w, pr.battery_pct,
              COALESCE(al.open_alerts, 0)::int AS open_alerts
       FROM devices d
       LEFT JOIN device_thresholds dt ON dt.device_id = d.id
       LEFT JOIN LATERAL (
         SELECT ts, temperature_c, soil_moisture_pct, soil_temp_c, ec, ph
         FROM sensor_readings
         WHERE device_id = d.id
         ORDER BY ts DESC
         LIMIT 1
       ) sr ON TRUE
       LEFT JOIN LATERAL (
         SELECT ts, solar_voltage_v, solar_current_a, battery_voltage_v,
                battery_current_a, power_w, battery_pct
         FROM power_readings
         WHERE device_id = d.id
         ORDER BY ts DESC
         LIMIT 1
       ) pr ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS open_alerts
         FROM alerts
         WHERE device_id = d.id AND status = 'open'
       ) al ON TRUE
       ORDER BY d.code ASC`,
    );

    return { devices: res.rows };
  });

  app.get('/api/v1/devices/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!isUuid(id)) {
      return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
    }

    const res = await query(
      `SELECT d.id, d.code, d.name, d.location, d.lat, d.lng, d.status, d.last_seen,
              d.report_interval_s, d.created_at,
              dt.battery_pct_min, dt.battery_voltage_min, dt.offline_after_s,
              sr.ts AS sensor_ts, sr.temperature_c, sr.soil_moisture_pct,
              sr.soil_temp_c, sr.ec, sr.ph,
              pr.ts AS power_ts, pr.solar_voltage_v, pr.solar_current_a,
              pr.battery_voltage_v, pr.battery_current_a, pr.power_w, pr.battery_pct,
              COALESCE(al.open_alerts, 0)::int AS open_alerts
       FROM devices d
       LEFT JOIN device_thresholds dt ON dt.device_id = d.id
       LEFT JOIN LATERAL (
         SELECT ts, temperature_c, soil_moisture_pct, soil_temp_c, ec, ph
         FROM sensor_readings WHERE device_id = d.id ORDER BY ts DESC LIMIT 1
       ) sr ON TRUE
       LEFT JOIN LATERAL (
         SELECT ts, solar_voltage_v, solar_current_a, battery_voltage_v,
                battery_current_a, power_w, battery_pct
         FROM power_readings WHERE device_id = d.id ORDER BY ts DESC LIMIT 1
       ) pr ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS open_alerts
         FROM alerts
         WHERE device_id = d.id AND status = 'open'
       ) al ON TRUE
       WHERE d.id = $1`,
      [id],
    );

    if (!res.rows[0]) {
      return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
    }
    return { device: res.rows[0] };
  });

  app.post('/api/v1/devices', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = createDeviceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Input tidak valid' });
    }

    const { code, name, location, lat, lng, report_interval_s, thresholds } = parsed.data;
    const { raw, hash } = generateDeviceKey();

    try {
      const created = await withTransaction(async (client) => {
        const devRes = await client.query<{ id: string }>(
          `INSERT INTO devices (code, name, location, lat, lng, api_key_hash, report_interval_s)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [code, name, location, lat ?? null, lng ?? null, hash, report_interval_s],
        );
        const deviceId = devRes.rows[0].id;

        const sysRes = await client.query<{
          default_battery_pct_min: number;
          default_battery_voltage_min: number;
          default_offline_after_s: number;
        }>(
          'SELECT default_battery_pct_min, default_battery_voltage_min, default_offline_after_s FROM system_settings WHERE id = 1',
        );
        const def = sysRes.rows[0];
        await client.query(
          `INSERT INTO device_thresholds (device_id, battery_pct_min, battery_voltage_min, offline_after_s)
           VALUES ($1, $2, $3, $4)`,
          [
            deviceId,
            thresholds?.battery_pct_min ?? def?.default_battery_pct_min ?? 20,
            thresholds?.battery_voltage_min ?? def?.default_battery_voltage_min ?? 11.6,
            thresholds?.offline_after_s ?? Math.max(report_interval_s * 3, def?.default_offline_after_s ?? 900),
          ],
        );

        const row = await client.query(
          `SELECT d.id, d.code, d.name, d.location, d.lat, d.lng, d.status, d.last_seen,
                  d.report_interval_s, d.created_at,
                  dt.battery_pct_min, dt.battery_voltage_min, dt.offline_after_s
           FROM devices d
           LEFT JOIN device_thresholds dt ON dt.device_id = d.id
           WHERE d.id = $1`,
          [deviceId],
        );
        return row.rows[0];
      });

      return reply.code(201).send({ device: created, device_key: raw });
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        return reply.code(409).send({ error: `Kode perangkat "${code}" sudah dipakai` });
      }
      throw err;
    }
  });

  app.patch('/api/v1/devices/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!isUuid(id)) {
      return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
    }

    const parsed = updateDeviceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Input tidak valid' });
    }

    const d = parsed.data;
    try {
      const updated = await withTransaction(async (client) => {
        const existing = await client.query('SELECT id FROM devices WHERE id = $1', [id]);
        if (existing.rowCount === 0) return null;

        await client.query(
          `UPDATE devices SET
            code = COALESCE($2, code),
            name = COALESCE($3, name),
            location = COALESCE($4, location),
            lat = CASE WHEN $5::boolean THEN $6 ELSE lat END,
            lng = CASE WHEN $7::boolean THEN $8 ELSE lng END,
            status = COALESCE($9, status),
            report_interval_s = COALESCE($10, report_interval_s)
           WHERE id = $1`,
          [
            id,
            d.code ?? null,
            d.name ?? null,
            d.location ?? null,
            d.lat !== undefined,
            d.lat ?? null,
            d.lng !== undefined,
            d.lng ?? null,
            d.status ?? null,
            d.report_interval_s ?? null,
          ],
        );

        if (d.thresholds) {
          await client.query(
            `INSERT INTO device_thresholds (device_id, battery_pct_min, battery_voltage_min, offline_after_s)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (device_id) DO UPDATE SET
               battery_pct_min = EXCLUDED.battery_pct_min,
               battery_voltage_min = EXCLUDED.battery_voltage_min,
               offline_after_s = EXCLUDED.offline_after_s`,
            [
              id,
              d.thresholds.battery_pct_min,
              d.thresholds.battery_voltage_min,
              d.thresholds.offline_after_s,
            ],
          );
        }

        const res = await client.query(
          `SELECT d.id, d.code, d.name, d.location, d.lat, d.lng, d.status, d.last_seen,
                  d.report_interval_s, d.created_at,
                  dt.battery_pct_min, dt.battery_voltage_min, dt.offline_after_s
           FROM devices d
           LEFT JOIN device_thresholds dt ON dt.device_id = d.id
           WHERE d.id = $1`,
          [id],
        );
        return res.rows[0];
      });

      if (!updated) {
        return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
      }
      return { device: updated };
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        return reply.code(409).send({ error: `Kode perangkat "${d.code}" sudah dipakai` });
      }
      throw err;
    }
  });

  app.delete('/api/v1/devices/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!isUuid(id)) {
      return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
    }
    const res = await query('DELETE FROM devices WHERE id = $1 RETURNING id', [id]);
    if (res.rowCount === 0) {
      return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
    }
    return { ok: true };
  });

  app.post(
    '/api/v1/devices/:id/rotate-key',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!isUuid(id)) {
        return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
      }
      const { raw, hash } = generateDeviceKey();
      const res = await query(
        'UPDATE devices SET api_key_hash = $2 WHERE id = $1 RETURNING id, code',
        [id, hash],
      );
      if (res.rowCount === 0) {
        return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
      }
      return { device_key: raw };
    },
  );

  app.post('/api/v1/devices/seed-demo', { preHandler: requireAdmin }, async () => {
    await seedDemoDevices();
    return { ok: true };
  });

  app.delete('/api/v1/devices/seed-demo', { preHandler: requireAdmin }, async () => {
    const deleted = await clearDemoDevices();
    return { ok: true, deleted };
  });
}
