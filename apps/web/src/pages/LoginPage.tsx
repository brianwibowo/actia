import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Moon, Radio, Sun } from 'lucide-react';
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
    <div className="grid min-h-[100dvh] bg-[#f6f8fa] dark:bg-[#090d11] lg:grid-cols-12">
      <aside className="relative hidden overflow-hidden bg-slate-950 lg:col-span-7 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <img
          src="/images/agri-solar.jpg"
          alt="Panel surya dan lahan pertanian Actia Telemetry"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/40"
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-emerald-950 shadow-sm">
            <Radio size={20} aria-hidden="true" />
          </span>
          <span className="rounded-lg bg-slate-950/65 px-3 py-1.5 text-sm font-bold tracking-tight text-white backdrop-blur-sm">
            Actia Telemetry
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl font-bold leading-snug tracking-tight text-white">
            Monitoring Sensor Tanah & Daya Surya
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-slate-950/65 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
              Kelembapan & pH Tanah
            </span>
            <span className="rounded-full border border-white/20 bg-slate-950/65 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
              Tegangan Solar & Aki
            </span>
            <span className="rounded-full border border-white/20 bg-slate-950/65 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
              Peta & Alert Real-Time
            </span>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-col items-center justify-center p-6 sm:p-10 lg:col-span-5">
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
          className="w-full max-w-[400px] rounded-2xl border border-slate-200/90 bg-white p-7 shadow-card dark:border-slate-800 dark:bg-[#11171d] dark:shadow-card-dark sm:p-8"
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
