import { BatteryWarning, ShieldAlert, WifiOff } from 'lucide-react'
import type { AlertItem } from '@/types'

export function alertTypeLabel(type: AlertItem['type']): string {
  if (type === 'battery_low') return 'Aki Lemah'
  if (type === 'sensor_error') return 'Sensor Anomali'
  return 'Perangkat Offline'
}

export function alertMetricLabel(metric: string | null): string {
  if (!metric) return 'Status Perangkat'
  if (metric === 'battery_pct') return 'Kapasitas Baterai (%)'
  if (metric === 'battery_voltage_v') return 'Tegangan Aki (V)'
  if (metric === 'soil_moisture_pct') return 'Kelembapan Tanah (%)'
  if (metric === 'temperature_c') return 'Suhu Udara (°C)'
  if (metric === 'soil_temp_c') return 'Suhu Tanah (°C)'
  if (metric === 'ph') return 'pH Tanah'
  if (metric === 'ec') return 'EC Tanah'
  if (metric === 'offline_s') return 'Durasi Offline (detik)'
  return metric
}

export function AlertTypeIcon({ type }: { type: AlertItem['type'] }) {
  if (type === 'battery_low') {
    return <BatteryWarning className='size-4 text-amber-600 dark:text-[#FFD758]' />
  }
  if (type === 'sensor_error') {
    return <ShieldAlert className='size-4 text-destructive' />
  }
  return <WifiOff className='size-4 text-primary' />
}
