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
