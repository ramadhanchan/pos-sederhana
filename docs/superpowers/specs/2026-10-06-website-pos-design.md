# Design Spec: Website POS Sederhana

Tanggal: 2026-10-06
Status: Draft untuk review

## 1. Intent & Success Criteria

**Intent:** Membangun website Point of Sale (POS) sederhana sebagai project belajar dan portfolio. Full-stack, dijalankan lokal, tidak di-deploy.

**Target pengguna:** 1 admin/kasir (demo/portfolio). Bukan produksi beneran.

**Success criteria:**
- Bisa login, catat penjualan lewat keranjang, checkout mengurangi stok, lihat riwayat dan laporan harian.
- Seluruh alur jalan dengan `bun run dev` di localhost, tanpa layanan eksternal.
- Kelihatan rapi dan profesional di portfolio (design bersih, gak norak).

**Bukan bagian dari scope (YAGNI):** deploy/hosting, multi-user role, discount/pajak/pembayaran sebagian, gambar produk, export PDF/Excel, dark mode, printer fisik.

## 2. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Runtime & package manager | Bun | Preferensi; `bun:sqlite` bawaan, `bun test` bawaan |
| Framework | Next.js (App Router) + TypeScript | Satu app untuk halaman + API routes; tidak perlu Express terpisah |
| Styling | Tailwind CSS (tanpa UI library) | Ringan, kontrol penuh |
| Server state | TanStack Query (React Query) | Cache + invalidation otomatis pasca-mutasi; loading/error state gratis |
| Client state | React Context + useReducer | Keranjang belanja |
| Database | SQLite via `bun:sqlite`, file `pos.db` lokal | Tanpa server DB terpisah |
| Auth | bcrypt hash + signed session cookie | Sederhana tapi bukan plaintext |

**Catatan deploy (informasional):** Next.js umumnya di-deploy ke Vercel (Node), bukan Bun. Karena deploy diskip, ini tidak relevan sekarang.

## 3. Arsitektur

```
superpower/ (root)
├── app/                      # Next.js App Router
│   ├── (auth)/login/         # halaman login (publik)
│   ├── (protected)/          # wrapper proteksi login
│   │   ├── page.tsx          # kasir
│   │   ├── produk/
│   │   ├── riwayat/
│   │   └── laporan/
│   ├── api/
│   │   ├── auth/login/route.ts
│   │   ├── products/route.ts           # GET, POST
│   │   ├── products/[id]/route.ts      # PUT, DELETE
│   │   └── transactions/route.ts       # GET (filter date), POST (checkout)
│   └── layout.tsx
├── lib/
│   ├── db.ts                 # koneksi bun:sqlite + migrasi + seed
│   ├── auth.ts               # hash, session sign/verify
│   └── queries.ts            # fungsi query DB (di-test terpisah)
├── components/               # ProductGrid, Cart, Modal, Toast, dll
├── middleware.ts             # cek session cookie, redirect ke /login
├── pos.db                    # SQLite (gitignore)
├── tests/                    # bun test untuk API + queries
└── bunfig / package.json / tailwind / tsconfig
```

**Prinsip batas:**
- Halaman React tidak query DB langsung — selalu lewat API routes.
- API routes tipis: validasi + panggil `lib/queries.ts`.
- `lib/queries.ts` satu-satunya tempat SQL — bisa di-test tanpa HTTP.

## 4. Database Schema

```sql
users       (id, username UNIQUE, password_hash)
products    (id, name, category, price, stock, emoji, created_at)
transactions(id, total, created_at)
transaction_items (id, transaction_id, product_id, name, price, qty)
```

- `category` enum: `makanan` | `minuman` | `lainnya`
- `transaction_items` menyimpan snapshot `name`/`price` supaya riwayat tidak berubah walau produk diedit/dihapus.
- Seed saat `pos.db` belum ada: 10 produk dummy (across 3 kategori) + 1 user `admin` / `admin123` (bcrypt).

## 5. Fitur & Alur

### 5.1 Login
- Form → `POST /api/auth/login` → cocokkan bcrypt → set session cookie → redirect `/`.
- Salah → pesan error di form (401).
- `middleware.ts` cek cookie untuk semua route proteksi; tanpa session → redirect `/login`.
- Logout → hapus cookie.

### 5.2 Kasir `/`
- `ProductGrid`: kartu produk (emoji, nama, harga, badge stok), **search bar**, **filter kategori**.
- Klik produk → masuk `Cart` (Context + useReducer; item sama qty+1).
- `Cart`: daftar item, tombol +/−, hapus, `CartSummary` total (tabular-nums).
- **Checkout** → `POST /api/transactions` → backend dalam SATU transaksi SQLite: insert transaksi + items, kurangi stok. Stok kurang → rollback, 409, toast pesan.
- Sukses → modal **struk**: nama toko, daftar item, total, waktu; print CSS untuk cetak via browser.

### 5.3 Produk `/produk`
- Tabel: nama, kategori, harga, stok.
- Tambah/edit/hapus lewat modal form → API `/api/products` (POST/PUT/DELETE).
- Validasi: nama wajib, angka positif → 400 + `{ error }`.

### 5.4 Riwayat `/riwayat`
- Daftar transaksi (no, waktu, jumlah item, total), klik → detail item (snapshot).
- `GET /api/transactions`.

### 5.5 Laporan `/laporan`
- Pilih tanggal → total penjualan, jumlah transaksi, produk paling laris.
- `GET /api/transactions?date=YYYY-MM-DD`.

### 5.6 Keyboard navigation
- `/` fokus search bar (di kasir).
- `Enter` di search menambah produk pertama hasil pencarian ke keranjang.
- `Esc` menutup modal (struk/form) yang sedang terbuka.
- Hint shortcut ditampilkan kecil di UI.

### 5.7 Data flow (TanStack Query)
- Query keys: `['products']`, `['transactions', date]`, dll.
- Mutasi (checkout, CRUD produk) → `invalidateQueries` terkait → UI refresh otomatis, tidak basi.
- API GET Next.js dynamic by default (tidak di-cache server) — cache murni di client via TanStack Query.

## 6. Design System

- **Warna (3 utama):**
  - Primary: slate/charcoal `#1e293b` — header, tombol utama
  - Aksen: amber hangat `#d97706` — harga, tombol checkout, highlight
  - Background: `#f8fafc` + putih untuk kartu
  - Hijau/merah hanya indikator kecil (stok/hapus)
- **Tipografi:** font system/Inter, heading semibold, angka rupiah `tabular-nums`.
- **Layout:** sidebar navigasi (desktop) / topbar (mobile), grid kartu 3–4 kolom, whitespace longgar.
- **Komponen:** tombol (primary/outline/danger), kartu, tabel, modal, badge stok, toast — semua Tailwind, tanpa library UI.
- **Ciri:** bersih, hangat, tanpa neon/glassmorphism.

## 7. Error Handling

- Semua error API: `{ error: "pesan jelas" }` + status code (400 validasi, 401 auth, 404 tidak ketemu, 409 konflik stok, 500 tak terduga).
- Checkout dibungkus database transaction; gagal di tengah → rollback.
- Frontend: loading state (spinner), empty state ("belum ada transaksi"), error → toast, bukan layar blank.

## 8. Testing

- `bun test` untuk:
  - **API routes:** login benar/salah, CRUD produk, checkout (stok berkurang, stok kurang ditolak 409).
  - **lib/queries:** pakai database in-memory sementara (tidak menyentuh `pos.db`).
- Halaman React: verifikasi manual (testing library di-skip, YAGNI untuk skala ini).

## 9. Risiko / Catatan Jujur

- Auth ini sesi sederhana untuk demo — bukan security-grade (tanpa rate limit, httpOnly+signed cukup untuk lokal).
- Bun + Next.js stabil untuk dev lokal; pastikan tidak pakai API Node-only.
- TanStack Query menambah 1 dependency, tapi mengurangi boilerplate refetch secara signifikan.
