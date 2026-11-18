import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, ExternalLink, KeyRound, Send } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { swalToast } from '@/lib/swal'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export interface RevealedDeviceKey {
  id: string
  code: string
  key: string
}

interface DeviceKeyBannerProps {
  revealedKey: RevealedDeviceKey
  onClose: () => void
  onChanged: () => void
  onError: (msg: string) => void
}

export function DeviceKeyBanner({
  revealedKey,
  onClose,
  onChanged,
  onError,
}: DeviceKeyBannerProps) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testSent, setTestSent] = useState(false)

  async function copyKey() {
    await navigator.clipboard.writeText(revealedKey.key)
    setCopied(true)
    swalToast('success', 'Device Key disalin ke clipboard')
  }

  async function sendSampleReading() {
    setSendingTest(true)
    onError('')
    try {
      await apiFetch('/api/v1/ingest', {
        method: 'POST',
        headers: {
          'x-device-key': revealedKey.key,
        },
        body: JSON.stringify({
          sensor: {
            temperature_c: 29.4,
            soil_moisture_pct: 46.5,
            soil_temp_c: 26.8,
            ec: 820,
            ph: 6.5,
          },
          power: {
            solar_voltage_v: 18.4,
            solar_current_a: 1.12,
            battery_voltage_v: 12.7,
            battery_current_a: 0.62,
            power_w: 20.6,
            battery_pct: 86,
          },
        }),
      })
      setTestSent(true)
      swalToast('success', 'Data uji berhasil dikirim ke perangkat')
      onChanged()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Gagal mengirim data uji'
      onError(msg)
      swalToast('error', 'Gagal mengirim data uji', msg)
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <Alert>
      <KeyRound className='size-4' />
      <AlertTitle>
        Device Key untuk {revealedKey.code} (ditampilkan satu kali)
      </AlertTitle>
      <AlertDescription className='mt-2 space-y-3'>
        <p>
          Simpan key ini pada konfigurasi firmware ESP32/LoRa. Anda juga dapat
          mengirim 1 paket data uji agar perangkat langsung berstatus Online.
        </p>
        <pre className='overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-xs text-foreground'>
          {revealedKey.key}
        </pre>
        <div className='flex flex-wrap items-center gap-2'>
          <Button size='sm' onClick={() => void copyKey()}>
            {copied ? (
              <Check className='size-4' />
            ) : (
              <Copy className='size-4' />
            )}
            {copied ? 'Tersalin' : 'Salin Key'}
          </Button>

          <Button
            variant='outline'
            size='sm'
            disabled={sendingTest}
            onClick={() => void sendSampleReading()}
          >
            <Send className='size-4' />
            {sendingTest
              ? 'Mengirim...'
              : testSent
                ? 'Data Uji Terkirim'
                : 'Kirim Data Uji'}
          </Button>

          {testSent && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate(`/devices/${revealedKey.id}`)}
            >
              <ExternalLink className='size-4' />
              Buka Grafik
            </Button>
          )}

          <Button variant='ghost' size='sm' onClick={onClose}>
            Tutup
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
