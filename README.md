# Toko Sederhana — POS Sederhana

Website Point of Sale (POS) sederhana: kasir dengan keranjang, checkout + struk,
kelola produk, riwayat transaksi, dan laporan penjualan harian.
Dibangun untuk belajar dan portfolio — dijalankan sepenuhnya lokal, tanpa deployment.

## Tech Stack

- **Runtime:** Bun (package manager, `bun:sqlite`, `bun test`)
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Server state:** TanStack Query
- **Database:** SQLite (file `pos.db`, dibuat otomatis)

## Menjalankan

```bash
bun install        # install dependensi
bun run dev        # dev server → http://localhost:3000
```

> Penting: semua script dev/build/start memakai `bun --bun next ...` —
> `bun:sqlite` hanya hidup di runtime Bun, jangan diganti dengan Node/npm.

## Login

| Username | Password   |
| -------- | ---------- |
| `admin`  | `admin123` |

Akun dan 10 produk dummy di-seed otomatis saat `pos.db` belum ada.

## Fitur

- **Kasir** (`/`) — cari produk (`/` untuk fokus search, `Enter` menambah hasil
  pertama), filter kategori, keranjang, checkout atomik (stok tidak pernah minus),
  struk siap cetak
- **Produk** (`/produk`) — tambah/edit/hapus produk, badge stok
- **Riwayat** (`/riwayat`) — daftar transaksi + detail item (snapshot nama/harga)
- **Laporan** (`/laporan`) — total penjualan, jumlah transaksi, produk terlaris
  per tanggal

## Testing

```bash
bun test           # 41 test: queries, auth, API routes
bun run typecheck  # tsc --noEmit
bun run build      # production build
```

## Arsitektur

Satu aplikasi Next.js: halaman React sebagai frontend, API routes sebagai
backend, SQLite via `bun:sqlite` sebagai database.

- `lib/db.ts` — koneksi, schema, seed
- `lib/queries.ts` — semua SQL
- `lib/auth.ts` — bcrypt + signed session cookie (HMAC-SHA256)
- `proxy.ts` — proteksi route halaman (Next 16: pengganti `middleware.ts`)
- `app/api/*` — endpoint REST; mutasi (POST/PUT/DELETE) wajib session cookie

Design spec lengkap: [`docs/superpowers/specs/2026-10-06-website-pos-design.md`](docs/superpowers/specs/2026-10-06-website-pos-design.md)

## Catatan

Ini demo lokal, bukan produksi: tanpa rate limit, tanpa HTTPS, secret session
memakai fallback dev. Jangan dipakai untuk penjualan beneran.
