export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface DeviceSummary {
  id: string;
  code: string;
  name: string;
  location: string;
  lat: number | null;
  lng: number | null;
  status: 'online' | 'offline' | 'maintenance';
  last_seen: string | null;
  report_interval_s: number;
  created_at: string;
  battery_pct_min: number | null;
  battery_voltage_min: number | null;
  offline_after_s: number | null;
  sensor_ts: string | null;
  temperature_c: number | null;
  soil_moisture_pct: number | null;
  soil_temp_c: number | null;
  ec: number | null;
  ph: number | null;
  power_ts: string | null;
  solar_voltage_v: number | null;
  solar_current_a: number | null;
  battery_voltage_v: number | null;
  battery_current_a: number | null;
  power_w: number | null;
  battery_pct: number | null;
  open_alerts: number;
}

export interface SensorReading {
  ts: string;
  temperature_c: number | null;
  soil_moisture_pct: number | null;
  soil_temp_c: number | null;
  ec: number | null;
  ph: number | null;
}

export interface PowerReading {
  ts: string;
  solar_voltage_v: number | null;
  solar_current_a: number | null;
  battery_voltage_v: number | null;
  battery_current_a: number | null;
  power_w: number | null;
  battery_pct: number | null;
}

export interface AlertItem {
  id: number;
  device_id: string;
  device_code: string;
  device_name: string;
  type: 'battery_low' | 'sensor_error' | 'offline';
  metric: string;
  value: number | null;
  threshold: number | null;
  triggered_at: string;
  status: 'open' | 'acknowledged' | 'resolved';
  acknowledged_at: string | null;
  resolved_at: string | null;
  acknowledged_by_email: string | null;
}

export interface SystemSettings {
  default_battery_pct_min: number;
  default_battery_voltage_min: number;
  default_offline_after_s: number;
  updated_at: string;
}

export interface UserItem {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}
