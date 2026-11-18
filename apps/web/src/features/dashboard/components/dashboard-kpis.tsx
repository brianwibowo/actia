import { Link } from 'react-router-dom'
import { AlertTriangle, BatteryCharging, Cpu, Wifi } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AlertItem, DeviceSummary } from '@/types'

interface DashboardKpisProps {
  devices: DeviceSummary[]
  openAlerts: AlertItem[]
}

export function DashboardKpis({ devices, openAlerts }: DashboardKpisProps) {
  const onlineCount = devices.filter((d) => d.status === 'online').length
  const offlineCount = devices.filter((d) => d.status === 'offline').length
  const maintenanceCount = devices.filter(
    (d) => d.status === 'maintenance'
  ).length
  const onlinePct =
    devices.length > 0 ? Math.round((onlineCount / devices.length) * 100) : 0

  const vals = devices
    .map((d) => d.battery_pct)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  const avgBatteryPct =
    vals.length > 0
      ? Math.round(vals.reduce((acc, v) => acc + v, 0) / vals.length)
      : null

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Perangkat</CardTitle>
          <Cpu className='h-4 w-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{devices.length}</div>
          <p className='text-xs text-muted-foreground'>
            {maintenanceCount > 0
              ? `${maintenanceCount} dalam pemeliharaan`
              : 'Seluruh perangkat lapangan terdaftar'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Perangkat Online
          </CardTitle>
          <Wifi className='h-4 w-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{onlineCount}</div>
          <p className='text-xs text-muted-foreground'>
            {onlinePct}% dari total perangkat aktif
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Rata-rata Baterai
          </CardTitle>
          <BatteryCharging className='h-4 w-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {avgBatteryPct !== null ? `${avgBatteryPct}%` : '-'}
          </div>
          <p className='text-xs text-muted-foreground'>
            {offlineCount > 0
              ? `${offlineCount} perangkat offline`
              : 'Semua aki surya terpantau'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Peringatan Aktif
          </CardTitle>
          <AlertTriangle className='h-4 w-4 text-[#FFD758]' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{openAlerts.length}</div>
          <p className='text-xs text-muted-foreground'>
            {openAlerts.length > 0 ? (
              <Link
                to='/alerts'
                className='underline underline-offset-4 hover:text-primary'
              >
                Tinjau peringatan terbuka
              </Link>
            ) : (
              'Semua ambang batas normal'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
