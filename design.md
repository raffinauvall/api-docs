# Hub API — Design Direction

## Referensi

- [FINANCIA — Finance CRM & SaaS UI/UX Dashboard Design](https://www.behance.net/gallery/248793029/FINANCIA-Finance-CRM-SaaS-UIUX-Dashboard-Design)
- Referensi dipakai untuk karakter visual: dark dashboard, panel modular, chart yang dominan, kontras antara surface gelap dan aksen ungu, serta kepadatan informasi yang terkontrol.
- Jangan menyalin logo, ilustrasi, copy, angka finance, atau layout secara pixel-perfect. Produk ini adalah developer portal internal; Git, OpenAPI, endpoint, versi, dan status sync adalah konten utamanya.

## Produk dan pengguna

Hub API adalah registry dan viewer dokumentasi API internal SMG. Repository Git tetap menjadi source of truth; Hub API membantu orang menemukan API, memahami endpoint, melihat versi, dan mengetahui apakah dokumentasi berhasil disinkronkan.

Pengguna utama:

- Developer yang mencari endpoint dan contoh kontrak API.
- Tech lead atau owner yang memantau API, versi aktif, dan status sync.
- Admin platform yang mendaftarkan repository serta mengelola group.

Keputusan desain utama: setiap halaman harus menjawab satu pertanyaan kerja dengan cepat. Dashboard menjawab “apa yang perlu saya buka atau perbaiki?”, detail API menjawab “kontrak API ini apa?”, detail endpoint menjawab “bagaimana cara memanggilnya?”.

## Karakter visual

- **Tenang dan operasional.** Terlihat seperti control room untuk developer, bukan halaman marketing.
- **Padat tetapi tidak sesak.** Informasi dikelompokkan ke panel dengan hierarki kuat; jangan membuat semua hal menjadi kartu.
- **Premium lewat kontras, bukan dekorasi.** Surface berlapis, border tipis, dan satu aksen utama cukup.
- **Evidence-first.** Status, jumlah endpoint, versi, commit, dan waktu sync hanya ditampilkan bila berasal dari data nyata.

Dials:

- Energy: 2/5 — hidup lewat aksen dan state, bukan glow atau animasi.
- Rhythm: 3/5 — dashboard memakai variasi panel; halaman dokumentasi lebih tenang dan linear.
- Motion: 1/5 — hanya feedback interaksi, loading, dan perubahan status.

## Warna

Gunakan token berikut sebagai dasar. Nama token sengaja netral supaya tidak mengunci implementasi ke satu utility class.

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `bg.canvas` | `#08090D` | Latar utama aplikasi |
| `bg.surface` | `#101219` | Panel dan sidebar |
| `bg.surfaceRaised` | `#171923` | Panel aktif, popover, command surface |
| `bg.input` | `#0C0E14` | Input, code block, area yang butuh fokus |
| `border.default` | `#252936` | Border panel dan divider |
| `border.strong` | `#383D4D` | Hover, focus, dan pemisah penting |
| `text.primary` | `#F4F5F7` | Heading dan data utama |
| `text.secondary` | `#A5A9B5` | Deskripsi dan metadata |
| `text.muted` | `#6F7482` | Hint, timestamp, label sekunder |
| `accent.primary` | `#9B7BFF` | Link aktif, focus, chart highlight, CTA utama |
| `accent.soft` | `rgba(155,123,255,.12)` | Selected surface dan hover |
| `state.success` | `#48D597` | Synced, valid, aktif |
| `state.warning` | `#F2B76B` | Syncing, pending, perhatian |
| `state.error` | `#F27B8A` | Failed, invalid, error |
| `method.get` | `#67B7FF` | GET |
| `method.write` | `#C79BFF` | POST, PUT, PATCH |
| `method.delete` | `#F27B8A` | DELETE |

Aturan warna:

- Maksimal 2–3 warna aktif dalam satu area: neutral, purple accent, dan satu state color bila perlu.
- Ungu hanya menandai pilihan, fokus, aksi utama, atau insight yang perlu dilihat. Jangan mewarnai semua icon dan border.
- Tidak memakai gradient sebagai background utama, glow dekoratif, atau glassmorphism di seluruh aplikasi.
- Status selalu dibantu label teks; warna saja tidak cukup.

## Tipografi

- Gunakan font sans-serif UI yang sudah tersedia di sistem atau dependency yang sudah ada. Jangan menambah font hanya untuk gaya.
- Body: 14–15px, line-height 1.5.
- Page title: 28–36px, weight 700–800.
- Section title: 16–18px, weight 650–700.
- Data besar / KPI: 28–40px, weight 700–800.
- Metadata: 11–12px, uppercase hanya untuk label pendek seperti `SYNC STATUS` atau `API GROUP`.
- Path endpoint, commit SHA, repository, dan payload memakai monospace untuk membedakan data teknis dari copy biasa.
- Hindari heading uppercase bertracking lebar sebagai gaya default.

## Layout shell

### Desktop

- Canvas penuh dengan sidebar kiri tetap, lebar 232–256px.
- Header atas tinggi sekitar 64px: logo, konteks halaman, search/command entry bila tersedia, user menu.
- Konten utama scroll sendiri; sidebar tetap berada di tempat.
- Padding konten 24–32px. Lebar maksimal mengikuti area kerja, bukan memaksa satu kolom sempit.
- Grid 12 kolom hanya untuk layout lebar yang memang membutuhkan beberapa panel. Jangan memakainya pada detail endpoint.

### Tablet

- Sidebar mengecil atau menjadi drawer pada lebar menengah.
- Dashboard turun dari tiga panel ke dua panel sebelum akhirnya satu kolom.
- Header tidak boleh menumpuk; action utama tetap terlihat, action sekunder masuk menu.

### Mobile

- Navigasi utama memakai drawer dengan tombol `Menu` yang berlabel, bukan icon tanpa konteks.
- Semua panel menjadi satu kolom; tidak ada tabel yang memaksa halaman melebar.
- Toolbar boleh wrap menjadi beberapa baris.
- Target sentuh minimum 44×44px dengan jarak yang jelas.
- Code/path panjang memakai container horizontal yang terkontrol atau wrapping; halaman tidak boleh mengalami horizontal overflow.
- Kurangi padding dan ukuran heading, tetapi jangan mengecilkan teks body di bawah ukuran baca yang wajar.

## Struktur halaman

### 1. Login

Tujuan: masuk ke Hub API melalui SSO Portal SMG.

- Latar dark solid dengan satu bidang fokus, bukan kumpulan orb atau gradient.
- Card login sempit, surface raised, logo SMG, judul `Hub API`, copy satu kalimat.
- Form hanya berisi NIK Portal dan Password Portal.
- CTA utama `Masuk ke Hub SMG`.
- Dev Login hanya tampil di environment development dan harus terlihat sebagai mode development.
- Error tampil dekat form dengan `role="alert"`; loading button mempertahankan lebar dan memberi feedback.

### 2. Dashboard / Overview

Tujuan: menemukan API dan mendeteksi pekerjaan yang perlu dilakukan.

Urutan visual:

1. Page header: `Developer Portal`, deskripsi singkat, dan action `Register API`.
2. Ringkasan ringkas: registered APIs, total endpoints, synced APIs. Angka harus berasal dari query nyata; tidak menampilkan delta fiktif.
3. Panel prioritas sync: API dengan status `FAILED`, `SYNCING`, atau `PENDING` di atas daftar normal.
4. API groups sebagai section yang bisa dipindai, bukan kumpulan card identik tanpa hierarki.
5. Empty state yang memberi action pertama jika belum ada API.

Panel yang paling penting adalah status sync dan akses ke API. KPI hanya konteks, bukan hero.

### 3. Software Catalog

Tujuan: melihat inventaris apps, APIs, dan services.

- Header dengan search/filter bila datanya sudah cukup banyak.
- Item menampilkan nama, tipe, deskripsi singkat, repository, jumlah endpoint, dan status.
- Gunakan list atau dua kolom yang responsif; jangan membuat bento grid dekoratif.
- State kosong menjelaskan hubungan antara register API dan repository source of truth.

### 4. Organization

Tujuan: memahami ownership business unit dan team.

- Tampilkan unit sebagai section dengan team di dalamnya.
- Hierarki ownership lebih penting daripada metrik.
- Team kosong memakai empty state lokal, bukan panel palsu yang terlihat terisi.

### 5. API Detail

Tujuan: memahami identitas API, status source, versi aktif, dan endpoint yang tersedia.

Urutan:

1. Breadcrumb/back link.
2. Header API: nama, deskripsi, group, status sync, action `Sync now`.
3. Source panel: provider, repository, branch, file path, commit terakhir, waktu sync.
4. Version switcher: versi semantic dan commit SHA dipisahkan jelas.
5. Endpoint list dengan method, path, summary, dan filter/search bila diperlukan.

Status `FAILED` tidak boleh menghapus atau mengganti versi aktif yang masih valid. Tampilkan error sync sebagai konteks operasional.

### 6. Endpoint Detail

Tujuan: membaca dan mencoba memahami satu endpoint.

- Header menonjolkan method dan path dengan monospace.
- Tampilkan summary, description, auth requirement, parameters, request body, responses, dan schemas dalam urutan baca yang natural.
- Gunakan tab hanya jika bagian memang panjang; jangan menyembunyikan informasi inti di balik tab.
- Code/payload block memakai surface `bg.input`, border halus, dan tombol copy yang punya feedback teks.
- Response status memakai warna state dengan label angka dan deskripsi.

### 7. Register API

Tujuan: mendaftarkan repository sekali lalu melakukan initial sync.

- Form dibagi menjadi tiga kelompok: identity (`API name`, `description`, `group`), source (`provider`, `repository`, `branch`, `file path`), dan submit.
- Field teknis memakai monospace hanya pada value, bukan seluruh form.
- Submit menjelaskan proses: `Register and sync repository`.
- Saat gagal sync setelah API terdaftar, pisahkan dua fakta tersebut: registration berhasil, initial sync gagal.
- Jangan memakai wizard multi-step sebelum jumlah field atau error rate membuktikan kebutuhan itu.

## Komponen dan aturan

### Surface

- Radius default 10px; radius besar hanya untuk auth surface atau area fokus utama.
- Border 1px dengan kontras rendah. Gunakan shadow sangat tipis atau tanpa shadow di canvas gelap.
- Satu panel boleh elevated jika sedang menjadi fokus. Jangan memberi shadow pada semua panel.

### Button

- Primary: background `accent.primary`, teks gelap/terang sesuai contrast check.
- Secondary: surface raised dengan border.
- Destructive: hanya untuk aksi yang benar-benar destruktif seperti menghapus API.
- Label harus menjelaskan aksi: `Sync now`, `Register API`, `Open endpoint`; jangan memakai `Explore` atau `Get started`.
- Tidak menambahkan panah dekoratif ke semua tombol.

### Badge dan status

- Badge hanya untuk state atau klasifikasi yang membantu scanning.
- Status yang tersedia: `Synced`, `Syncing`, `Failed`, `Disabled`, `Pending`.
- Tidak memakai badge `New`, `AI Powered`, atau dot beranimasi jika tidak mewakili state nyata.

### Chart

- Chart hanya ada jika menjawab pertanyaan operasional, misalnya “berapa banyak API gagal sync dalam 7 hari terakhir?”.
- Judul chart harus berupa pertanyaan atau metrik spesifik, bukan `Overview`.
- Jika belum ada data time series yang nyata, gunakan ringkasan teks atau hilangkan chart.
- Chart memakai grid dan tooltip seperlunya; jangan menambahkan grafik hanya untuk mengisi ruang seperti referensi finance.

### Icon

- Icon dipakai untuk membantu mengenali fungsi, bukan sebagai dekorasi setiap judul.
- Pilih satu set icon yang sudah ada di codebase atau gunakan SVG sederhana yang relevan.
- Hindari sparkle, magic wand, robot, lightning, dan icon generik lain yang tidak menjelaskan domain.

## States wajib

Setiap halaman data harus punya:

- Loading state yang mempertahankan struktur layout tanpa skeleton dekoratif berlebihan.
- Empty state yang menjelaskan kenapa kosong dan action pertama yang bisa dilakukan.
- Error state yang menyebut tindakan pemulihan jika ada.
- Disabled state untuk action yang belum bisa dilakukan.
- Success feedback setelah sync, register, update, atau copy.

Nilai placeholder atau contoh harus diberi label jelas dan tidak boleh terlihat seperti data production.

## Accessibility

- Semua input punya label yang terlihat.
- Semua action keyboard-accessible dengan focus ring yang jelas menggunakan aksen ungu.
- Kontras teks dan state memenuhi WCAG AA; jangan mengandalkan slate abu-abu tipis di atas canvas gelap.
- Method HTTP, status sync, dan error tidak dikomunikasikan lewat warna saja.
- Modal, drawer, tooltip, dan dropdown harus punya keyboard behavior dan close behavior yang jelas.
- `prefers-reduced-motion` mematikan animasi non-esensial.

## Motion

- Transisi hover/focus singkat sekitar 120–180ms.
- Loading memakai indikator sederhana; tidak ada infinite floating atau pulsing dekoratif.
- Perubahan status sync boleh memakai highlight singkat satu kali untuk membantu orientasi.
- Tidak menganimasikan seluruh dashboard saat mount.

## Do / don't

### Do

- Jadikan status sync, endpoint, versi, dan repository sebagai pusat visual.
- Pakai ungu sebagai penanda fokus dan navigasi aktif.
- Tampilkan data nyata atau empty state yang jujur.
- Variasikan komposisi berdasarkan kepentingan konten.
- Uji desktop, tablet, mobile, keyboard, loading, empty, dan error.

### Don't

- Jangan menyalin dashboard finance, istilah finance, angka palsu, atau screenshot Behance.
- Jangan memakai gradient biru-ungu, glow, blur, dan rounded pill di semua elemen.
- Jangan membuat empat KPI hanya karena dashboard “biasanya” punya empat KPI.
- Jangan membuat chart tanpa pertanyaan yang perlu dijawab.
- Jangan menambah link, menu, atau tombol yang belum punya tujuan nyata.

## Delivery checklist

- [ ] Visual terasa seperti Hub API walau logo dan nama produk dilepas.
- [ ] Warna aktif terbatas dan aksen ungu tetap punya makna.
- [ ] Semua angka, status, commit, dan timestamp berasal dari data nyata.
- [ ] Halaman punya loading, empty, error, dan success feedback yang relevan.
- [ ] Tidak ada horizontal overflow di mobile.
- [ ] Semua kontrol utama bisa digunakan dengan keyboard dan touch.
- [ ] Referensi Behance menginspirasi karakter visual, bukan menjadi template yang disalin.
