import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { NodeMap } from '@/components/NodeMap'
import { ThemeSwitch } from '@/components/theme-switch'
import type { AlertItem, AuthUser, DeviceSummary } from '@/types'
import { DashboardHero } from './components/dashboard-hero'
import { DashboardKpis } from './components/dashboard-kpis'
import { DeviceStatusList } from './components/device-status-list'

export interface OverviewPageProps {
  user: AuthUser
  devices: DeviceSummary[]
  openAlerts: AlertItem[]
  loading: boolean
  error: string
  onRetry: () => void
  onChanged: () => void
}

export function OverviewPage({
  user,
  devices,
  openAlerts,
  loading,
  error,
  onRetry,
}: OverviewPageProps) {
  const navigate = useNavigate()
  const hasGeo = devices.some((d) => d.lat !== null && d.lng !== null)
  const onlineCount = devices.filter((d) => d.status === 'online').length

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='space-y-4'>
        <DashboardHero
          user={user}
          onlineCount={onlineCount}
          totalCount={devices.length}
          onRetry={onRetry}
        />

        {loading ? (
          <Card>
            <CardContent className='py-10 text-center text-sm text-muted-foreground'>
              Memuat pembacaan perangkat dari server...
            </CardContent>
          </Card>
        ) : error ? (
          <Alert variant='destructive'>
            <AlertTitle>Gagal memuat data</AlertTitle>
            <AlertDescription className='flex items-center justify-between gap-4'>
              <span>{error}</span>
              <Button variant='outline' size='sm' onClick={onRetry}>
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        ) : devices.length === 0 ? (
          <Card className='overflow-hidden py-0'>
            <div className='grid grid-cols-1 md:grid-cols-12'>
              <div className='relative min-h-[240px] md:col-span-5'>
                <img
                  src='/images/weather-station.jpg'
                  alt='Stasiun sensor lapangan'
                  className='h-full w-full object-cover'
                />
              </div>
              <div className='flex flex-col justify-center p-6 sm:p-8 md:col-span-7'>
                <h2 className='text-lg font-semibold tracking-tight'>
                  Belum ada perangkat terdaftar
                </h2>
                <p className='mt-1.5 text-sm text-muted-foreground'>
                  Tambahkan perangkat pertama atau isi data seed di halaman
                  Perangkat untuk mulai memantau telemetri sensor tanah dan daya
                  surya.
                </p>
                {user.role === 'admin' && (
                  <div className='mt-5 flex flex-wrap gap-2'>
                    <Button onClick={() => navigate('/devices?new=1')}>
                      <Plus className='size-4' />
                      Tambah Perangkat
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => navigate('/devices')}
                    >
                      Kelola & Seed Data
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className='space-y-4'>
            <DashboardKpis devices={devices} openAlerts={openAlerts} />

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Peta Lokasi Perangkat</CardTitle>
                  <CardDescription>
                    Klik ganda pada titik perangkat untuk melihat detail grafik
                    sensor & daya.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasGeo ? (
                    <NodeMap
                      devices={devices}
                      height={360}
                      onSelectDevice={(id) => navigate(`/devices/${id}`)}
                    />
                  ) : (
                    <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
                      Koordinat perangkat belum diisi.
                    </div>
                  )}
                </CardContent>
              </Card>

              <DeviceStatusList devices={devices} />
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
