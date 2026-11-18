import type { PoolClient } from 'pg';

export interface SensorReadingInput {
  temperature_c?: number | null;
  soil_moisture_pct?: number | null;
  soil_temp_c?: number | null;
  ec?: number | null;
  ph?: number | null;
}

export interface PowerReadingInput {
  solar_voltage_v?: number | null;
  solar_current_a?: number | null;
  battery_voltage_v?: number | null;
  battery_current_a?: number | null;
  power_w?: number | null;
  battery_pct?: number | null;
}

export interface DeviceThresholdRow {
  battery_pct_min: number;
  battery_voltage_min: number;
  offline_after_s: number;
}

export interface AlertTransition {
  action: 'opened' | 'resolved';
  type: 'battery_low' | 'sensor_error' | 'offline';
  metric: string;
  value: number | null;
  threshold: number | null;
}

const SENSOR_BOUNDS: Record<keyof SensorReadingInput, { min: number; max: number; faultValues?: number[] }> = {
  temperature_c: { min: -40, max: 85, faultValues: [-127] },
  soil_moisture_pct: { min: 0, max: 100 },
  soil_temp_c: { min: -20, max: 70, faultValues: [-127] },
  ec: { min: 0, max: 20000 },
  ph: { min: 0, max: 14 },
};

// Histeresis 5% / 0.3V agar alert tidak bolak-balik saat tegangan di sekitar ambang batas.
const BATTERY_PCT_HYSTERESIS = 5;
const BATTERY_V_HYSTERESIS = 0.3;

export function detectSensorAnomalies(
  sensor: SensorReadingInput,
): Array<{ metric: string; value: number; threshold: number }> {
  const issues: Array<{ metric: string; value: number; threshold: number }> = [];

  for (const [metric, rule] of Object.entries(SENSOR_BOUNDS)) {
    const val = sensor[metric as keyof SensorReadingInput];
    if (val === undefined || val === null) continue;
    if (Number.isNaN(val)) {
      issues.push({ metric, value: val, threshold: rule.min });
      continue;
    }
    if (rule.faultValues?.includes(val)) {
      issues.push({ metric, value: val, threshold: rule.min });
      continue;
    }
    if (val < rule.min) {
      issues.push({ metric, value: val, threshold: rule.min });
    } else if (val > rule.max) {
      issues.push({ metric, value: val, threshold: rule.max });
    }
  }

  return issues;
}

export async function openAlertIfNotExists(
  client: PoolClient,
  deviceId: string,
  type: 'battery_low' | 'sensor_error' | 'offline',
  metric: string,
  value: number | null,
  threshold: number | null,
): Promise<boolean> {
  const existing = await client.query(
    `SELECT id FROM alerts
     WHERE device_id = $1 AND type = $2 AND metric = $3 AND status IN ('open', 'acknowledged')
     LIMIT 1`,
    [deviceId, type, metric],
  );
  if (existing.rowCount && existing.rowCount > 0) {
    return false;
  }

  await client.query(
    `INSERT INTO alerts (device_id, type, metric, value, threshold, status)
     VALUES ($1, $2, $3, $4, $5, 'open')`,
    [deviceId, type, metric, value, threshold],
  );
  return true;
}

export async function resolveAlertsForMetric(
  client: PoolClient,
  deviceId: string,
  type: 'battery_low' | 'sensor_error' | 'offline',
  metric: string,
): Promise<boolean> {
  const res = await client.query(
    `UPDATE alerts
     SET status = 'resolved', resolved_at = NOW()
     WHERE device_id = $1 AND type = $2 AND metric = $3 AND status IN ('open', 'acknowledged')`,
    [deviceId, type, metric],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function evaluateReadingAlerts(
  client: PoolClient,
  deviceId: string,
  thresholds: DeviceThresholdRow,
  sensor?: SensorReadingInput,
  power?: PowerReadingInput,
): Promise<AlertTransition[]> {
  const transitions: AlertTransition[] = [];

  if (sensor) {
    const anomalies = detectSensorAnomalies(sensor);
    const badMetrics = new Set(anomalies.map((a) => a.metric));

    for (const issue of anomalies) {
      const opened = await openAlertIfNotExists(
        client,
        deviceId,
        'sensor_error',
        issue.metric,
        issue.value,
        issue.threshold,
      );
      if (opened) {
        transitions.push({
          action: 'opened',
          type: 'sensor_error',
          metric: issue.metric,
          value: issue.value,
          threshold: issue.threshold,
        });
      }
    }

    for (const key of Object.keys(SENSOR_BOUNDS)) {
      const val = sensor[key as keyof SensorReadingInput];
      if (val !== undefined && val !== null && !badMetrics.has(key)) {
        const resolved = await resolveAlertsForMetric(client, deviceId, 'sensor_error', key);
        if (resolved) {
          transitions.push({
            action: 'resolved',
            type: 'sensor_error',
            metric: key,
            value: val,
            threshold: null,
          });
        }
      }
    }
  }

  if (power) {
    if (power.battery_pct !== undefined && power.battery_pct !== null) {
      if (power.battery_pct < thresholds.battery_pct_min) {
        const opened = await openAlertIfNotExists(
          client,
          deviceId,
          'battery_low',
          'battery_pct',
          power.battery_pct,
          thresholds.battery_pct_min,
        );
        if (opened) {
          transitions.push({
            action: 'opened',
            type: 'battery_low',
            metric: 'battery_pct',
            value: power.battery_pct,
            threshold: thresholds.battery_pct_min,
          });
        }
      } else if (power.battery_pct >= thresholds.battery_pct_min + BATTERY_PCT_HYSTERESIS) {
        const resolved = await resolveAlertsForMetric(client, deviceId, 'battery_low', 'battery_pct');
        if (resolved) {
          transitions.push({
            action: 'resolved',
            type: 'battery_low',
            metric: 'battery_pct',
            value: power.battery_pct,
            threshold: thresholds.battery_pct_min,
          });
        }
      }
    }

    if (power.battery_voltage_v !== undefined && power.battery_voltage_v !== null) {
      if (power.battery_voltage_v < thresholds.battery_voltage_min) {
        const opened = await openAlertIfNotExists(
          client,
          deviceId,
          'battery_low',
          'battery_voltage_v',
          power.battery_voltage_v,
          thresholds.battery_voltage_min,
        );
        if (opened) {
          transitions.push({
            action: 'opened',
            type: 'battery_low',
            metric: 'battery_voltage_v',
            value: power.battery_voltage_v,
            threshold: thresholds.battery_voltage_min,
          });
        }
      } else if (power.battery_voltage_v >= thresholds.battery_voltage_min + BATTERY_V_HYSTERESIS) {
        const resolved = await resolveAlertsForMetric(
          client,
          deviceId,
          'battery_low',
          'battery_voltage_v',
        );
        if (resolved) {
          transitions.push({
            action: 'resolved',
            type: 'battery_low',
            metric: 'battery_voltage_v',
            value: power.battery_voltage_v,
            threshold: thresholds.battery_voltage_min,
          });
        }
      }
    }
  }

  return transitions;
}
