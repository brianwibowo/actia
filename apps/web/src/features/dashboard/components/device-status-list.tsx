import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BatteryCharging, Droplets } from 'lucide-react'
import { fmtNum, formatRelativeTime } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getDeviceCoverImage } from '@/components/svg/actia-illustrations'
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
        <div className='max-h-[310px] space-y-2.5 overflow-y-auto pe-1'>
          {filteredDevices.map((d) => (
            <Link
              key={d.id}
              to={`/devices/${d.id}`}
              className='flex items-center justify-between gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-accent/60'
            >
              <div className='flex min-w-0 items-center gap-3'>
                <Avatar className='h-10 w-10 rounded-lg border'>
                  <AvatarImage
                    src={getDeviceCoverImage(d.code)}
                    alt={d.name}
                    className='object-cover'
                  />
                  <AvatarFallback className='rounded-lg bg-primary/10 text-xs font-bold text-primary'>
                    {d.code.slice(0, 3)}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <p className='truncate text-sm leading-none font-medium'>
                      {d.name}
                    </p>
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
                  <p className='truncate text-xs text-muted-foreground'>
                    {d.code} • {formatRelativeTime(d.last_seen)}
                  </p>
                </div>
              </div>
              <div className='shrink-0 text-right font-medium tabular-nums'>
                <div className='inline-flex items-center gap-1 text-sm'>
                  <Droplets className='size-3.5 text-[#2BBBD7]' />
                  {fmtNum(d.soil_moisture_pct, '%')}
                </div>
                <div className='flex items-center justify-end gap-1 text-xs text-muted-foreground'>
                  <BatteryCharging className='size-3.5 text-[#218DAE]' />
                  {fmtNum(d.battery_pct, '%', 0)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
