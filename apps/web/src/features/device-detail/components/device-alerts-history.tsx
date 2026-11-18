import { formatWib } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AlertItem } from '@/types'

interface DeviceAlertsHistoryProps {
  deviceCode: string
  alerts: AlertItem[]
}

export function DeviceAlertsHistory({
  deviceCode,
  alerts,
}: DeviceAlertsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Peringatan Perangkat</CardTitle>
        <CardDescription>
          Catatan peringatan yang pernah terpicu pada perangkat {deviceCode}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
            Belum pernah ada peringatan tercatat untuk perangkat ini.
          </div>
        ) : (
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Metrik</TableHead>
                  <TableHead>Nilai / Batas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className='text-xs text-muted-foreground'>
                      {formatWib(a.triggered_at)}
                    </TableCell>
                    <TableCell className='font-medium'>{a.type}</TableCell>
                    <TableCell className='tabular-nums'>
                      {a.metric || '-'}
                    </TableCell>
                    <TableCell className='tabular-nums'>
                      {a.value ?? '-'} / {a.threshold ?? '-'}
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
                        {a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
