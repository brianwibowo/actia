import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SystemSettings } from '@/types'

interface ThresholdsFormProps {
  settings: SystemSettings
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings | null>>
  onSubmit: (e: FormEvent) => void
}

export function ThresholdsForm({
  settings,
  setSettings,
  onSubmit,
}: ThresholdsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Threshold Default Global</CardTitle>
        <CardDescription>
          Nilai ambang batas bawaan ketika mendaftarkan perangkat baru.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='grid gap-2'>
            <Label htmlFor='def-bpct'>Batas Aki Low Default (%)</Label>
            <Input
              id='def-bpct'
              type='number'
              step='0.5'
              value={settings.default_battery_pct_min}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_battery_pct_min: Number(e.target.value),
                })
              }
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='def-bv'>Batas Tegangan Aki Low Default (V)</Label>
            <Input
              id='def-bv'
              type='number'
              step='0.1'
              value={settings.default_battery_voltage_min}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_battery_voltage_min: Number(e.target.value),
                })
              }
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='def-off'>Batas Offline Default (detik)</Label>
            <Input
              id='def-off'
              type='number'
              min={30}
              value={settings.default_offline_after_s}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_offline_after_s: Number(e.target.value),
                })
              }
            />
          </div>

          <Button type='submit'>Simpan Perubahan</Button>
        </form>
      </CardContent>
    </Card>
  )
}
