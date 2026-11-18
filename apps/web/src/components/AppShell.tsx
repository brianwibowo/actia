import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Radio,
  Sliders,
  Sun,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { AuthUser, DeviceSummary } from '../types';
import { Button } from './ui';

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
    return [{ label: 'Overview' }];
  }
  if (pathname.startsWith('/devices/manage')) {
    return [{ label: 'Perangkat' }];
  }
  if (pathname.startsWith('/devices/')) {
    const id = pathname.replace('/devices/', '');
    const dev = devices.find((d) => d.id === id);
    return [
      { label: 'Perangkat', to: '/devices/manage' },
      { label: dev ? dev.name : 'Detail Perangkat' },
    ];
  }
  if (pathname.startsWith('/alerts')) {
    return [{ label: 'Peringatan' }];
  }
  if (pathname.startsWith('/settings')) {
    return [{ label: 'Pengaturan' }];
  }
  return [{ label: 'Overview' }];
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

  useEffect(() => {
    setMenuOpen(false);
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

  const initials = user.email.slice(0, 2).toUpperCase();
  const breadcrumbs = resolveBreadcrumbs(location.pathname, devices);
  const isDevicesActive = location.pathname.startsWith('/devices');

  const navLinkClass = (active: boolean) =>
    `flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
      active
        ? 'bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-500/15 dark:text-emerald-300'
        : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] shrink-0 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-[#11171d] lg:sticky lg:top-0 lg:h-[100dvh] lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[64px] items-center justify-between gap-3 border-b border-slate-100 px-5 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950">
              <Radio size={18} aria-hidden="true" />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Actia Telemetry
            </span>
          </NavLink>

          <button
            type="button"
            aria-label="Tutup menu navigasi"
            onClick={() => setMenuOpen(false)}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Menu utama">
          <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
            <span className="flex items-center gap-3">
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>Overview</span>
            </span>
          </NavLink>

          {user.role === 'admin' && (
            <NavLink to="/devices/manage" className={() => navLinkClass(isDevicesActive)}>
              <span className="flex items-center gap-3">
                <Cpu size={18} aria-hidden="true" />
                <span>Perangkat</span>
              </span>
              {devices.length > 0 && (
                <span className="mono text-xs text-slate-400 dark:text-slate-500">
                  {devices.length}
                </span>
              )}
            </NavLink>
          )}

          <NavLink to="/alerts" className={({ isActive }) => navLinkClass(isActive)}>
            <span className="flex items-center gap-3">
              <Bell size={18} aria-hidden="true" />
              <span>Peringatan</span>
            </span>
            {openAlertsCount > 0 && (
              <span
                className="mono rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300"
                aria-label={`${openAlertsCount} alert terbuka`}
              >
                {openAlertsCount}
              </span>
            )}
          </NavLink>

          {user.role === 'admin' && (
            <NavLink to="/settings" className={({ isActive }) => navLinkClass(isActive)}>
              <span className="flex items-center gap-3">
                <Sliders size={18} aria-hidden="true" />
                <span>Pengaturan</span>
              </span>
            </NavLink>
          )}
        </nav>

        <div className="border-t border-slate-100 p-3.5 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div
                  className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100"
                  title={user.email}
                >
                  {user.email}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user.role === 'admin' ? 'Admin' : 'Viewer'}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Ubah tema terang atau gelap"
                title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                {theme === 'light' ? (
                  <Moon size={16} aria-hidden="true" />
                ) : (
                  <Sun size={16} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Keluar"
                title="Keluar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
              >
                <LogOut size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-[#11171d]/95 sm:px-6">
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

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
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
                        className="font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              title="Status koneksi pembaruan real-time"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  streamConnected
                    ? 'bg-emerald-600 dark:bg-emerald-400'
                    : 'bg-slate-400 dark:bg-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>{streamConnected ? 'Live' : 'Terhubung'}</span>
            </span>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
