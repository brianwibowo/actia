import { useState, type FormEvent } from 'react';
import { Command, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { Button, Field, Input, StateBox } from '../components/ui';
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
    <div className="grid min-h-[100dvh] bg-white dark:bg-[#09090b] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-zinc-900 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <img
          src="/images/agri-solar.jpg"
          alt="Panel surya dan lahan pertanian Actia Telemetry"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35"
        />

        <div className="relative z-10 flex items-center gap-2.5 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
            <Command size={16} aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Actia Telemetry</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-lg font-medium leading-snug text-white">
            Monitoring sensor tanah & daya surya real-time.
          </p>
        </div>
      </aside>

      <main className="relative flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="absolute right-5 top-5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleTheme}
            aria-label="Ubah tema"
            icon={theme === 'light' ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />}
          >
            {theme === 'light' ? 'Gelap' : 'Terang'}
          </Button>
        </div>

        <section
          aria-labelledby="login-title"
          className="w-full max-w-[360px] space-y-6"
        >
          <div className="flex flex-col space-y-1.5 text-left">
            <h1
              id="login-title"
              className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              Login
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Masukkan email dan password akun Anda untuk masuk ke dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute right-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
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
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
