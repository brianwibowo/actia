import { Link } from 'react-router-dom'
import { KeyRound, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { fmtNum, formatRelativeTime } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DeviceSummary } from '@/types'

interface DevicesTableProps {
  devices: DeviceSummary[]
  isAdmin: boolean
  onEdit: (device: DeviceSummary) => void
  onRotateKey: (device: DeviceSummary) => void
  onDelete: (device: DeviceSummary) => void
}

export function DevicesTable({
  devices,
  isAdmin,
  onEdit,
  onRotateKey,
  onDelete,
}: DevicesTableProps) {
  return (
    <div className='overflow-hidden rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Perangkat & Lokasi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sensor Tanah</TableHead>
            <TableHead>Baterai & Surya</TableHead>
            <TableHead>Ambang Batas</TableHead>
            <TableHead>Update</TableHead>
            <TableHead className='text-right'>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((d) => (
            <TableRow key={d.id}>
              <TableCell className='font-mono font-medium'>
                <Link
                  to={`/devices/${d.id}`}
                  className='underline-offset-4 hover:underline'
                >
                  {d.code}
                </Link>
              </TableCell>
              <TableCell>
                <div className='font-medium'>{d.name}</div>
                <div className='text-xs text-muted-foreground'>
                  {d.location || '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-1.5'>
                  <Badge
                    variant={
                      d.status === 'online'
                        ? 'default'
                        : d.status === 'maintenance'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {d.status}
                  </Badge>
                  {d.open_alerts > 0 && (
                    <Badge variant='destructive'>{d.open_alerts}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className='tabular-nums'>
                <div className='text-sm'>
                  Lembap {fmtNum(d.soil_moisture_pct, '%')} •{' '}
                  {fmtNum(d.temperature_c, '°C')}
                </div>
                <div className='text-xs text-muted-foreground'>
                  pH {fmtNum(d.ph, '', 2)} • EC {fmtNum(d.ec, '', 0)}
                </div>
              </TableCell>
              <TableCell className='tabular-nums'>
                <div className='text-sm'>
                  {fmtNum(d.battery_pct, '%', 0)} (
                  {fmtNum(d.battery_voltage_v, 'V', 2)})
                </div>
                <div className='text-xs text-muted-foreground'>
                  Solar {fmtNum(d.power_w, 'W', 1)}
                </div>
              </TableCell>
              <TableCell className='text-xs text-muted-foreground tabular-nums'>
                <div>Interval {d.report_interval_s}s</div>
                <div>
                  Min {d.battery_pct_min ?? 20}% /{' '}
                  {d.battery_voltage_min ?? 11.6}V
                </div>
              </TableCell>
              <TableCell className='text-xs text-muted-foreground'>
                {formatRelativeTime(d.last_seen)}
              </TableCell>
              <TableCell className='text-right'>
                <div className='inline-flex items-center justify-end gap-1'>
                  <Button variant='outline' size='sm' asChild>
                    <Link to={`/devices/${d.id}`}>Detail</Link>
                  </Button>
                  {isAdmin && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='size-8'>
                          <MoreHorizontal className='size-4' />
                          <span className='sr-only'>Menu aksi</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-44'>
                        <DropdownMenuItem onClick={() => onEdit(d)}>
                          <Pencil className='size-4' />
                          Ubah Perangkat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRotateKey(d)}>
                          <KeyRound className='size-4' />
                          Key Baru
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant='destructive'
                          onClick={() => onDelete(d)}
                        >
                          <Trash2 className='size-4' />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
