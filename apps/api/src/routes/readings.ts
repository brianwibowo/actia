import type { FastifyInstance } from 'fastify';
import { query } from '../db/pool.js';
import { isUuid, sanitizeFilename } from '../lib/validate.js';
import { requireAuth } from '../plugins/auth.js';

const BUCKET_MAP: Record<string, string> = {
  raw: 'raw',
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '1h': '1 hour',
  '6h': '6 hours',
  '1d': '1 day',
};

function pickRange(fromRaw?: string, toRaw?: string): { from: Date; to: Date } {
  const to = toRaw ? new Date(toRaw) : new Date();
  const validTo = Number.isNaN(to.getTime()) ? new Date() : to;
  const from = fromRaw
    ? new Date(fromRaw)
    : new Date(validTo.getTime() - 24 * 60 * 60 * 1000);
  const validFrom = Number.isNaN(from.getTime())
    ? new Date(validTo.getTime() - 24 * 60 * 60 * 1000)
    : from;
  return { from: validFrom, to: validTo };
}

function resolveBucket(requested: string | undefined, from: Date, to: Date): string {
  if (requested && BUCKET_MAP[requested]) {
    return BUCKET_MAP[requested];
  }
  const spanHours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
  if (spanHours <= 24) return 'raw';
  if (spanHours <= 24 * 7) return '15 minutes';
  if (spanHours <= 24 * 31) return '1 hour';
  return '6 hours';
}

function csvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = val instanceof Date ? val.toISOString() : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export async function readingsRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/devices/:id/sensor-readings',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!isUuid(id)) {
        return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
      }
      const q = request.query as { from?: string; to?: string; bucket?: string };
      const { from, to } = pickRange(q.from, q.to);
      const bucket = resolveBucket(q.bucket, from, to);

      if (bucket === 'raw') {
        const res = await query(
          `SELECT ts, temperature_c, soil_moisture_pct, soil_temp_c, ec, ph
           FROM sensor_readings
           WHERE device_id = $1 AND ts >= $2 AND ts <= $3
           ORDER BY ts ASC
           LIMIT 5000`,
          [id, from, to],
        );
        return { bucket: 'raw', readings: res.rows };
      }

      const res = await query(
        `SELECT time_bucket($1::interval, ts) AS ts,
                ROUND(AVG(temperature_c)::numeric, 2)::real AS temperature_c,
                ROUND(AVG(soil_moisture_pct)::numeric, 2)::real AS soil_moisture_pct,
                ROUND(AVG(soil_temp_c)::numeric, 2)::real AS soil_temp_c,
                ROUND(AVG(ec)::numeric, 2)::real AS ec,
                ROUND(AVG(ph)::numeric, 2)::real AS ph
         FROM sensor_readings
         WHERE device_id = $2 AND ts >= $3 AND ts <= $4
         GROUP BY 1
         ORDER BY 1 ASC`,
        [bucket, id, from, to],
      );
      return { bucket, readings: res.rows };
    },
  );

  app.get(
    '/api/v1/devices/:id/power-readings',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!isUuid(id)) {
        return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
      }
      const q = request.query as { from?: string; to?: string; bucket?: string };
      const { from, to } = pickRange(q.from, q.to);
      const bucket = resolveBucket(q.bucket, from, to);

      if (bucket === 'raw') {
        const res = await query(
          `SELECT ts, solar_voltage_v, solar_current_a, battery_voltage_v,
                  battery_current_a, power_w, battery_pct
           FROM power_readings
           WHERE device_id = $1 AND ts >= $2 AND ts <= $3
           ORDER BY ts ASC
           LIMIT 5000`,
          [id, from, to],
        );
        return { bucket: 'raw', readings: res.rows };
      }

      const res = await query(
        `SELECT time_bucket($1::interval, ts) AS ts,
                ROUND(AVG(solar_voltage_v)::numeric, 2)::real AS solar_voltage_v,
                ROUND(AVG(solar_current_a)::numeric, 2)::real AS solar_current_a,
                ROUND(AVG(battery_voltage_v)::numeric, 2)::real AS battery_voltage_v,
                ROUND(AVG(battery_current_a)::numeric, 2)::real AS battery_current_a,
                ROUND(AVG(power_w)::numeric, 2)::real AS power_w,
                ROUND(AVG(battery_pct)::numeric, 1)::real AS battery_pct
         FROM power_readings
         WHERE device_id = $2 AND ts >= $3 AND ts <= $4
         GROUP BY 1
         ORDER BY 1 ASC`,
        [bucket, id, from, to],
      );
      return { bucket, readings: res.rows };
    },
  );

  app.get(
    '/api/v1/devices/:id/export.csv',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!isUuid(id)) {
        return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
      }
      const q = request.query as { type?: string; from?: string; to?: string };
      const { from, to } = pickRange(q.from, q.to);
      const exportType = q.type === 'power' ? 'power' : 'sensor';

      const devRes = await query<{ code: string }>('SELECT code FROM devices WHERE id = $1', [id]);
      if (!devRes.rows[0]) {
        return reply.code(404).send({ error: 'Perangkat tidak ditemukan' });
      }
      const safeCode = sanitizeFilename(devRes.rows[0].code);

      if (exportType === 'power') {
        const res = await query(
          `SELECT ts, solar_voltage_v, solar_current_a, battery_voltage_v,
                  battery_current_a, power_w, battery_pct, received_at
           FROM power_readings
           WHERE device_id = $1 AND ts >= $2 AND ts <= $3
           ORDER BY ts ASC
           LIMIT 50000`,
          [id, from, to],
        );
        const headers = [
          'ts',
          'solar_voltage_v',
          'solar_current_a',
          'battery_voltage_v',
          'battery_current_a',
          'power_w',
          'battery_pct',
          'received_at',
        ];
        const lines = [
          headers.join(','),
          ...res.rows.map((row) => headers.map((h) => csvCell(row[h])).join(',')),
        ];
        return reply
          .header('content-type', 'text/csv; charset=utf-8')
          .header('content-disposition', `attachment; filename="${safeCode}-power.csv"`)
          .send(lines.join('\n'));
      }

      const res = await query(
        `SELECT ts, temperature_c, soil_moisture_pct, soil_temp_c, ec, ph, received_at
         FROM sensor_readings
         WHERE device_id = $1 AND ts >= $2 AND ts <= $3
         ORDER BY ts ASC
         LIMIT 50000`,
        [id, from, to],
      );
      const headers = [
        'ts',
        'temperature_c',
        'soil_moisture_pct',
        'soil_temp_c',
        'ec',
        'ph',
        'received_at',
      ];
      const lines = [
        headers.join(','),
        ...res.rows.map((row) => headers.map((h) => csvCell(row[h])).join(',')),
      ];
      return reply
        .header('content-type', 'text/csv; charset=utf-8')
        .header('content-disposition', `attachment; filename="${safeCode}-sensor.csv"`)
        .send(lines.join('\n'));
    },
  );
}
