import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  createTransaction,
  listTransactions,
  ValidationError,
  ProductNotFoundError,
  InsufficientStockError,
} from "@/lib/queries";
import type { NewTransactionItem } from "@/lib/queries";

export async function GET(request: Request): Promise<Response> {
  const db = await getDb();
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? undefined;
  return NextResponse.json({ transactions: listTransactions(db, date) });
}

export async function POST(request: Request): Promise<Response> {
  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Transaksi harus punya minimal satu item" }, { status: 400 });
  }
  for (const item of items as NewTransactionItem[]) {
    if (!Number.isInteger(item?.productId) || item.productId <= 0) {
      return NextResponse.json({ error: "productId harus bilangan bulat positif" }, { status: 400 });
    }
    if (!Number.isInteger(item?.qty) || item.qty <= 0) {
      return NextResponse.json({ error: "qty harus bilangan bulat positif" }, { status: 400 });
    }
  }

  try {
    const db = await getDb();
    const transaction = createTransaction(db, items as NewTransactionItem[]);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (e) {
    if (e instanceof InsufficientStockError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof ProductNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
