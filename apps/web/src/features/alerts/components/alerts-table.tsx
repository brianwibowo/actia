import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { formatRelativeTime, formatWib } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AllClearIllustration } from '@/components/svg/actia-illustrations'
import type { AlertItem } from '@/types'
import {
  alertMetricLabel,
  AlertTypeIcon,
  alertTypeLabel,
} from '../alert-utils'

interface AlertsTableProps {
  loading: boolean
  alerts: AlertItem[]
  busyId: number | null
  onAck: (id: number) => void
}

export function AlertsTable({
  loading,
  alerts,
  busyId,
  onAck,
}: AlertsTableProps) {
  return (
    <div className='overflow-hidden rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kategori Insiden</TableHead>
            <TableHead>Perangkat</TableHead>
            <TableHead>Parameter & Nilai</TableHead>
            <TableHead>Waktu Terpicu</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Tindakan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className='h-28 text-center text-muted-foreground'
              >
                Memuat riwayat peringatan...
              </TableCell>
            </TableRow>
          ) : alerts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className='py-10 text-center'>
                <div className='flex flex-col items-center justify-center gap-2'>
                  <AllClearIllustration />
                  <p className='text-sm font-medium text-foreground'>
                    Tidak ada peringatan aktif pada filter ini
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    Seluruh perangkat berada dalam kondisi terpantau normal.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            alerts.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40'>
                      <AlertTypeIcon type={a.type} />
                    </div>
                    <div>
                      <div className='font-medium'>
                        {alertTypeLabel(a.type)}
                      </div>
                      <div className='font-mono text-xs text-muted-foreground'>
                        {a.type}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Link
                    to={`/devices/${a.device_id}`}
                    className='inline-flex items-center gap-1 font-mono font-medium underline-offset-4 hover:underline'
                  >
                    {a.device_code}
                    <ArrowUpRight className='size-3 text-muted-foreground' />
                  </Link>
                  <div className='text-xs text-muted-foreground'>
                    {a.device_name}
                  </div>
                </TableCell>

                <TableCell>
                  <div className='text-sm font-medium'>
                    {alertMetricLabel(a.metric)}
                  </div>
                  <div className='mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums'>
                    <span>Nilai: {a.value ?? '-'}</span>
                    <span>•</span>
                    <span>Ambang: {a.threshold ?? '-'}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className='text-sm'>
                    {formatRelativeTime(a.triggered_at)}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {formatWib(a.triggered_at)}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      a.status === 'open'
                        ? 'destructive'
                        : a.status === 'acknowledged'
                          ? 'secondary'
                          : 'default'
                    }
                  >
                    {a.status === 'open'
                      ? 'Terbuka'
                      : a.status === 'acknowledged'
                        ? 'Ditangani'
                        : 'Pulih'}
                  </Badge>
                  {a.acknowledged_by_email && (
                    <div className='mt-1 text-xs text-muted-foreground'>
                      oleh {a.acknowledged_by_email}
                    </div>
                  )}
                </TableCell>

                <TableCell className='text-right'>
                  <div className='inline-flex items-center justify-end gap-1.5'>
                    {a.status === 'open' && (
                      <Button
                        size='sm'
                        disabled={busyId === a.id}
                        onClick={() => onAck(a.id)}
                      >
                        {busyId === a.id
                          ? 'Menyimpan...'
                          : 'Tandai Ditangani'}
                      </Button>
                    )}
                    <Button variant='outline' size='sm' asChild>
                      <Link to={`/devices/${a.device_id}`}>Detail</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
