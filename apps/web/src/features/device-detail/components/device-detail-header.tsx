import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Sliders } from 'lucide-react'
import { formatRelativeTime, formatWib } from '@/lib/api'
import { swalToast } from '@/lib/swal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AuthUser, DeviceSummary } from '@/types'
import { rangeDates, type RangeKey } from '../use-device-series'

interface DeviceDetailHeaderProps {
  user: AuthUser
  device: DeviceSummary
  devices: DeviceSummary[]
  range: RangeKey
  onRangeChange: (next: RangeKey) => void
}

export function DeviceDetailHeader({
  user,
  device,
  devices,
  range,
  onRangeChange,
}: DeviceDetailHeaderProps) {
  const navigate = useNavigate()
  const { from, to } = rangeDates(range)

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild className='-ms-2'>
            <Link to='/devices'>
              <ArrowLeft className='size-4' />
              Daftar Perangkat
            </Link>
          </Button>
          {devices.length > 1 && (
            <Select
              value={device.id}
              onValueChange={(v) => navigate(`/devices/${v}`)}
            >
              <SelectTrigger className='h-8 w-[210px] text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Tabs
            value={range}
            onValueChange={(v) => {
              onRangeChange(v as RangeKey)
              swalToast(
                'info',
                `Rentang grafik diubah ke ${v === '24h' ? '24 Jam' : v === '7d' ? '7 Hari' : '30 Hari'}`
              )
            }}
          >
            <TabsList className='h-8'>
              <TabsTrigger value='24h' className='text-xs'>
                24 Jam
              </TabsTrigger>
              <TabsTrigger value='7d' className='text-xs'>
                7 Hari
              </TabsTrigger>
              <TabsTrigger value='30d' className='text-xs'>
                30 Hari
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant='outline'
            size='sm'
            asChild
            onClick={() => swalToast('success', 'Mengunduh CSV Sensor...')}
          >
            <a
              href={`/api/v1/devices/${device.id}/export.csv?type=sensor&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
            >
              <Download className='size-4' />
              CSV Sensor
            </a>
          </Button>
          <Button
            variant='outline'
            size='sm'
            asChild
            onClick={() => swalToast('success', 'Mengunduh CSV Daya...')}
          >
            <a
              href={`/api/v1/devices/${device.id}/export.csv?type=power&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
            >
              <Download className='size-4' />
              CSV Daya
            </a>
          </Button>

          {user.role === 'admin' && (
            <Button variant='outline' size='sm' asChild>
              <Link to={`/devices?edit=${encodeURIComponent(device.id)}`}>
                <Sliders className='size-4' />
                Konfigurasi
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className='space-y-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='outline' className='font-mono'>
            {device.code}
          </Badge>
          <Badge
            variant={
              device.status === 'online'
                ? 'default'
                : device.status === 'maintenance'
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {device.status}
          </Badge>
          {device.open_alerts > 0 && (
            <Badge variant='destructive'>
              {device.open_alerts} peringatan terbuka
            </Badge>
          )}
        </div>
        <h1 className='text-2xl font-bold tracking-tight'>{device.name}</h1>
        <p className='text-sm text-muted-foreground'>
          {device.location || 'Lokasi belum diisi'} • Update terakhir:{' '}
          {formatRelativeTime(device.last_seen)} ({formatWib(device.last_seen)})
        </p>
      </div>
    </>
  )
}
