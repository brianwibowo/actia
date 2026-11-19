import { BatteryCharging, Droplets, Sun, Thermometer } from 'lucide-react'
import { fmtNum } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DeviceSummary } from '@/types'

export function DeviceDetailKpis({ device }: { device: DeviceSummary }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Kelembapan Tanah
          </CardTitle>
          <Droplets className='size-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>
            {fmtNum(device.soil_moisture_pct, '%')}
          </div>
          <p className='text-xs text-muted-foreground tabular-nums'>
            Suhu tanah: {fmtNum(device.soil_temp_c, ' °C')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Suhu Udara & Tanah
          </CardTitle>
          <Thermometer className='size-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>
            {fmtNum(device.temperature_c, ' °C')}
          </div>
          <p className='text-xs text-muted-foreground tabular-nums'>
            pH {fmtNum(device.ph, '', 2)} • EC {fmtNum(device.ec, ' µS/cm', 0)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Baterai / Aki</CardTitle>
          <BatteryCharging className='size-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>
            {fmtNum(device.battery_pct, '%', 0)}
          </div>
          <p className='text-xs text-muted-foreground tabular-nums'>
            Tegangan: {fmtNum(device.battery_voltage_v, ' V', 2)} (Min{' '}
            {device.battery_voltage_min ?? 11.6}V)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Input Panel Surya
          </CardTitle>
          <Sun className='size-4 text-amber-600 dark:text-[#FFD758]' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>
            {fmtNum(device.power_w, ' W', 1)}
          </div>
          <p className='text-xs text-muted-foreground tabular-nums'>
            {fmtNum(device.solar_voltage_v, ' V', 1)} •{' '}
            {fmtNum(device.solar_current_a, ' A', 2)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
