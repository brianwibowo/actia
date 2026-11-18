import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BatteryCharging,
  ChevronRight,
  Cpu,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { NodeMap } from '../components/NodeMap';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
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
    <>
      <PageHeader
        title="Overview"
        subtitle="Pantauan real-time perangkat sensor tanah dan daya surya."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              icon={<RefreshCw size={15} aria-hidden="true" />}
            >
              Muat Ulang
            </Button>
            {user.role === 'admin' && (
              <Link
                to="/devices/manage?new=1"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Tambah Perangkat</span>
              </Link>
            )}
          </>
        }
      />

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
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Belum ada perangkat terdaftar
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Tambahkan perangkat pertama untuk mendapatkan Device Key dan mulai memantau data sensor.
              </p>

              {user.role === 'admin' && (
                <div className="mt-5">
                  <Link
                    to="/devices/manage?new=1"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950"
                  >
                    <Plus size={16} aria-hidden="true" />
                    <span>Tambah Perangkat</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <section
            aria-label="Ringkasan metrik"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              label="Total Perangkat"
              value={devices.length}
              tone="neutral"
              icon={<Cpu size={18} aria-hidden="true" />}
              sublabel={
                maintenanceCount > 0
                  ? `${maintenanceCount} pemeliharaan`
                  : 'Terdaftar'
              }
            />

            <StatCard
              label="Online"
              value={onlineCount}
              tone="ok"
              progressPct={onlinePct}
              icon={<Wifi size={18} aria-hidden="true" />}
              sublabel={`${onlinePct}% aktif`}
            />

            <StatCard
              label="Rata-rata Baterai"
              value={avgBatteryPct !== null ? `${avgBatteryPct}%` : '-'}
              tone={avgBatteryPct !== null && avgBatteryPct <= 25 ? 'danger' : 'ok'}
              progressPct={avgBatteryPct}
              icon={<BatteryCharging size={18} aria-hidden="true" />}
              sublabel={
                offlineCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-300">
                    <WifiOff size={13} aria-hidden="true" />
                    {offlineCount} offline
                  </span>
                ) : (
                  'Normal'
                )
              }
            />

            <StatCard
              label="Peringatan Aktif"
              value={openAlerts.length}
              tone={openAlerts.length > 0 ? 'warn' : 'ok'}
              icon={<AlertTriangle size={18} aria-hidden="true" />}
              sublabel={
                openAlerts.length > 0 ? (
                  <Link
                    to="/alerts"
                    className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                  >
                    Lihat peringatan
                  </Link>
                ) : (
                  'Aman'
                )
              }
            />
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <CardHeader title="Peta Lokasi" />
              <CardBody>
                {hasGeo ? (
                  <>
                    <NodeMap
                      devices={devices}
                      height={420}
                      onSelectDevice={(id) => navigate(`/devices/${id}`)}
                    />
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
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

            <Card className="xl:col-span-5">
              <CardHeader title={`Perangkat (${filteredDevices.length})`} />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SearchInput
                    aria-label="Cari perangkat"
                    placeholder="Cari perangkat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Select
                    aria-label="Filter status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="w-auto min-w-[130px]"
                  >
                    <option value="all">Semua</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="alert">Peringatan</option>
                  </Select>
                </div>

                {filteredDevices.length === 0 ? (
                  <StateBox description="Tidak ada perangkat yang cocok." />
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 dark:divide-slate-800 dark:border-slate-800">
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
                          className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {d.name}
                              </span>
                              <StatusBadge status={d.status} label={statusLabel} />
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="mono">{d.code}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(d.last_seen)}</span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3 text-right">
                            <div className="hidden sm:block">
                              <div className="mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {fmtNum(d.soil_moisture_pct, '%')}
                              </div>
                              <div className="mono text-[11px] text-slate-500 dark:text-slate-400">
                                Batt {fmtNum(d.battery_pct, '%', 0)}
                              </div>
                            </div>

                            <ChevronRight
                              size={16}
                              className="text-slate-400 transition-transform group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
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
    </>
  );
}
