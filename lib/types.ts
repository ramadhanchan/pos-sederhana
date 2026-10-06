export type Category = "makanan" | "minuman" | "lainnya";

export const CATEGORIES: Category[] = ["makanan", "minuman", "lainnya"];

export interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
  stock: number;
  emoji: string;
}

export interface ProductInput {
  name: string;
  category: Category;
  price: number;
  stock: number;
  emoji?: string;
}

export interface User {
  id: number;
  username: string;
  passwordHash: string;
}

export interface TransactionItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  qty: number;
}

export interface Transaction {
  id: number;
  total: number;
  createdAt: string;
  items: TransactionItem[];
}
