import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  ChevronsUpDown,
  Command,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Search,
  Sliders,
  Sun,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { AuthUser, DeviceSummary } from '../types';
import { StatusBadge } from './ui';

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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('actia_sidebar_collapsed') === '1';
  });
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('actia_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed((v) => !v);
      } else if (e.key === 'Escape') {
        setMobileOpen(false);
        setCmdOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function handleLogout() {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      onLoggedOut();
      navigate('/login');
    }
  }

  const initials = user.email.slice(0, 2).toUpperCase();
  const isDevicesActive = location.pathname.startsWith('/devices');

  const generalItems = [
    {
      label: 'Dashboard',
      to: '/',
      end: true,
      active: location.pathname === '/',
      icon: LayoutDashboard,
      badge: undefined as number | undefined,
    },
    ...(user.role === 'admin'
      ? [
          {
            label: 'Perangkat',
            to: '/devices/manage',
            end: false,
            active: isDevicesActive,
            icon: Cpu,
            badge: devices.length > 0 ? devices.length : undefined,
          },
        ]
      : []),
    {
      label: 'Peringatan',
      to: '/alerts',
      end: false,
      active: location.pathname.startsWith('/alerts'),
      icon: Bell,
      badge: openAlertsCount > 0 ? openAlertsCount : undefined,
    },
  ];

  const otherItems =
    user.role === 'admin'
      ? [
          {
            label: 'Pengaturan',
            to: '/settings',
            end: false,
            active: location.pathname.startsWith('/settings'),
            icon: Sliders,
          },
        ]
      : [];

  const filteredCmdDevices = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return devices.slice(0, 6);
    return devices
      .filter(
        (d) =>
          d.code.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [devices, cmdQuery]);

  const filteredCmdPages = useMemo(() => {
    const allPages = [
      { label: 'Dashboard Overview', to: '/' },
      ...(user.role === 'admin'
        ? [
            { label: 'Perangkat (Kelola Node)', to: '/devices/manage' },
            { label: 'Tambah Perangkat Baru', to: '/devices/manage?new=1' },
          ]
        : []),
      { label: 'Peringatan (Alerts)', to: '/alerts' },
      ...(user.role === 'admin' ? [{ label: 'Pengaturan Sistem', to: '/settings' }] : []),
    ];
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return allPages;
    return allPages.filter((p) => p.label.toLowerCase().includes(q));
  }, [cmdQuery, user.role]);

  return (
    <div className="flex min-h-[100dvh] bg-white text-zinc-950 dark:bg-[#09090b] dark:text-zinc-50">
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (satnaing/shadcn-admin style) */}
      <aside
        id="primary-sidebar"
        aria-label="Sidebar navigasi"
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/70 transition-all duration-200 dark:border-zinc-800 dark:bg-[#0c0c0f] lg:sticky lg:top-0 lg:h-[100dvh] lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[64px]' : 'lg:w-60'}`}
      >
        {/* Sidebar Header / TeamSwitcher */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200/80 px-3 dark:border-zinc-800">
          <NavLink
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`flex w-full items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 ${
              collapsed ? 'lg:justify-center' : ''
            }`}
            title="Actia Telemetry"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
              <Command size={16} aria-hidden="true" />
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="truncate text-xs font-semibold leading-tight text-zinc-950 dark:text-zinc-50">
                Actia Telemetry
              </div>
              <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                Sensor & Solar Console
              </div>
            </div>
            <ChevronsUpDown
              size={14}
              className={`shrink-0 text-zinc-400 ${collapsed ? 'lg:hidden' : ''}`}
              aria-hidden="true"
            />
          </NavLink>

          <button
            type="button"
            aria-label="Tutup sidebar"
            onClick={() => setMobileOpen(false)}
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Sidebar Navigation Groups */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Menu utama">
          <div>
            <div
              className={`px-2 pb-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 ${
                collapsed ? 'lg:hidden' : ''
              }`}
            >
              General
            </div>
            <div className="space-y-1">
              {generalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    className={`flex h-9 items-center justify-between gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
                      collapsed ? 'lg:justify-center lg:px-0' : ''
                    } ${
                      item.active
                        ? 'bg-zinc-900 font-medium text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={16} aria-hidden="true" />
                      <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                    </span>
                    {typeof item.badge === 'number' && (
                      <span
                        className={`mono rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          collapsed ? 'lg:hidden' : ''
                        } ${
                          item.active
                            ? 'bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900'
                            : 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {otherItems.length > 0 && (
            <div>
              <div
                className={`px-2 pb-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 ${
                  collapsed ? 'lg:hidden' : ''
                }`}
              >
                Other
              </div>
              <div className="space-y-1">
                {otherItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={item.label}
                      className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
                        collapsed ? 'lg:justify-center lg:px-0' : ''
                      } ${
                        item.active
                          ? 'bg-zinc-900 font-medium text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                          : 'text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-50'
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Footer / NavUser */}
        <div className="relative border-t border-zinc-200/80 p-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className={`flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 ${
              collapsed ? 'lg:justify-center' : ''
            }`}
            aria-expanded={userMenuOpen}
            title={user.email}
          >
            <div
              className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="truncate text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                {user.role === 'admin' ? 'Administrator' : 'Operator'}
              </div>
              <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {user.email}
              </div>
            </div>
            <ChevronsUpDown
              size={14}
              className={`shrink-0 text-zinc-400 ${collapsed ? 'lg:hidden' : ''}`}
              aria-hidden="true"
            />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 z-50 min-w-[200px] rounded-xl border border-zinc-200 bg-white p-1.5 shadow-float dark:border-zinc-800 dark:bg-[#09090b]">
              <div className="border-b border-zinc-100 px-2.5 py-2 dark:border-zinc-800">
                <div className="truncate text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                  {user.email}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Peran: {user.role}
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                    setUserMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                  <span>{theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOut size={14} />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header (satnaing/shadcn-admin style) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-[#09090b]/95 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* Mobile drawer button */}
            <button
              type="button"
              aria-label="Buka menu navigasi"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden"
            >
              <Menu size={16} aria-hidden="true" />
            </button>

            {/* Desktop sidebar collapse trigger (PanelLeft) */}
            <button
              type="button"
              aria-label="Sembunyikan atau tampilkan sidebar"
              title="Toggle Sidebar (⌘B)"
              onClick={() => setCollapsed((v) => !v)}
              className="hidden h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:inline-flex"
            >
              <PanelLeft size={16} aria-hidden="true" />
            </button>

            <div className="hidden h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 sm:block" />

            {/* Top Nav Links (satnaing/shadcn-admin TopNav) */}
            <nav aria-label="Navigasi atas" className="hidden items-center gap-5 text-sm sm:flex">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive
                      ? 'font-medium text-zinc-950 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`
                }
              >
                Overview
              </NavLink>
              {user.role === 'admin' && (
                <NavLink
                  to="/devices/manage"
                  className={() =>
                    `transition-colors ${
                      isDevicesActive
                        ? 'font-medium text-zinc-950 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`
                  }
                >
                  Perangkat
                </NavLink>
              )}
              <NavLink
                to="/alerts"
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive
                      ? 'font-medium text-zinc-950 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`
                }
              >
                Peringatan
              </NavLink>
              {user.role === 'admin' && (
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `transition-colors ${
                      isActive
                        ? 'font-medium text-zinc-950 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`
                  }
                >
                  Pengaturan
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Command Search Trigger (Search... ⌘K) */}
            <button
              type="button"
              onClick={() => {
                setCmdQuery('');
                setCmdOpen(true);
              }}
              className="inline-flex h-9 items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50/60 px-3 text-xs text-zinc-500 shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:w-56"
            >
              <span className="flex items-center gap-2">
                <Search size={14} aria-hidden="true" />
                <span>Cari...</span>
              </span>
              <kbd className="mono hidden rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 sm:inline-block">
                ⌘K
              </kbd>
            </button>

            <span
              className="hidden items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 md:inline-flex"
              title="Status SSE Real-Time"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  streamConnected ? 'bg-emerald-500' : 'bg-zinc-400'
                }`}
                aria-hidden="true"
              />
              <span>{streamConnected ? 'Live' : 'Sync'}</span>
            </span>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Ubah tema"
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>

      {/* Command Palette (⌘K) Modal */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label="Pencarian cepat"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCmdOpen(false);
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-float dark:border-zinc-800 dark:bg-[#09090b]">
            <div className="flex items-center border-b border-zinc-200 px-3 dark:border-zinc-800">
              <Search size={16} className="mr-2.5 text-zinc-400" aria-hidden="true" />
              <input
                type="search"
                autoFocus
                placeholder="Ketik halaman atau nama perangkat..."
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                className="h-11 w-full bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={() => setCmdOpen(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={15} />
              </button>
            </div>

            <div className="max-h-[340px] space-y-4 overflow-y-auto p-2">
              {filteredCmdPages.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Navigasi Halaman
                  </div>
                  <div className="space-y-0.5">
                    {filteredCmdPages.map((p) => (
                      <button
                        key={p.to}
                        type="button"
                        onClick={() => {
                          navigate(p.to);
                          setCmdOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <span className="flex items-center gap-2">
                          <ArrowRight size={13} className="text-zinc-400" />
                          <span>{p.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredCmdDevices.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Perangkat Lapangan
                  </div>
                  <div className="space-y-0.5">
                    {filteredCmdDevices.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          navigate(`/devices/${d.id}`);
                          setCmdOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {d.name}
                          </div>
                          <div className="mono text-[11px] text-zinc-500 dark:text-zinc-400">
                            {d.code} {d.location ? `• ${d.location}` : ''}
                          </div>
                        </div>
                        <StatusBadge status={d.status} label={d.status} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Tampilan
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                    setCmdOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                  <span>Ganti ke {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
