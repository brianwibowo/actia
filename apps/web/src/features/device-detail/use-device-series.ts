import { useMemo } from 'react'
import type { ChartSeries } from '@/components/TimeSeriesChart'
import type { PowerReading, SensorReading } from '@/types'

export type RangeKey = '24h' | '7d' | '30d'

export function rangeDates(key: RangeKey): { from: string; to: string } {
  const to = new Date()
  const hours = key === '24h' ? 24 : key === '7d' ? 24 * 7 : 24 * 30
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function useDeviceSeries(
  sensorRows: SensorReading[],
  powerRows: PowerReading[]
) {
  const sensorSeries = useMemo<ChartSeries[]>(() => {
    const out: ChartSeries[] = [
      {
        name: 'Suhu Udara (°C)',
        color: '#d97706',
        data: sensorRows.map((r) => [r.ts, r.temperature_c]),
      },
      {
        name: 'Soil Moisture (%)',
        color: '#2BBBD7',
        yAxisIndex: 1,
        data: sensorRows.map((r) => [r.ts, r.soil_moisture_pct]),
      },
    ]
    if (sensorRows.some((r) => r.soil_temp_c !== null)) {
      out.push({
        name: 'Suhu Tanah (°C)',
        color: '#218DAE',
        data: sensorRows.map((r) => [r.ts, r.soil_temp_c]),
      })
    }
    if (sensorRows.some((r) => r.ph !== null)) {
      out.push({
        name: 'pH Tanah',
        color: '#ca8a04',
        data: sensorRows.map((r) => [r.ts, r.ph]),
      })
    }
    return out
  }, [sensorRows])

  const ecSeries = useMemo<ChartSeries[]>(() => {
    if (!sensorRows.some((r) => r.ec !== null)) return []
    return [
      {
        name: 'Konduktivitas Listrik (EC)',
        color: '#218DAE',
        data: sensorRows.map((r) => [r.ts, r.ec]),
      },
    ]
  }, [sensorRows])

  const powerSeries = useMemo<ChartSeries[]>(
    () => [
      {
        name: 'Tegangan Solar (V)',
        color: '#d97706',
        data: powerRows.map((r) => [r.ts, r.solar_voltage_v]),
      },
      {
        name: 'Tegangan Aki (V)',
        color: '#218DAE',
        data: powerRows.map((r) => [r.ts, r.battery_voltage_v]),
      },
      {
        name: 'Persen Baterai (%)',
        color: '#2BBBD7',
        yAxisIndex: 1,
        data: powerRows.map((r) => [r.ts, r.battery_pct]),
      },
    ],
    [powerRows]
  )

  return { sensorSeries, ecSeries, powerSeries }
}
