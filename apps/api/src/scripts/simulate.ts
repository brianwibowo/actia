// Simulator node lapangan untuk menguji ingest, peta, grafik, dan alert tanpa hardware asli.
const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const DEVICE_KEY = process.env.DEVICE_KEY ?? '';
const INTERVAL_S = Number(process.env.INTERVAL_S ?? 10);

if (!DEVICE_KEY) {
  console.error('Set env DEVICE_KEY dulu. Contoh: DEVICE_KEY=dev_xxx npm --workspace=apps/api run simulate');
  process.exit(1);
}

function jitter(base: number, span: number, digits = 2): number {
  const val = base + (Math.random() - 0.5) * span;
  return Number(val.toFixed(digits));
}

async function sendTick() {
  const hour = new Date().getHours();
  const isDay = hour >= 7 && hour <= 17;
  const solarV = isDay ? jitter(18.2, 2.0) : jitter(0.3, 0.2);
  const solarA = isDay ? jitter(0.95, 0.4) : 0;
  const battPct = jitter(78, 8, 1);
  const battV = Number((11.8 + (battPct / 100) * 1.1).toFixed(2));
  const battA = Number((solarA - 0.25).toFixed(2));

  const payload = {
    ts: new Date().toISOString(),
    sensor: {
      temperature_c: isDay ? jitter(30.5, 2.4) : jitter(24.2, 1.4),
      soil_moisture_pct: jitter(42.5, 4.0),
      soil_temp_c: jitter(26.8, 1.2),
      ec: jitter(840, 60, 0),
      ph: jitter(6.4, 0.3),
    },
    power: {
      solar_voltage_v: solarV,
      solar_current_a: solarA,
      battery_voltage_v: battV,
      battery_current_a: battA,
      power_w: Number((solarV * solarA).toFixed(2)),
      battery_pct: battPct,
    },
  };

  const res = await fetch(`${API_URL}/api/v1/ingest`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-device-key': DEVICE_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`Ingest gagal (${res.status}):`, await res.text());
    return;
  }
  console.log(`[${new Date().toISOString()}] Terkirim -> temp=${payload.sensor.temperature_c}C soil=${payload.sensor.soil_moisture_pct}% batt=${payload.power.battery_pct}%`);
}

console.log(`Simulator mengirim ke ${API_URL} setiap ${INTERVAL_S} detik...`);
void sendTick();
setInterval(() => void sendTick(), INTERVAL_S * 1000);
