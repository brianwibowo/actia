import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  FlaskConical,
  KeyRound,
  MapPin,
  MoreHorizontal,
  Pencil,
  Sun,
  Thermometer,
  Trash2,
} from 'lucide-react'
import { fmtNum, formatRelativeTime } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getDeviceCoverImage,
  RadialGaugeSvg,
} from '@/components/svg/actia-illustrations'
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
      {devices.map((d) => {
        const batteryColor =
          (d.battery_pct ?? 100) < (d.battery_pct_min ?? 20)
            ? '#dc2626'
            : (d.battery_pct ?? 100) < 40
              ? '#d97706'
              : '#218DAE'

        return (
          <Card
            key={d.id}
            className='flex flex-col justify-between overflow-hidden py-0 transition-shadow hover:shadow-md'
          >
            {/* Visual Field Cover Photo Header */}
            <div className='relative h-32 w-full overflow-hidden bg-muted'>
              <img
                src={getDeviceCoverImage(d.code)}
                alt={d.name}
                className='h-full w-full object-cover transition-transform duration-300 hover:scale-105'
              />
              <div
                aria-hidden='true'
                className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30'
              />

              <div className='absolute inset-x-3 top-2.5 flex items-center justify-between gap-2'>
                <div className='flex flex-wrap items-center gap-1.5'>
                  <Badge className='bg-black/65 font-mono text-white backdrop-blur-xs hover:bg-black/75'>
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

                {isAdmin && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='secondary'
                        size='icon'
                        className='size-7 bg-black/55 text-white hover:bg-black/75'
                      >
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

              <div className='absolute inset-x-3 bottom-2.5 text-white'>
                <Link
                  to={`/devices/${d.id}`}
                  className='block truncate text-base font-semibold leading-tight hover:underline'
                >
                  {d.name}
                </Link>
                <div className='mt-0.5 flex items-center justify-between gap-2 text-xs text-white/80'>
                  <span className='inline-flex items-center gap-1 truncate'>
                    <MapPin className='size-3 shrink-0 text-[#FFD758]' />
                    <span className='truncate'>
                      {d.location || 'Lokasi belum diisi'}
                    </span>
                  </span>
                  <span className='shrink-0'>
                    {formatRelativeTime(d.last_seen)}
                  </span>
                </div>
              </div>
            </div>

            {/* SVG Radial Gauges + Metric Chips */}
            <CardContent className='space-y-4 p-4'>
              <div className='flex items-center justify-around rounded-lg border bg-muted/35 px-3 py-3'>
                <RadialGaugeSvg
                  value={d.soil_moisture_pct}
                  label='Kelembapan'
                  color='#2BBBD7'
                />
                <RadialGaugeSvg
                  value={d.battery_pct}
                  label='Baterai Aki'
                  color={batteryColor}
                />
                <div className='flex flex-col gap-1.5 text-xs'>
                  <div className='inline-flex items-center gap-1.5 font-medium tabular-nums'>
                    <Thermometer className='size-3.5 text-[#218DAE]' />
                    <span>{fmtNum(d.temperature_c, ' °C')}</span>
                  </div>
                  <div className='inline-flex items-center gap-1.5 font-medium tabular-nums'>
                    <FlaskConical className='size-3.5 text-[#2BBBD7]' />
                    <span>pH {fmtNum(d.ph, '', 1)}</span>
                  </div>
                  <div className='inline-flex items-center gap-1.5 font-medium tabular-nums'>
                    <Sun className='size-3.5 text-amber-600 dark:text-[#FFD758]' />
                    <span>{fmtNum(d.power_w, ' W', 1)}</span>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between gap-2'>
                <span className='text-xs text-muted-foreground tabular-nums'>
                  {fmtNum(d.battery_voltage_v, ' V', 2)} • Interval{' '}
                  {d.report_interval_s}s
                </span>
                <Button variant='outline' size='sm' asChild>
                  <Link to={`/devices/${d.id}`}>
                    Grafik & Detail
                    <ArrowUpRight className='size-3.5' />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
