import { AlertTriangle, BatteryCharging, Cpu, Wifi } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DeviceSummary } from '@/types'

interface DevicesKpiCardsProps {
  devices: DeviceSummary[]
}

export function DevicesKpiCards({ devices }: DevicesKpiCardsProps) {
  const onlineCount = devices.filter((d) => d.status === 'online').length
  const offlineCount = devices.filter((d) => d.status === 'offline').length
  const attentionCount = devices.filter(
    (d) => d.status === 'maintenance' || d.open_alerts > 0
  ).length

  const batteryVals = devices
    .map((d) => d.battery_pct)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  const avgBatteryPct =
    batteryVals.length > 0
      ? Math.round(
          batteryVals.reduce((acc, v) => acc + v, 0) / batteryVals.length
        )
      : null

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Perangkat</CardTitle>
          <Cpu className='size-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>
            {devices.length}
          </div>
          <p className='text-xs text-muted-foreground'>
            {onlineCount} online • {offlineCount} offline
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Status Online</CardTitle>
          <Wifi className='size-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>{onlineCount}</div>
          <p className='text-xs text-muted-foreground'>
            {devices.length > 0
              ? `${Math.round((onlineCount / devices.length) * 100)}% perangkat aktif mengirim data`
              : 'Belum ada perangkat'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Perlu Perhatian</CardTitle>
          <AlertTriangle className='size-4 text-[#FFD758]' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>
            {attentionCount}
          </div>
          <p className='text-xs text-muted-foreground'>
            {attentionCount > 0
              ? 'Node dalam pemeliharaan atau alert aktif'
              : 'Seluruh node beroperasi normal'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Rata-rata Aki</CardTitle>
          <BatteryCharging className='size-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>
            {avgBatteryPct !== null ? `${avgBatteryPct}%` : '-'}
          </div>
          <p className='text-xs text-muted-foreground'>
            Kapasitas baterai sistem tenaga surya
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
