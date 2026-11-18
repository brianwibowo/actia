import { Copy, Terminal } from 'lucide-react'
import { swalToast } from '@/lib/swal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface IotGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sampleKey?: string
}

export function IotGuideDialog({
  open,
  onOpenChange,
  sampleKey,
}: IotGuideDialogProps) {
  const apiKey = sampleKey || 'ISI_DENGAN_DEVICE_KEY_ANDA'
  const endpointUrl = 'https://apiactia.duckdns.org/api/v1/ingest'

  const curlSnippet = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Key: ${apiKey}" \\
  -d '{
    "sensor": {
      "temperature_c": 26.4,
      "soil_moisture_pct": 54.2,
      "soil_temp_c": 24.8,
      "ec": 840,
      "ph": 6.4
    },
    "power": {
      "solar_voltage_v": 18.2,
      "solar_current_a": 1.15,
      "battery_voltage_v": 12.8,
      "battery_current_a": 0.65,
      "power_w": 20.9,
      "battery_pct": 88
    }
  }'`

  const esp32Snippet = `#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "NAMA_WIFI";
const char* WIFI_PASS = "PASSWORD_WIFI";
const char* API_URL   = "${endpointUrl}";
const char* DEV_KEY   = "${apiKey}";

void sendTelemetry(float tempC, float soilMoist, float soilTemp, float ec, float ph,
                   float solarV, float solarA, float battV, float battA, float powerW, float battPct) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEV_KEY);

  String payload = "{";
  payload += "\\"sensor\\":{";
  payload += "\\"temperature_c\\":" + String(tempC, 2) + ",";
  payload += "\\"soil_moisture_pct\\":" + String(soilMoist, 2) + ",";
  payload += "\\"soil_temp_c\\":" + String(soilTemp, 2) + ",";
  payload += "\\"ec\\":" + String(ec, 0) + ",";
  payload += "\\"ph\\":" + String(ph, 2) + "},";
  payload += "\\"power\\":{";
  payload += "\\"solar_voltage_v\\":" + String(solarV, 2) + ",";
  payload += "\\"solar_current_a\\":" + String(solarA, 2) + ",";
  payload += "\\"battery_voltage_v\\":" + String(battV, 2) + ",";
  payload += "\\"battery_current_a\\":" + String(battA, 2) + ",";
  payload += "\\"power_w\\":" + String(powerW, 2) + ",";
  payload += "\\"battery_pct\\":" + String(battPct, 0) + "}}";

  int code = http.POST(payload);
  Serial.printf("[Actia] HTTP %d: %s\\n", code, http.getString().c_str());
  http.end();
}`

  const pythonSnippet = `import requests

API_URL = "${endpointUrl}"
DEVICE_KEY = "${apiKey}"

payload = {
    "sensor": {
        "temperature_c": 26.4,
        "soil_moisture_pct": 54.2,
        "soil_temp_c": 24.8,
        "ec": 840,
        "ph": 6.4,
    },
    "power": {
        "solar_voltage_v": 18.2,
        "solar_current_a": 1.15,
        "battery_voltage_v": 12.8,
        "battery_current_a": 0.65,
        "power_w": 20.9,
        "battery_pct": 88,
    },
}

res = requests.post(
    API_URL,
    json=payload,
    headers={"X-Device-Key": DEVICE_KEY},
    timeout=10,
)
print(res.status_code, res.json())`

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text)
    swalToast('success', `${label} disalin ke clipboard`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Terminal className='size-5 text-primary' />
            Panduan Integrasi API IoT (Firmware / Gateway)
          </DialogTitle>
          <DialogDescription>
            Gunakan endpoint HTTP POST berikut untuk mengirim pembacaan sensor
            tanah dan daya surya dari ESP32, Raspberry Pi, atau gateway LoRa.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 text-sm'>
          <div className='rounded-lg border bg-muted/40 p-3 space-y-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <Badge>POST</Badge>
                <code className='font-mono text-xs font-semibold'>
                  {endpointUrl}
                </code>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='h-7 text-xs'
                onClick={() => void copyText(endpointUrl, 'URL Endpoint')}
              >
                <Copy className='size-3.5' />
                Salin URL
              </Button>
            </div>
            <div className='text-xs text-muted-foreground'>
              Header wajib: <code className='font-mono'>Content-Type: application/json</code> dan{' '}
              <code className='font-mono'>X-Device-Key: &lt;device_key&gt;</code>
            </div>
          </div>

          <Tabs defaultValue='esp32' className='space-y-3'>
            <TabsList>
              <TabsTrigger value='esp32' className='text-xs'>
                ESP32 (Arduino C++)
              </TabsTrigger>
              <TabsTrigger value='curl' className='text-xs'>
                cURL (Terminal)
              </TabsTrigger>
              <TabsTrigger value='python' className='text-xs'>
                Python / Raspberry Pi
              </TabsTrigger>
            </TabsList>

            <TabsContent value='esp32' className='space-y-2'>
              <div className='flex justify-end'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs'
                  onClick={() => void copyText(esp32Snippet, 'Kode ESP32')}
                >
                  <Copy className='size-3.5' />
                  Salin Kode ESP32
                </Button>
              </div>
              <pre className='max-h-[300px] overflow-auto rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed'>
                {esp32Snippet}
              </pre>
            </TabsContent>

            <TabsContent value='curl' className='space-y-2'>
              <div className='flex justify-end'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs'
                  onClick={() => void copyText(curlSnippet, 'Perintah cURL')}
                >
                  <Copy className='size-3.5' />
                  Salin cURL
                </Button>
              </div>
              <pre className='max-h-[300px] overflow-auto rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed'>
                {curlSnippet}
              </pre>
            </TabsContent>

            <TabsContent value='python' className='space-y-2'>
              <div className='flex justify-end'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs'
                  onClick={() => void copyText(pythonSnippet, 'Script Python')}
                >
                  <Copy className='size-3.5' />
                  Salin Python
                </Button>
              </div>
              <pre className='max-h-[300px] overflow-auto rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed'>
                {pythonSnippet}
              </pre>
            </TabsContent>
          </Tabs>

          <div className='rounded-lg border p-3 text-xs text-muted-foreground space-y-1'>
            <p className='font-medium text-foreground'>Catatan Penting:</p>
            <p>
              • Semua field di dalam <code className='font-mono'>sensor</code> dan{' '}
              <code className='font-mono'>power</code> bersifat opsional (kirim
              hanya sensor yang terpasang).
            </p>
            <p>
              • Mendukung pengiriman batch offline buffer: kirim berupa JSON
              Array <code className='font-mono'>[{'{ "ts": "2026-11-18T10:00:00Z", "sensor": {...} }'}, ...]</code>{' '}
              (maksimal 200 item per request).
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
