import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Copy, Database, ExternalLink, Plus, Send, Trash2 } from 'lucide-react';
import { NodeMap } from '../components/NodeMap';
import {
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  StateBox,
  StatusBadge,
} from '../components/ui';
import { apiFetch, ApiError } from '../lib/api';
import type { DeviceSummary } from '../types';

interface ManageDevicesPageProps {
  devices: DeviceSummary[];
  onChanged: () => void;
}

interface FormState {
  code: string;
  name: string;
  location: string;
  lat: string;
  lng: string;
  report_interval_s: string;
  battery_pct_min: string;
  battery_voltage_min: string;
  offline_after_s: string;
}

const emptyForm: FormState = {
  code: '',
  name: '',
  location: '',
  lat: '',
  lng: '',
  report_interval_s: '300',
  battery_pct_min: '20',
  battery_voltage_min: '11.6',
  offline_after_s: '900',
};

export function ManageDevicesPage({ devices, onChanged }: ManageDevicesPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filterText, setFilterText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [revealedKey, setRevealedKey] = useState<{
    id: string;
    code: string;
    key: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [seedBusy, setSeedBusy] = useState(false);
  const hasSeedDevices = devices.some((d) =>
    ['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05'].includes(d.code),
  );

  async function handleSeedDemo() {
    setSeedBusy(true);
    setError('');
    try {
      await apiFetch('/api/v1/devices/seed-demo', { method: 'POST' });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengisi data seed');
    } finally {
      setSeedBusy(false);
    }
  }

  async function handleClearDemo() {
    if (!window.confirm('Hapus seluruh perangkat contoh (ACT-01 s/d ACT-05) beserta riwayat datanya?')) {
      return;
    }
    setSeedBusy(true);
    setError('');
    try {
      await apiFetch('/api/v1/devices/seed-demo', { method: 'DELETE' });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus data seed');
    } finally {
      setSeedBusy(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(d: DeviceSummary) {
    setEditingId(d.id);
    setForm({
      code: d.code,
      name: d.name,
      location: d.location,
      lat: d.lat !== null ? String(d.lat) : '',
      lng: d.lng !== null ? String(d.lng) : '',
      report_interval_s: String(d.report_interval_s),
      battery_pct_min: String(d.battery_pct_min ?? 20),
      battery_voltage_min: String(d.battery_voltage_min ?? 11.6),
      offline_after_s: String(d.offline_after_s ?? 900),
    });
    setError('');
    setModalOpen(true);
  }

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
      return;
    }
    const editId = searchParams.get('edit');
    if (editId && devices.length > 0) {
      const target = devices.find((d) => d.id === editId);
      if (target) {
        openEdit(target);
        const next = new URLSearchParams(searchParams);
        next.delete('edit');
        setSearchParams(next, { replace: true });
      }
    }
  }, [searchParams, devices, setSearchParams]);

  const filteredDevices = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q),
    );
  }, [devices, filterText]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        location: form.location.trim(),
        lat: form.lat.trim() === '' ? null : Number(form.lat),
        lng: form.lng.trim() === '' ? null : Number(form.lng),
        report_interval_s: Number(form.report_interval_s),
        thresholds: {
          battery_pct_min: Number(form.battery_pct_min),
          battery_voltage_min: Number(form.battery_voltage_min),
          offline_after_s: Number(form.offline_after_s),
        },
      };

      if (editingId) {
        await apiFetch(`/api/v1/devices/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const res = await apiFetch<{ device: DeviceSummary; device_key: string }>(
          '/api/v1/devices',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          },
        );
        setRevealedKey({
          id: res.device.id,
          code: res.device.code,
          key: res.device_key,
        });
        setCopied(false);
        setTestSent(false);
      }
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan perangkat');
    } finally {
      setSaving(false);
    }
  }

  async function handleRotateKey(d: DeviceSummary) {
    if (!window.confirm(`Buat device key baru untuk ${d.code}? Key lama langsung tidak berlaku.`)) {
      return;
    }
    try {
      const res = await apiFetch<{ device_key: string }>(`/api/v1/devices/${d.id}/rotate-key`, {
        method: 'POST',
      });
      setRevealedKey({ id: d.id, code: d.code, key: res.device_key });
      setCopied(false);
      setTestSent(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memutar device key');
    }
  }

  async function handleDelete(d: DeviceSummary) {
    if (!window.confirm(`Hapus perangkat ${d.code} beserta seluruh riwayat pembacaannya?`)) {
      return;
    }
    try {
      await apiFetch(`/api/v1/devices/${d.id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus perangkat');
    }
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(true);
  }

  async function sendSampleReading() {
    if (!revealedKey) return;
    setSendingTest(true);
    setError('');
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
      });
      setTestSent(true);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim data uji');
    } finally {
      setSendingTest(false);
    }
  }

  const parsedLat = form.lat.trim() === '' ? null : Number(form.lat);
  const parsedLng = form.lng.trim() === '' ? null : Number(form.lng);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Perangkat"
        subtitle="Kelola perangkat lapangan, lokasi peta, dan Device Key."
        actions={
          <>
            {hasSeedDevices ? (
              <Button
                variant="danger"
                size="sm"
                disabled={seedBusy}
                onClick={() => void handleClearDemo()}
                icon={<Trash2 size={14} aria-hidden="true" />}
              >
                {seedBusy ? 'Memproses...' : 'Hapus Data Seed'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled={seedBusy}
                onClick={() => void handleSeedDemo()}
                icon={<Database size={14} aria-hidden="true" />}
              >
                {seedBusy ? 'Mengisi...' : 'Isi Data Seed'}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={openCreate}
              icon={<Plus size={15} aria-hidden="true" />}
            >
              Tambah Perangkat
            </Button>
          </>
        }
      />

      {revealedKey && (
        <StateBox
          tone="success"
          title={`Device Key untuk ${revealedKey.code} (tampil satu kali)`}
          description="Simpan key ini di firmware perangkat. Anda juga dapat mengirim 1 data uji perdana agar perangkat langsung berstatus Online."
          action={
            <div className="space-y-3">
              <pre className="mono overflow-x-auto rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                {revealedKey.key}
              </pre>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void copyKey(revealedKey.key)}
                  icon={
                    copied ? (
                      <Check size={14} aria-hidden="true" />
                    ) : (
                      <Copy size={14} aria-hidden="true" />
                    )
                  }
                >
                  {copied ? 'Tersalin' : 'Salin Key'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={sendingTest}
                  onClick={() => void sendSampleReading()}
                  icon={<Send size={14} aria-hidden="true" />}
                >
                  {sendingTest
                    ? 'Mengirim...'
                    : testSent
                      ? 'Data Uji Terkirim'
                      : 'Kirim Data Uji'}
                </Button>

                {testSent && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/devices/${revealedKey.id}`)}
                    icon={<ExternalLink size={14} aria-hidden="true" />}
                  >
                    Buka Grafik
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={() => setRevealedKey(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          }
        />
      )}

      {error && !modalOpen && <StateBox tone="error" role="alert" description={error} />}

      {/* Shadcn DataTable Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchInput
          aria-label="Filter perangkat"
          placeholder="Filter kode, nama, lokasi..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {filteredDevices.length} perangkat
        </span>
      </div>

      {/* Shadcn DataTable */}
      <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0c0c0f]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Nama Perangkat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lokasi</th>
              <th className="px-4 py-3">Interval</th>
              <th className="px-4 py-3">Batas Aki</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Belum ada perangkat yang ditampilkan.
                </td>
              </tr>
            ) : (
              filteredDevices.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40">
                  <td className="px-4 py-3">
                    <Link
                      to={`/devices/${d.id}`}
                      className="mono text-xs font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-100"
                    >
                      {d.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {d.name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={d.status}
                      label={
                        d.status === 'online'
                          ? 'Online'
                          : d.status === 'maintenance'
                            ? 'Pemeliharaan'
                            : 'Offline'
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-zinc-800 dark:text-zinc-200">{d.location || '-'}</div>
                    <div className="mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {d.lat !== null && d.lng !== null ? `${d.lat}, ${d.lng}` : 'Tanpa koordinat'}
                    </div>
                  </td>
                  <td className="mono px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                    {d.report_interval_s}s
                  </td>
                  <td className="mono px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                    {d.battery_pct_min ?? 20}% / {d.battery_voltage_min ?? 11.6}V
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/devices/${d.id}`)}
                      >
                        Detail
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openEdit(d)}>
                        Ubah
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleRotateKey(d)}
                      >
                        Key Baru
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDelete(d)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Ubah Perangkat' : 'Tambah Perangkat Baru'}
        onClose={() => setModalOpen(false)}
        titleId="node-modal-title"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Kode Perangkat" htmlFor="dev-code">
            <Input
              id="dev-code"
              className="mono"
              required
              placeholder="NODE-01"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>

          <Field label="Nama Perangkat" htmlFor="dev-name">
            <Input
              id="dev-name"
              required
              placeholder="Blok Utara A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Keterangan Lokasi" htmlFor="dev-loc" className="sm:col-span-2">
            <Input
              id="dev-loc"
              placeholder="Kebun Percobaan Lembang"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>

          <Field label="Latitude" htmlFor="dev-lat">
            <Input
              id="dev-lat"
              className="mono"
              type="number"
              step="any"
              placeholder="-6.8123"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </Field>

          <Field label="Longitude" htmlFor="dev-lng">
            <Input
              id="dev-lng"
              className="mono"
              type="number"
              step="any"
              placeholder="107.6123"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Klik peta untuk mengisi koordinat otomatis:
            </p>
            <NodeMap
              devices={[]}
              height={200}
              pickCoords={{
                lat: Number.isFinite(parsedLat) ? parsedLat : null,
                lng: Number.isFinite(parsedLng) ? parsedLng : null,
              }}
              onPickCoords={(lat, lng) =>
                setForm((prev) => ({ ...prev, lat: String(lat), lng: String(lng) }))
              }
            />
          </div>

          <Field label="Interval Kirim (detik)" htmlFor="dev-interval">
            <Input
              id="dev-interval"
              className="mono"
              type="number"
              min={10}
              required
              value={form.report_interval_s}
              onChange={(e) => setForm({ ...form, report_interval_s: e.target.value })}
            />
          </Field>

          <Field label="Batas Offline (detik)" htmlFor="dev-offline">
            <Input
              id="dev-offline"
              className="mono"
              type="number"
              min={30}
              required
              value={form.offline_after_s}
              onChange={(e) => setForm({ ...form, offline_after_s: e.target.value })}
            />
          </Field>

          <Field label="Batas Aki Low (%)" htmlFor="dev-bpct">
            <Input
              id="dev-bpct"
              className="mono"
              type="number"
              step="0.5"
              required
              value={form.battery_pct_min}
              onChange={(e) => setForm({ ...form, battery_pct_min: e.target.value })}
            />
          </Field>

          <Field label="Batas Aki Low (V)" htmlFor="dev-bv">
            <Input
              id="dev-bv"
              className="mono"
              type="number"
              step="0.1"
              required
              value={form.battery_voltage_min}
              onChange={(e) => setForm({ ...form, battery_voltage_min: e.target.value })}
            />
          </Field>

          {error && (
            <div className="sm:col-span-2">
              <StateBox tone="error" role="alert" description={error} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
