export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    let msg = `Permintaan gagal (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      // Abaikan body non-JSON saat parsing pesan error.
    }
    throw new ApiError(res.status, msg);
  }

  return (await res.json()) as T;
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Belum pernah kirim';
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec} detik lalu`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} hari lalu`;
}

export function formatWib(iso: string | null): string {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(iso)) + ' WIB';
}

export function fmtNum(val: number | null | undefined, unit = '', digits = 1): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '-';
  return `${Number(val.toFixed(digits))}${unit}`;
}
