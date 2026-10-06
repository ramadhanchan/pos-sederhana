import type { Database } from "bun:sqlite";
import { CATEGORIES, type Category, type Product, type ProductInput, type User } from "./types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
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
