import { createContext, useContext } from 'react'
import type { AlertItem, AuthUser, DeviceSummary } from '@/types'

type TelemetryContextValue = {
  user: AuthUser | null
  devices: DeviceSummary[]
  openAlerts: AlertItem[]
  streamConnected: boolean
  signOut: () => Promise<void>
  refreshOverview: () => Promise<void>
}

const TelemetryContext = createContext<TelemetryContextValue>({
  user: null,
  devices: [],
  openAlerts: [],
  streamConnected: false,
  signOut: async () => {},
  refreshOverview: async () => {},
})

export function TelemetryProvider({
  value,
  children,
}: {
  value: TelemetryContextValue
  children: React.ReactNode
}) {
  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTelemetry() {
  return useContext(TelemetryContext)
}
