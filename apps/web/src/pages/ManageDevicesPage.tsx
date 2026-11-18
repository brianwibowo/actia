import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Plus } from 'lucide-react';
import { NodeMap } from '../components/NodeMap';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Modal,
  PageHeader,
  StateBox,
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [revealedKey, setRevealedKey] = useState<{ code: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
        setRevealedKey({ code: res.device.code, key: res.device_key });
        setCopied(false);
      }
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan node');
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
      setRevealedKey({ code: d.code, key: res.device_key });
      setCopied(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memutar device key');
    }
  }

  async function handleDelete(d: DeviceSummary) {
    if (!window.confirm(`Hapus node ${d.code} beserta seluruh riwayat pembacaannya?`)) {
      return;
    }
    try {
      await apiFetch(`/api/v1/devices/${d.id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus node');
    }
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(true);
  }

  const parsedLat = form.lat.trim() === '' ? null : Number(form.lat);
  const parsedLng = form.lng.trim() === '' ? null : Number(form.lng);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Node"
        subtitle="Daftarkan perangkat lapangan, atur lokasi peta, batas alert, dan device key."
        actions={
          <Button
            variant="primary"
            onClick={openCreate}
            icon={<Plus size={17} aria-hidden="true" />}
          >
            Tambah Node Baru
          </Button>
        }
      />

      {revealedKey && (
        <StateBox
          tone="success"
          title={`Device Key untuk ${revealedKey.code} (tampil satu kali)`}
          description="Simpan key ini di firmware atau konfigurasi node. Key tidak dapat dilihat lagi setelah pesan ini ditutup."
          action={
            <div className="space-y-3">
              <pre className="mono overflow-x-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-[#0e141a] dark:text-slate-100">
                {revealedKey.key}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void copyKey(revealedKey.key)}
                  icon={copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                >
                  {copied ? 'Tersalin' : 'Salin Key'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setRevealedKey(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          }
        />
      )}

      {error && !modalOpen && <StateBox tone="error" role="alert" description={error} />}

      <Card>
        <CardHeader
          title="Perangkat Terdaftar"
          description={`Total ${devices.length} node lapangan terdaftar.`}
        />
        <CardBody className="p-0 sm:p-0">
          {devices.length === 0 ? (
            <div className="p-5">
              <StateBox
                title="Belum ada node"
                description="Klik tombol Tambah Node Baru untuk membuat node pertama."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-[#0d1318] dark:text-slate-400">
                    <th className="px-5 py-3.5">Kode & Nama</th>
                    <th className="px-5 py-3.5">Lokasi</th>
                    <th className="px-5 py-3.5">Interval</th>
                    <th className="px-5 py-3.5">Batas Aki</th>
                    <th className="px-5 py-3.5">Batas Offline</th>
                    <th className="px-5 py-3.5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {devices.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/devices/${d.id}`}
                          className="mono font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                        >
                          {d.code}
                        </Link>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{d.name}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-800 dark:text-slate-200">{d.location || '-'}</div>
                        <div className="mono text-xs text-slate-500 dark:text-slate-400">
                          {d.lat !== null && d.lng !== null ? `${d.lat}, ${d.lng}` : 'Tanpa koordinat'}
                        </div>
                      </td>
                      <td className="mono px-5 py-3.5 text-xs">{d.report_interval_s}s</td>
                      <td className="mono px-5 py-3.5 text-xs">
                        {d.battery_pct_min ?? 20}% / {d.battery_voltage_min ?? 11.6}V
                      </td>
                      <td className="mono px-5 py-3.5 text-xs">{d.offline_after_s ?? 900}s</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-2">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? 'Ubah Data Node' : 'Tambah Node Baru'}
        onClose={() => setModalOpen(false)}
        titleId="node-modal-title"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Kode Node" htmlFor="dev-code">
            <Input
              id="dev-code"
              className="mono"
              required
              placeholder="NODE-01"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>

          <Field label="Nama Node" htmlFor="dev-name">
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
            <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              Klik peta untuk mengisi koordinat otomatis:
            </p>
            <NodeMap
              devices={[]}
              height={210}
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

          <div className="flex justify-end gap-2.5 pt-2 sm:col-span-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Node'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
