import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, ApiError } from '@/lib/api'
import { swalToast } from '@/lib/swal'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { TimeSeriesChart } from '@/components/TimeSeriesChart'
import type {
  AlertItem,
  AuthUser,
  DeviceSummary,
  PowerReading,
  SensorReading,
} from '@/types'
import { DeviceAlertsHistory } from './components/device-alerts-history'
import { DeviceDetailHeader } from './components/device-detail-header'
import { DeviceDetailKpis } from './components/device-detail-kpis'
import {
  rangeDates,
  useDeviceSeries,
  type RangeKey,
} from './use-device-series'

export function DeviceDetailPage({
  user,
  devices,
  refreshToken,
}: {
  user: AuthUser
  devices: DeviceSummary[]
  refreshToken: number
}) {
  const { id } = useParams<{ id: string }>()
  const [range, setRange] = useState<RangeKey>('24h')
  const [device, setDevice] = useState<DeviceSummary | null>(null)
  const [sensorRows, setSensorRows] = useState<SensorReading[]>([])
  const [powerRows, setPowerRows] = useState<PowerReading[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async (silent = false) => {
    if (!id) return
    if (!silent) {
      setLoading(true)
    }
    setError('')
    try {
      const { from, to } = rangeDates(range)
      const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      const [devRes, sensRes, powRes, alertRes] = await Promise.all([
        apiFetch<{ device: DeviceSummary }>(`/api/v1/devices/${id}`),
        apiFetch<{ readings: SensorReading[] }>(
          `/api/v1/devices/${id}/sensor-readings?${qs}`
        ),
        apiFetch<{ readings: PowerReading[] }>(
          `/api/v1/devices/${id}/power-readings?${qs}`
        ),
        apiFetch<{ alerts: AlertItem[] }>(
          `/api/v1/alerts?device_id=${encodeURIComponent(id)}`
        ),
      ])
      setDevice(devRes.device)
      setSensorRows(sensRes.readings)
      setPowerRows(powRes.readings)
      setAlerts(alertRes.alerts)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal memuat detail perangkat'
      if (!silent) {
        setError(msg)
        swalToast('error', 'Gagal memuat detail perangkat', msg)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [id, range])

  useEffect(() => {
    void loadData(false)
  }, [loadData])

  useEffect(() => {
    if (refreshToken === 0) return
    void loadData(true)
  }, [refreshToken, loadData])

  const { sensorSeries, ecSeries, powerSeries } = useDeviceSeries(
    sensorRows,
    powerRows
  )

  const rangeLabel =
    range === '24h'
      ? '24 jam terakhir'
      : range === '7d'
        ? '7 hari terakhir'
        : '30 hari terakhir'

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {loading ? (
          <Card>
            <CardContent className='py-10 text-center text-sm text-muted-foreground'>
              Memuat detail perangkat dan grafik telemetri...
            </CardContent>
          </Card>
        ) : error || !device ? (
          <Alert variant='destructive'>
            <AlertTitle>Perangkat tidak dapat dimuat</AlertTitle>
            <AlertDescription className='flex items-center justify-between gap-4'>
              <span>{error || 'Perangkat tidak ditemukan.'}</span>
              <Button variant='outline' size='sm' asChild>
                <Link to='/devices'>Kembali ke Perangkat</Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <DeviceDetailHeader
              user={user}
              device={device}
              devices={devices}
              range={range}
              onRangeChange={setRange}
            />

            <DeviceDetailKpis device={device} />

            <Tabs defaultValue='charts' className='space-y-4'>
              <TabsList>
                <TabsTrigger value='charts'>
                  Grafik Telemetri ({rangeLabel})
                </TabsTrigger>
                <TabsTrigger value='alerts'>
                  Riwayat Peringatan ({alerts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='charts' className='space-y-4'>
                <TimeSeriesChart
                  title={`Tren Suhu & Kelembapan Tanah (${rangeLabel})`}
                  yLeftLabel='°C / pH'
                  yRightLabel='%'
                  series={sensorSeries}
                  emptyMessage='Belum ada data pembacaan sensor pada rentang waktu ini.'
                />

                {ecSeries.length > 0 && (
                  <TimeSeriesChart
                    title={`Konduktivitas Tanah / EC (${rangeLabel})`}
                    yLeftLabel='EC'
                    series={ecSeries}
                    emptyMessage='Belum ada data EC pada rentang waktu ini.'
                  />
                )}

                <TimeSeriesChart
                  title={`Tegangan Solar, Tegangan Aki & Kapasitas Baterai (${rangeLabel})`}
                  yLeftLabel='Volt (V)'
                  yRightLabel='Baterai (%)'
                  series={powerSeries}
                  emptyMessage='Belum ada data daya pada rentang waktu ini.'
                />
              </TabsContent>

              <TabsContent value='alerts'>
                <DeviceAlertsHistory
                  deviceCode={device.code}
                  alerts={alerts}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </Main>
    </>
  )
}
