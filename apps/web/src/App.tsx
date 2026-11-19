import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { swalToast } from '@/lib/swal'
import { TelemetryProvider } from '@/context/telemetry-provider'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { apiFetch, ApiError } from './lib/api'
import { AlertsPage } from './pages/AlertsPage'
import { DeviceDetailPage } from './pages/DeviceDetailPage'
import { LoginPage } from './pages/LoginPage'
import { ManageDevicesPage } from './pages/ManageDevicesPage'
import { OverviewPage } from './pages/OverviewPage'
import { SettingsPage } from './pages/SettingsPage'
import type { AlertItem, AuthUser, DeviceSummary } from './types'

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [devices, setDevices] = useState<DeviceSummary[]>([])
  const [openAlerts, setOpenAlerts] = useState<AlertItem[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [streamConnected, setStreamConnected] = useState(false)

  useEffect(() => {
    apiFetch<{ user: AuthUser }>('/api/v1/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true))
  }, [])

  const refreshOverview = useCallback(async () => {
    if (!user) return
    setDataError('')
    try {
      const [devRes, alertRes] = await Promise.all([
        apiFetch<{ devices: DeviceSummary[] }>('/api/v1/devices'),
        apiFetch<{ alerts: AlertItem[] }>('/api/v1/alerts?status=open'),
      ])
      setDevices(devRes.devices)
      setOpenAlerts(alertRes.alerts)
      setRefreshToken((n) => n + 1)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        setDevices([])
        setOpenAlerts([])
        setStreamConnected(false)
        swalToast('warning', 'Sesi telah berakhir', 'Silakan login kembali.')
        return
      }
      setDataError(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setDataLoading(false)
    }
  }, [user])

  const signOut = useCallback(async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setDevices([])
      setOpenAlerts([])
      setStreamConnected(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setStreamConnected(false)
      return
    }
    setDataLoading(true)
    void refreshOverview()

    const source = new EventSource('/api/v1/stream', { withCredentials: true })
    const onConnected = () => setStreamConnected(true)
    const onStreamEvent = () => {
      setStreamConnected(true)
      void refreshOverview()
    }
    const onAlertEvent = () => {
      setStreamConnected(true)
      swalToast(
        'warning',
        'Peringatan Perangkat',
        'Status peringatan node lapangan baru saja diperbarui.'
      )
      void refreshOverview()
    }
    const onError = () => setStreamConnected(false)

    source.addEventListener('connected', onConnected)
    source.addEventListener('reading', onStreamEvent)
    source.addEventListener('device_status', onStreamEvent)
    source.addEventListener('alert', onAlertEvent)
    source.addEventListener('error', onError)

    const fallbackPoll = setInterval(() => {
      void refreshOverview()
    }, 30_000)

    return () => {
      source.close()
      clearInterval(fallbackPoll)
    }
  }, [user, refreshOverview])

  if (!authChecked) {
    return (
      <main className='flex min-h-svh items-center justify-center bg-background p-6'>
        <div className='flex items-center gap-3 text-sm text-muted-foreground'>
          <Loader2 className='size-4 animate-spin' />
          <span>Memeriksa sesi Actia Telemetry...</span>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<LoginPage onSuccess={setUser} />} />
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <TelemetryProvider
        value={{
          user,
          devices,
          openAlerts,
          streamConnected,
          signOut,
          refreshOverview,
        }}
      >
        <AuthenticatedLayout>
          <Routes>
            <Route
              path='/'
              element={
                <OverviewPage
                  user={user}
                  devices={devices}
                  openAlerts={openAlerts}
                  loading={dataLoading}
                  error={dataError}
                  onRetry={() => void refreshOverview()}
                  onChanged={() => void refreshOverview()}
                />
              }
            />
            <Route
              path='/devices'
              element={
                <ManageDevicesPage
                  user={user}
                  devices={devices}
                  onChanged={() => void refreshOverview()}
                />
              }
            />
            <Route
              path='/devices/manage'
              element={
                <ManageDevicesPage
                  user={user}
                  devices={devices}
                  onChanged={() => void refreshOverview()}
                />
              }
            />
            <Route
              path='/devices/:id'
              element={
                <DeviceDetailPage
                  user={user}
                  devices={devices}
                  refreshToken={refreshToken}
                />
              }
            />
            <Route
              path='/alerts'
              element={
                <AlertsPage
                  devices={devices}
                  onChanged={() => void refreshOverview()}
                />
              }
            />
            {user.role === 'admin' && (
              <Route path='/settings' element={<SettingsPage />} />
            )}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </AuthenticatedLayout>
      </TelemetryProvider>
    </BrowserRouter>
  )
}
