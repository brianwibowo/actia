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
          <div className='flex size-9 items-center justify-center rounded-lg bg-[#2BBBD7]/15 text-[#218DAE] dark:text-[#2BBBD7]'>
            <Droplets className='size-5' />
          </div>
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
          <div className='flex size-9 items-center justify-center rounded-lg bg-[#218DAE]/12 text-[#218DAE] dark:bg-[#2BBBD7]/15 dark:text-[#2BBBD7]'>
            <Thermometer className='size-5' />
          </div>
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
          <div className='flex size-9 items-center justify-center rounded-lg bg-[#218DAE]/12 text-[#218DAE] dark:bg-[#2BBBD7]/15 dark:text-[#2BBBD7]'>
            <BatteryCharging className='size-5' />
          </div>
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
          <div className='flex size-9 items-center justify-center rounded-lg bg-[#FCE59A]/70 text-amber-800 dark:bg-[#FFD758]/15 dark:text-[#FFD758]'>
            <Sun className='size-5' />
          </div>
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
