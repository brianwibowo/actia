import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
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
  return 'Node Offline';
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
      setError(err instanceof ApiError ? err.message : 'Gagal memuat daftar alert');
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
      setError(err instanceof ApiError ? err.message : 'Gagal acknowledge alert');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Daftar Alert"
        subtitle="Pantau kondisi aki lemah, pembacaan sensor di luar rentang, dan node offline."
        actions={
          <>
            <Select
              aria-label="Filter status alert"
              className="w-auto min-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua status</option>
              <option value="open">Terbuka (Open)</option>
              <option value="acknowledged">Ditangani (Ack)</option>
              <option value="resolved">Pulih (Resolved)</option>
            </Select>

            <Select
              aria-label="Filter tipe alert"
              className="w-auto min-w-[160px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Semua tipe</option>
              <option value="battery_low">Aki Lemah</option>
              <option value="sensor_error">Sensor Anomali</option>
              <option value="offline">Node Offline</option>
            </Select>

            <Select
              aria-label="Filter perangkat"
              className="w-auto min-w-[180px]"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
            >
              <option value="">Semua node</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </Select>
          </>
        }
      />

      {loading ? (
        <StateBox
          tone="loading"
          role="status"
          title="Memuat alert..."
          description="Mengambil riwayat alert terbaru dari server."
        />
      ) : error ? (
        <StateBox tone="error" role="alert" title="Gagal memuat alert" description={error} />
      ) : alerts.length === 0 ? (
        <StateBox
          title="Tidak ada alert pada filter ini"
          description="Semua node berjalan normal atau coba ubah filter status di atas."
        />
      ) : (
        <Card>
          <CardHeader
            title="Log Peringatan"
            description={`Menampilkan ${alerts.length} catatan alert.`}
          />
          <CardBody className="p-0 sm:p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-[#0d1318] dark:text-slate-400">
                    <th className="px-5 py-3.5">Waktu</th>
                    <th className="px-5 py-3.5">Node</th>
                    <th className="px-5 py-3.5">Tipe</th>
                    <th className="px-5 py-3.5">Metrik</th>
                    <th className="px-5 py-3.5">Nilai / Batas</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-700 dark:text-slate-300">
                        {formatWib(a.triggered_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/devices/${a.device_id}`}
                          className="mono font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                        >
                          {a.device_code}
                        </Link>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {a.device_name}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {alertTypeLabel(a.type)}
                        </div>
                        <div className="mono text-xs text-slate-500 dark:text-slate-400">
                          {a.type}
                        </div>
                      </td>
                      <td className="mono px-5 py-3.5 text-xs">{a.metric || '-'}</td>
                      <td className="mono px-5 py-3.5 text-xs">
                        {a.value ?? '-'} / {a.threshold ?? '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={a.status} label={alertStatusLabel(a.status)} />
                        {a.acknowledged_by_email && (
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            oleh {a.acknowledged_by_email}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
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
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
