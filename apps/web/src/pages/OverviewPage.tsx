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
        title="Ringkasan Node Lapangan"
        subtitle="Pantau kondisi sensor tanah, daya surya, dan peringatan aktif di setiap lokasi."
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
                to="/devices/manage"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Kelola Node</span>
              </Link>
            )}
          </>
        }
      />

      {loading ? (
        <StateBox
          tone="loading"
          role="status"
          title="Memuat data perangkat..."
          description="Mengambil pembacaan terakhir dari server Actia Telemetry."
        />
      ) : error ? (
        <StateBox
          tone="error"
          role="alert"
          title="Gagal memuat ringkasan"
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
            <div className="relative min-h-[220px] md:col-span-5">
              <img
                src="/images/weather-station.jpg"
                alt="Stasiun pemantauan telemetri lapangan bertenaga surya"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent"
              />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Node Telemetri Lapangan
                </div>
                <div className="mt-0.5 text-sm font-bold">
                  Sensor Tanah, Cuaca & Panel Surya
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center p-6 md:col-span-7 sm:p-8">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Belum ada node terdaftar
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Daftarkan node lapangan pertama Anda untuk mendapatkan device key, memetakan koordinat GPS, dan mulai menerima data suhu, kelembapan tanah, pH, EC, serta daya panel surya.
              </p>
              {user.role === 'admin' && (
                <div className="mt-5">
                  <Link
                    to="/devices/manage"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950"
                  >
                    <Plus size={16} aria-hidden="true" />
                    <span>Daftarkan Node Pertama</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="relative min-h-[170px] lg:col-span-4">
                <img
                  src="/images/agri-solar.jpg"
                  alt="Pemantauan lahan pertanian dan panel surya Actia Telemetry"
                  className="h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/40 to-transparent"
                />
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Actia Field Network
                  </div>
                  <div className="mt-0.5 text-base font-bold">
                    {onlineCount} dari {devices.length} node aktif
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:col-span-8 xl:grid-cols-4">
                <StatCard
                  label="Total Node"
                  value={devices.length}
                  tone="neutral"
                  icon={<Cpu size={18} aria-hidden="true" />}
                  sublabel={
                    maintenanceCount > 0
                      ? `${maintenanceCount} dalam pemeliharaan`
                      : 'Perangkat terdaftar aktif'
                  }
                />

                <StatCard
                  label="Node Online"
                  value={onlineCount}
                  tone="ok"
                  progressPct={onlinePct}
                  icon={<Wifi size={18} aria-hidden="true" />}
                  sublabel={`${onlinePct}% terhubung`}
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
                        {offlineCount} node offline
                      </span>
                    ) : (
                      'Semua node terhubung'
                    )
                  }
                />

                <StatCard
                  label="Alert Terbuka"
                  value={openAlerts.length}
                  tone={openAlerts.length > 0 ? 'warn' : 'ok'}
                  icon={<AlertTriangle size={18} aria-hidden="true" />}
                  sublabel={
                    openAlerts.length > 0 ? (
                      <Link
                        to="/alerts"
                        className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        Tinjau alert terbuka
                      </Link>
                    ) : (
                      'Ambang batas aman'
                    )
                  }
                />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <CardHeader
                title="Sebaran Node di Peta"
                description="Klik marker untuk melihat ringkasan, atau klik ganda untuk detail node."
              />
              <CardBody>
                {hasGeo ? (
                  <>
                    <NodeMap
                      devices={devices}
                      height={430}
                      onSelectDevice={(id) => navigate(`/devices/${id}`)}
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <StatusBadge status="online" label="Online" />
                      <StatusBadge status="maintenance" label="Alert / Pemeliharaan" />
                      <StatusBadge status="offline" label="Offline" />
                    </div>
                  </>
                ) : (
                  <StateBox
                    title="Koordinat node belum diisi"
                    description="Tambahkan latitude dan longitude pada node di menu Kelola Node agar tampil di peta."
                  />
                )}
              </CardBody>
            </Card>

            <Card className="xl:col-span-5">
              <CardHeader
                title="Status Node Lapangan"
                description={`Menampilkan ${filteredDevices.length} dari ${devices.length} node.`}
              />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <SearchInput
                    aria-label="Cari kode, nama, atau lokasi node"
                    placeholder="Cari kode, nama, lokasi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Select
                    aria-label="Filter status node"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="w-auto min-w-[140px]"
                  >
                    <option value="all">Semua status</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="alert">Dengan alert</option>
                  </Select>
                </div>

                {filteredDevices.length === 0 ? (
                  <StateBox
                    title="Tidak ada node yang cocok"
                    description="Ubah kata kunci pencarian atau pilih filter status lainnya."
                  />
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 dark:divide-slate-800 dark:border-slate-800">
                    {filteredDevices.map((d) => {
                      const battPct = d.battery_pct ?? 0;
                      const lowBatt = d.battery_pct !== null && d.battery_pct <= 25;
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
                          className="group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                {d.code}
                              </span>
                              <StatusBadge status={d.status} label={statusLabel} />
                              {d.open_alerts > 0 && (
                                <StatusBadge
                                  status="acknowledged"
                                  withDot={false}
                                  label={`${d.open_alerts} alert`}
                                />
                              )}
                            </div>
                            <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {d.name}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                              <span>{d.location || 'Lokasi belum diisi'}</span>
                              <span>Update {formatRelativeTime(d.last_seen)}</span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3 text-right">
                            <div className="hidden sm:block">
                              <div className="mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                                Soil {fmtNum(d.soil_moisture_pct, '%')}
                              </div>
                              <div className="mono mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                                Batt {fmtNum(d.battery_pct, '%', 0)}
                              </div>
                              {d.battery_pct !== null && (
                                <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                  <div
                                    className={`h-full rounded-full ${
                                      lowBatt
                                        ? 'bg-red-600 dark:bg-red-400'
                                        : 'bg-emerald-600 dark:bg-emerald-400'
                                    }`}
                                    style={{ width: `${Math.max(5, Math.min(100, battPct))}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            <ChevronRight
                              size={18}
                              className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-200"
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
