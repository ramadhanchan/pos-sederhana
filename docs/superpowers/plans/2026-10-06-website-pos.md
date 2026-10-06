# Website POS Sederhana Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun website POS sederhana full-stack (login, kasir dengan keranjang + checkout, kelola produk, riwayat, laporan harian) yang jalan lokal dengan `bun run dev`.

**Architecture:** Satu aplikasi Next.js App Router — halaman React sebagai frontend, API routes sebagai backend, SQLite (`bun:sqlite`) sebagai database file lokal. Server state pakai TanStack Query (cache + invalidasi otomatis), cart state pakai Context + useReducer. Auth: bcrypt + signed session cookie, proteksi halaman via middleware.

**Tech Stack:** Bun (runtime, package manager, `bun:sqlite`, `bun test`), Next.js (App Router) + TypeScript, Tailwind CSS (tanpa UI library), TanStack Query.

**Spec:** `docs/superpowers/specs/2026-10-06-website-pos-design.md`

## Global Constraints

- Runtime & package manager: **Bun** — semua perintah `bun install`, `bun run dev`, `bun test`.
- Framework: **Next.js App Router** + TypeScript, tanpa Express terpisah.
- Styling: **Tailwind CSS saja** — dilarang pakai UI component library (shadcn, MUI, dll).
- Database: **SQLite via `bun:sqlite`**, file `pos.db` di root project, masuk `.gitignore`.
- Warna design system (persis): primary `#1e293b`, aksen `#d97706`, background `#f8fafc`; hijau/merah hanya indikator kecil (stok/hapus).
- Kategori produk (enum, persis): `makanan` | `minuman` | `lainnya`.
- Seed (sekali, saat DB belum ada): **10 produk dummy** + user **`admin` / `admin123`** (bcrypt hash).
- Format rupiah: `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })`.
- Bentuk error API (semua endpoint): `{ error: string }` dengan status **400** validasi, **401** auth, **404** tidak ketemu, **409** konflik stok, **500** tak terduga.
- Server state: **TanStack Query**; cart client state: **Context + useReducer**.
- `getDb()` dipanggil di dalam handler (bukan top-level module) dan membaca `process.env.POS_DB ?? "pos.db"`.
- Session secret: `process.env.SESSION_SECRET ?? "pos-dev-secret"` (lokal only).
- Store name di struk: **"Toko Sederhana"**.
- Tidak ada: deploy, diskon/pajak, gambar produk, dark mode, multi-role, testing library untuk halaman React.
- Timestamp transaksi: string lokal `YYYY-MM-DD HH:MM:SS` (dibuat di aplikasi, bukan `CURRENT_TIMESTAMP` SQLite), filter laporan pakai `LIKE 'YYYY-MM-DD%'`.

## Review Focus

Lima kondisi yang paling mungkin merusak software ini bila tidak diproteksi test:

1. **Stok negatif saat checkout ganda** — unit terakhir di-checkout 2x berturut-turut: kedua request diproses, stok tidak boleh < 0, yang kedua harus 409. Test di Task 6.
2. **Produk dihapus setelah ada penjualan** — riwayat harus tetap menampilkan nama & harga snapshot saat itu. Test di Task 6.
3. **Seed ganda saat dev server restart** — `initDb` dijalankan lagi pada DB yang sudah ada: produk/user tidak boleh terduplikasi atau di-reset. Test di Task 2.
4. **Input API malformed** — `price: -5`, `qty: "abc"`, body kosong: harus 400 `{ error }`, bukan 500/crash. Test di Task 5 & 6.
5. **Cookie session dipalsukan / kedaluwarsa** — `verifySession` harus return `null` (redirect ke `/login`), tidak pernah render halaman terproteksi. Test di Task 3, check manual di Task 7.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/types.ts` | Tipe bersama: `Category`, `Product`, `ProductInput`, `Transaction`, `TransactionItem` |
| `lib/db.ts` | Buka koneksi `bun:sqlite`, migrasi schema, seed — satu-satunya tempat DDL |
| `lib/queries.ts` | Semua SQL (products, users, transactions) — fungsi murni yang menerima `db` sebagai argumen pertama |
| `lib/auth.ts` | `hashPassword`, `verifyPassword` (Bun.password bcrypt), `createSession`, `verifySession` (HMAC-SHA256 Web Crypto) |
| `lib/format.ts` | `formatRupiah`, `formatDateTime` |
| `app/api/auth/login/route.ts` | POST login → set cookie |
| `app/api/products/route.ts` | GET (list + filter), POST |
| `app/api/products/[id]/route.ts` | PUT, DELETE |
| `app/api/transactions/route.ts` | GET (list + `?date=`, menyertakan items), POST checkout |
| `middleware.ts` | Cek cookie session, redirect `/login` untuk semua route proteksi |
| `app/(auth)/login/page.tsx` | Form login |
| `app/(protected)/layout.tsx` | Shell: sidebar desktop / topbar mobile |
| `app/(protected)/page.tsx` | Kasir: grid produk + search + filter + cart panel |
| `app/(protected)/produk/page.tsx` | Tabel produk + form tambah/edit/hapus |
| `app/(protected)/riwayat/page.tsx` | Daftar transaksi + detail |
| `app/(protected)/laporan/page.tsx` | Laporan harian |
| `components/providers.tsx` | `QueryClientProvider` + `ToastProvider` + `CartProvider` (client) |
| `components/ui/{button,modal,badge,toast,card,table}.tsx` | Komponen design system |
| `components/cart/cart-context.tsx` | Context + reducer keranjang |
| `components/kasir/{product-grid,cart-panel,receipt}.tsx` | Komponen kasir |
| `tests/*.test.ts` | Test API routes + queries + auth (bun test) |

---

### Task 1: Scaffold Proyek

**Files:**
- Create: seluruh scaffold Next.js di root repo (`package.json`, `app/layout.tsx`, `app/page.tsx`, `tailwind` config, `tsconfig.json`, `.gitignore`)

**Interfaces:**
- Consumes: —
- Produces: proyek Next.js + TypeScript + Tailwind yang bisa `bun run dev` dan `bun test`.

- [ ] **Step 1: Scaffold Next.js di root (dir sudah berisi `docs/`, `urutan-skill.md`, `.gitignore`)**

```bash
bun create next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-bun
```
Jawab prompt sesuai flag di atas; prompt git di-skip/yes (repo sudah ada `.git`).

- [ ] **Step 2: Tambah dependensi & konfigurasi**

```bash
bun add @tanstack/react-query
bun add -d @types/bun
```
Tambahkan ke `package.json` scripts: `"test": "bun test"`, `"typecheck": "tsc --noEmit"`. Tambahkan `pos.db` ke `.gitignore`.

- [ ] **Step 3: Verifikasi dev server & build**

Run: `bun run build`
Expected: `✓ Compiled successfully` (atau exit 0). Lalu `bun run dev` → `curl http://localhost:3000` → HTTP 200. Matikan server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Bun + Tailwind project"
```

---

### Task 2: Database Layer (schema, seed, queries produk/user)

**Files:**
- Create: `lib/types.ts`, `lib/db.ts`, `lib/queries.ts`
- Test: `tests/queries.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `initDb(filename: string): Promise<Database>` — buka DB, buat schema, seed jika kosong. Dipakai test dengan `":memory:"`.
  - `getDb(): Promise<Database>` — singleton atas `process.env.POS_DB ?? "pos.db"`; re-init bila nilai env berubah dari key terakhir.
  - `listProducts(db, opts?: { q?: string; category?: Category }): Product[]`
  - `createProduct(db, input: ProductInput): Product` (lempar `ValidationError`)
  - `updateProduct(db, id: number, input: ProductInput): Product | null`
  - `deleteProduct(db, id: number): boolean`
  - `getUserByUsername(db, username: string): { id: number; username: string; passwordHash: string } | null`
  - Class `ValidationError extends Error`

- [ ] **Step 1: Tulis test yang gagal**

```ts
// tests/queries.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { initDb } from "../lib/db";
import { listProducts, createProduct, updateProduct, deleteProduct, getUserByUsername, ValidationError } from "../lib/queries";

let db: Awaited<ReturnType<typeof initDb>>;
beforeEach(async () => { db = await initDb(":memory:"); });

test("seed membuat 10 produk dan 1 admin", async () => {
  expect((await listProducts(db)).length).toBe(10);
  expect((await getUserByUsername(db, "admin"))).not.toBeNull();
});
test("initDb ulang tidak menduplikasi seed (idempotent)", async () => {
  const tmp = `${process.env.COMMANDCODE_SCRATCHPAD ?? "/tmp"}/pos-seed-test-${crypto.randomUUID()}.db`;
  const first = await initDb(tmp);
  expect((await listProducts(first)).length).toBe(10);
  await first.close();
  const again = await initDb(tmp); // file yang sama, dibuka lagi
  expect((await listProducts(again)).length).toBe(10);
  await again.close();
});
test("listProducts filter kategori makanan", async () => {
  expect((await listProducts(db, { category: "makanan" })).every(p => p.category === "makanan")).toBe(true);
});
test("listProducts search by name", async () => {
  const all = await listProducts(db);
  const target = all[0].name;
  expect((await listProducts(db, { q: target })).length).toBeGreaterThan(0);
});
test("createProduct valid mengembalikan product dengan id", async () => {
  const p = await createProduct(db, { name: "Test", category: "lainnya", price: 1000, stock: 5, emoji: "📦" });
  expect(p.id).toBeGreaterThan(0);
});
test("createProduct harga negatif melempar ValidationError", async () => {
  expect(() => createProduct(db, { name: "X", category: "lainnya", price: -5, stock: 1 })).toThrow(ValidationError);
});
test("updateProduct id tidak ada mengembalikan null", async () => {
  expect(await updateProduct(db, 9999, { name: "X", category: "makanan", price: 1, stock: 1 })).toBeNull();
});
test("deleteProduct id tidak ada mengembalikan false", async () => {
  expect(await deleteProduct(db, 9999)).toBe(false);
});
test("getUserByUsername password salah tetap return user + hash", async () => {
  const u = await getUserByUsername(db, "admin");
  expect(u?.passwordHash).toStartWith("$2"); // bcrypt prefix
});
```

- [ ] **Step 2: Jalankan test, pastikan FAIL**

Run: `bun test tests/queries.test.ts`
Expected: FAIL (module tidak ditemukan / ValidationError undefined)

- [ ] **Step 3: Implementasi `lib/types.ts`, `lib/db.ts`, `lib/queries.ts`**

- Schema (DDL persis): `users(id INTEGER PK, username TEXT UNIQUE, password_hash TEXT)`, `products(id INTEGER PK, name TEXT, category TEXT, price INTEGER, stock INTEGER, emoji TEXT, created_at TEXT)`, plus tabel transaksi dibuat Task 6 (bisa dibuat di sini juga — ikut schema awal: `transactions(id INTEGER PK, total INTEGER, created_at TEXT)`, `transaction_items(id INTEGER PK, transaction_id INTEGER, product_id INTEGER, name TEXT, price INTEGER, qty INTEGER)`).
- Seed 10 produk (kategori seimbang): Roti Tawar 15000 🍞 (makanan), Roti Coklat 8000 🍫 (makanan), Keripik 12000 🍟 (makanan), Air Mineral 4000 💧 (minuman), Kopi Sachet 3000 ☕ (minuman), Teh Botol 6000 🧋 (minuman), Susu Kotak 7000 🥤 (minuman), Sabun Cuci 18000 🧼 (lainnya), Tisu Roll 10000 🧻 (lainnya), Sampo Mini 9000 🧴 (lainnya).
- Seed admin: hash dengan `Bun.password.hash("admin123", { algorithm: "bcrypt" })` (karena async, `initDb` async).
- Guard seed: hanya jalan bila `SELECT COUNT(*) FROM users = 0`.
- Validasi `createProduct`: name non-kosong, price & stock integer >= 0, category dalam enum → selain itu `throw new ValidationError(msg)`.

- [ ] **Step 4: Jalankan test, pastikan PASS**

Run: `bun test tests/queries.test.ts`
Expected: PASS semua

- [ ] **Step 5: Commit**

```bash
git add lib/ tests/queries.test.ts
git commit -m "feat: database layer with schema, seed, product queries"
```

---

### Task 3: Auth Library (password + session)

**Files:**
- Create: `lib/auth.ts`
- Test: `tests/auth.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `hashPassword(plain: string): Promise<string>` (bcrypt via `Bun.password`)
  - `verifyPassword(plain: string, hash: string): Promise<boolean>`
  - `createSession(userId: number): Promise<string>` — token `base64url(json).base64url(hmac)`, berlaku 7 hari
  - `verifySession(token: string): Promise<number | null>` — `null` bila signature salah / kedaluwarsa / format rusak

- [ ] **Step 1: Tulis test yang gagal**

```ts
// tests/auth.test.ts
import { test, expect } from "bun:test";
import { hashPassword, verifyPassword, createSession, verifySession } from "../lib/auth";

test("hash + verify password roundtrip", async () => {
  const h = await hashPassword("admin123");
  expect(await verifyPassword("admin123", h)).toBe(true);
  expect(await verifyPassword("salah", h)).toBe(false);
});
test("createSession → verifySession mengembalikan userId yang sama", async () => {
  const token = await createSession(1);
  expect(await verifySession(token)).toBe(1);
});
test("token yang dipalsukan mengembalikan null", async () => {
  const token = await createSession(1);
  const tampered = token.slice(0, -3) + "aaa";
  expect(await verifySession(tampered)).toBeNull();
});
test("token format rusak mengembalikan null", async () => {
  expect(await verifySession("bukan-token")).toBeNull();
});
test("token kedaluwarsa mengembalikan null", async () => {
  const token = await createSession(1, -1000); // ttl negatif (override param)
  expect(await verifySession(token)).toBeNull();
});
```

- [ ] **Step 2: Jalankan test, pastikan FAIL**

Run: `bun test tests/auth.test.ts`
Expected: FAIL (module tidak ditemukan)

- [ ] **Step 3: Implementasi `lib/auth.ts`**

- `hashPassword`/`verifyPassword` → `Bun.password` algorithm `bcrypt`.
- Signing: HMAC-SHA256 via Web Crypto (`crypto.subtle`) dengan secret `process.env.SESSION_SECRET ?? "pos-dev-secret"` — harus jalan juga di middleware (edge-safe, tanpa `node:crypto`).
- Payload JSON: `{ uid: number, exp: number }` (epoch ms). `createSession(userId, ttlMs = 7 * 24 * 60 * 60 * 1000)`.

- [ ] **Step 4: Jalankan test, pastikan PASS**

Run: `bun test tests/auth.test.ts`
Expected: PASS semua

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts tests/auth.test.ts
git commit -m "feat: auth library (bcrypt password + HMAC session)"
```

---

### Task 4: API Login

**Files:**
- Create: `app/api/auth/login/route.ts`
- Test: `tests/api-login.test.ts`

**Interfaces:**
- Consumes: `getUserByUsername` (Task 2), `verifyPassword`, `createSession` (Task 3)
- Produces: `POST /api/auth/login` — body `{ username, password }` → `200 { ok: true }` + cookie `session` (httpOnly, sameSite lax, path `/`, maxAge 7 hari); `401 { error }` salah login; `400 { error }` body tidak lengkap.

- [ ] **Step 1: Tulis test yang gagal**

```ts
// tests/api-login.test.ts
process.env.POS_DB = `pos-test-${crypto.randomUUID()}.db`; // unik per file, getDb init on demand
import { POST } from "../app/api/auth/login/route";

const req = (body: unknown) => new Request("http://localhost/api/auth/login", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

test("login benar → 200 + set-cookie", async () => {
  const res = await POST!(req({ username: "admin", password: "admin123" }));
  expect(res.status).toBe(200);
  expect(res.headers.get("set-cookie")).toStartWith("session=");
});
test("login salah → 401 { error }", async () => {
  const res = await POST!(req({ username: "admin", password: "salah" }));
  expect(res.status).toBe(401);
  expect(await res.json()).toHaveProperty("error");
});
test("body kosong → 400", async () => {
  const res = await POST!(req({}));
  expect(res.status).toBe(400);
});
```

Catatan: panggil `getDb()` di dalam handler (bukan top-level), sehingga env di atas kebaca saat test jalan. Setelah test, hapus file DB uji (atau pakai path di `$COMMANDCODE_SCRATCHPAD`).

- [ ] **Step 2: Jalankan test, pastikan FAIL**

Run: `bun test tests/api-login.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementasi handler `POST(request: Request)`**

Validasi body (400) → `getUserByUsername` → `verifyPassword` (401 bila salah, pesan umum "Username atau password salah") → `createSession` → `NextResponse.json({ ok: true })` + `response.cookies.set("session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 604800 })`.

- [ ] **Step 4: Jalankan test, pastikan PASS**

Run: `bun test tests/api-login.test.ts`
Expected: PASS semua

- [ ] **Step 5: Commit**

```bash
git add app/api/auth tests/api-login.test.ts
git commit -m "feat: POST /api/auth/login endpoint"
```

---

### Task 5: API Produk CRUD

**Files:**
- Create: `app/api/products/route.ts`, `app/api/products/[id]/route.ts`
- Test: `tests/api-products.test.ts`

**Interfaces:**
- Consumes: `listProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `ValidationError` (Task 2)
- Produces:
  - `GET /api/products?q=&category=` → `200 { products: Product[] }`
  - `POST /api/products` body `ProductInput` → `201 { product }`; invalid → `400 { error }`
  - `PUT /api/products/[id]` → `200 { product }`; tidak ada → `404 { error }`
  - `DELETE /api/products/[id]` → `204`; tidak ada → `404 { error }`

- [ ] **Step 1: Tulis test yang gagal**

```ts
// tests/api-products.test.ts
process.env.POS_DB = `pos-test-${crypto.randomUUID()}.db`;
import { GET, POST } from "../app/api/products/route";
import { PUT, DELETE } from "../app/api/products/[id]/route";

const json = (body: unknown) => new Request("http://localhost/api/products", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

test("GET → 200 dengan daftar produk seed", async () => {
  const res = await GET!(new Request("http://localhost/api/products"));
  expect((await res.json()).products.length).toBe(10);
});
test("POST valid → 201 + product", async () => {
  const res = await POST!(json({ name: "Baru", category: "makanan", price: 500, stock: 2, emoji: "📦" }));
  expect(res.status).toBe(201);
  expect((await res.json()).product.name).toBe("Baru");
});
test("POST harga negatif → 400 { error }", async () => {
  const res = await POST!(json({ name: "X", category: "makanan", price: -5, stock: 1 }));
  expect(res.status).toBe(400);
  expect(await res.json()).toHaveProperty("error");
});
test("PUT id tidak ada → 404", async () => {
  const res = await PUT!(json({ name: "X", category: "makanan", price: 1, stock: 1 }), { params: { id: "9999" } });
  expect(res.status).toBe(404);
});
test("DELETE id tidak ada → 404", async () => {
  const res = await DELETE!(new Request("http://localhost/api/products/9999"), { params: { id: "9999" } });
  expect(res.status).toBe(404);
});
```

- [ ] **Step 2: Jalankan test, pastikan FAIL**

Run: `bun test tests/api-products.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementasi kedua route**

Panggil `await getDb()` di dalam handler. `ValidationError` → 400, `null`/`false` dari queries → 404. Kembalikan JSON sesuai kontrak di Interfaces.

- [ ] **Step 4: Jalankan test, pastikan PASS**

Run: `bun test tests/api-products.test.ts`
Expected: PASS semua

- [ ] **Step 5: Commit**

```bash
git add app/api/products tests/api-products.test.ts
git commit -m "feat: products CRUD API"
```

---

### Task 6: API Transaksi (checkout atomik + riwayat)

**Files:**
- Create: `app/api/transactions/route.ts`
- Modify: `lib/queries.ts` (tambah fungsi transaksi), `tests/queries.test.ts`
- Test: `tests/api-transactions.test.ts`

**Interfaces:**
- Consumes: schema `transactions`/`transaction_items` (Task 2), `ValidationError`
- Produces (di `lib/queries.ts`):
  - `createTransaction(db, items: { productId: number; qty: number }[]): Promise<Transaction>` — atomik; lempar `ProductNotFoundError`, `InsufficientStockError`, `ValidationError`
  - `listTransactions(db, date?: string): Promise<Transaction[]>` — setiap transaksi menyertakan `items` (snapshot nama/harga)
  - Class `InsufficientStockError extends Error`, `ProductNotFoundError extends Error`
- Endpoint:
  - `POST /api/transactions` body `{ items: [{ productId, qty }] }` → `201 { transaction }`; stok kurang → `409 { error }`; produk tak ada → `404`; invalid → `400`
  - `GET /api/transactions?date=YYYY-MM-DD` → `200 { transactions: Transaction[] }` (tanpa date = semua)

- [ ] **Step 1: Tulis test query (tambah ke `tests/queries.test.ts`) — gagal dulu**

```ts
test("checkout mengurangi stok dan mencatat snapshot", async () => {
  const before = (await listProducts(db))[0];
  const trx = await createTransaction(db, [{ productId: before.id, qty: 2 }]);
  expect((await listProducts(db)).find(p => p.id === before.id)!.stock).toBe(before.stock - 2);
  expect(trx.items[0].name).toBe(before.name);
});
test("REVIEW-FOCUS: stok kurang → lempar, stok tidak berubah", async () => {
  const before = (await listProducts(db))[0];
  try { await createTransaction(db, [{ productId: before.id, qty: before.stock + 1 }]); } catch (e) {}
  expect((await listProducts(db)).find(p => p.id === before.id)!.stock).toBe(before.stock);
});
test("REVIEW-FOCUS: unit terakhir dibeli 2x → yang kedua gagal, stok 0 (tidak negatif)", async () => {
  const p = (await listProducts(db))[0];
  await updateProduct(db, p.id, { ...p, stock: 1 });
  await createTransaction(db, [{ productId: p.id, qty: 1 }]);
  let failed = false;
  try { await createTransaction(db, [{ productId: p.id, qty: 1 }]); } catch (e) { failed = e instanceof InsufficientStockError; }
  expect(failed).toBe(true);
  expect((await listProducts(db)).find(x => x.id === p.id)!.stock).toBe(0);
});
test("REVIEW-FOCUS: produk dihapus setelah penjualan → riwayat tetap ada namanya", async () => {
  const p = (await listProducts(db))[0];
  const trx = await createTransaction(db, [{ productId: p.id, qty: 1 }]);
  await deleteProduct(db, p.id);
  const list = await listTransactions(db);
  expect(list.find(t => t.id === trx.id)!.items[0].name).toBe(p.name);
});
test("listTransactions filter date", async () => {
  const today = new Date().toISOString().slice(0, 10);
  await createTransaction(db, [{ productId: (await listProducts(db))[0].id, qty: 1 }]);
  expect((await listTransactions(db, today)).length).toBeGreaterThan(0);
  expect((await listTransactions(db, "1999-01-01")).length).toBe(0);
});
```
Import tambahan: `createTransaction, listTransactions, InsufficientStockError` dari `../lib/queries`.

- [ ] **Step 2: Jalankan, pastikan FAIL**

Run: `bun test tests/queries.test.ts`
Expected: FAIL (nama fungsi belum ada)

- [ ] **Step 3: Implementasi fungsi transaksi di `lib/queries.ts`**

`createTransaction` dibungkus `db.transaction(...)`: untuk tiap item jalankan `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?` — bila `info.changes === 0` bedakan `ProductNotFoundError` (cek existence) vs `InsufficientStockError`; hitung total dari harga DB saat itu; insert `transactions` (`created_at` = format lokal `YYYY-MM-DD HH:MM:SS`) dan `transaction_items` (snapshot `name`, `price`). Gagal di tengah → otomatis rollback.

- [ ] **Step 4: Jalankan test query, pastikan PASS**

Run: `bun test tests/queries.test.ts`
Expected: PASS semua

- [ ] **Step 5: Tulis test API route — gagal dulu, lalu implement**

```ts
// tests/api-transactions.test.ts
process.env.POS_DB = `pos-test-${crypto.randomUUID()}.db`;
import { GET, POST } from "../app/api/transactions/route";

const checkout = (items: unknown) => new Request("http://localhost/api/transactions", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items }),
});

test("checkout valid → 201 { transaction } dengan total", async () => {
  const res = await POST!(checkout([{ productId: 1, qty: 2 }]));
  expect(res.status).toBe(201);
  const body = await res.json();
  expect(body.transaction.total).toBeGreaterThan(0);
  expect(body.transaction.items.length).toBe(1);
});
test("stok kurang → 409 { error }", async () => {
  const res = await POST!(checkout([{ productId: 1, qty: 99999 }]));
  expect(res.status).toBe(409);
});
test("items kosong → 400", async () => {
  const res = await POST!(checkout([]));
  expect(res.status).toBe(400);
});
test("qty tidak integer → 400", async () => {
  const res = await POST!(checkout([{ productId: 1, qty: "abc" }]));
  expect(res.status).toBe(400);
});
test("GET ?date= mengembalikan transaksi berhari itu", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const res = await GET!(new Request(`http://localhost/api/transactions?date=${today}`));
  expect((await res.json()).transactions.length).toBeGreaterThan(0);
});
```
(Hapus baris komentar pertama yang tidak terpakai saat implementasi.)

Implement handler: validasi `items` array non-kosong + tiap `productId` integer > 0 + `qty` integer > 0 (400); map `InsufficientStockError` → 409, `ProductNotFoundError` → 404, `ValidationError` → 400.

- [ ] **Step 6: Jalankan test API, pastikan PASS**

Run: `bun test tests/api-transactions.test.ts`
Expected: PASS semua

- [ ] **Step 7: Commit**

```bash
git add lib/queries.ts app/api/transactions tests/
git commit -m "feat: atomic checkout and transaction history API"
```

---

### Task 7: Middleware Proteksi + Halaman Login

**Files:**
- Create: `middleware.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/layout.tsx`, `app/api/auth/logout/route.ts`
- Modify: tidak ada (root `Providers` menyusul di Task 8 — halaman login tidak butuh TanStack Query)

**Interfaces:**
- Consumes: `verifySession` (Task 3), `POST /api/auth/login` (Task 4)
- Produces: route `/login` publik; semua route selain `/login` & `/api/*` redirect ke `/login` tanpa cookie valid; `middleware.ts` dengan matcher `/((?!api|_next/static|_next/image|login|favicon.ico).*)`; `POST /api/auth/logout` → `200 { ok: true }` + hapus cookie `session` (dipakai tombol Logout di Task 8).

- [ ] **Step 1: Implementasi `middleware.ts`**

Ambil cookie `session` → `await verifySession(token)` → `null` → `NextResponse.redirect(new URL("/login", request.url))`.

- [ ] **Step 2: Implementasi halaman login**

Form client component (`"use client"`): state `username`/`password`/`error`, submit → `fetch("/api/auth/login", { method: "POST" })` → ok: `router.push("/"); router.refresh()`; error: tampilkan pesan. Layout: center card, logo toko, warna design system.

- [ ] **Step 3: Implementasi `POST /api/auth/logout`**

`app/api/auth/logout/route.ts`: balas `NextResponse.json({ ok: true })` lalu `response.cookies.set("session", "", { maxAge: 0, path: "/" })`.

- [ ] **Step 4: Verifikasi manual**

Run: `bun run dev`
Checklist:
- `curl -I http://localhost:3000/` → redirect ke `/login` (tanpa cookie).
- Buka `/login`, login `admin`/`admin123` → masuk ke `/`; login salah → muncul pesan error.
- Setelah login, `curl -I http://localhost:3000/ -b "session=<token>"` → 200.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/
git commit -m "feat: login page, logout route, and route protection middleware"
```

---

### Task 8: Design System + Shell Layout

**Files:**
- Create: `lib/format.ts`, `components/providers.tsx`, `components/ui/button.tsx`, `components/ui/modal.tsx`, `components/ui/badge.tsx`, `components/ui/toast.tsx`, `components/ui/card.tsx`, `components/ui/table.tsx`, `components/layout/sidebar.tsx`, `app/(protected)/layout.tsx`
- Modify: `app/layout.tsx` (bungkus `Providers`), `app/globals.css` (token warna)

**Interfaces:**
- Consumes: Task 1 (Tailwind), Task 7 (route group terproteksi)
- Produces:
  - `formatRupiah(n: number): string`, `formatDateTime(iso: string): string`
  - `Button({ variant?: "primary" | "outline" | "danger", ...props })`
  - `Modal({ open: boolean, onClose: () => void, title: string, children: React.ReactNode })`
  - `StockBadge({ stock: number })` — `0` merah "HABIS", `1–5` amber "TERBATAS", `>5` hijau "READY"
  - `ToastProvider` + `useToast(): { success(msg: string): void, error(msg: string): void }`
  - `Card`, `Table` (wrapper sederhana)
  - `Sidebar` nav item persis: Kasir `/`, Produk `/produk`, Riwayat `/riwayat`, Laporan `/laporan` — active state aksen amber; mobile jadi topbar. Termasuk tombol **Logout** di bawah nav: `fetch("/api/auth/logout", { method: "POST" })` → `router.push("/login")`.
  - `app/(protected)/layout.tsx` = `<Providers>` (sudah di root) + Sidebar + `<main>`.

- [ ] **Step 1: Token warna & `lib/format.ts`**

Definisikan CSS variable di `globals.css` (primary `#1e293b`, aksen `#d97706`, bg `#f8fafc`) dan utility Tailwind-nya. `formatRupiah` pakai `Intl.NumberFormat` persis di Global Constraints.

- [ ] **Step 2: Komponen UI + Providers + Sidebar**

Satu file per komponen sesuai daftar. Toast: context + fixed bottom-right stack. `Providers` (client): `QueryClientProvider` → `ToastProvider`.

- [ ] **Step 3: Verifikasi manual**

Run: `bun run build` → exit 0. `bun run dev` → buka `/` (login dulu) → sidebar tampil dengan 4 nav, klik tiap nav tidak 404 (halaman bisa masih placeholder).

- [ ] **Step 4: Commit**

```bash
git add lib/format.ts components/ app/
git commit -m "feat: design system components and app shell"
```

---

### Task 9: Halaman Kasir — Grid Produk, Search, Filter, Keranjang

**Files:**
- Create: `components/cart/cart-context.tsx`, `components/kasir/product-grid.tsx`, `components/kasir/cart-panel.tsx`, `app/(protected)/page.tsx`
- Modify: `components/providers.tsx` (tambah `CartProvider`)

**Interfaces:**
- Consumes: `GET /api/products` (Task 5), komponen UI (Task 8)
- Produces:
  - `useCart(): { items: { product: Product; qty: number }[]; add(p: Product): void; increment(id: number): void; decrement(id: number): void; remove(id: number): void; clear(): void; total: number; count: number }`
  - Kasir page: search bar (state `q`, debounce 300ms → query key `["products", q, category]`), filter kategori (Semua/Makanan/Minuman/Lainnya), grid kartu (emoji, nama, harga `formatRupiah`, `StockBadge`), klik kartu → `add`.

- [ ] **Step 1: Implementasi cart context (useReducer)**

Aksi: `ADD` (qty+1 bila sudah ada), `INCREMENT`, `DECREMENT` (hapus bila qty 0), `REMOVE`, `CLEAR`. `total`/`count` dihitung dari `items`.

- [ ] **Step 2: Implementasi ProductGrid + CartPanel + halaman**

TanStack Query `useQuery({ queryKey: ["products", q, category], queryFn })`, `isPending` → skeleton, kosong → "Produk tidak ditemukan". CartPanel: daftar item, tombol +/−/hapus, total. Layout: grid produk 2/3 + cart sticky 1/3 (desktop); cart di bawah grid (mobile).

- [ ] **Step 3: Keyboard shortcut `/` dan `Enter`**

`/` (saat tidak fokus input) → focus search bar. `Enter` di search → `add` produk pertama hasil pencarian. Hint kecil: `/ cari · Enter tambah`.

- [ ] **Step 4: Verifikasi manual**

Run: `bun run dev` → login → checklist:
- Search menyaring produk; filter kategori berfungsi; refresh produk dari API.
- Klik produk masuk keranjang, qty bertambah, +/−/hapus jalan, total akurat.
- `/` fokus search, `Enter` menambah hasil pertama.
- `bun run build` exit 0.

- [ ] **Step 5: Commit**

```bash
git add components/ app/
git commit -m "feat: cashier page with product grid, search, cart"
```

---

### Task 10: Checkout + Struk

**Files:**
- Create: `components/kasir/receipt.tsx`, modify `app/(protected)/page.tsx` (checkout handler)
- Modify: `app/globals.css` (print CSS)

**Interfaces:**
- Consumes: `useCart` (Task 9), `POST /api/transactions` (Task 6), `formatRupiah`/`formatDateTime` (Task 8), `Modal`+`useToast` (Task 8)
- Produces: tombol `Checkout` → mutation → sukses: cart `clear()` + `<Receipt transaction={...}>` terbuka; error: toast (409 "Stok tidak cukup: X"). Print CSS: saat print hanya struk yang tampil.

- [ ] **Step 1: Implementasi checkout mutation**

`useMutation` ke `POST /api/transactions`; `onSuccess` → `invalidateQueries({ queryKey: ["transactions"] })`, `clear()` cart, buka struk; `onError` → `toast.error(...)` dari `res.error`.

- [ ] **Step 2: Implementasi struk + print CSS**

Isi struk: "Toko Sederhana", waktu (`formatDateTime`), daftar item (nama × qty, subtotal), total, "Terima kasih". `@media print`: sembunyikan semuanya kecuali struk. `Esc` menutup struk (dan semua modal — pasang di `Modal` global handler di Task 8 bila belum).

- [ ] **Step 3: Verifikasi manual + test API integration**

Checklist (dev server):
- Checkout sukses → struk muncul, cart kosong, stok produk berkurang (cek halaman Produk / reload).
- Beli melebihi stok → toast 409, cart tidak kosong, stok tidak berubah.
- Ctrl+P di struk → hanya struk tercetak.
- `bun test` → semua test lama tetap PASS.

- [ ] **Step 4: Commit**

```bash
git add app/ components/
git commit -m "feat: checkout flow with receipt and print CSS"
```

---

### Task 11: Halaman Kelola Produk

**Files:**
- Create: `app/(protected)/produk/page.tsx`, `components/produk/product-form-modal.tsx`
- Modify: tidak ada

**Interfaces:**
- Consumes: `GET/POST/PUT/DELETE /api/products` (Task 5), komponen UI (Task 8)
- Produces: halaman `/produk` — tabel (emoji, nama, kategori, harga, stok, badge), tombol "Tambah Produk" → modal form (`name`, `category` select 3 opsi, `price`, `stock`, `emoji` optional default 📦), baris ada aksi Edit/Hapus (hapus pakai konfirmasi). Mutasi → `invalidateQueries(["products"])`.

- [ ] **Step 1: Implementasi halaman + form modal**

Validasi form client (required, angka >= 0) + tangani 400 dari server → toast error. `isPending` → disabled submit.

- [ ] **Step 2: Verifikasi manual**

Checklist: tambah produk muncul di tabel & di Kasir; edit berubah; hapus hilang (konfirmasi dulu); input harga `-5` → toast error dari server; `bun run build` exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/ components/
git commit -m "feat: product management page"
```

---

### Task 12: Halaman Riwayat

**Files:**
- Create: `app/(protected)/riwayat/page.tsx`

**Interfaces:**
- Consumes: `GET /api/transactions` (Task 6), `formatRupiah`/`formatDateTime` (Task 8)
- Produces: daftar transaksi (no #id, waktu, jumlah item, total) → klik satu baris → tampil detail item (nama snapshot × qty, harga satuan, subtotal). Empty state "Belum ada transaksi".

- [ ] **Step 1: Implementasi halaman**

`useQuery({ queryKey: ["transactions"] })`; detail pakai state lokal (transaksi terpilih) — data items sudah termasuk di response.

- [ ] **Step 2: Verifikasi manual**

Checklist: transaksi hasil checkout tampil; klik → detail item benar; setelah checkout baru, list refresh (invalidasi); kosong-state tampil bila DB kosong; `bun run build` exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/
git commit -m "feat: transaction history page"
```

---

### Task 13: Halaman Laporan Harian

**Files:**
- Create: `app/(protected)/laporan/page.tsx`

**Interfaces:**
- Consumes: `GET /api/transactions?date=` (Task 6), `formatRupiah` (Task 8)
- Produces: `<input type="date">` (default hari ini, state lokal `YYYY-MM-DD`) → ringkasan: total penjualan, jumlah transaksi, produk paling laris (dihitung client dari `items`: kelompokkan per `name`, urutkan `qty` desc, top 3).

- [ ] **Step 1: Implementasi halaman**

Query key `["transactions", date]`. Kosong di tanggal itu → "Belum ada penjualan tanggal ini".

- [ ] **Step 2: Verifikasi manual**

Checklist: pilih hari ini → angka sesuai struk yang tadi; ganti tanggal kosong → empty state; produk paling laris sesuai jumlah terjual; `bun run build` exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/
git commit -m "feat: daily sales report page"
```

---

### Task 14: Integrasi Final

**Files:**
- Modify: bug apa pun yang ketemu

**Interfaces:**
- Consumes: semua task
- Produces: aplikasi utuh lolos checklist akhir.

- [ ] **Step 1: Jalankan seluruh test + typecheck + build**

Run: `bun test && bun run typecheck && bun run build`
Expected: semua PASS / exit 0.

- [ ] **Step 2: Checklist alur penuh (manual, dev server)**

1. Buka `/` tanpa login → redirect `/login`.
2. Login salah → error; login benar → masuk.
3. Kasir: cari produk (`/` + ketik), filter kategori, tambah 2 item, ubah qty.
4. Checkout → struk tampil → cart kosong.
5. Produk: stok item terjual berkurang; tambah/edit/hapus produk.
6. Riwayat: transaksi tadi ada, detail item benar.
7. Laporan hari ini: total & jumlah transaksi cocok dengan struk.
8. Logout (tombol di sidebar) → `/` redirect ke `/login`.
9. Restart server (`bun run dev` ulang) → data masih ada (persist), seed tidak dobel (cek jumlah produk == 10 + yang ditambah).

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "chore: final integration fixes for POS app"
```
