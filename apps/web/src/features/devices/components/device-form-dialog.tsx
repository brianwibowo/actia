import type { FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NodeMap } from '@/components/NodeMap'
import type { DeviceStatus } from '@/types'
import type { DeviceFormState } from '../types'

interface DeviceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  form: DeviceFormState
  setForm: React.Dispatch<React.SetStateAction<DeviceFormState>>
  saving: boolean
  error: string
  onSubmit: (e: FormEvent) => void
}

export function DeviceFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  setForm,
  saving,
  error,
  onSubmit,
}: DeviceFormDialogProps) {
  const parsedLat = form.lat.trim() === '' ? null : Number(form.lat)
  const parsedLng = form.lng.trim() === '' ? null : Number(form.lng)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Ubah Perangkat' : 'Tambah Perangkat Baru'}
          </DialogTitle>
          <DialogDescription>
            Isi identitas perangkat, lokasi koordinat peta, dan ambang batas
            peringatan.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className='grid grid-cols-1 gap-4 sm:grid-cols-2'
        >
          <div className='grid gap-2'>
            <Label htmlFor='dev-code'>Kode Perangkat</Label>
            <Input
              id='dev-code'
              required
              placeholder='NODE-01'
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dev-name'>Nama Perangkat</Label>
            <Input
              id='dev-name'
              required
              placeholder='Blok Utara A'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className='grid gap-2 sm:col-span-2'>
            <Label htmlFor='dev-loc'>Keterangan Lokasi</Label>
            <Input
              id='dev-loc'
              placeholder='Kebun Percobaan Lembang'
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {editingId && (
            <div className='grid gap-2 sm:col-span-2'>
              <Label htmlFor='dev-status'>Status Operasional</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as DeviceStatus })
                }
              >
                <SelectTrigger id='dev-status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='online'>Online (Aktif)</SelectItem>
                  <SelectItem value='maintenance'>
                    Maintenance (Pemeliharaan)
                  </SelectItem>
                  <SelectItem value='offline'>Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='grid gap-2'>
            <Label htmlFor='dev-lat'>Latitude</Label>
            <Input
              id='dev-lat'
              type='number'
              step='any'
              placeholder='-6.8123'
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dev-lng'>Longitude</Label>
            <Input
              id='dev-lng'
              type='number'
              step='any'
              placeholder='107.6123'
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </div>

          <div className='sm:col-span-2'>
            <p className='mb-2 text-xs text-muted-foreground'>
              Klik peta untuk mengisi koordinat otomatis:
            </p>
            <NodeMap
              devices={[]}
              height={190}
              pickCoords={{
                lat: Number.isFinite(parsedLat) ? parsedLat : null,
                lng: Number.isFinite(parsedLng) ? parsedLng : null,
              }}
              onPickCoords={(lat, lng) =>
                setForm((prev) => ({
                  ...prev,
                  lat: String(lat),
                  lng: String(lng),
                }))
              }
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dev-interval'>Interval Kirim (detik)</Label>
            <Input
              id='dev-interval'
              type='number'
              min={10}
              required
              value={form.report_interval_s}
              onChange={(e) =>
                setForm({ ...form, report_interval_s: e.target.value })
              }
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dev-offline'>Batas Offline (detik)</Label>
            <Input
              id='dev-offline'
              type='number'
              min={30}
              required
              value={form.offline_after_s}
              onChange={(e) =>
                setForm({ ...form, offline_after_s: e.target.value })
              }
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dev-bpct'>Batas Aki Low (%)</Label>
            <Input
              id='dev-bpct'
              type='number'
              step='0.5'
              required
              value={form.battery_pct_min}
              onChange={(e) =>
                setForm({ ...form, battery_pct_min: e.target.value })
              }
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dev-bv'>Batas Aki Low (V)</Label>
            <Input
              id='dev-bv'
              type='number'
              step='0.1'
              required
              value={form.battery_voltage_min}
              onChange={(e) =>
                setForm({ ...form, battery_voltage_min: e.target.value })
              }
            />
          </div>

          {error && (
            <div className='sm:col-span-2'>
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className='sm:col-span-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type='submit' disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
