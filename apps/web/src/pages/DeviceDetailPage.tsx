import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Sliders } from 'lucide-react';
import { TimeSeriesChart, type ChartSeries } from '../components/TimeSeriesChart';
import {
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Select,
  StateBox,
  StatusBadge,
} from '../components/ui';
import { apiFetch, ApiError, fmtNum, formatRelativeTime, formatWib } from '../lib/api';
import type { AlertItem, AuthUser, DeviceSummary, PowerReading, SensorReading } from '../types';

type RangeKey = '24h' | '7d' | '30d';

function rangeDates(key: RangeKey): { from: string; to: string } {
  const to = new Date();
  const hours = key === '24h' ? 24 : key === '7d' ? 24 * 7 : 24 * 30;
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function DeviceDetailPage({
  user,
  devices,
  refreshToken,
}: {
  user: AuthUser;
  devices: DeviceSummary[];
  refreshToken: number;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>('24h');
  const [device, setDevice] = useState<DeviceSummary | null>(null);
  const [sensorRows, setSensorRows] = useState<SensorReading[]>([]);
  const [powerRows, setPowerRows] = useState<PowerReading[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setError('');
    try {
      const { from, to } = rangeDates(range);
      const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const [devRes, sensRes, powRes, alertRes] = await Promise.all([
        apiFetch<{ device: DeviceSummary }>(`/api/v1/devices/${id}`),
        apiFetch<{ readings: SensorReading[] }>(`/api/v1/devices/${id}/sensor-readings?${qs}`),
        apiFetch<{ readings: PowerReading[] }>(`/api/v1/devices/${id}/power-readings?${qs}`),
        apiFetch<{ alerts: AlertItem[] }>(`/api/v1/alerts?device_id=${encodeURIComponent(id)}`),
      ]);
      setDevice(devRes.device);
      setSensorRows(sensRes.readings);
      setPowerRows(powRes.readings);
      setAlerts(alertRes.alerts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat detail node');
    } finally {
      setLoading(false);
    }
  }, [id, range]);

  useEffect(() => {
    setLoading(true);
    void loadData();
  }, [loadData, refreshToken]);

  const sensorSeries = useMemo<ChartSeries[]>(() => {
    const out: ChartSeries[] = [
      {
        name: 'Suhu Udara (°C)',
        color: '#b45309',
        data: sensorRows.map((r) => [r.ts, r.temperature_c]),
      },
      {
        name: 'Soil Moisture (%)',
        color: '#047857',
        yAxisIndex: 1,
        data: sensorRows.map((r) => [r.ts, r.soil_moisture_pct]),
      },
    ];
    if (sensorRows.some((r) => r.soil_temp_c !== null)) {
      out.push({
        name: 'Suhu Tanah (°C)',
        color: '#0f766e',
        data: sensorRows.map((r) => [r.ts, r.soil_temp_c]),
      });
    }
    if (sensorRows.some((r) => r.ph !== null)) {
      out.push({
        name: 'pH Tanah',
        color: '#4338ca',
        data: sensorRows.map((r) => [r.ts, r.ph]),
      });
    }
    return out;
  }, [sensorRows]);

  const ecSeries = useMemo<ChartSeries[]>(() => {
    if (!sensorRows.some((r) => r.ec !== null)) return [];
    return [
      {
        name: 'Konduktivitas Listrik (EC)',
        color: '#047857',
        data: sensorRows.map((r) => [r.ts, r.ec]),
      },
    ];
  }, [sensorRows]);

  const powerSeries = useMemo<ChartSeries[]>(
    () => [
      {
        name: 'Tegangan Solar (V)',
        color: '#b45309',
        data: powerRows.map((r) => [r.ts, r.solar_voltage_v]),
      },
      {
        name: 'Tegangan Aki (V)',
        color: '#047857',
        data: powerRows.map((r) => [r.ts, r.battery_voltage_v]),
      },
      {
        name: 'Persen Baterai (%)',
        color: '#1d4ed8',
        yAxisIndex: 1,
        data: powerRows.map((r) => [r.ts, r.battery_pct]),
      },
    ],
    [powerRows],
  );

  const rangeLabel =
    range === '24h' ? '24 jam terakhir' : range === '7d' ? '7 hari terakhir' : '30 hari terakhir';
  const { from, to } = rangeDates(range);

  if (loading) {
    return (
      <StateBox
        tone="loading"
        role="status"
        title="Memuat detail node..."
        description="Mengambil pembacaan sensor dan daya dari server."
      />
    );
  }

  if (error || !device) {
    return (
      <StateBox
        tone="error"
        role="alert"
        title="Node tidak dapat dimuat"
        description={error || 'Node tidak ditemukan.'}
        action={
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161f27] dark:text-slate-100"
          >
            Kembali ke Ringkasan
          </Link>
        }
      />
    );
  }

  const statusLabel =
    device.status === 'online'
      ? 'Online'
      : device.status === 'maintenance'
        ? 'Pemeliharaan'
        : 'Offline';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <>
            <Link
              to="/"
              className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
            >
              Peta & Ringkasan
            </Link>
            <span className="text-slate-400">/</span>
            <StatusBadge status="neutral" withDot={false} label={device.code} className="mono" />
            <StatusBadge status={device.status} label={statusLabel} />
            {devices.length > 1 && (
              <Select
                aria-label="Pindah ke node lain"
                value={device.id}
                onChange={(e) => navigate(`/devices/${e.target.value}`)}
                className="ml-1 min-h-[34px] w-auto py-1 text-xs"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    Pindah: {d.code} - {d.name}
                  </option>
                ))}
              </Select>
            )}
          </>
        }
        title={device.name}
        subtitle={`${device.location || 'Lokasi belum diisi'} | Kiriman terakhir: ${formatRelativeTime(device.last_seen)} (${formatWib(device.last_seen)})`}
        actions={
          <>
            <div
              role="group"
              aria-label="Rentang waktu grafik"
              className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-[#11171d]"
            >
              {(['24h', '7d', '30d'] as RangeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    range === key
                      ? 'bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {key === '24h' ? '24 Jam' : key === '7d' ? '7 Hari' : '30 Hari'}
                </button>
              ))}
            </div>

            <a
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161f27] dark:text-slate-100 dark:hover:bg-slate-800"
              href={`/api/v1/devices/${device.id}/export.csv?type=sensor&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
            >
              <Download size={15} aria-hidden="true" />
              <span>CSV Sensor</span>
            </a>
            <a
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161f27] dark:text-slate-100 dark:hover:bg-slate-800"
              href={`/api/v1/devices/${device.id}/export.csv?type=power&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
            >
              <Download size={15} aria-hidden="true" />
              <span>CSV Daya</span>
            </a>

            {user.role === 'admin' && (
              <Link
                to={`/devices/manage?edit=${encodeURIComponent(device.id)}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161f27] dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <Sliders size={15} aria-hidden="true" />
                <span>Konfigurasi Node</span>
              </Link>
            )}
          </>
        }
      />

      {!device.last_seen && (
        <StateBox
          tone="neutral"
          title="Node ini belum mengirim data telemetri perdana"
          description="Gunakan X-Device-Key perangkat ini untuk mengirim data ke POST /api/v1/ingest, atau buat Device Key baru di halaman Kelola Node untuk menguji kiriman data secara instan."
          action={
            user.role === 'admin' ? (
              <Link
                to="/devices/manage"
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950"
              >
                Buka Kelola Node & Uji Kirim Data
              </Link>
            ) : undefined
          }
        />
      )}

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="relative min-h-[150px] md:col-span-4">
            <img
              src="/images/field-station.jpg"
              alt={`Perangkat lapangan ${device.name}`}
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent"
            />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <div className="mono text-xs font-semibold text-emerald-300">{device.code}</div>
              <div className="text-sm font-bold">{device.location || 'Lokasi Lapangan'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 p-5 sm:grid-cols-3 md:col-span-8">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#0d1318]">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Suhu Udara</div>
              <div className="mono mt-1.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                {fmtNum(device.temperature_c, ' °C')}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#0d1318]">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Kelembapan Tanah</div>
              <div className="mono mt-1.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                {fmtNum(device.soil_moisture_pct, '%')}
              </div>
            </div>

            {device.soil_temp_c !== null && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#0d1318]">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Suhu Tanah</div>
                <div className="mono mt-1.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                  {fmtNum(device.soil_temp_c, ' °C')}
                </div>
              </div>
            )}

            {device.ec !== null && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#0d1318]">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">EC Tanah</div>
                <div className="mono mt-1.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                  {fmtNum(device.ec, '', 0)}
                </div>
              </div>
            )}

            {device.ph !== null && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#0d1318]">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">pH Tanah</div>
                <div className="mono mt-1.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                  {fmtNum(device.ph, '', 2)}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#0d1318]">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Baterai / Aki</div>
              <div className="mono mt-1.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                {fmtNum(device.battery_pct, '%', 0)}
              </div>
              <div className="mono mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {fmtNum(device.battery_voltage_v, ' V', 2)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#0d1318]">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Daya Panel Surya</div>
              <div className="mono mt-1.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                {fmtNum(device.power_w, ' W', 1)}
              </div>
              <div className="mono mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {fmtNum(device.solar_voltage_v, ' V', 1)} / {fmtNum(device.solar_current_a, ' A', 2)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <TimeSeriesChart
          title={`Tren Suhu & Kelembapan Tanah (${rangeLabel})`}
          subtitle="Pembacaan sensor lingkungan dan media tanam"
          yLeftLabel="°C / pH"
          yRightLabel="%"
          series={sensorSeries}
          emptyMessage="Belum ada data pembacaan sensor pada rentang waktu ini."
        />

        {ecSeries.length > 0 && (
          <TimeSeriesChart
            title={`Konduktivitas Tanah / EC (${rangeLabel})`}
            subtitle="Tingkat salinitas & nutrisi terlarut pada tanah"
            yLeftLabel="EC"
            series={ecSeries}
            emptyMessage="Belum ada data EC pada rentang waktu ini."
          />
        )}

        <TimeSeriesChart
          title={`Tegangan Solar, Tegangan Aki & Kapasitas Baterai (${rangeLabel})`}
          subtitle="Performa pengisian daya surya dan cadangan baterai node"
          yLeftLabel="Volt (V)"
          yRightLabel="Baterai (%)"
          series={powerSeries}
          emptyMessage="Belum ada data daya pada rentang waktu ini."
        />
      </div>

      <Card>
        <CardHeader
          title="Riwayat Alert Node Ini"
          description="Catatan peringatan yang pernah tercatat pada perangkat ini."
        />
        <CardBody>
          {alerts.length === 0 ? (
            <StateBox description="Belum pernah ada alert tercatat untuk node ini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-[#0d1318] dark:text-slate-400">
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Metrik</th>
                    <th className="px-4 py-3">Nilai / Batas</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                        {formatWib(a.triggered_at)}
                      </td>
                      <td className="mono px-4 py-3 text-xs font-medium">{a.type}</td>
                      <td className="mono px-4 py-3 text-xs">{a.metric || '-'}</td>
                      <td className="mono px-4 py-3 text-xs">
                        {a.value ?? '-'} / {a.threshold ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} label={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
