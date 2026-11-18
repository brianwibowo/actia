import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCheck, RefreshCw } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { swalToast } from '@/lib/swal'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import type { AlertItem, DeviceSummary } from '@/types'
import { alertTypeLabel } from './alert-utils'
import { AlertsKpiCards } from './components/alerts-kpi-cards'
import { AlertsTable } from './components/alerts-table'
import { AlertsToolbar } from './components/alerts-toolbar'

export function AlertsPage({
  devices,
  onChanged,
}: {
  devices: DeviceSummary[]
  onChanged: () => void
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [ackAllBusy, setAckAllBusy] = useState(false)

  const loadAlerts = useCallback(async () => {
    setError('')
    try {
      const res = await apiFetch<{ alerts: AlertItem[] }>('/api/v1/alerts')
      setAlerts(res.alerts)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Gagal memuat daftar peringatan'
      setError(msg)
      swalToast('error', 'Gagal memuat peringatan', msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void loadAlerts()
  }, [loadAlerts])

  const counts = useMemo(() => {
    const open = alerts.filter((a) => a.status === 'open').length
    const acknowledged = alerts.filter(
      (a) => a.status === 'acknowledged'
    ).length
    const resolved = alerts.filter((a) => a.status === 'resolved').length
    return { open, acknowledged, resolved }
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return alerts.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (deviceFilter !== 'all' && a.device_id !== deviceFilter) return false
      if (!q) return true
      return (
        (a.device_code ?? '').toLowerCase().includes(q) ||
        (a.device_name ?? '').toLowerCase().includes(q) ||
        (a.metric ?? '').toLowerCase().includes(q) ||
        alertTypeLabel(a.type).toLowerCase().includes(q)
      )
    })
  }, [alerts, statusFilter, typeFilter, deviceFilter, searchText])

  async function handleAck(id: number) {
    setBusyId(id)
    try {
      await apiFetch(`/api/v1/alerts/${id}`, { method: 'PATCH' })
      swalToast('success', 'Peringatan ditandai sedang ditangani')
      await loadAlerts()
      onChanged()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal menandai peringatan'
      setError(msg)
      swalToast('error', 'Gagal menandai peringatan', msg)
    } finally {
      setBusyId(null)
    }
  }

  async function handleAckAllOpen() {
    const openItems = filteredAlerts.filter((a) => a.status === 'open')
    if (openItems.length === 0) return
    setAckAllBusy(true)
    try {
      await Promise.all(
        openItems.map((a) =>
          apiFetch(`/api/v1/alerts/${a.id}`, { method: 'PATCH' })
        )
      )
      swalToast(
        'success',
        `${openItems.length} peringatan terbuka telah ditangani`
      )
      await loadAlerts()
      onChanged()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Gagal menandai seluruh peringatan'
      setError(msg)
      swalToast('error', 'Gagal memproses peringatan', msg)
    } finally {
      setAckAllBusy(false)
    }
  }

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Pusat Peringatan
            </h1>
            <p className='text-muted-foreground'>
              Triage insiden baterai lemah, anomali sensor, dan perangkat
              lapangan offline.
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setLoading(true)
                void loadAlerts()
                swalToast('info', 'Memuat ulang daftar peringatan...')
              }}
            >
              <RefreshCw className='size-4' />
              Muat Ulang
            </Button>
            {counts.open > 0 && (
              <Button
                size='sm'
                disabled={ackAllBusy}
                onClick={() => void handleAckAllOpen()}
              >
                <CheckCheck className='size-4' />
                {ackAllBusy
                  ? 'Memproses...'
                  : `Tandai Semua Terbuka (${counts.open})`}
              </Button>
            )}
          </div>
        </div>

        <AlertsKpiCards
          openCount={counts.open}
          acknowledgedCount={counts.acknowledged}
          resolvedCount={counts.resolved}
        />

        {error && (
          <Alert variant='destructive'>
            <AlertTitle>Gagal memuat peringatan</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertsToolbar
          devices={devices}
          searchText={searchText}
          onSearchChange={setSearchText}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          deviceFilter={deviceFilter}
          onDeviceChange={setDeviceFilter}
          totalCount={alerts.length}
          openCount={counts.open}
          acknowledgedCount={counts.acknowledged}
          resolvedCount={counts.resolved}
          onReset={() => {
            setStatusFilter('all')
            setTypeFilter('all')
            setDeviceFilter('all')
            setSearchText('')
          }}
        />

        <AlertsTable
          loading={loading}
          alerts={filteredAlerts}
          busyId={busyId}
          onAck={(id) => void handleAck(id)}
        />
      </Main>
    </>
  )
}
