import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AlertsKpiCardsProps {
  openCount: number
  acknowledgedCount: number
  resolvedCount: number
}

export function AlertsKpiCards({
  openCount,
  acknowledgedCount,
  resolvedCount,
}: AlertsKpiCardsProps) {
  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Peringatan Terbuka
          </CardTitle>
          <div className='flex size-9 items-center justify-center rounded-lg bg-[#FCE59A]/70 text-amber-800 dark:bg-[#FFD758]/15 dark:text-[#FFD758]'>
            <AlertTriangle className='size-5' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>{openCount}</div>
          <p className='text-xs text-muted-foreground'>
            Memerlukan tinjauan atau tindakan operator
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Sedang Ditangani
          </CardTitle>
          <div className='flex size-9 items-center justify-center rounded-lg bg-[#218DAE]/12 text-[#218DAE] dark:bg-[#2BBBD7]/15 dark:text-[#2BBBD7]'>
            <Clock className='size-5' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>
            {acknowledgedCount}
          </div>
          <p className='text-xs text-muted-foreground'>
            Telah dikonfirmasi oleh operator lapangan
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Telah Pulih</CardTitle>
          <div className='flex size-9 items-center justify-center rounded-lg bg-[#2BBBD7]/15 text-[#218DAE] dark:text-[#2BBBD7]'>
            <CheckCircle2 className='size-5' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold tabular-nums'>{resolvedCount}</div>
          <p className='text-xs text-muted-foreground'>
            Nilai sensor/baterai kembali dalam ambang normal
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
