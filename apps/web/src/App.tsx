import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { StateBox } from './components/ui';
import { apiFetch } from './lib/api';
import { AlertsPage } from './pages/AlertsPage';
import { DeviceDetailPage } from './pages/DeviceDetailPage';
import { LoginPage } from './pages/LoginPage';
import { ManageDevicesPage } from './pages/ManageDevicesPage';
import { OverviewPage } from './pages/OverviewPage';
import { SettingsPage } from './pages/SettingsPage';
import type { AlertItem, AuthUser, DeviceSummary } from './types';

function readInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem('actia_theme');
  return saved === 'dark' ? 'dark' : 'light';
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(readInitialTheme);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [openAlerts, setOpenAlerts] = useState<AlertItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [streamConnected, setStreamConnected] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('actia_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    apiFetch<{ user: AuthUser }>('/api/v1/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const refreshOverview = useCallback(async () => {
    if (!user) return;
    setDataError('');
    try {
      const [devRes, alertRes] = await Promise.all([
        apiFetch<{ devices: DeviceSummary[] }>('/api/v1/devices'),
        apiFetch<{ alerts: AlertItem[] }>('/api/v1/alerts?status=open'),
      ]);
      setDevices(devRes.devices);
      setOpenAlerts(alertRes.alerts);
      setRefreshToken((n) => n + 1);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setStreamConnected(false);
      return;
    }
    setDataLoading(true);
    void refreshOverview();

    const source = new EventSource('/api/v1/stream', { withCredentials: true });
    const onConnected = () => setStreamConnected(true);
    const onStreamEvent = () => {
      setStreamConnected(true);
      void refreshOverview();
    };
    const onError = () => setStreamConnected(false);

    source.addEventListener('connected', onConnected);
    source.addEventListener('reading', onStreamEvent);
    source.addEventListener('device_status', onStreamEvent);
    source.addEventListener('alert', onStreamEvent);
    source.addEventListener('error', onError);

    const fallbackPoll = setInterval(() => {
      void refreshOverview();
    }, 30_000);

    return () => {
      source.close();
      clearInterval(fallbackPoll);
    };
  }, [user, refreshOverview]);

  if (!authChecked) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <StateBox
            tone="loading"
            role="status"
            title="Memeriksa sesi..."
            description="Menghubungkan ke server Actia Telemetry."
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onSuccess={setUser} theme={theme} onToggleTheme={toggleTheme} />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppShell
        user={user}
        devices={devices}
        openAlertsCount={openAlerts.length}
        streamConnected={streamConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLoggedOut={() => {
          setUser(null);
          setDevices([]);
          setOpenAlerts([]);
          setStreamConnected(false);
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <OverviewPage
                user={user}
                devices={devices}
                openAlerts={openAlerts}
                loading={dataLoading}
                error={dataError}
                onRetry={() => void refreshOverview()}
                onChanged={() => void refreshOverview()}
              />
            }
          />
          <Route
            path="/devices/:id"
            element={
              <DeviceDetailPage
                user={user}
                devices={devices}
                refreshToken={refreshToken}
              />
            }
          />
          <Route
            path="/alerts"
            element={
              <AlertsPage
                devices={devices}
                onChanged={() => void refreshOverview()}
              />
            }
          />
          {user.role === 'admin' && (
            <>
              <Route
                path="/devices/manage"
                element={
                  <ManageDevicesPage
                    devices={devices}
                    onChanged={() => void refreshOverview()}
                  />
                }
              />
              <Route path="/settings" element={<SettingsPage />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
