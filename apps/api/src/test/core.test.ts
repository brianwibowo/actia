import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTimestamp } from '../routes/ingest.js';
import { detectSensorAnomalies } from '../services/alert-evaluator.js';
import { generateDeviceKey, hashDeviceKey } from '../services/device-key.js';

test('detectSensorAnomalies flags out-of-range and DS18B20 fault codes', () => {
  const issues = detectSensorAnomalies({
    temperature_c: -127,
    soil_moisture_pct: 108,
    ph: 15,
    ec: 500,
  });

  assert.equal(issues.length, 3);
  assert.deepEqual(
    issues.map((i) => i.metric).sort(),
    ['ph', 'soil_moisture_pct', 'temperature_c'],
  );
});

test('detectSensorAnomalies ignores normal and omitted optional sensors', () => {
  const issues = detectSensorAnomalies({
    temperature_c: 29.5,
    soil_moisture_pct: 45,
    soil_temp_c: null,
  });
  assert.equal(issues.length, 0);
});

test('resolveTimestamp rejects clocks drifted far into the future', () => {
  const now = new Date('2026-11-18T10:00:00Z');
  const validPast = resolveTimestamp('2026-11-18T09:50:00Z', now);
  assert.equal(validPast.toISOString(), '2026-11-18T09:50:00.000Z');

  const futureDrift = resolveTimestamp('2026-11-18T10:20:00Z', now);
  assert.equal(futureDrift.toISOString(), now.toISOString());

  const missing = resolveTimestamp(undefined, now);
  assert.equal(missing.toISOString(), now.toISOString());
});

test('generateDeviceKey produces unique keys whose SHA-256 hash matches', () => {
  const a = generateDeviceKey();
  const b = generateDeviceKey();
  assert.notEqual(a.raw, b.raw);
  assert.equal(a.raw.startsWith('dev_'), true);
  assert.equal(hashDeviceKey(a.raw), a.hash);
});
