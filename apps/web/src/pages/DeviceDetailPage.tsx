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
      setError(err instanceof ApiError ? err.message : 'Gagal memuat detail perangkat');
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
        color: '#ea580c',
        data: sensorRows.map((r) => [r.ts, r.temperature_c]),
      },
      {
        name: 'Soil Moisture (%)',
        color: '#10b981',
        yAxisIndex: 1,
        data: sensorRows.map((r) => [r.ts, r.soil_moisture_pct]),
      },
    ];
    if (sensorRows.some((r) => r.soil_temp_c !== null)) {
      out.push({
        name: 'Suhu Tanah (°C)',
        color: '#0ea5e9',
        data: sensorRows.map((r) => [r.ts, r.soil_temp_c]),
      });
    }
    if (sensorRows.some((r) => r.ph !== null)) {
      out.push({
        name: 'pH Tanah',
        color: '#8b5cf6',
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
        color: '#10b981',
        data: sensorRows.map((r) => [r.ts, r.ec]),
      },
    ];
  }, [sensorRows]);

  const powerSeries = useMemo<ChartSeries[]>(
    () => [
      {
        name: 'Tegangan Solar (V)',
        color: '#f59e0b',
        data: powerRows.map((r) => [r.ts, r.solar_voltage_v]),
      },
      {
        name: 'Tegangan Aki (V)',
        color: '#10b981',
        data: powerRows.map((r) => [r.ts, r.battery_voltage_v]),
      },
      {
        name: 'Persen Baterai (%)',
        color: '#3b82f6',
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
        title="Memuat detail perangkat..."
        description="Mengambil pembacaan sensor dan daya dari server."
      />
    );
  }

  if (error || !device) {
    return (
      <StateBox
        tone="error"
        role="alert"
        title="Perangkat tidak dapat dimuat"
        description={error || 'Perangkat tidak ditemukan.'}
        action={
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            Kembali ke Dashboard
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
    <div className="space-y-4">
      <PageHeader
        eyebrow={
          <>
            <StatusBadge status="neutral" withDot={false} label={device.code} className="mono" />
            <StatusBadge status={device.status} label={statusLabel} />
            {devices.length > 1 && (
              <Select
                aria-label="Pindah perangkat"
                value={device.id}
                onChange={(e) => navigate(`/devices/${e.target.value}`)}
                className="ml-1 min-h-[30px] w-auto py-0.5 text-xs"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </Select>
            )}
          </>
        }
        title={device.name}
        subtitle={`${device.location || 'Lokasi belum diisi'} • Update: ${formatRelativeTime(device.last_seen)} (${formatWib(device.last_seen)})`}
        actions={
          <>
            <div
              role="group"
              aria-label="Rentang waktu grafik"
              className="inline-flex h-9 items-center rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/80"
            >
              {(['24h', '7d', '30d'] as RangeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    range === key
                      ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {key === '24h' ? '24 Jam' : key === '7d' ? '7 Hari' : '30 Hari'}
                </button>
              ))}
            </div>

            <a
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              href={`/api/v1/devices/${device.id}/export.csv?type=sensor&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
            >
              <Download size={14} aria-hidden="true" />
              <span>CSV Sensor</span>
            </a>
            <a
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              href={`/api/v1/devices/${device.id}/export.csv?type=power&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
            >
              <Download size={14} aria-hidden="true" />
              <span>CSV Daya</span>
            </a>

            {user.role === 'admin' && (
              <Link
                to={`/devices/manage?edit=${encodeURIComponent(device.id)}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <Sliders size={14} aria-hidden="true" />
                <span>Ubah</span>
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Suhu Udara</div>
          <div className="mono mt-1.5 text-xl font-bold">{fmtNum(device.temperature_c, ' °C')}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Kelembapan Tanah</div>
          <div className="mono mt-1.5 text-xl font-bold">{fmtNum(device.soil_moisture_pct, '%')}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Suhu Tanah</div>
          <div className="mono mt-1.5 text-xl font-bold">{fmtNum(device.soil_temp_c, ' °C')}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">pH / EC Tanah</div>
          <div className="mono mt-1.5 text-xl font-bold">
            {fmtNum(device.ph, '', 2)} / {fmtNum(device.ec, '', 0)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Baterai / Aki</div>
          <div className="mono mt-1.5 text-xl font-bold">{fmtNum(device.battery_pct, '%', 0)}</div>
          <div className="mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {fmtNum(device.battery_voltage_v, ' V', 2)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Daya Surya</div>
          <div className="mono mt-1.5 text-xl font-bold">{fmtNum(device.power_w, ' W', 1)}</div>
          <div className="mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {fmtNum(device.solar_voltage_v, ' V', 1)} • {fmtNum(device.solar_current_a, ' A', 2)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <TimeSeriesChart
          title={`Tren Suhu & Kelembapan Tanah (${rangeLabel})`}
          yLeftLabel="°C / pH"
          yRightLabel="%"
          series={sensorSeries}
          emptyMessage="Belum ada data pembacaan sensor pada rentang waktu ini."
        />

        {ecSeries.length > 0 && (
          <TimeSeriesChart
            title={`Konduktivitas Tanah / EC (${rangeLabel})`}
            yLeftLabel="EC"
            series={ecSeries}
            emptyMessage="Belum ada data EC pada rentang waktu ini."
          />
        )}

        <TimeSeriesChart
          title={`Tegangan Solar, Tegangan Aki & Kapasitas Baterai (${rangeLabel})`}
          yLeftLabel="Volt (V)"
          yRightLabel="Baterai (%)"
          series={powerSeries}
          emptyMessage="Belum ada data daya pada rentang waktu ini."
        />
      </div>

      <Card>
        <CardHeader
          title="Riwayat Peringatan Perangkat"
          description="Catatan peringatan pada perangkat ini."
        />
        <CardBody>
          {alerts.length === 0 ? (
            <StateBox description="Belum pernah ada peringatan tercatat untuk perangkat ini." />
          ) : (
            <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                    <th className="px-4 py-2.5">Waktu</th>
                    <th className="px-4 py-2.5">Tipe</th>
                    <th className="px-4 py-2.5">Metrik</th>
                    <th className="px-4 py-2.5">Nilai / Batas</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40">
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatWib(a.triggered_at)}
                      </td>
                      <td className="mono px-4 py-2.5 text-xs font-medium">{a.type}</td>
                      <td className="mono px-4 py-2.5 text-xs">{a.metric || '-'}</td>
                      <td className="mono px-4 py-2.5 text-xs">
                        {a.value ?? '-'} / {a.threshold ?? '-'}
                      </td>
                      <td className="px-4 py-2.5">
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
