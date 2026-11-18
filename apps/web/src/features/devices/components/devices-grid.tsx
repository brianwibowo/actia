import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { fmtNum, formatRelativeTime } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DeviceSummary } from '@/types'

interface DevicesGridProps {
  devices: DeviceSummary[]
  isAdmin: boolean
  onEdit: (device: DeviceSummary) => void
  onRotateKey: (device: DeviceSummary) => void
  onDelete: (device: DeviceSummary) => void
}

export function DevicesGrid({
  devices,
  isAdmin,
  onEdit,
  onRotateKey,
  onDelete,
}: DevicesGridProps) {
  const navigate = useNavigate()

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {devices.map((d) => (
        <Card
          key={d.id}
          className='flex flex-col justify-between transition-shadow hover:shadow-md'
        >
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-2.5'>
                <div className='flex size-10 items-center justify-center rounded-lg border bg-primary/10 text-primary'>
                  <Activity className='size-5' />
                </div>
                <div>
                  <div className='flex items-center gap-1.5'>
                    <Badge variant='outline' className='font-mono'>
                      {d.code}
                    </Badge>
                    <Badge
                      variant={
                        d.status === 'online'
                          ? 'default'
                          : d.status === 'maintenance'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {d.status}
                    </Badge>
                    {d.open_alerts > 0 && (
                      <Badge variant='destructive'>{d.open_alerts} alert</Badge>
                    )}
                  </div>
                  <CardTitle className='mt-1.5 text-base'>
                    <Link to={`/devices/${d.id}`} className='hover:underline'>
                      {d.name}
                    </Link>
                  </CardTitle>
                </div>
              </div>

              {isAdmin && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='size-8'>
                      <MoreHorizontal className='size-4' />
                      <span className='sr-only'>Aksi perangkat</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuLabel>Aksi Perangkat</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate(`/devices/${d.id}`)}
                    >
                      <ArrowUpRight className='size-4' />
                      Lihat Detail & Grafik
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(d)}>
                      <Pencil className='size-4' />
                      Ubah Konfigurasi
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRotateKey(d)}>
                      <KeyRound className='size-4' />
                      Buat Device Key Baru
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => onDelete(d)}
                    >
                      <Trash2 className='size-4' />
                      Hapus Perangkat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <CardDescription className='flex items-center justify-between pt-1 text-xs'>
              <span className='truncate'>
                {d.location || 'Lokasi belum diisi'}
              </span>
              <span className='shrink-0'>
                {formatRelativeTime(d.last_seen)}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-2.5 rounded-lg border bg-muted/40 p-3 text-xs'>
              <div>
                <span className='text-muted-foreground'>Kelembapan Tanah</span>
                <div className='mt-0.5 text-sm font-semibold tabular-nums'>
                  {fmtNum(d.soil_moisture_pct, '%')}
                </div>
              </div>
              <div>
                <span className='text-muted-foreground'>Suhu & pH Tanah</span>
                <div className='mt-0.5 text-sm font-semibold tabular-nums'>
                  {fmtNum(d.temperature_c, '°C')} • pH {fmtNum(d.ph, '', 1)}
                </div>
              </div>
              <div>
                <span className='text-muted-foreground'>Baterai Aki</span>
                <div className='mt-0.5 text-sm font-semibold tabular-nums'>
                  {fmtNum(d.battery_pct, '%', 0)} (
                  {fmtNum(d.battery_voltage_v, 'V', 2)})
                </div>
              </div>
              <div>
                <span className='text-muted-foreground'>Daya Surya</span>
                <div className='mt-0.5 text-sm font-semibold tabular-nums'>
                  {fmtNum(d.power_w, ' W', 1)}
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <span className='text-xs text-muted-foreground tabular-nums'>
                Interval {d.report_interval_s}s • Min Aki{' '}
                {d.battery_pct_min ?? 20}%
              </span>
              <Button variant='outline' size='sm' asChild>
                <Link to={`/devices/${d.id}`}>
                  Detail
                  <ArrowUpRight className='size-3.5' />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
