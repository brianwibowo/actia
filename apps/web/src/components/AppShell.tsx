import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Radio,
  Search,
  Sliders,
  Sun,
  Terminal,
  X,
} from 'lucide-react';
import { apiFetch, fmtNum } from '../lib/api';
import type { AuthUser, DeviceSummary } from '../types';
import { Button, Modal, StatusBadge } from './ui';

interface AppShellProps {
  user: AuthUser;
  devices: DeviceSummary[];
  openAlertsCount: number;
  streamConnected: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLoggedOut: () => void;
  children: ReactNode;
}

function resolveBreadcrumbs(
  pathname: string,
  devices: DeviceSummary[],
): Array<{ label: string; to?: string }> {
  if (pathname === '/') {
    return [{ label: 'Pantauan' }, { label: 'Peta & Ringkasan' }];
  }
  if (pathname.startsWith('/alerts')) {
    return [{ label: 'Pantauan', to: '/' }, { label: 'Pusat Alert' }];
  }
  if (pathname.startsWith('/devices/manage')) {
    return [{ label: 'Perangkat', to: '/' }, { label: 'Kelola Node & Device Key' }];
  }
  if (pathname.startsWith('/devices/')) {
    const id = pathname.replace('/devices/', '');
    const dev = devices.find((d) => d.id === id);
    return [
      { label: 'Node Lapangan', to: '/' },
      { label: dev ? `${dev.code} (${dev.name})` : 'Detail Node' },
    ];
  }
  if (pathname.startsWith('/settings')) {
    return [{ label: 'Konfigurasi', to: '/' }, { label: 'Ambang Batas & Akses' }];
  }
  return [{ label: 'Console Monitoring' }];
}

export function AppShell({
  user,
  devices,
  openAlertsCount,
  streamConnected,
  theme,
  onToggleTheme,
  onLoggedOut,
  children,
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setSearchFocused(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  async function handleLogout() {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      onLoggedOut();
      navigate('/login');
    }
  }

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const hasTelemetryData = devices.some((d) => d.last_seen !== null);
  const setupStepCount = (devices.length > 0 ? 1 : 0) + (hasTelemetryData ? 1 : 0);

  const quickResults = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return devices.slice(0, 6);
    return devices
      .filter(
        (d) =>
          d.code.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [devices, quickSearch]);

  const sampleOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://actia.duckdns.org';
  const sampleCurl = `curl -X POST ${sampleOrigin}/api/v1/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Key: dev_ISI_DEVICE_KEY_NODE" \\
  -d '{
    "sensor": {
      "temperature_c": 29.4,
      "soil_moisture_pct": 46.2,
      "soil_temp_c": 26.8,
      "ec": 820,
      "ph": 6.5
    },
    "power": {
      "solar_voltage_v": 18.4,
      "solar_current_a": 1.15,
      "battery_voltage_v": 12.7,
      "battery_current_a": 0.65,
      "power_w": 21.16,
      "battery_pct": 86
    }
  }'`;

  async function copySampleCurl() {
    await navigator.clipboard.writeText(sampleCurl);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 2500);
  }

  const initials = user.email.slice(0, 2).toUpperCase();
  const breadcrumbs = resolveBreadcrumbs(location.pathname, devices);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-[42px] items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-500/15 dark:text-emerald-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
    }`;

  return (
    <div className="flex min-h-[100dvh] bg-[#f6f8fa] dark:bg-[#090d11]">
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="primary-sidebar"
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-[#11171d] lg:sticky lg:top-0 lg:h-[100dvh] lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950">
              <Radio size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Actia Telemetry
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    onlineCount > 0
                      ? 'bg-emerald-600 dark:bg-emerald-400'
                      : 'bg-slate-400 dark:bg-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {devices.length > 0
                    ? `${onlineCount}/${devices.length} node online`
                    : 'Siap konfigurasi'}
                </span>
              </div>
            </div>
          </NavLink>

          <button
            type="button"
            aria-label="Tutup menu navigasi"
            onClick={() => setMenuOpen(false)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-4" aria-label="Alur kerja console">
          {/* Guided Onboarding Card in Sidebar if setup not yet complete */}
          {setupStepCount < 2 && (
            <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/70 p-3.5 dark:border-emerald-800/70 dark:bg-emerald-950/35">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <span>Alur Mulai Cepat</span>
                <span className="mono">{setupStepCount}/2</span>
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2
                    size={14}
                    className={
                      devices.length > 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-600'
                    }
                    aria-hidden="true"
                  />
                  <span className={devices.length > 0 ? 'line-through opacity-75' : 'font-semibold'}>
                    1. Buat node & ambil key
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2
                    size={14}
                    className={
                      hasTelemetryData
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-600'
                    }
                    aria-hidden="true"
                  />
                  <span className={hasTelemetryData ? 'line-through opacity-75' : 'font-semibold'}>
                    2. Kirim data sensor perdana
                  </span>
                </div>
              </div>
              <div className="mt-3">
                {devices.length === 0 && user.role === 'admin' ? (
                  <Link
                    to="/devices/manage?new=1"
                    className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950"
                  >
                    <Plus size={14} aria-hidden="true" />
                    <span>Tambah Node Pertama</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950"
                  >
                    <Terminal size={14} aria-hidden="true" />
                    <span>Lihat Cara Kirim Data</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stage 1: Monitoring & Triage */}
          <div>
            <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Pantauan & Triage
            </div>
            <div className="space-y-1">
              <NavLink to="/" end className={navLinkClass}>
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard size={17} aria-hidden="true" />
                  <span>Peta & Ringkasan</span>
                </span>
                <span className="mono text-xs text-slate-500 dark:text-slate-400">
                  {devices.length}
                </span>
              </NavLink>

              <NavLink to="/alerts" className={navLinkClass}>
                <span className="flex items-center gap-2.5">
                  <Bell size={17} aria-hidden="true" />
                  <span>Pusat Alert</span>
                </span>
                {openAlertsCount > 0 ? (
                  <span
                    className="mono rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300"
                    aria-label={`${openAlertsCount} alert terbuka`}
                  >
                    {openAlertsCount}
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">Aman</span>
                )}
              </NavLink>
            </div>
          </div>

          {/* Stage 2: Direct Field Nodes Explorer in Sidebar */}
          <div>
            <div className="flex items-center justify-between px-2.5 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Node Lapangan ({devices.length})
              </span>
              {user.role === 'admin' && (
                <Link
                  to="/devices/manage?new=1"
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
                  title="Tambah node baru"
                >
                  <Plus size={13} aria-hidden="true" />
                  <span>Baru</span>
                </Link>
              )}
            </div>

            {devices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                Belum ada node. Tambahkan node untuk memantau sensor & baterai langsung dari sidebar.
              </div>
            ) : (
              <div className="max-h-[230px] space-y-1 overflow-y-auto pr-0.5">
                {devices.map((d) => {
                  const dotColor =
                    d.status === 'online'
                      ? 'bg-emerald-600 dark:bg-emerald-400'
                      : d.status === 'maintenance'
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : 'bg-red-600 dark:bg-red-400';

                  return (
                    <NavLink
                      key={d.id}
                      to={`/devices/${d.id}`}
                      className={({ isActive }) =>
                        `group flex min-h-[40px] items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-xs transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-950 font-semibold dark:bg-emerald-500/15 dark:text-emerald-200'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                        }`
                      }
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`}
                          title={`Status: ${d.status}`}
                        />
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{d.name}</div>
                          <div className="mono truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {d.code}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {d.open_alerts > 0 ? (
                          <span className="mono rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                            {d.open_alerts}!
                          </span>
                        ) : (
                          <span className="mono text-[11px] text-slate-500 dark:text-slate-400">
                            {fmtNum(d.battery_pct, '%', 0)}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stage 3: Administration & Integration */}
          <div>
            <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Konfigurasi & Integrasi
            </div>
            <div className="space-y-1">
              {user.role === 'admin' && (
                <>
                  <NavLink to="/devices/manage" className={navLinkClass}>
                    <span className="flex items-center gap-2.5">
                      <Cpu size={17} aria-hidden="true" />
                      <span>Kelola Node & Key</span>
                    </span>
                  </NavLink>

                  <NavLink to="/settings" className={navLinkClass}>
                    <span className="flex items-center gap-2.5">
                      <Sliders size={17} aria-hidden="true" />
                      <span>Ambang Batas & Akun</span>
                    </span>
                  </NavLink>
                </>
              )}

              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="flex min-h-[42px] w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
              >
                <span className="flex items-center gap-2.5">
                  <Terminal size={17} aria-hidden="true" />
                  <span>Panduan API Ingest</span>
                </span>
                <ChevronRight size={15} className="text-slate-400" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-100 p-3.5 dark:border-slate-800">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#0d1318]">
            <div className="flex items-center gap-2.5">
              <div
                className="mono flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white dark:bg-emerald-400 dark:text-emerald-950"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100"
                  title={user.email}
                >
                  {user.email}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {user.role === 'admin' ? 'Administrator' : 'Operator / Viewer'}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Ubah tema terang atau gelap"
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#161f27] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {theme === 'light' ? (
                  <Moon size={14} aria-hidden="true" />
                ) : (
                  <Sun size={14} aria-hidden="true" />
                )}
                <span>{theme === 'light' ? 'Gelap' : 'Terang'}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:bg-[#161f27] dark:text-slate-200 dark:hover:bg-red-950/50 dark:hover:text-red-300"
              >
                <LogOut size={14} aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-sm dark:border-slate-800 dark:bg-[#11171d]/95 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              icon={<Menu size={17} aria-hidden="true" />}
              aria-expanded={menuOpen}
              aria-controls="primary-sidebar"
              onClick={() => setMenuOpen((v) => !v)}
            >
              Menu
            </Button>

            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
              {breadcrumbs.map((item, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <span key={idx} className="flex items-center gap-1.5">
                    {idx > 0 && (
                      <ChevronRight
                        size={14}
                        className="text-slate-400 dark:text-slate-500"
                        aria-hidden="true"
                      />
                    )}
                    {item.to && !isLast ? (
                      <Link
                        to={item.to}
                        className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global Quick Node Jump */}
            {devices.length > 0 && (
              <div className="relative hidden md:block">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Lompat cepat ke node"
                  placeholder="Lompat ke node..."
                  value={quickSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="min-h-[40px] w-[210px] rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-500 focus:border-emerald-700 focus:bg-white dark:border-slate-700 dark:bg-[#0d1318] dark:text-slate-100 dark:placeholder:text-slate-400"
                />
                {searchFocused && (
                  <div className="absolute right-0 top-full mt-1.5 w-[280px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-float dark:border-slate-700 dark:bg-[#11171d]">
                    <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Pilih Node Lapangan
                    </div>
                    {quickResults.length === 0 ? (
                      <div className="px-2.5 py-2 text-xs text-slate-500">
                        Node tidak ditemukan.
                      </div>
                    ) : (
                      quickResults.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onMouseDown={() => {
                            navigate(`/devices/${d.id}`);
                            setQuickSearch('');
                            setSearchFocused(false);
                          }}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {d.name}
                            </div>
                            <div className="mono text-[11px] text-slate-500 dark:text-slate-400">
                              {d.code} {d.location ? `• ${d.location}` : ''}
                            </div>
                          </div>
                          <StatusBadge status={d.status} label={d.status} />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                streamConnected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
              title="Status koneksi SSE real-time"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  streamConnected
                    ? 'bg-emerald-600 dark:bg-emerald-400'
                    : 'bg-slate-500 dark:bg-slate-400'
                }`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {streamConnected ? 'Stream Aktif' : 'Sinkronisasi Berkala'}
              </span>
            </span>

            {user.role === 'admin' && (
              <Link
                to="/devices/manage?new=1"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
              >
                <Plus size={15} aria-hidden="true" />
                <span>Tambah Node</span>
              </Link>
            )}
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Modal Panduan Integrasi Sensor / Ingest API */}
      <Modal
        open={guideOpen}
        title="Panduan Integrasi Sensor & Pengiriman Data (Ingest API)"
        onClose={() => setGuideOpen(false)}
        titleId="ingest-guide-modal-title"
      >
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <ol className="list-decimal space-y-2 pl-5 text-xs sm:text-sm">
            <li>
              Buka menu <strong>Kelola Node & Key</strong> lalu buat perangkat baru untuk mendapatkan{' '}
              <code className="mono rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                X-Device-Key
              </code>
              .
            </li>
            <li>
              Kirim pembacaan sensor tanah dan daya surya melalui HTTP{' '}
              <code className="mono rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                POST /api/v1/ingest
              </code>{' '}
              dari mikrokontroler (ESP32 / GSM / Gateway) atau uji langsung lewat terminal.
            </li>
            <li>
              Begitu data masuk, status node otomatis berubah menjadi <strong>Online</strong> dan grafik di halaman detail langsung terisi secara real-time.
            </li>
          </ol>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Contoh Perintah Uji Kirim Data (cURL):
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void copySampleCurl()}
                icon={copiedGuide ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              >
                {copiedGuide ? 'Tersalin' : 'Salin cURL'}
              </Button>
            </div>
            <pre className="mono overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs text-emerald-300 dark:border-slate-800">
              {sampleCurl}
            </pre>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {user.role === 'admin' && (
              <Button
                variant="primary"
                onClick={() => {
                  setGuideOpen(false);
                  navigate('/devices/manage?new=1');
                }}
                icon={<Plus size={16} aria-hidden="true" />}
              >
                Buat Node & Ambil Key
              </Button>
            )}
            <Button variant="secondary" onClick={() => setGuideOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
