import bcrypt from 'bcryptjs';
import { loadConfig } from '../config.js';
import { closePool, query, withTransaction } from './pool.js';

export const DEMO_DEVICE_CODES = ['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05'] as const;

export async function seedDemoDevices(): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `DELETE FROM devices WHERE code = ANY($1::text[])`,
      [DEMO_DEVICE_CODES],
    );

    await client.query(`
      WITH ins AS (
        INSERT INTO devices (code, name, location, lat, lng, status, last_seen, api_key_hash, report_interval_s)
        VALUES
          ('ACT-01', 'Blok Teh Lembang Utara', 'Lembang, Bandung Barat', -6.8125, 107.6185, 'online', NOW() - INTERVAL '2 minutes', encode(digest('dev_seed_act01', 'sha256'), 'hex'), 300),
          ('ACT-02', 'Greenhouse Strawberry Ciwidey', 'Ciwidey, Kabupaten Bandung', -7.0928, 107.4562, 'online', NOW() - INTERVAL '4 minutes', encode(digest('dev_seed_act02', 'sha256'), 'hex'), 300),
          ('ACT-03', 'Lahan Kentang Pangalengan', 'Pangalengan, Bandung Selatan', -7.1782, 107.5714, 'online', NOW() - INTERVAL '1 minute', encode(digest('dev_seed_act03', 'sha256'), 'hex'), 300),
          ('ACT-04', 'Kebun Kopi Cikajang', 'Cikajang, Garut', -7.3654, 107.7921, 'maintenance', NOW() - INTERVAL '12 minutes', encode(digest('dev_seed_act04', 'sha256'), 'hex'), 600),
          ('ACT-05', 'Blok Hortikultura Dieng', 'Kejajar, Wonosobo', -7.2095, 109.9142, 'offline', NOW() - INTERVAL '3 hours', encode(digest('dev_seed_act05', 'sha256'), 'hex'), 300)
        RETURNING id
      )
      INSERT INTO device_thresholds (device_id, battery_pct_min, battery_voltage_min, offline_after_s)
      SELECT id, 20, 11.6, 900 FROM ins
    `);

    await client.query(`
      INSERT INTO sensor_readings (device_id, ts, temperature_c, soil_moisture_pct, soil_temp_c, ec, ph, received_at)
      SELECT
        d.id,
        gs.ts,
        ROUND((22.0 + 6.5 * SIN(EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') * 3.14159 / 12.0 - 1.5) + (RANDOM() * 1.6 - 0.8))::numeric, 1)::real,
        ROUND((
          CASE d.code
            WHEN 'ACT-01' THEN 54.0
            WHEN 'ACT-02' THEN 62.5
            WHEN 'ACT-03' THEN 48.0
            WHEN 'ACT-04' THEN 39.5
            ELSE 44.0
          END
          + 4.5 * COS(EXTRACT(EPOCH FROM gs.ts) / 43200.0)
          + (RANDOM() * 2.4 - 1.2)
        )::numeric, 1)::real,
        ROUND((20.5 + 3.0 * SIN(EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') * 3.14159 / 12.0 - 1.5) + (RANDOM() * 0.8 - 0.4))::numeric, 1)::real,
        ROUND((
          CASE d.code
            WHEN 'ACT-02' THEN 1120
            WHEN 'ACT-03' THEN 890
            ELSE 760
          END
          + (RANDOM() * 60 - 30)
        )::numeric, 0)::real,
        ROUND((6.3 + (RANDOM() * 0.3 - 0.15))::numeric, 2)::real,
        gs.ts
      FROM devices d
      CROSS JOIN generate_series(
        date_trunc('hour', NOW()) - INTERVAL '7 days',
        date_trunc('hour', NOW()),
        INTERVAL '1 hour'
      ) AS gs(ts)
      WHERE d.code IN ('ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05')
        AND NOT (d.code = 'ACT-05' AND gs.ts > NOW() - INTERVAL '3 hours')
      ON CONFLICT (device_id, ts) DO NOTHING
    `);

    await client.query(`
      INSERT INTO power_readings (device_id, ts, solar_voltage_v, solar_current_a, battery_voltage_v, battery_current_a, power_w, battery_pct, received_at)
      SELECT
        d.id,
        gs.ts,
        CASE
          WHEN EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') BETWEEN 6 AND 17
            THEN ROUND((17.2 + 2.2 * SIN((EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') - 6) * 3.14159 / 11.0) + (RANDOM() * 0.6 - 0.3))::numeric, 2)::real
          ELSE ROUND((0.1 + RANDOM() * 0.15)::numeric, 2)::real
        END,
        CASE
          WHEN EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') BETWEEN 6 AND 17
            THEN ROUND((0.55 + 0.85 * SIN((EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') - 6) * 3.14159 / 11.0) + (RANDOM() * 0.12 - 0.06))::numeric, 2)::real
          ELSE 0.0::real
        END,
        ROUND((
          CASE d.code
            WHEN 'ACT-04' THEN 11.45
            WHEN 'ACT-05' THEN 11.75
            ELSE 12.45
          END
          + 0.35 * SIN((EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') - 8) * 3.14159 / 12.0)
          + (RANDOM() * 0.08 - 0.04)
        )::numeric, 2)::real,
        CASE
          WHEN EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') BETWEEN 7 AND 16
            THEN ROUND((0.45 + RANDOM() * 0.35)::numeric, 2)::real
          ELSE ROUND((-0.18 - RANDOM() * 0.08)::numeric, 2)::real
        END,
        CASE
          WHEN EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') BETWEEN 6 AND 17
            THEN ROUND((12.0 + 11.5 * SIN((EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') - 6) * 3.14159 / 11.0) + (RANDOM() * 1.8 - 0.9))::numeric, 1)::real
          ELSE 0.0::real
        END,
        ROUND((
          CASE d.code
            WHEN 'ACT-01' THEN 88
            WHEN 'ACT-02' THEN 92
            WHEN 'ACT-03' THEN 79
            WHEN 'ACT-04' THEN 18
            ELSE 34
          END
          + 6 * SIN((EXTRACT(HOUR FROM gs.ts AT TIME ZONE 'Asia/Jakarta') - 8) * 3.14159 / 12.0)
        )::numeric, 0)::real,
        gs.ts
      FROM devices d
      CROSS JOIN generate_series(
        date_trunc('hour', NOW()) - INTERVAL '7 days',
        date_trunc('hour', NOW()),
        INTERVAL '1 hour'
      ) AS gs(ts)
      WHERE d.code IN ('ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05')
        AND NOT (d.code = 'ACT-05' AND gs.ts > NOW() - INTERVAL '3 hours')
      ON CONFLICT (device_id, ts) DO NOTHING
    `);

    await client.query(`
      INSERT INTO alerts (device_id, type, metric, value, threshold, triggered_at, status)
      SELECT id, 'battery_low', 'battery_pct', 18, 20, NOW() - INTERVAL '35 minutes', 'open'
      FROM devices WHERE code = 'ACT-04';

      INSERT INTO alerts (device_id, type, metric, value, threshold, triggered_at, status)
      SELECT id, 'offline', 'heartbeat', 10800, 900, NOW() - INTERVAL '2 hours 45 minutes', 'open'
      FROM devices WHERE code = 'ACT-05';

      INSERT INTO alerts (device_id, type, metric, value, threshold, triggered_at, status, acknowledged_by, acknowledged_at)
      SELECT id, 'battery_low', 'battery_voltage_v', 11.4, 11.6, NOW() - INTERVAL '5 hours', 'acknowledged', (SELECT id FROM users LIMIT 1), NOW() - INTERVAL '4 hours'
      FROM devices WHERE code = 'ACT-04';

      INSERT INTO alerts (device_id, type, metric, value, threshold, triggered_at, status, acknowledged_by, acknowledged_at, resolved_at)
      SELECT id, 'sensor_error', 'soil_moisture_pct', 104.2, 100, NOW() - INTERVAL '2 days', 'resolved', (SELECT id FROM users LIMIT 1), NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'
      FROM devices WHERE code = 'ACT-02';
    `);
  });
}

export async function clearDemoDevices(): Promise<number> {
  const res = await query(
    `DELETE FROM devices WHERE code = ANY($1::text[]) RETURNING id`,
    [DEMO_DEVICE_CODES],
  );
  return res.rowCount ?? 0;
}

export async function runSeed(): Promise<void> {
  const cfg = loadConfig();
  const hash = await bcrypt.hash(cfg.adminPassword, 10);

  await query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [cfg.adminEmail.toLowerCase(), hash],
  );
  console.log(`Admin ensured: ${cfg.adminEmail.toLowerCase()}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => seedDemoDevices())
    .then(() => closePool())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
