import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Sliders, Users } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { swalConfirm, swalToast } from '@/lib/swal'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import type { SystemSettings, UserItem, UserRole } from '@/types'
import { ThresholdsForm } from './components/thresholds-form'
import { UsersManagement } from './components/users-management'

type SettingsTab = 'thresholds' | 'users'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('thresholds')
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    setError('')
    try {
      const [sRes, uRes] = await Promise.all([
        apiFetch<{ settings: SystemSettings }>('/api/v1/settings'),
        apiFetch<{ users: UserItem[] }>('/api/v1/users'),
      ])
      setSettings(sRes.settings)
      setUsers(uRes.users)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal memuat pengaturan'
      setError(msg)
      swalToast('error', 'Gagal memuat pengaturan', msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  async function saveSettings(e: FormEvent) {
    e.preventDefault()
    if (!settings) return
    setError('')
    try {
      const res = await apiFetch<{ settings: SystemSettings }>(
        '/api/v1/settings',
        {
          method: 'PATCH',
          body: JSON.stringify({
            default_battery_pct_min: Number(settings.default_battery_pct_min),
            default_battery_voltage_min: Number(
              settings.default_battery_voltage_min
            ),
            default_offline_after_s: Number(settings.default_offline_after_s),
          }),
        }
      )
      setSettings(res.settings)
      swalToast('success', 'Threshold default berhasil disimpan')
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal menyimpan pengaturan'
      setError(msg)
      swalToast('error', 'Gagal menyimpan pengaturan', msg)
    }
  }

  async function createUser(payload: {
    email: string
    password: string
    role: UserRole
  }) {
    setError('')
    try {
      await apiFetch('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      swalToast('success', `Akun ${payload.email} berhasil ditambahkan`)
      await loadAll()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menambah user'
      setError(msg)
      swalToast('error', 'Gagal menambah user', msg)
    }
  }

  async function removeUser(u: UserItem) {
    const confirmed = await swalConfirm({
      title: `Hapus Akun ${u.email}?`,
      text: 'Pengguna ini tidak akan bisa lagi mengakses dashboard Actia Telemetry.',
      confirmText: 'Hapus Akun',
      destructive: true,
    })
    if (!confirmed) return
    try {
      await apiFetch(`/api/v1/users/${u.id}`, { method: 'DELETE' })
      swalToast('success', `Akun ${u.email} telah dihapus`)
      await loadAll()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menghapus user'
      setError(msg)
      swalToast('error', 'Gagal menghapus user', msg)
    }
  }

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='space-y-4'>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Settings
          </h1>
          <p className='text-muted-foreground'>
            Kelola ambang batas (threshold) bawaan perangkat dan akses pengguna
            dashboard.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='flex flex-1 flex-col gap-6 lg:flex-row lg:gap-12'>
          <aside className='lg:w-1/5'>
            <nav className='flex flex-wrap gap-2 py-1 lg:flex-col lg:gap-1'>
              <button
                type='button'
                onClick={() => {
                  setActiveTab('thresholds')
                  setError('')
                }}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  activeTab === 'thresholds'
                    ? 'bg-muted hover:bg-accent'
                    : 'hover:bg-accent hover:underline',
                  'justify-start'
                )}
              >
                <span className='me-2'>
                  <Sliders size={18} />
                </span>
                Threshold Default
              </button>

              <button
                type='button'
                onClick={() => {
                  setActiveTab('users')
                  setError('')
                }}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  activeTab === 'users'
                    ? 'bg-muted hover:bg-accent'
                    : 'hover:bg-accent hover:underline',
                  'justify-start'
                )}
              >
                <span className='me-2'>
                  <Users size={18} />
                </span>
                Pengguna ({users.length})
              </button>
            </nav>
          </aside>

          <div className='flex w-full min-w-0 flex-1'>
            <div className='flex-1 space-y-4 lg:max-w-2xl'>
              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <Card>
                  <CardContent className='py-8 text-center text-sm text-muted-foreground'>
                    Memuat pengaturan...
                  </CardContent>
                </Card>
              ) : activeTab === 'thresholds' && settings ? (
                <ThresholdsForm
                  settings={settings}
                  setSettings={setSettings}
                  onSubmit={(e) => void saveSettings(e)}
                />
              ) : (
                <UsersManagement
                  users={users}
                  onCreateUser={createUser}
                  onRemoveUser={removeUser}
                />
              )}
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
