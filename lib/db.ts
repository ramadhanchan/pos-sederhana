import { Database } from "bun:sqlite";
import type { Category } from "./types";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transaction_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id),
  product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL
);
`;

type SeedProduct = [name: string, category: Category, price: number, stock: number, emoji: string];

const SEED_PRODUCTS: SeedProduct[] = [
  ["Roti Tawar", "makanan", 15000, 20, "🍞"],
  ["Roti Coklat", "makanan", 8000, 15, "🍫"],
  ["Keripik Kentang", "makanan", 12000, 25, "🍟"],
  ["Air Mineral", "minuman", 4000, 40, "💧"],
  ["Kopi Sachet", "minuman", 3000, 50, "☕"],
  ["Teh Botol", "minuman", 6000, 30, "🧋"],
  ["Susu Kotak", "minuman", 7000, 20, "🥤"],
  ["Sabun Cuci", "lainnya", 18000, 10, "🧼"],
  ["Tisu Roll", "lainnya", 10000, 12, "🧻"],
  ["Sampo Mini", "lainnya", 9000, 8, "🧴"],
];

function localNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function seed(db: Database): Promise<void> {
  const hasUsers = (db.query("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c > 0;
  if (hasUsers) return;

  const hash = await Bun.password.hash("admin123", { algorithm: "bcrypt" });
  db.query("INSERT INTO users (username, password_hash) VALUES (?, ?)").run("admin", hash);

  const insert = db.query(
    "INSERT INTO products (name, category, price, stock, emoji, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (const [name, category, price, stock, emoji] of SEED_PRODUCTS) {
    insert.run(name, category, price, stock, emoji, localNow());
  }
}

export async function initDb(filename: string): Promise<Database> {
  const db = new Database(filename, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA);
  await seed(db);
  return db;
}

let cached: { key: string; db: Database } | null = null;

export async function getDb(): Promise<Database> {
  const key = process.env.POS_DB ?? "pos.db";
  if (cached && cached.key === key) return cached.db;
  if (cached) cached.db.close();
  const db = await initDb(key);
  cached = { key, db };
  return db;
}
