# API Docs Platform

Platform dokumentasi REST API internal — **registry + viewer** yang menyinkronkan file OpenAPI langsung dari Git repository (GitHub). Konsepnya mirip Swagger/Redoc, tapi repository jadi *source of truth*: developer cukup `git push`, dokumentasi otomatis ter-update via webhook. Tidak ada upload OpenAPI manual.

## Fitur

- **SSO Portal SMG** — autentikasi session-based (`express-session` + PostgreSQL store), bukan JWT.
- **API Grouping** — organisasi API ke dalam grup (mis. Payment APIs, User APIs).
- **Register API dari Git repo** — cukup daftarkan `owner/repo` + branch + path file OpenAPI, lalu sistem melakukan initial sync.
- **Sync otomatis via GitHub webhook** — hanya di-sync jika file OpenAPI berubah, dengan verifikasi signature HMAC-SHA256.
- **Manual sync** — tombol `Sync Now` yang memakai logic sync yang sama dengan webhook.
- **Versioning** — track semantic version (`info.version`) dan Git commit SHA secara terpisah, snapshot append-only.
- **Failure-safe** — jika OpenAPI invalid, dokumentasi aktif tidak rusak; status tercatat `FAILED`.
- **Documentation viewer** — tampilkan daftar endpoint, parameter, request body, responses, dan schemas dari data yang sudah di-parse.

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Frontend | React 18 + Vite (SPA), TanStack Query, React Router |
| Backend | Node.js + Express (REST API, ESM) |
| Database | PostgreSQL lokal (tanpa Docker) |
| Auth | `express-session` + `connect-pg-simple` (session-based) |
| OpenAPI parsing | `@apidevtools/swagger-parser` (validasi) + `yaml` (parse) |
| Git provider | GitHub (dengan abstraction `GitProvider`) |

## Struktur Proyek

```text
api-docs/
├── client/                 # Frontend React + Vite
│   ├── index.html
│   ├── vite.config.js      # Proxy /api & /webhooks ke server
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js          # Fetch wrapper (credentials: include)
│       ├── auth.jsx
│       ├── index.css
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── RegisterApi.jsx
│           ├── ApiDetail.jsx
│           └── EndpointDetail.jsx
├── server/                 # Backend Express
│   ├── migrations/
│   │   └── 001_init.sql    # Schema lengkap
│   ├── .env.example
│   └── src/
│       ├── index.js        # Entry point + mount route
│       ├── config.js       # Env config terpusat
│       ├── db.js           # Pool + transaction helper
│       ├── migrate.js      # Auto-migrate saat start
│       ├── auth/
│       │   ├── session.js  # Session middleware
│       │   ├── middleware.js # requireAuth / adminOnly
│       │   └── portal.js   # Login SSO Portal SMG
│       ├── middleware/
│       │   └── error.js    # Error handler + asyncHandler
│       ├── repos/          # Data access (SQL)
│       │   ├── users.js
│       │   ├── groups.js
│       │   ├── apis.js
│       │   ├── sources.js
│       │   └── versions.js
│       ├── routes/         # REST handlers
│       │   ├── auth.js
│       │   ├── groups.js
│       │   ├── apis.js
│       │   ├── versions.js
│       │   ├── endpoints.js
│       │   └── webhooks.js
│       ├── scripts/
│       │   └── initdb.js   # Inisialisasi cluster PostgreSQL lokal
│       └── services/
│           ├── git-provider.js # Abstraction GitHub
│           ├── parser.js       # Parse + validate OpenAPI
│           └── sync.js         # Logic sinkronisasi (satu sumber)
├── pgdata/                 # Data dir PostgreSQL lokal (gitignored)
├── package.json            # Root: script dev & db
└── .env.example
```

## Prasyarat

- Node.js 18+ (mendukung native `fetch` dan `node --watch`)
- PostgreSQL lokal (`initdb`, `psql`, `createdb`) — tersedia di `PATH`

## Setup

### 1. Inisialisasi & mulai PostgreSQL lokal

Data dir disimpan di `pgdata/` (tanpa Docker):

```bash
npm run db:init
```

Ini menjalankan `initdb -D pgdata` jika cluster belum ada. Lalu buat database `api_docs`:

```bash
createdb api_docs
```

> Jika ingin mengelola server PostgreSQL sendiri, sesuaikan `DATABASE_URL` di `server/.env`.

### 2. Konfigurasi environment

```bash
cp server/.env.example server/.env
```

Isi `server/.env` sesuai kebutuhan (lihat [Environment Variables](#environment-variables)).

### 3. Install dependency

```bash
npm install
```

### 4. Jalankan development

```bash
npm run dev
```

Server berjalan di `http://localhost:4000`, client di `http://localhost:5173` (Vite mem-proxy `/api` dan `/webhooks` ke server).

## Script (root)

| Command | Deskripsi |
| --- | --- |
| `npm run dev` | Jalankan server + client bersamaan (concurrently) |
| `npm run dev:server` | Jalankan hanya server (`node --watch`) |
| `npm run dev:client` | Jalankan hanya client (Vite) |
| `npm run db:init` | Inisialisasi cluster PostgreSQL lokal di `pgdata/` |
| `npm run db:migrate` | Jalankan migrasi |
| `npm run build` | Build frontend (Vite) |
| `npm run start` | Jalankan server (production) |

Migrasi juga otomatis dijalankan saat server start (`migrate()` di `index.js`).

## Environment Variables

Dibaca dari `server/.env` (lihat `server/src/config.js`).

| Variable | Default | Deskripsi |
| --- | --- | --- |
| `NODE_ENV` | `development` | Mode environment |
| `PORT` | `4000` | Port server |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin client untuk CORS |
| `DATABASE_URL` | `postgres://localhost:5432/api_docs` | Koneksi PostgreSQL |
| `SESSION_SECRET` | (dev fallback) | Secret session, **wajib** random ≥32 char di produksi |
| `SESSION_NAME` | `api_docs_sid` | Nama cookie session |
| `COOKIE_SECURE` | `false` | Set `true` hanya di production HTTPS |
| `PORTAL_AUTH_URL` | — | URL login Portal SMG |
| `PORTAL_BASIC_USERNAME` | — | Username Basic Auth portal |
| `PORTAL_BASIC_PASSWORD` | — | Password Basic Auth portal |
| `CORP_ID` | — | Corporate ID (fallback ke `PORTAL_CORP`) |
| `APP_KEY` | — | App key portal |
| `PORTAL_BUSINESS_UNIT_FIELD` | `business_unit` | Nama field business unit |
| `DEFAULT_BUSINESS_UNIT` | — | Business unit default |
| `GITHUB_TOKEN` | — | GitHub PAT (opsional, untuk repo private) |
| `GITHUB_WEBHOOK_SECRET` | — | Secret untuk verifikasi webhook signature |
| `DEV_AUTH` | `true` | Aktifkan `POST /api/auth/dev-login` (hanya non-production) |

> Config Portal memakai `PORTAL_AUTH_URL`, `PORTAL_BASIC_USERNAME`, `PORTAL_BASIC_PASSWORD`, `CORP_ID`, dan `APP_KEY`. Jika belum di-set, login Portal akan gagal dengan error `PORTAL_CONFIG`.

## Database Schema

Tabel utama (detail lengkap di `server/migrations/001_init.sql`):

```text
users
  └── api_groups (created_by)
        └── apis (group_id)
              ├── api_sources (api_id)     → Git repo source
              └── api_versions (api_id)
                    ├── openapi_documents (api_version_id)
                    └── endpoints (api_version_id)
```

- **`users`** — profil user dari Portal (NIK unik).
- **`api_groups`** — pengelompokan API.
- **`apis`** — entitas API ter-registrasi.
- **`api_sources`** — konfigurasi source Git (`provider`, `repository`, `branch`, `file_path`) + status sync.
- **`api_versions`** — versi (semantic + commit SHA), append-only.
- **`openapi_documents`** — snapshot dokumen asli (YAML/JSON) + checksum.
- **`endpoints`** — data endpoint ter-parse (JSONB untuk struktur kompleks).

Constraint penting:
- `UNIQUE(api_version_id, path, method)` — endpoint tidak boleh duplikat dalam satu versi.
- `UNIQUE(provider, repository, branch, file_path)` — source tidak boleh duplikat.

## REST API

Semua route kecuali auth/webhook diproteksi `requireAuth`.

### Auth

| Method | Path | Deskripsi |
| --- | --- | --- |
| `POST` | `/api/auth/login` | SSO login Portal (body: `nik`, `password`) |
| `POST` | `/api/auth/dev-login` | Dev login (hanya non-production) |
| `GET` | `/api/auth/me` | Profil user yang login |
| `POST` | `/api/auth/logout` | Logout (destroy session) |

### Groups

| Method | Path | Deskripsi |
| --- | --- | --- |
| `GET` | `/api/groups` | List group |
| `POST` | `/api/groups` | Buat group |
| `GET` | `/api/groups/:id` | Detail group |
| `PATCH` | `/api/groups/:id` | Update group |
| `DELETE` | `/api/groups/:id` | Hapus group |

### APIs

| Method | Path | Deskripsi |
| --- | --- | --- |
| `GET` | `/api/apis` | List API |
| `POST` | `/api/apis/register` | Register repo Git + initial sync |
| `GET` | `/api/apis/:id` | Detail API |
| `PATCH` | `/api/apis/:id` | Update API |
| `DELETE` | `/api/apis/:id` | Hapus API |
| `GET` | `/api/apis/:id/source` | Konfigurasi source |
| `PATCH` | `/api/apis/:id/source` | Update source |
| `POST` | `/api/apis/:id/sync` | Manual sync |
| `GET` | `/api/apis/:id/versions` | List versi |

### Versions & Endpoints

| Method | Path | Deskripsi |
| --- | --- | --- |
| `GET` | `/api/versions/:id` | Detail versi |
| `GET` | `/api/versions/:id/endpoints` | List endpoint versi |
| `GET` | `/api/versions/:id/document` | Dokumen OpenAPI asli (YAML/JSON) |
| `PATCH` | `/api/versions/:id` | Aktivasi versi (rollback) |
| `GET` | `/api/endpoints/:id` | Detail endpoint |

### Webhook

| Method | Path | Deskripsi |
| --- | --- | --- |
| `POST` | `/webhooks/github` | Terima push event GitHub (verifikasi signature) |

## Authentication Flow

```text
POST /api/auth/login { nik, password }
        ↓
POST {PORTAL_AUTH_URL} (Basic Auth + corp_id + app_key)
        ↓
Portal → profile + token
        ↓
Upsert user lokal (NIK sebagai identitas)
        ↓
Simpan user + portalToken di session server-side
        ↓
Set cookie httpOnly
```

Session disimpan di PostgreSQL (`connect-pg-simple`), cookie `httpOnly`. Untuk development, `POST /api/auth/dev-login` tersedia jika `DEV_AUTH=true`.

## Synchronization Flow

```text
Git push → GitHub webhook → POST /webhooks/github
        ↓
Verifikasi signature (HMAC-SHA256)
        ↓
Cek event (hanya 'push') & repository
        ↓
Cek apakah file OpenAPI berubah
        ├── Tidak → ignore
        └── Ya → syncApiSource()
                    ↓
              Fetch latest file (GitHub API)
                    ↓
              Validate + parse OpenAPI
                    ├── Invalid → status FAILED (dok aktif aman)
                    └── Valid → buat versi + snapshot + endpoints
```

Logic sync ada di satu tempat (`server/src/services/sync.js`) dan dipakai oleh webhook, manual sync, dan initial sync. Idempotency memakai commit SHA: jika commit sama dan status `SYNCED`, sync di-skip.
