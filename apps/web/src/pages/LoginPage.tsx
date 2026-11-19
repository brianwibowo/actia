import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { swalToast } from '@/lib/swal'
import { ActiaLogoMark } from '@/components/svg/actia-illustrations'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/password-input'
import { ThemeSwitch } from '@/components/theme-switch'
import { apiFetch, ApiError } from '../lib/api'
import type { AuthUser } from '../types'

interface LoginPageProps {
  onSuccess: (user: AuthUser) => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch<{ user: AuthUser }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      swalToast('success', 'Berhasil masuk', `Selamat datang, ${res.user.email}`)
      onSuccess(res.user)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal terhubung ke server'
      setError(msg)
      swalToast('error', 'Login gagal', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col justify-between overflow-hidden bg-muted p-10 text-white lg:flex dark:border-r'>
        <img
          src='/images/agri-solar.jpg'
          alt='Panel surya dan lahan pertanian Actia Telemetry'
          className='absolute inset-0 h-full w-full object-cover'
        />
        <div
          aria-hidden='true'
          className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/35'
        />

        <div className='relative z-20 flex items-center gap-2.5 text-lg font-semibold'>
          <ActiaLogoMark className='size-9 shadow-sm' />
          Actia Telemetry
        </div>

        <div className='relative z-20 mt-auto max-w-md'>
          <p className='text-lg font-medium leading-snug'>
            Monitoring sensor tanah & daya surya real-time.
          </p>
        </div>
      </div>

      <div className='relative flex h-full w-full items-center justify-center lg:p-8'>
        <div className='absolute top-4 right-4 md:top-8 md:right-8'>
          <ThemeSwitch />
        </div>

        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[360px]'>
          <div className='flex flex-col space-y-2 text-start'>
            <h1 className='text-2xl font-semibold tracking-tight'>Sign in</h1>
            <p className='text-sm text-muted-foreground'>
              Masukkan email dan password akun Anda untuk masuk ke dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='login-email'>Email</Label>
              <Input
                id='login-email'
                type='email'
                autoComplete='email'
                required
                placeholder='name@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='login-password'>Password</Label>
              <PasswordInput
                id='login-password'
                autoComplete='current-password'
                required
                placeholder='********'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type='submit' className='mt-1 w-full' disabled={loading}>
              {loading && <Loader2 className='animate-spin' />}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
