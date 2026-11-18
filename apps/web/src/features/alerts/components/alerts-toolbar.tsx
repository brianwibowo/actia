import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DeviceSummary } from '@/types'

interface AlertsToolbarProps {
  devices: DeviceSummary[]
  searchText: string
  onSearchChange: (val: string) => void
  statusFilter: string
  onStatusChange: (val: string) => void
  typeFilter: string
  onTypeChange: (val: string) => void
  deviceFilter: string
  onDeviceChange: (val: string) => void
  totalCount: number
  openCount: number
  acknowledgedCount: number
  resolvedCount: number
  onReset: () => void
}

export function AlertsToolbar({
  devices,
  searchText,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  deviceFilter,
  onDeviceChange,
  totalCount,
  openCount,
  acknowledgedCount,
  resolvedCount,
  onReset,
}: AlertsToolbarProps) {
  const isFiltered =
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    deviceFilter !== 'all' ||
    searchText.trim().length > 0

  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        <Input
          placeholder='Cari perangkat atau metrik...'
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className='h-9 w-full sm:w-[220px] lg:w-[260px]'
        />

        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className='h-9 w-[165px]'>
            <SelectValue placeholder='Semua tipe' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Semua Tipe</SelectItem>
            <SelectItem value='battery_low'>Aki Lemah</SelectItem>
            <SelectItem value='sensor_error'>Sensor Anomali</SelectItem>
            <SelectItem value='offline'>Perangkat Offline</SelectItem>
          </SelectContent>
        </Select>

        <Select value={deviceFilter} onValueChange={onDeviceChange}>
          <SelectTrigger className='h-9 w-[195px]'>
            <SelectValue placeholder='Semua perangkat' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Semua Perangkat</SelectItem>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.code} - {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onReset}
            className='h-9 px-2.5'
          >
            Reset
            <X className='ms-1 size-4' />
          </Button>
        )}
      </div>

      <Tabs value={statusFilter} onValueChange={onStatusChange}>
        <TabsList className='h-9'>
          <TabsTrigger value='all' className='text-xs'>
            Semua ({totalCount})
          </TabsTrigger>
          <TabsTrigger value='open' className='text-xs'>
            Terbuka ({openCount})
          </TabsTrigger>
          <TabsTrigger value='acknowledged' className='text-xs'>
            Ditangani ({acknowledgedCount})
          </TabsTrigger>
          <TabsTrigger value='resolved' className='text-xs'>
            Pulih ({resolvedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
