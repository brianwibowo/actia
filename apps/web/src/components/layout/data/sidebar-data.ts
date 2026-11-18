import {
  AudioWaveform,
  Bell,
  Command,
  Cpu,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import type { AuthUser, DeviceSummary } from '@/types'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Administrator',
    email: 'user@gmail.com',
    avatar: '/images/weather-station.jpg',
  },
  teams: [
    {
      name: 'Actia Telemetry',
      logo: Command,
      plan: 'TimescaleDB + IoT',
    },
    {
      name: 'Kebun Teh & Kopi',
      logo: GalleryVerticalEnd,
      plan: 'Jawa Barat Cluster',
    },
    {
      name: 'Solar Grid Cluster',
      logo: AudioWaveform,
      plan: 'Field Telemetry',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Perangkat',
          url: '/devices',
          icon: Cpu,
        },
        {
          title: 'Peringatan',
          url: '/alerts',
          icon: Bell,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Pengaturan',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}

export function buildSidebarData(params?: {
  user?: AuthUser | null
  devices?: DeviceSummary[]
  openAlertsCount?: number
}): SidebarData {
  const email = params?.user?.email ?? sidebarData.user.email
  const roleLabel =
    params?.user?.role === 'admin' ? 'Administrator' : 'Viewer'
  const devices = params?.devices ?? []
  const openAlertsCount = params?.openAlertsCount ?? 0

  const navGroups: SidebarData['navGroups'] = [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Perangkat',
          url: '/devices',
          badge: devices.length > 0 ? String(devices.length) : undefined,
          icon: Cpu,
        },
        {
          title: 'Peringatan',
          url: '/alerts',
          badge: openAlertsCount > 0 ? String(openAlertsCount) : undefined,
          icon: Bell,
        },
      ],
    },
  ]

  if (params?.user?.role !== 'viewer') {
    navGroups.push({
      title: 'Other',
      items: [
        {
          title: 'Pengaturan',
          url: '/settings',
          icon: Settings,
        },
      ],
    })
  }

  return {
    user: {
      name: roleLabel,
      email,
      avatar: '/images/weather-station.jpg',
    },
    teams: sidebarData.teams,
    navGroups,
  }
}
