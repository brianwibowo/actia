-- Skema awal monitoring sensor tanah & daya surya (PostgreSQL + TimescaleDB)

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')) DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_battery_pct_min REAL NOT NULL DEFAULT 20,
  default_battery_voltage_min REAL NOT NULL DEFAULT 11.6,
  default_offline_after_s INTEGER NOT NULL DEFAULT 900,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'maintenance')) DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  api_key_hash TEXT NOT NULL,
  report_interval_s INTEGER NOT NULL DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_thresholds (
  device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  battery_pct_min REAL NOT NULL DEFAULT 20,
  battery_voltage_min REAL NOT NULL DEFAULT 11.6,
  offline_after_s INTEGER NOT NULL DEFAULT 900
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGSERIAL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  temperature_c REAL,
  soil_moisture_pct REAL,
  soil_temp_c REAL,
  ec REAL,
  ph REAL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (device_id, ts, id),
  UNIQUE (device_id, ts)
);

SELECT create_hypertable('sensor_readings', 'ts', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_ts ON sensor_readings (device_id, ts DESC);

CREATE TABLE IF NOT EXISTS power_readings (
  id BIGSERIAL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  solar_voltage_v REAL,
  solar_current_a REAL,
  battery_voltage_v REAL,
  battery_current_a REAL,
  power_w REAL,
  battery_pct REAL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (device_id, ts, id),
  UNIQUE (device_id, ts)
);

SELECT create_hypertable('power_readings', 'ts', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_power_readings_device_ts ON power_readings (device_id, ts DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('battery_low', 'sensor_error', 'offline')),
  metric TEXT NOT NULL DEFAULT '',
  value REAL,
  threshold REAL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'resolved')) DEFAULT 'open',
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_status_triggered ON alerts (status, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_device_open ON alerts (device_id, type, metric) WHERE status IN ('open', 'acknowledged');
