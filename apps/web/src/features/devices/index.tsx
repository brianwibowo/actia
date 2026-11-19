import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Database,
  LayoutGrid,
  MapPin,
  Plus,
  Table2,
  Terminal,
  Trash2,
  X,
} from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { swalConfirm, swalToast } from '@/lib/swal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { NodeMap } from '@/components/NodeMap'
import { EmptyFieldIllustration } from '@/components/svg/actia-illustrations'
import { ThemeSwitch } from '@/components/theme-switch'
import type { AuthUser, DeviceSummary } from '@/types'
import { DeviceFormDialog } from './components/device-form-dialog'
import {
  DeviceKeyBanner,
  type RevealedDeviceKey,
} from './components/device-key-banner'
import { DevicesGrid } from './components/devices-grid'
import { DevicesKpiCards } from './components/devices-kpi-cards'
import { DevicesTable } from './components/devices-table'
import { IotGuideDialog } from './components/iot-guide-dialog'
import {
  emptyDeviceForm,
  type DeviceFormState,
  type DeviceViewMode,
} from './types'

export interface ManageDevicesPageProps {
  user?: AuthUser
  devices: DeviceSummary[]
  onChanged: () => void
}

export function ManageDevicesPage({
  user,
  devices,
  onChanged,
}: ManageDevicesPageProps) {
  const isAdmin = user?.role !== 'viewer'
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [filterText, setFilterText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<DeviceViewMode>('grid')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DeviceFormState>(emptyDeviceForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [revealedKey, setRevealedKey] = useState<RevealedDeviceKey | null>(null)
  const [seedBusy, setSeedBusy] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const hasSeedDevices = devices.some((d) =>
    ['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05'].includes(d.code)
  )

  async function handleSeedDemo() {
    setSeedBusy(true)
    setError('')
    try {
      await apiFetch('/api/v1/devices/seed-demo', { method: 'POST' })
      swalToast(
        'success',
        'Data seed berhasil dimuat',
        'Perangkat contoh ACT-01 s/d ACT-05 telah aktif.'
      )
      onChanged()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal mengisi data seed'
      setError(msg)
      swalToast('error', 'Gagal mengisi data seed', msg)
    } finally {
      setSeedBusy(false)
    }
  }

  async function handleClearDemo() {
    const confirmed = await swalConfirm({
      title: 'Hapus Data Seed Contoh?',
      text: 'Seluruh perangkat contoh (ACT-01 s/d ACT-05) beserta riwayat pembacaan dan peringatannya akan dihapus.',
      confirmText: 'Hapus Data Seed',
      destructive: true,
    })
    if (!confirmed) return

    setSeedBusy(true)
    setError('')
    try {
      await apiFetch('/api/v1/devices/seed-demo', { method: 'DELETE' })
      swalToast('success', 'Data seed contoh telah dihapus')
      onChanged()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal menghapus data seed'
      setError(msg)
      swalToast('error', 'Gagal menghapus data seed', msg)
    } finally {
      setSeedBusy(false)
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyDeviceForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(d: DeviceSummary) {
    setEditingId(d.id)
    setForm({
      code: d.code,
      name: d.name,
      location: d.location,
      lat: d.lat !== null ? String(d.lat) : '',
      lng: d.lng !== null ? String(d.lng) : '',
      status: d.status,
      report_interval_s: String(d.report_interval_s),
      battery_pct_min: String(d.battery_pct_min ?? 20),
      battery_voltage_min: String(d.battery_voltage_min ?? 11.6),
      offline_after_s: String(d.offline_after_s ?? 900),
    })
    setError('')
    setModalOpen(true)
  }

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate()
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
      return
    }
    const editId = searchParams.get('edit')
    if (editId && devices.length > 0) {
      const target = devices.find((d) => d.id === editId)
      if (target) {
        openEdit(target)
        const next = new URLSearchParams(searchParams)
        next.delete('edit')
        setSearchParams(next, { replace: true })
      }
    }
  }, [searchParams, devices, setSearchParams])

  const filteredDevices = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    return devices.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (!q) return true
      return (
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
      )
    })
  }, [devices, filterText, statusFilter])

  const isFiltered = filterText.trim().length > 0 || statusFilter !== 'all'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        location: form.location.trim(),
        lat: form.lat.trim() === '' ? null : Number(form.lat),
        lng: form.lng.trim() === '' ? null : Number(form.lng),
        report_interval_s: Number(form.report_interval_s),
        thresholds: {
          battery_pct_min: Number(form.battery_pct_min),
          battery_voltage_min: Number(form.battery_voltage_min),
          offline_after_s: Number(form.offline_after_s),
        },
      }

      if (editingId) {
        await apiFetch(`/api/v1/devices/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...payload, status: form.status }),
        })
        swalToast('success', `Perangkat ${payload.code} berhasil diperbarui`)
      } else {
        const res = await apiFetch<{
          device: DeviceSummary
          device_key: string
        }>('/api/v1/devices', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setRevealedKey({
          id: res.device.id,
          code: res.device.code,
          key: res.device_key,
        })
        swalToast('success', `Perangkat ${res.device.code} berhasil ditambahkan`)
      }
      setModalOpen(false)
      onChanged()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal menyimpan perangkat'
      setError(msg)
      swalToast('error', 'Gagal menyimpan perangkat', msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleRotateKey(d: DeviceSummary) {
    const confirmed = await swalConfirm({
      title: `Buat Device Key Baru (${d.code})?`,
      text: 'Device Key lama akan langsung dicabut dan tidak bisa lagi digunakan sampai firmware perangkat diperbarui.',
      confirmText: 'Buat Key Baru',
    })
    if (!confirmed) return
    try {
      const res = await apiFetch<{ device_key: string }>(
        `/api/v1/devices/${d.id}/rotate-key`,
        {
          method: 'POST',
        }
      )
      setRevealedKey({
        id: d.id,
        code: d.code,
        key: res.device_key,
      })
      swalToast('success', `Device Key baru dibuat untuk ${d.code}`)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal memutar device key'
      setError(msg)
      swalToast('error', 'Gagal memutar device key', msg)
    }
  }

  async function handleDeleteDevice(d: DeviceSummary) {
    const confirmed = await swalConfirm({
      title: `Hapus Perangkat ${d.code}?`,
      text: `Perangkat "${d.name}" beserta seluruh riwayat telemetri dan peringatannya akan dihapus permanen.`,
      confirmText: 'Hapus Permanen',
      destructive: true,
    })
    if (!confirmed) return
    try {
      await apiFetch(`/api/v1/devices/${d.id}`, { method: 'DELETE' })
      swalToast('success', `Perangkat ${d.code} telah dihapus`)
      onChanged()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal menghapus perangkat'
      setError(msg)
      swalToast('error', 'Gagal menghapus perangkat', msg)
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
              Perangkat Lapangan
            </h1>
            <p className='text-muted-foreground'>
              Pantau telemetri sensor tanah & daya surya, kelola lokasi peta,
              dan konfigurasi Device Key.
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setGuideOpen(true)}
            >
              <Terminal className='size-4' />
              Panduan API IoT
            </Button>
            {isAdmin && (
              <>
                {hasSeedDevices ? (
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={seedBusy}
                    onClick={() => void handleClearDemo()}
                  >
                    <Trash2 className='size-4 text-destructive' />
                    {seedBusy ? 'Memproses...' : 'Hapus Data Seed'}
                  </Button>
                ) : (
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={seedBusy}
                    onClick={() => void handleSeedDemo()}
                  >
                    <Database className='size-4' />
                    {seedBusy ? 'Mengisi...' : 'Isi Data Seed'}
                  </Button>
                )}
                <Button size='sm' onClick={openCreate}>
                  <Plus className='size-4' />
                  Tambah Perangkat
                </Button>
              </>
            )}
          </div>
        </div>

        <DevicesKpiCards devices={devices} />

        {revealedKey && (
          <DeviceKeyBanner
            revealedKey={revealedKey}
            onClose={() => setRevealedKey(null)}
            onChanged={onChanged}
            onError={setError}
          />
        )}

        {error && !modalOpen && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex flex-1 flex-wrap items-center gap-2'>
            <Input
              placeholder='Cari kode, nama, atau lokasi...'
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className='h-9 w-full sm:w-[250px] lg:w-[300px]'
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='h-9 w-[160px]'>
                <SelectValue placeholder='Semua status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Status</SelectItem>
                <SelectItem value='online'>Online</SelectItem>
                <SelectItem value='maintenance'>Pemeliharaan</SelectItem>
                <SelectItem value='offline'>Offline</SelectItem>
              </SelectContent>
            </Select>
            {isFiltered && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setFilterText('')
                  setStatusFilter('all')
                }}
                className='h-9 px-2.5'
              >
                Reset
                <X className='ms-1 size-4' />
              </Button>
            )}
          </div>

          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as DeviceViewMode)}
          >
            <TabsList className='h-9'>
              <TabsTrigger value='grid' className='gap-1.5 text-xs'>
                <LayoutGrid className='size-3.5' />
                Kartu
              </TabsTrigger>
              <TabsTrigger value='table' className='gap-1.5 text-xs'>
                <Table2 className='size-3.5' />
                Tabel
              </TabsTrigger>
              <TabsTrigger value='map' className='gap-1.5 text-xs'>
                <MapPin className='size-3.5' />
                Peta
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredDevices.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <EmptyFieldIllustration className='mb-3' />
              <h3 className='text-base font-semibold'>
                Tidak ada perangkat ditemukan
              </h3>
              <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
                {devices.length === 0
                  ? 'Tambahkan perangkat baru atau muat data seed untuk melihat daftar node lapangan.'
                  : 'Coba ubah kata kunci pencarian atau reset filter status.'}
              </p>
              {devices.length === 0 && isAdmin && (
                <div className='mt-4 flex gap-2'>
                  <Button size='sm' onClick={openCreate}>
                    <Plus className='size-4' />
                    Tambah Perangkat
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={seedBusy}
                    onClick={() => void handleSeedDemo()}
                  >
                    <Database className='size-4' />
                    Isi Data Seed
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <DevicesGrid
            devices={filteredDevices}
            isAdmin={isAdmin}
            onEdit={openEdit}
            onRotateKey={(d) => void handleRotateKey(d)}
            onDelete={(d) => void handleDeleteDevice(d)}
          />
        ) : viewMode === 'table' ? (
          <DevicesTable
            devices={filteredDevices}
            isAdmin={isAdmin}
            onEdit={openEdit}
            onRotateKey={(d) => void handleRotateKey(d)}
            onDelete={(d) => void handleDeleteDevice(d)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Peta Sebaran Perangkat</CardTitle>
              <CardDescription>
                Klik ganda pada marker untuk membuka grafik detail perangkat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NodeMap
                devices={filteredDevices}
                height={460}
                onSelectDevice={(id) => navigate(`/devices/${id}`)}
              />
            </CardContent>
          </Card>
        )}
      </Main>

      <DeviceFormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        saving={saving}
        error={error}
        onSubmit={(e) => void handleSubmit(e)}
      />

      <IotGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        sampleKey={revealedKey?.key}
      />
    </>
  )
}
