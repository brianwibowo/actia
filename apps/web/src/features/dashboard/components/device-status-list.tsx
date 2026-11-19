import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { fmtNum, formatRelativeTime } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { DeviceSummary } from '@/types'

export function DeviceStatusList({ devices }: { devices: DeviceSummary[] }) {
  const [search, setSearch] = useState('')

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return devices
    return devices.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
    )
  }, [devices, search])

  return (
    <Card className='col-span-1 lg:col-span-3'>
      <CardHeader>
        <CardTitle>Status Perangkat</CardTitle>
        <CardDescription>
          Menampilkan {filteredDevices.length} dari {devices.length} perangkat
          lapangan.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Input
          placeholder='Cari kode, nama, atau lokasi...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className='max-h-[310px] space-y-3 overflow-y-auto pe-1'>
          {filteredDevices.map((d) => (
            <Link
              key={d.id}
              to={`/devices/${d.id}`}
              className='flex items-center justify-between gap-4 rounded-md p-2 transition-colors hover:bg-accent'
            >
              <div className='flex items-center gap-3'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback className='bg-primary/10 text-primary'>
                    <Activity className='size-4' />
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <p className='text-sm leading-none font-medium'>{d.name}</p>
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
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {d.code} • {formatRelativeTime(d.last_seen)}
                  </p>
                </div>
              </div>
              <div className='text-right font-medium tabular-nums'>
                <div className='text-sm'>
                  {fmtNum(d.soil_moisture_pct, '%')}
                </div>
                <div className='text-xs text-muted-foreground'>
                  Batt {fmtNum(d.battery_pct, '%', 0)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
