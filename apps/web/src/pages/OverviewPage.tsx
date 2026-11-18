import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Cpu,
  Plus,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { NodeMap } from '../components/NodeMap';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  SearchInput,
  Select,
  StatCard,
  StateBox,
  StatusBadge,
} from '../components/ui';
import { fmtNum, formatRelativeTime } from '../lib/api';
import type { AlertItem, AuthUser, DeviceSummary } from '../types';

interface OverviewPageProps {
  user: AuthUser;
  devices: DeviceSummary[];
  openAlerts: AlertItem[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onChanged: () => void;
}

type StatusFilter = 'all' | 'online' | 'offline' | 'alert';

export function OverviewPage({
  user,
  devices,
  openAlerts,
  loading,
  error,
  onRetry,
}: OverviewPageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const maintenanceCount = devices.filter((d) => d.status === 'maintenance').length;
  const hasGeo = devices.some((d) => d.lat !== null && d.lng !== null);
  const onlinePct = devices.length > 0 ? Math.round((onlineCount / devices.length) * 100) : 0;

  const avgBatteryPct = useMemo(() => {
    const vals = devices
      .map((d) => d.battery_pct)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((acc, v) => acc + v, 0) / vals.length);
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter((d) => {
      if (statusFilter === 'online' && d.status !== 'online') return false;
      if (statusFilter === 'offline' && d.status !== 'offline') return false;
      if (statusFilter === 'alert' && d.open_alerts === 0) return false;
      if (!q) return true;
      return (
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
      );
    });
  }, [devices, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw size={14} aria-hidden="true" />}
          >
            Muat Ulang
          </Button>
          {user.role === 'admin' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/devices/manage?new=1')}
              icon={<Plus size={14} aria-hidden="true" />}
            >
              Tambah Perangkat
            </Button>
          )}
        </div>
      </div>

      {/* Shadcn Tabs bar */}
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 p-1 text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-white px-3 py-1 text-xs font-medium text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
        >
          Overview
        </button>
        {user.role === 'admin' && (
          <button
            type="button"
            onClick={() => navigate('/devices/manage')}
            className="inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Perangkat ({devices.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/alerts')}
          className="inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Peringatan ({openAlerts.length})
        </button>
      </div>

      {loading ? (
        <StateBox
          tone="loading"
          role="status"
          title="Memuat data..."
          description="Mengambil pembacaan terakhir dari server."
        />
      ) : error ? (
        <StateBox
          tone="error"
          role="alert"
          title="Gagal memuat data"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Coba Lagi
            </Button>
          }
        />
      ) : devices.length === 0 ? (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="relative min-h-[240px] md:col-span-5">
              <img
                src="/images/weather-station.jpg"
                alt="Stasiun sensor lapangan"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-center p-6 md:col-span-7 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Belum ada perangkat terdaftar
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Tambahkan perangkat pertama untuk mendapatkan Device Key dan mulai memantau data sensor tanah serta daya surya.
              </p>

              {user.role === 'admin' && (
                <div className="mt-5">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/devices/manage?new=1')}
                    icon={<Plus size={15} aria-hidden="true" />}
                  >
                    Tambah Perangkat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <section
            aria-label="Ringkasan metrik"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              label="Total Perangkat"
              value={devices.length}
              icon={<Cpu size={16} aria-hidden="true" />}
              sublabel={
                maintenanceCount > 0
                  ? `${maintenanceCount} dalam pemeliharaan`
                  : 'Perangkat lapangan terdaftar'
              }
            />

            <StatCard
              label="Perangkat Online"
              value={onlineCount}
              icon={<Wifi size={16} aria-hidden="true" />}
              sublabel={`${onlinePct}% dari total perangkat`}
            />

            <StatCard
              label="Rata-rata Baterai"
              value={avgBatteryPct !== null ? `${avgBatteryPct}%` : '-'}
              icon={<BatteryCharging size={16} aria-hidden="true" />}
              sublabel={
                offlineCount > 0
                  ? `${offlineCount} perangkat offline`
                  : 'Seluruh perangkat terhubung'
              }
            />

            <StatCard
              label="Peringatan Aktif"
              value={openAlerts.length}
              icon={<AlertTriangle size={16} aria-hidden="true" />}
              sublabel={
                openAlerts.length > 0 ? (
                  <Link
                    to="/alerts"
                    className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Tinjau peringatan terbuka
                  </Link>
                ) : (
                  'Semua ambang batas normal'
                )
              }
            />
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader
                title="Peta Lokasi Perangkat"
                description="Klik ganda pada titik perangkat untuk melihat detail grafik."
              />
              <CardBody>
                {hasGeo ? (
                  <>
                    <NodeMap
                      devices={devices}
                      height={380}
                      onSelectDevice={(id) => navigate(`/devices/${id}`)}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status="online" label="Online" />
                      <StatusBadge status="maintenance" label="Peringatan" />
                      <StatusBadge status="offline" label="Offline" />
                    </div>
                  </>
                ) : (
                  <StateBox
                    title="Koordinat belum diisi"
                    description="Isi latitude dan longitude perangkat di menu Perangkat untuk menampilkan peta."
                  />
                )}
              </CardBody>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader
                title="Status Perangkat"
                description={`Menampilkan ${filteredDevices.length} dari ${devices.length} perangkat.`}
              />
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2">
                  <SearchInput
                    aria-label="Cari perangkat"
                    placeholder="Filter perangkat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Select
                    aria-label="Filter status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="w-auto min-w-[115px]"
                  >
                    <option value="all">Semua</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="alert">Alert</option>
                  </Select>
                </div>

                {filteredDevices.length === 0 ? (
                  <StateBox description="Tidak ada perangkat yang cocok." />
                ) : (
                  <div className="space-y-3">
                    {filteredDevices.map((d) => {
                      const statusLabel =
                        d.status === 'online'
                          ? 'Online'
                          : d.status === 'maintenance'
                            ? 'Pemeliharaan'
                            : 'Offline';

                      return (
                        <Link
                          key={d.id}
                          to={`/devices/${d.id}`}
                          className="flex items-center justify-between gap-4 rounded-lg border border-transparent p-2 transition-colors hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/60"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                              <Activity size={15} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium leading-none text-zinc-950 dark:text-zinc-50">
                                  {d.name}
                                </p>
                                <StatusBadge status={d.status} label={statusLabel} />
                              </div>
                              <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                                <span className="mono">{d.code}</span> • {formatRelativeTime(d.last_seen)}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="mono text-sm font-medium text-zinc-950 dark:text-zinc-50">
                              {fmtNum(d.soil_moisture_pct, '%')}
                            </div>
                            <div className="mono text-xs text-zinc-500 dark:text-zinc-400">
                              Batt {fmtNum(d.battery_pct, '%', 0)}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
