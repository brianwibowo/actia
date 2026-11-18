export interface DeviceFormState {
  code: string
  name: string
  location: string
  lat: string
  lng: string
  report_interval_s: string
  battery_pct_min: string
  battery_voltage_min: string
  offline_after_s: string
}

export const emptyDeviceForm: DeviceFormState = {
  code: '',
  name: '',
  location: '',
  lat: '',
  lng: '',
  report_interval_s: '300',
  battery_pct_min: '20',
  battery_voltage_min: '11.6',
  offline_after_s: '900',
}

export type DeviceViewMode = 'grid' | 'table' | 'map'
