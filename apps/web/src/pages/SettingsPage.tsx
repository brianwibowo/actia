import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Sliders, Users } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  StateBox,
  StatusBadge,
} from '../components/ui';
import { apiFetch, ApiError, formatWib } from '../lib/api';
import type { SystemSettings, UserItem, UserRole } from '../types';

type SettingsTab = 'thresholds' | 'users';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('thresholds');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('viewer');

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const [sRes, uRes] = await Promise.all([
        apiFetch<{ settings: SystemSettings }>('/api/v1/settings'),
        apiFetch<{ users: UserItem[] }>('/api/v1/users'),
      ]);
      setSettings(sRes.settings);
      setUsers(uRes.users);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setNotice('');
    setError('');
    try {
      const res = await apiFetch<{ settings: SystemSettings }>('/api/v1/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          default_battery_pct_min: Number(settings.default_battery_pct_min),
          default_battery_voltage_min: Number(settings.default_battery_voltage_min),
          default_offline_after_s: Number(settings.default_offline_after_s),
        }),
      });
      setSettings(res.settings);
      setNotice('Threshold default berhasil disimpan.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan pengaturan');
    }
  }

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setNotice('');
    setError('');
    try {
      await apiFetch('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      setNewEmail('');
      setNewPassword('');
      setNotice('Akun baru berhasil dibuat.');
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah user');
    }
  }

  async function removeUser(u: UserItem) {
    if (!window.confirm(`Hapus akun ${u.email}?`)) return;
    try {
      await apiFetch(`/api/v1/users/${u.id}`, { method: 'DELETE' });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus user');
    }
  }

  if (loading) {
    return (
      <StateBox
        tone="loading"
        role="status"
        title="Memuat pengaturan..."
        description="Mengambil konfigurasi threshold dan daftar akun."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Pengaturan
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kelola ambang batas (threshold) bawaan perangkat dan akses pengguna dashboard.
        </p>
      </div>

      <div className="h-[1px] w-full bg-zinc-200 dark:bg-zinc-800" />

      {notice && <StateBox tone="success" description={notice} />}
      {error && <StateBox tone="error" role="alert" description={error} />}

      {/* satnaing/shadcn-admin signature vertical sidebar settings layout */}
      <div className="flex flex-col space-y-6 lg:flex-row lg:space-x-10 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1" aria-label="Sub-menu pengaturan">
            <button
              type="button"
              onClick={() => {
                setActiveTab('thresholds');
                setNotice('');
                setError('');
              }}
              className={`inline-flex h-9 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === 'thresholds'
                  ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-100/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50'
              }`}
            >
              <Sliders size={15} aria-hidden="true" />
              <span>Threshold Default</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('users');
                setNotice('');
                setError('');
              }}
              className={`inline-flex h-9 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-100/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50'
              }`}
            >
              <Users size={15} aria-hidden="true" />
              <span>Pengguna ({users.length})</span>
            </button>
          </nav>
        </aside>

        <div className="flex-1 lg:max-w-2xl">
          {activeTab === 'thresholds' && settings && (
            <Card>
              <CardHeader
                title="Threshold Default Global"
                description="Nilai ambang batas bawaan ketika mendaftarkan perangkat baru."
              />
              <CardBody>
                <form onSubmit={saveSettings} className="space-y-4">
                  <Field label="Batas Aki Low Default (%)" htmlFor="def-bpct">
                    <Input
                      id="def-bpct"
                      className="mono"
                      type="number"
                      step="0.5"
                      value={settings.default_battery_pct_min}
                      onChange={(e) =>
                        setSettings({ ...settings, default_battery_pct_min: Number(e.target.value) })
                      }
                    />
                  </Field>

                  <Field label="Batas Tegangan Aki Low Default (V)" htmlFor="def-bv">
                    <Input
                      id="def-bv"
                      className="mono"
                      type="number"
                      step="0.1"
                      value={settings.default_battery_voltage_min}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          default_battery_voltage_min: Number(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field label="Batas Offline Default (detik)" htmlFor="def-off">
                    <Input
                      id="def-off"
                      className="mono"
                      type="number"
                      min={30}
                      value={settings.default_offline_after_s}
                      onChange={(e) =>
                        setSettings({ ...settings, default_offline_after_s: Number(e.target.value) })
                      }
                    />
                  </Field>

                  <div className="pt-2">
                    <Button type="submit" variant="primary">
                      Simpan Perubahan
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader
                title="Pengguna Dashboard"
                description="Tambahkan atau cabut akses akun administrator dan operator."
              />
              <CardBody className="space-y-6">
                <form onSubmit={createUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Email" htmlFor="user-email">
                    <Input
                      id="user-email"
                      type="email"
                      required
                      placeholder="operator@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </Field>

                  <Field label="Password (min 8 karakter)" htmlFor="user-pass">
                    <Input
                      id="user-pass"
                      type="password"
                      minLength={8}
                      required
                      placeholder="Minimal 8 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Field>

                  <Field label="Peran" htmlFor="user-role">
                    <Select
                      id="user-role"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                    >
                      <option value="viewer">Viewer (Operator)</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </Field>

                  <div className="flex items-end">
                    <Button type="submit" variant="primary" className="w-full">
                      Tambah Pengguna
                    </Button>
                  </div>
                </form>

                <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Peran</th>
                        <th className="px-4 py-2.5">Dibuat</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40">
                          <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                            {u.email}
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={u.role} label={u.role} withDot={false} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {formatWib(u.created_at)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => void removeUser(u)}
                            >
                              Hapus
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
