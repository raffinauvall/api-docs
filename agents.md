# API Documentation Platform — Technical Specification Prompt

Saya ingin membangun sebuah platform API Documentation Management yang konsepnya mirip Swagger/Redoc, tetapi memiliki authentication, API grouping, repository integration, automatic synchronization, versioning, dan dokumentasi API yang dikelola secara terpusat.

Platform ini **tidak menggunakan upload OpenAPI secara manual sebagai workflow utama**.

Setiap project/repository memiliki file OpenAPI sendiri, misalnya:

```text
openapi.yml
openapi.yaml
openapi.json
```

Platform akan melakukan sinkronisasi file tersebut secara otomatis dari Git repository.

Repository menjadi **source of truth**, sedangkan aplikasi ini menjadi **API Documentation Registry + Viewer**.

---

# Tech Stack

- **Frontend**: React + Vite (SPA, JavaScript). TanStack Query untuk data fetching, React Router untuk routing.
- **Backend**: Node.js + Express (REST API).
- **Database**: PostgreSQL lokal (tanpa Docker), schema di `server/migrations/`.
- **Auth**: SSO ke Portal SMG (mengikuti pola project `SMG-EMPmvp`) — **session-based** (`express-session` + PostgreSQL store), bukan JWT.
- **OpenAPI parsing**: `@apidevtools/swagger-parser` (validasi) + `yaml` (parse).
- **Git provider**: GitHub (initial), abstraction `GitProvider` agar GitLab/Bitbucket mudah ditambah.

> Tidak menggunakan Next.js. Frontend SPA (React + Vite) terpisah dari backend Express.

---

# 1. Core Concept

Architecture utama:

```text
Git Repository
      │
      │
      ▼
 openapi.yml
      │
      │ webhook / sync
      ▼
API Documentation Platform
      │
      ├── Validate OpenAPI
      ├── Parse OpenAPI
      ├── Store OpenAPI Snapshot
      ├── Extract API metadata
      ├── Extract endpoints
      ├── Extract schemas
      ├── Extract parameters
      └── Generate documentation
```

User hanya perlu melakukan **register repository satu kali**.

Setelah repository terdaftar:

```text
Developer
   │
   ▼
git push
   │
   ▼
Git Provider
   │
   ▼
Webhook
   │
   ▼
Documentation Platform
   │
   ▼
Detect OpenAPI changes
   │
   ▼
Sync automatically
```

Developer tidak perlu meng-upload `openapi.yml` secara manual setiap kali dokumentasi berubah.

---

# 2. Authentication

Gunakan SSO sebagai authentication mechanism — **mengikuti pola `SMG-EMPmvp`**.

Flow:

```text
POST /api/auth/login
  body: { email (NIK), password }
       ↓
POST {PORTAL_HOST}/auth/login
  headers: { X-API-Corp: PORTAL_CORP, 'Content-Type': 'application/json' }
  body: { username: NIK, password, device: 'Web' }
       ↓
Portal mengembalikan profile + token (access/refresh)
       ↓
Simpan portalToken + user profile di session (server-side)
       ↓
Set cookie session (httpOnly)
       ↓
User diarahkan ke Dashboard
```

- Session disimpan server-side (`express-session` + PostgreSQL store), cookie `httpOnly`.
- `users` di-provision dari profile Portal (NIK sebagai identitas).
- Tipe user minimal: `id`, `email`, `name`, `avatar`, `nik`, `role`, `bu`, `created_at`, `updated_at`.

User minimal memiliki:

```text
users
──────────────
id
email
name
avatar
nik
role
bu
created_at
updated_at
```

Tidak perlu membuat authentication username/password sendiri.

---

# 3. Dashboard

Dashboard menampilkan API yang dapat diakses oleh user.

Contoh:

```text
Dashboard

API Groups

Payment APIs
├── Payment Service
├── Refund Service
└── Invoice Service

User APIs
├── User Service
└── Authentication Service

Internal APIs
└── Notification Service

[ + Register API ]
[ + Create Group ]
```

Setiap API minimal menampilkan:

- API name
- description
- group
- active version
- jumlah endpoint
- synchronization status
- last synchronized time

Contoh status:

```text
🟢 Synced
Last sync: 2 minutes ago
Commit: a82f31c
```

atau:

```text
🔴 Sync Failed
Last successful sync: 1 hour ago
```

---

# 4. API Groups

API Group digunakan untuk mengorganisasi beberapa API.

Contoh:

```text
Payment APIs
├── Payment Service
├── Refund Service
└── Invoice Service
```

Entity:

```text
api_groups
```

Field minimal:

```text
id
name
slug
description
created_by
created_at
updated_at
```

Relationship:

```text
User 1 ─── N API Groups
API Group 1 ─── N APIs
```

---

# 5. API Registration

User dapat memilih:

```text
+ Register API
```

Kemudian membuka halaman/modal registration.

User mengisi:

```text
API Name
API Description
API Group
Git Provider
Repository
Branch
OpenAPI File Path
```

Contoh:

```text
API Name:
Payment Service

Git Provider:
GitHub

Repository:
company/payment-service

Branch:
main

OpenAPI Path:
docs/openapi.yml
```

Setelah registration berhasil, sistem langsung melakukan initial synchronization.

Flow:

```text
Register API
      │
      ▼
Validate repository configuration
      │
      ▼
Fetch OpenAPI file
      │
      ▼
Validate OpenAPI
      │
      ▼
Parse OpenAPI
      │
      ▼
Create API
      │
      ▼
Create API Version
      │
      ▼
Save OpenAPI snapshot
      │
      ▼
Extract endpoints
      │
      ▼
Save parsed data
      │
      ▼
Create webhook
      │
      ▼
Initial Sync Complete
```

---

# 6. Git Provider Integration

Initial implementation menggunakan GitHub.

Namun architecture harus dibuat provider-agnostic agar dapat mendukung provider lain di masa depan.

Contoh:

```text
api_sources
```

Field:

```text
id
api_id
provider
repository
branch
file_path
sync_enabled
last_synced_at
last_commit_sha
last_sync_status
last_sync_error
created_at
updated_at
```

Provider:

```text
github
gitlab
bitbucket
```

Jangan membuat business logic documentation bergantung langsung kepada GitHub API.

Gunakan abstraction/interface seperti:

```text
GitProvider
├── GitHubProvider
├── GitLabProvider
└── BitbucketProvider
```

sehingga parser dan synchronization service tidak mengetahui provider secara spesifik.

---

# 7. GitHub Synchronization

Gunakan GitHub webhook untuk mendeteksi perubahan.

Endpoint:

```text
POST /webhooks/github
```

Ketika terjadi push:

```text
GitHub
   │
   ▼
POST /webhooks/github
   │
   ▼
Verify webhook signature
   │
   ▼
Identify repository
   │
   ▼
Check changed files
   │
   ├── openapi file tidak berubah
   │        └── Ignore
   │
   └── openapi file berubah
            │
            ▼
         Sync API
```

Jangan melakukan synchronization jika file OpenAPI tidak berubah.

Contoh:

```text
Commit A
README.md
→ Ignore

Commit B
src/payment.ts
→ Ignore

Commit C
docs/openapi.yml
→ Sync

Commit D
tests/payment.test.ts
→ Ignore
```

---

# 8. Initial Sync

Saat API pertama kali diregister:

```text
Repository
   │
   ▼
Fetch configured branch
   │
   ▼
Read configured OpenAPI file
   │
   ▼
Validate
   │
   ▼
Parse
```

Jika valid:

```text
Create API
Create API Version
Create OpenAPI Snapshot
Create Endpoints
```

Jika invalid:

```text
Registration Failed
```

Jangan membuat data database yang setengah jadi.

Gunakan database transaction.

---

# 9. Synchronization Flow

Setiap OpenAPI file berubah:

```text
Git Push
   │
   ▼
Webhook
   │
   ▼
Detect OpenAPI change
   │
   ▼
Fetch latest file
   │
   ▼
Calculate checksum
   │
   ▼
Compare with latest snapshot
   │
   ├── Same
   │    └── Ignore
   │
   └── Different
        │
        ▼
   Validate OpenAPI
        │
        ├── Invalid
        │     └── Sync Failed
        │
        └── Valid
              │
              ▼
          Parse OpenAPI
              │
              ▼
          Create snapshot
              │
              ▼
          Update parsed data
              │
              ▼
          Mark sync successful
```

---

# 10. Important Failure Behavior

Jika developer melakukan push OpenAPI yang invalid:

```text
Git Repository
      │
      ▼
Invalid OpenAPI
      │
      ▼
Sync Failed
```

**Jangan merusak dokumentasi yang sedang aktif.**

Contoh:

```text
Current Documentation
Version A
     │
     ▼
Valid
```

Developer push:

```text
Version B
     │
     ▼
Invalid OpenAPI
```

Result:

```text
Active Documentation
Version A

Sync Status
FAILED

Error
Invalid OpenAPI document
```

Version A tetap digunakan sebagai documentation yang aktif.

Version B boleh disimpan sebagai failed synchronization record jika diperlukan untuk audit/debugging, tetapi tidak boleh menggantikan active documentation.

---

# 11. OpenAPI Source of Truth

Repository adalah source of truth.

Database menyimpan snapshot dari OpenAPI document yang telah di-sync.

Entity:

```text
openapi_documents
```

Minimal:

```text
id
api_version_id
api_source_id
content
format
checksum
commit_sha
created_at
```

`content` dapat menyimpan original YAML sebagai `TEXT`.

Jika source menggunakan JSON, simpan original JSON.

Jangan hanya menyimpan hasil parsing.

Architecture:

```text
Git Repository
      │
      ▼
openapi.yml
      │
      ▼
OpenAPI Snapshot
      │
      ├── Raw Document
      │
      └── Parsed Data
```

Dengan demikian parsed data dapat dibuat ulang kapan saja.

---

# 12. API Versioning

Setiap perubahan OpenAPI dari repository harus dapat dilacak.

Entity:

```text
api_versions
```

Field minimal:

```text
id
api_id
version
commit_sha
is_active
created_at
updated_at
```

Contoh:

```text
Payment Service

v1
 ├── commit a82f31
 ├── commit b91ac2
 └── commit f81de9
```

Namun bedakan:

- API semantic version dari OpenAPI `info.version`
- source revision / Git commit

Jangan menganggap setiap Git commit sebagai semantic API version.

Contoh:

```text
OpenAPI Version:
1.4.0

Git Commit:
a82f31c
```

Simpan keduanya secara terpisah.

Jika `info.version` berubah:

```text
1.4.0 → 1.5.0
```

buat API version baru.

Jika hanya terjadi perubahan dokumentasi tanpa perubahan `info.version`, tetap simpan snapshot/revision agar history dapat dilacak.

---

# 13. OpenAPI Parsing

Gunakan OpenAPI parser yang mature dan mendukung OpenAPI 3.x.

Parser harus mengekstrak minimal:

```text
info
servers
paths
operations
parameters
requestBody
responses
schemas
security
tags
examples
```

Contoh:

```yaml
paths:
  /users/{id}:
    get:
      operationId: getUser
      summary: Get user
      parameters:
        ...
      responses:
        ...
```

menjadi:

```text
GET /users/{id}

operation_id:
getUser

summary:
Get user
```

---

# 14. Parsed Endpoint Data

Entity:

```text
endpoints
```

Field minimal:

```text
id
api_version_id
path
method
operation_id
summary
description
deprecated
tags
parameters
request_body
responses
security
created_at
updated_at
```

Gunakan PostgreSQL JSONB untuk struktur OpenAPI yang kompleks.

Contoh:

```text
parameters JSONB
request_body JSONB
responses JSONB
security JSONB
tags JSONB
```

Jangan membuat terlalu banyak tabel hanya untuk setiap detail OpenAPI jika tidak diperlukan.

Relational data digunakan untuk entity utama.

JSONB digunakan untuk data OpenAPI yang fleksibel.

---

# 15. Database Structure

Minimal:

```text
users
    │
    └── api_groups
            │
            └── apis
                  │
                  ├── api_sources
                  │       └── Git Repository
                  │
                  └── api_versions
                         │
                         ├── openapi_documents
                         │
                         └── endpoints
```

Detailed:

```text
users
────────────────────
id
email
name
avatar
nik
role
bu
created_at
updated_at
```

```text
api_groups
────────────────────
id
name
slug
description
created_by
created_at
updated_at
```

```text
apis
────────────────────
id
group_id
name
slug
description
created_by
created_at
updated_at
```

```text
api_sources
────────────────────
id
api_id
provider
repository
branch
file_path
sync_enabled
last_synced_at
last_commit_sha
last_sync_status
last_sync_error
created_at
updated_at
```

```text
api_versions
────────────────────
id
api_id
version
commit_sha
is_active
created_at
updated_at
```

```text
openapi_documents
────────────────────
id
api_version_id
api_source_id
content
format
checksum
commit_sha
created_at
```

```text
endpoints
────────────────────
id
api_version_id
path
method
operation_id
summary
description
deprecated
tags JSONB
parameters JSONB
request_body JSONB
responses JSONB
security JSONB
created_at
updated_at
```

---

# 16. Database Constraints

Gunakan foreign key dengan benar.

Minimal index:

```text
api_groups.created_by
apis.group_id
api_sources.api_id
api_sources.repository
api_versions.api_id
endpoints.api_version_id
endpoints.path
endpoints.method
```

Endpoint dalam satu API version tidak boleh duplicate:

```text
UNIQUE(api_version_id, path, method)
```

Pertimbangkan unique constraint untuk source:

```text
UNIQUE(provider, repository, branch, file_path)
```

sesuai kebutuhan ownership model.

---

# 17. Documentation Viewer

User dapat membuka API:

```text
Payment Service
```

UI:

```text
Payment Service
Version 1.4.0

Base URL
https://api.example.com

Endpoints

Payments
├── GET    /payments
├── POST   /payments
├── GET    /payments/{id}
└── DELETE /payments/{id}
```

Endpoint detail:

```text
GET /payments/{id}

Description

Parameters
├── id
└── Authorization

Request

Response
├── 200
├── 404
└── 500

Request Example

Response Example
```

UI harus menggunakan parsed OpenAPI data.

Tidak perlu melakukan parsing YAML pada setiap page load.

---

# 18. Synchronization Status

Setiap API memiliki synchronization status.

Possible status:

```text
SYNCED
SYNCING
FAILED
DISABLED
```

Dashboard menampilkan:

```text
Payment Service
🟢 Synced
Last sync: 2 minutes ago
Commit: a82f31c
```

Jika gagal:

```text
Payment Service
🔴 Sync Failed

Last successful sync:
September 4, 2026

Error:
Invalid OpenAPI document
```

---

# 19. Manual Sync

Walaupun synchronization otomatis menggunakan webhook, sediakan tombol:

```text
Sync Now
```

Flow:

```text
User
 │
 ▼
Sync Now
 │
 ▼
Fetch repository
 │
 ▼
Fetch OpenAPI
 │
 ▼
Validate
 │
 ▼
Parse
 │
 ▼
Update documentation
```

Manual sync menggunakan synchronization service yang sama dengan webhook.

Jangan membuat dua implementation logic yang berbeda.

---

# 20. Background Job

Synchronization sebaiknya tidak dilakukan seluruhnya di HTTP webhook request.

Webhook:

```text
GitHub
   │
   ▼
Webhook Endpoint
   │
   ▼
Verify Event
   │
   ▼
Create Sync Job
   │
   ▼
Return 200
```

Worker:

```text
Sync Job
   │
   ▼
Fetch OpenAPI
   │
   ▼
Validate
   │
   ▼
Parse
   │
   ▼
Persist
```

Tujuannya agar webhook tidak timeout ketika parsing atau database operation membutuhkan waktu.

---

# 21. Webhook Security

GitHub webhook harus diverifikasi menggunakan webhook secret/signature.

Jangan menerima webhook tanpa verification.

Pastikan:

- signature validation
- repository identification
- event type validation
- idempotency
- duplicate webhook handling

Webhook dapat dikirim ulang oleh Git provider.

Sistem harus aman jika event yang sama diterima lebih dari satu kali.

Gunakan commit SHA / delivery ID / checksum sebagai bagian dari idempotency strategy.

---

# 22. OpenAPI Validation

Validasi:

- YAML syntax
- JSON syntax
- OpenAPI specification
- required properties
- paths
- HTTP methods
- schemas
- references
- parameters
- responses

Jika invalid:

```text
Sync Failed

OpenAPI validation error:

Path:
paths./users.get.responses

Reason:
Missing required response definition
```

Error harus dapat ditampilkan dengan jelas di UI.

---

# 23. Security Considerations

Perhatikan:

### Git credentials

Jangan menyimpan access token plaintext.

Gunakan secure credential storage / encryption.

### Repository access

Pastikan user hanya dapat mengakses repository yang memang memiliki permission.

### OpenAPI parsing

Anggap OpenAPI file sebagai untrusted input.

Validasi:

- file size
- YAML depth
- recursive references
- malformed documents

### SSRF

Jangan melakukan HTTP request otomatis ke URL yang terdapat dalam:

```text
servers
externalDocs
examples
```

hanya karena URL tersebut terdapat di OpenAPI document.

OpenAPI harus diperlakukan sebagai data.

---

# 24. API REST Design

Contoh backend API:

```text
POST   /api/groups
GET    /api/groups
GET    /api/groups/:id
PATCH  /api/groups/:id
DELETE /api/groups/:id
```

API:

```text
POST   /api/apis/register
GET    /api/apis
GET    /api/apis/:id
PATCH  /api/apis/:id
DELETE /api/apis/:id
```

Sources:

```text
GET    /api/apis/:id/source
PATCH  /api/apis/:id/source
POST   /api/apis/:id/sync
```

Versions:

```text
GET    /api/apis/:id/versions
GET    /api/versions/:id
```

Endpoints:

```text
GET    /api/versions/:id/endpoints
GET    /api/endpoints/:id
```

Webhook:

```text
POST /webhooks/github
```

---

# 25. Repository Registration Example

User register:

```text
Name:
Payment Service

Provider:
GitHub

Repository:
company/payment-service

Branch:
main

OpenAPI:
docs/openapi.yml
```

Database:

```text
apis
────────────────────
name:
Payment Service
```

```text
api_sources
──────────────────────────────
provider:
github

repository:
company/payment-service

branch:
main

file_path:
docs/openapi.yml

sync_enabled:
true
```

Initial synchronization:

```text
commit:
a82f31c
```

Kemudian:

```text
api_versions
────────────────
version:
1.4.0

commit_sha:
a82f31c
```

---

# 26. Future API Diff

Architecture harus memungkinkan fitur berikut di masa depan:

```text
Version 1.4.0
        ↓
Version 1.5.0
        ↓
API Diff
```

Contoh:

```text
Added:
+ GET /users/{id}

Removed:
- DELETE /users/{id}

Modified:
~ POST /users
  request schema changed
```

Fitur ini belum perlu diimplementasikan pada MVP, tetapi struktur database harus memungkinkan pengembangan fitur tersebut.

---

# 27. Future Git Providers

Jangan hardcode GitHub ke seluruh aplikasi.

Gunakan abstraction:

```text
GitProvider
```

dengan kemampuan minimal:

```text
getRepository()
getFile()
getLatestCommit()
createWebhook()
```

Implementasi pertama:

```text
GitHubProvider
```

Future:

```text
GitLabProvider
BitbucketProvider
```

---

# 28. Architecture Principle

Pisahkan component berikut:

```text
Authentication
        │
        ▼
API Management
        │
        ▼
Repository Integration
        │
        ▼
Synchronization Service
        │
        ▼
OpenAPI Parser
        │
        ▼
Persistence
        │
        ▼
Documentation API
        │
        ▼
Documentation UI
```

Repository integration **tidak boleh bercampur dengan OpenAPI parsing**.

Synchronization service bertugas:

```text
fetch source
detect changes
manage sync lifecycle
```

OpenAPI parser bertugas:

```text
validate
parse
normalize
extract
```

Persistence bertugas:

```text
store snapshot
store versions
store parsed data
```

Documentation layer bertugas:

```text
query
format
serve documentation
```

---

# 29. MVP Scope

Implementasikan terlebih dahulu:

### Authentication

- SSO login
- user session

### API Management

- create API Group
- register API
- list API
- API detail

### GitHub Integration

- repository connection
- branch selection
- OpenAPI file path
- webhook registration

### OpenAPI

- YAML
- JSON
- validation
- parsing
- endpoint extraction

### Synchronization

- initial sync
- automatic webhook sync
- manual sync
- checksum detection
- commit tracking
- sync status
- sync error handling

### Database

- users
- api_groups
- apis
- api_sources
- api_versions
- openapi_documents
- endpoints

### Documentation

- API list
- endpoint list
- endpoint detail
- parameters
- request body
- responses
- schemas
- examples

---

# 30. Do Not Over-Engineer MVP

Jangan implement terlebih dahulu:

- API gateway
- API mocking
- API execution
- API analytics
- billing
- marketplace
- advanced RBAC
- API testing
- multi-region infrastructure

Fokus pada:

```text
Git Repository
      ↓
OpenAPI
      ↓
Automatic Sync
      ↓
Parse
      ↓
Store
      ↓
Documentation
```

---

# 31. Expected Output Before Implementation

Sebelum menulis code, berikan:

1. Overall architecture
2. Component architecture
3. Database ERD
4. PostgreSQL schema
5. Entity relationships
6. GitHub integration flow
7. Webhook flow
8. Synchronization lifecycle
9. OpenAPI parsing strategy
10. Versioning strategy
11. REST API contract
12. Authorization strategy
13. Folder/project structure
14. Background job architecture
15. Error handling strategy
16. Security considerations

Setelah architecture disetujui, implementasikan secara bertahap.

Prioritas:

```text
Correctness
>
Security
>
Maintainability
>
Reliability
>
Performance
>
Complexity
```

Jangan melakukan over-engineering.

Jika terdapat keputusan architecture yang ambigu, pilih solusi yang paling sederhana tetapi tetap memungkinkan platform berkembang ke skala yang lebih besar.

Jangan  melakukan testing, biar developer testing sendiri