import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  StateBox,
  StatusBadge,
} from '../components/ui';
import { apiFetch, ApiError, formatWib } from '../lib/api';
import type { SystemSettings, UserItem, UserRole } from '../types';

export function SettingsPage() {
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
      <PageHeader
        title="Pengaturan Sistem"
        subtitle="Threshold default untuk node baru dan pengelolaan akun pengguna dashboard."
      />

      {notice && <StateBox tone="success" description={notice} />}
      {error && <StateBox tone="error" role="alert" description={error} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {settings && (
          <Card className="xl:col-span-5">
            <CardHeader
              title="Threshold Default Global"
              description="Nilai bawaan saat menambahkan perangkat baru."
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

                <Button type="submit" variant="primary" className="w-full">
                  Simpan Threshold Default
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        <Card className="xl:col-span-7">
          <CardHeader
            title="Pengguna Dashboard"
            description="Kelola akses administrator dan operator lapangan."
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
                  <option value="viewer">Viewer (Klien / Operator)</option>
                  <option value="admin">Admin</option>
                </Select>
              </Field>

              <div className="flex items-end">
                <Button type="submit" variant="primary" className="w-full">
                  Tambah Pengguna
                </Button>
              </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-[#0d1318] dark:text-slate-400">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Peran</th>
                    <th className="px-4 py-3">Dibuat</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.role} label={u.role} withDot={false} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {formatWib(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
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
      </div>
    </div>
  );
}
