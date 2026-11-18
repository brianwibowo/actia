import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Moon, Radio, ShieldCheck, Sun, Zap } from 'lucide-react';
import { Button, Field, Input, StateBox, StatusBadge } from '../components/ui';
import { apiFetch, ApiError } from '../lib/api';
import type { AuthUser } from '../types';

interface LoginPageProps {
  onSuccess: (user: AuthUser) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function LoginPage({ onSuccess, theme, onToggleTheme }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ user: AuthUser }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] bg-[#f6f8fa] dark:bg-[#090d11] lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0f1c16] p-12 text-slate-50 lg:flex">
        <img
          src="/images/agri-solar.jpg"
          alt="Instalasi panel surya di lahan pertanian"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0b1913]/95 via-[#0f241b]/88 to-[#09130e]/95"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-emerald-950">
              <Radio size={22} aria-hidden="true" />
            </span>
            <div>
              <div className="text-base font-bold tracking-tight text-white">Actia Telemetry</div>
              <div className="text-xs text-slate-400">Field Monitoring Console</div>
            </div>
          </div>

          <h1 className="mt-12 max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
            Konsol pemantauan sensor tanah dan daya surya lapangan.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Pantau sebaran node pada peta, kondisi kelembapan & pH tanah, kesehatan aki surya,
            peringatan otomatis, serta ekspor riwayat data TimescaleDB.
          </p>

          <div className="mt-10 grid gap-3.5">
            <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-900/60 bg-[#152820] p-4">
              <Zap size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold text-white">Aliran Data Real-Time (SSE)</div>
                <div className="mt-0.5 text-xs text-slate-300">
                  Setiap kiriman telemetri node langsung memperbarui status dan grafik tanpa muat ulang manual.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-900/60 bg-[#152820] p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold text-white">Deteksi Dini Aki & Node Offline</div>
                <div className="mt-0.5 text-xs text-slate-300">
                  Evaluasi ambang batas otomatis per perangkat disertai pelacakan penanganan alert oleh operator.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-300">Actia Telemetry Console</div>
      </aside>

      <main className="relative flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="absolute right-5 top-5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleTheme}
            aria-label="Ubah tema terang atau gelap"
            icon={theme === 'light' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
          >
            {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          </Button>
        </div>

        <section
          aria-labelledby="login-title"
          className="w-full max-w-[420px] rounded-2xl border border-slate-200/90 bg-white p-7 shadow-card dark:border-slate-800 dark:bg-[#11171d] dark:shadow-card-dark sm:p-8"
        >
          <div className="mb-6">
            <StatusBadge status="online" label="Actia Telemetry" />
            <h2
              id="login-title"
              className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Masuk ke Console
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Gunakan akun administrator atau operator untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password" htmlFor="login-password">
              <div className="relative flex items-center">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute right-1 inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </Field>

            {error && (
              <StateBox tone="error" role="alert" description={error} />
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Memeriksa akun...' : 'Masuk ke Dashboard'}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
