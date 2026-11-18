# Arif Telemetry (Sensor Tanah & Daya Surya)

Monorepo untuk backend API (Node.js + Fastify + TimescaleDB) dan dashboard visualisasi (React + Vite + Leaflet + ECharts), siap dijalankan lewat Docker Compose di VPS dengan Caddy HTTPS + DuckDNS.

## Struktur Proyek

- `apps/api`: Backend REST + SSE, worker deteksi offline, migrasi SQL TimescaleDB, dan simulator node.
- `apps/web`: Frontend dashboard monitoring.
- `deploy/Caddyfile` & `deploy/Caddy.Dockerfile`: Reverse proxy HTTPS otomatis dan penyaji build statis frontend.
- `docs/PRD.md`: Dokumen kebutuhan produk.

## Instalasi di VPS (Ubuntu / Debian)

```bash
# 1. Install Docker & Docker Compose plugin (jika belum ada)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Siapkan firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. Salin konfigurasi environment
cp .env.example .env
nano .env
```

Isi minimal di `.env`:
- `POSTGRES_PASSWORD`: password acak yang kuat
- `JWT_SECRET`: string acak minimal 32 karakter (bisa generate dengan `openssl rand -hex 32`)
- `DOMAIN`: subdomain DuckDNS kamu, misal `kebun-arif.duckdns.org`
- `CORS_ORIGIN`: `https://kebun-arif.duckdns.org`
- `COOKIE_SECURE`: `true`
- `ADMIN_EMAIL` & `ADMIN_PASSWORD`: akun admin login pertama kali

Jalankan seluruh stack:

```bash
docker compose up -d --build
```

Cek status container dan health endpoint:

```bash
docker compose ps
curl -fsS https://DOMAIN_KAMU/api/v1/health
```

## Menjalankan Lokal (Development)

```bash
# Install dependensi monorepo
npm install

# Jalankan database TimescaleDB saja via Docker
docker compose up -d db

# Jalankan backend API (port 3000) dan frontend (port 5173)
npm run dev:api
npm run dev:web
```

Untuk testing kirim data tanpa hardware asli, buat node baru di menu **Kelola Node**, salin device key-nya, lalu jalankan:

```bash
DEVICE_KEY=dev_xxx npm --workspace=apps/api run simulate
```

## Backup Harian Database

```bash
docker compose exec -T db pg_dump -U telemetry telemetry | gzip > backup-$(date +%F).sql.gz
```
