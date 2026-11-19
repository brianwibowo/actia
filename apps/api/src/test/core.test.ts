import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPositiveIntId,
  isUuid,
  parseOptionalDate,
  sanitizeFilename,
} from '../lib/validate.js';
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

test('validators reject malformed IDs/dates and sanitize CSV filenames', () => {
  assert.equal(isUuid('550e8400-e29b-41d4-a716-446655440000'), true);
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isPositiveIntId('42'), true);
  assert.equal(isPositiveIntId('0'), false);
  assert.equal(isPositiveIntId('abc'), false);
  assert.equal(parseOptionalDate('invalid-date'), null);
  assert.ok(parseOptionalDate('2026-11-18T10:00:00Z') instanceof Date);
  assert.equal(sanitizeFilename('ACT/01 "test"\r\n'), 'ACT_01__test');
});
