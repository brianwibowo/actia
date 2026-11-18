import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  PageHeader,
  Select,
  StateBox,
  StatusBadge,
} from '../components/ui';
import { apiFetch, ApiError, formatWib } from '../lib/api';
import type { AlertItem, DeviceSummary } from '../types';

function alertTypeLabel(type: AlertItem['type']): string {
  if (type === 'battery_low') return 'Aki Lemah';
  if (type === 'sensor_error') return 'Sensor Anomali';
  return 'Perangkat Offline';
}

function alertStatusLabel(status: AlertItem['status']): string {
  if (status === 'open') return 'Terbuka';
  if (status === 'acknowledged') return 'Ditangani';
  return 'Pulih';
}

export function AlertsPage({
  devices,
  onChanged,
}: {
  devices: DeviceSummary[];
  onChanged: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadAlerts = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (deviceFilter) params.set('device_id', deviceFilter);
      const res = await apiFetch<{ alerts: AlertItem[] }>(`/api/v1/alerts?${params.toString()}`);
      setAlerts(res.alerts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat daftar peringatan');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, deviceFilter]);

  useEffect(() => {
    setLoading(true);
    void loadAlerts();
  }, [loadAlerts]);

  async function handleAck(id: number) {
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/alerts/${id}`, { method: 'PATCH' });
      await loadAlerts();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menandai peringatan');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Peringatan"
        subtitle="Riwayat peringatan baterai, sensor, dan perangkat offline."
      />

      {/* Shadcn DataTable Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filter status"
            className="w-auto min-w-[145px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua status</option>
            <option value="open">Terbuka</option>
            <option value="acknowledged">Ditangani</option>
            <option value="resolved">Pulih</option>
          </Select>

          <Select
            aria-label="Filter tipe"
            className="w-auto min-w-[155px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Semua tipe</option>
            <option value="battery_low">Aki Lemah</option>
            <option value="sensor_error">Sensor Anomali</option>
            <option value="offline">Perangkat Offline</option>
          </Select>

          <Select
            aria-label="Filter perangkat"
            className="w-auto min-w-[175px]"
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
          >
            <option value="">Semua perangkat</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </Select>
        </div>

        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {alerts.length} catatan
        </span>
      </div>

      {loading ? (
        <StateBox
          tone="loading"
          role="status"
          title="Memuat peringatan..."
          description="Mengambil riwayat peringatan terbaru."
        />
      ) : error ? (
        <StateBox tone="error" role="alert" title="Gagal memuat peringatan" description={error} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0c0c0f]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Perangkat</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Metrik</th>
                <th className="px-4 py-3">Nilai / Batas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Tidak ada peringatan pada filter ini.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                      {formatWib(a.triggered_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/devices/${a.device_id}`}
                        className="mono text-xs font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-100"
                      >
                        {a.device_code}
                      </Link>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {a.device_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {alertTypeLabel(a.type)}
                      </div>
                      <div className="mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {a.type}
                      </div>
                    </td>
                    <td className="mono px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                      {a.metric || '-'}
                    </td>
                    <td className="mono px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                      {a.value ?? '-'} / {a.threshold ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} label={alertStatusLabel(a.status)} />
                      {a.acknowledged_by_email && (
                        <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          oleh {a.acknowledged_by_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'open' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === a.id}
                          onClick={() => void handleAck(a.id)}
                        >
                          {busyId === a.id ? 'Menyimpan...' : 'Tandai Ditangani'}
                        </Button>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
