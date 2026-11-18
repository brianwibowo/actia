import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Radio,
  Settings,
  Sliders,
  Sun,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { AuthUser } from '../types';
import { Button } from './ui';

interface AppShellProps {
  user: AuthUser;
  openAlertsCount: number;
  streamConnected: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLoggedOut: () => void;
  children: ReactNode;
}

function resolveSectionLabel(pathname: string): string {
  if (pathname === '/') return 'Ringkasan Jaringan';
  if (pathname.startsWith('/alerts')) return 'Manajemen Alert';
  if (pathname.startsWith('/devices/manage')) return 'Kelola Node';
  if (pathname.startsWith('/devices/')) return 'Detail Node';
  if (pathname.startsWith('/settings')) return 'Pengaturan Sistem';
  return 'Console Monitoring';
}

export function AppShell({
  user,
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
  }, [location.pathname]);

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-[44px] items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-[#11171d] lg:sticky lg:top-0 lg:h-[100dvh] lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950">
              <Radio size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Actia Telemetry
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Field Console
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

        <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 py-5" aria-label="Menu console">
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monitoring
            </div>
            <div className="space-y-1">
              <NavLink to="/" end className={navLinkClass}>
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard size={18} aria-hidden="true" />
                  <span>Ringkasan</span>
                </span>
              </NavLink>

              <NavLink to="/alerts" className={navLinkClass}>
                <span className="flex items-center gap-2.5">
                  <Bell size={18} aria-hidden="true" />
                  <span>Daftar Alert</span>
                </span>
                {openAlertsCount > 0 && (
                  <span
                    className="mono rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                    aria-label={`${openAlertsCount} alert terbuka`}
                  >
                    {openAlertsCount}
                  </span>
                )}
              </NavLink>
            </div>
          </div>

          {user.role === 'admin' && (
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Administrasi
              </div>
              <div className="space-y-1">
                <NavLink to="/devices/manage" className={navLinkClass}>
                  <span className="flex items-center gap-2.5">
                    <Cpu size={18} aria-hidden="true" />
                    <span>Kelola Node</span>
                  </span>
                </NavLink>

                <NavLink to="/settings" className={navLinkClass}>
                  <span className="flex items-center gap-2.5">
                    <Sliders size={18} aria-hidden="true" />
                    <span>Pengaturan</span>
                  </span>
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#0d1318]">
            <div
              className="mono flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white dark:bg-emerald-400 dark:text-emerald-950"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100" title={user.email}>
                {user.email}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                {user.role === 'admin' ? 'Administrator' : 'Operator / Viewer'}
              </div>
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

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {resolveSectionLabel(location.pathname)}
              </span>

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
                {streamConnected ? 'Stream Aktif' : 'Sinkronisasi Berkala'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <NavLink
                to="/settings"
                aria-label="Buka pengaturan"
                className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161f27] dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex"
              >
                <Settings size={17} aria-hidden="true" />
              </NavLink>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleTheme}
              aria-label="Ubah tema terang atau gelap"
              icon={theme === 'light' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
            >
              <span className="hidden sm:inline">{theme === 'light' ? 'Gelap' : 'Terang'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut size={16} aria-hidden="true" />}
            >
              Keluar
            </Button>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
