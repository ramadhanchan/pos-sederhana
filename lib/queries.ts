import type { Database } from "bun:sqlite";
import { CATEGORIES, type Category, type Product, type ProductInput, type Transaction, type TransactionItem, type User } from "./types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: number) {
    super(`Produk dengan id ${productId} tidak ditemukan`);
    this.name = "ProductNotFoundError";
  }
}

export class InsufficientStockError extends Error {
  constructor(name: string) {
    super(`Stok "${name}" tidak cukup`);
    this.name = "InsufficientStockError";
  }
}

interface ProductRow {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  emoji: string;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    price: row.price,
    stock: row.stock,
    emoji: row.emoji,
  };
}

export function validateProductInput(input: ProductInput): void {
  if (typeof input.name !== "string" || input.name.trim() === "") {
    throw new ValidationError("Nama produk wajib diisi");
  }
  if (!CATEGORIES.includes(input.category)) {
    throw new ValidationError("Kategori tidak valid");
  }
  if (!Number.isInteger(input.price) || input.price < 0) {
    throw new ValidationError("Harga harus bilangan bulat tidak negatif");
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    throw new ValidationError("Stok harus bilangan bulat tidak negatif");
  }
}

export function listProducts(
  db: Database,
  opts?: { q?: string; category?: Category }
): Product[] {
  let sql = "SELECT id, name, category, price, stock, emoji FROM products";
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts?.category) {
    where.push("category = ?");
    params.push(opts.category);
  }
  if (opts?.q) {
    where.push("name LIKE ? COLLATE NOCASE");
    params.push(`%${opts.q}%`);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY id";
  return (db.query(sql).all(...params) as ProductRow[]).map(toProduct);
}

export function createProduct(db: Database, input: ProductInput): Product {
  validateProductInput(input);
  const emoji = input.emoji?.trim() || "📦";
  const now = new Date().toISOString();
  const info = db
    .query("INSERT INTO products (name, category, price, stock, emoji, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(input.name.trim(), input.category, input.price, input.stock, emoji, now);
  return {
    id: Number(info.lastInsertRowid),
    name: input.name.trim(),
    category: input.category,
    price: input.price,
    stock: input.stock,
    emoji,
  };
}

export function updateProduct(db: Database, id: number, input: ProductInput): Product | null {
  validateProductInput(input);
  const emoji = input.emoji?.trim() || "📦";
  const info = db
    .query("UPDATE products SET name = ?, category = ?, price = ?, stock = ?, emoji = ? WHERE id = ?")
    .run(input.name.trim(), input.category, input.price, input.stock, emoji, id);
  if (info.changes === 0) return null;
  return { id, name: input.name.trim(), category: input.category, price: input.price, stock: input.stock, emoji };
}

export function deleteProduct(db: Database, id: number): boolean {
  const info = db.query("DELETE FROM products WHERE id = ?").run(id);
  return info.changes > 0;
}

export function getUserByUsername(db: Database, username: string): User | null {
  const row = db
    .query("SELECT id, username, password_hash AS passwordHash FROM users WHERE username = ?")
    .get(username) as { id: number; username: string; passwordHash: string } | null;
  return row ?? null;
}

function localNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export interface NewTransactionItem {
  productId: number;
  qty: number;
}

export function createTransaction(db: Database, items: NewTransactionItem[]): Transaction {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError("Transaksi harus punya minimal satu item");
  }
  for (const item of items) {
    if (!Number.isInteger(item.productId) || item.productId <= 0) {
      throw new ValidationError("productId harus bilangan bulat positif");
    }
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new ValidationError("qty harus bilangan bulat positif");
    }
  }

  const run = db.transaction((): Transaction => {
    let total = 0;
    const snapshots: { productId: number; name: string; price: number; qty: number }[] = [];

    for (const item of items) {
      const info = db
        .query("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?")
        .run(item.qty, item.productId, item.qty);
      if (info.changes === 0) {
        const exists = db.query("SELECT name, stock FROM products WHERE id = ?").get(item.productId) as
          | { name: string; stock: number }
          | null;
        if (!exists) throw new ProductNotFoundError(item.productId);
        throw new InsufficientStockError(exists.name);
      }
      const row = db.query("SELECT name, price FROM products WHERE id = ?").get(item.productId) as {
        name: string;
        price: number;
      };
      total += row.price * item.qty;
      snapshots.push({ productId: item.productId, name: row.name, price: row.price, qty: item.qty });
    }

    const now = localNow();
    const trxInfo = db.query("INSERT INTO transactions (total, created_at) VALUES (?, ?)").run(total, now);
    const trxId = Number(trxInfo.lastInsertRowid);

    const insertItem = db.query(
      "INSERT INTO transaction_items (transaction_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)"
    );
    const createdItems: TransactionItem[] = snapshots.map((s) => {
      const info = insertItem.run(trxId, s.productId, s.name, s.price, s.qty);
      return { id: Number(info.lastInsertRowid), productId: s.productId, name: s.name, price: s.price, qty: s.qty };
    });

    return { id: trxId, total, createdAt: now, items: createdItems };
  });

  return run();
}

export function listTransactions(db: Database, date?: string): Transaction[] {
  let sql = "SELECT id, total, created_at AS createdAt FROM transactions";
  const params: string[] = [];
  if (date) {
    sql += " WHERE created_at LIKE ?";
    params.push(`${date}%`);
  }
  sql += " ORDER BY id DESC";
  const rows = db.query(sql).all(...params) as { id: number; total: number; createdAt: string }[];

  const selectItems = db.query(
    "SELECT id, product_id AS productId, name, price, qty FROM transaction_items WHERE transaction_id = ? ORDER BY id"
  );
  return rows.map((row) => ({
    id: row.id,
    total: row.total,
    createdAt: row.createdAt,
    items: selectItems.all(row.id) as TransactionItem[],
  }));
}
