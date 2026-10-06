import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listProducts, createProduct, ValidationError } from "@/lib/queries";
import { getSessionFromRequest } from "@/lib/auth";
import type { Category } from "@/lib/types";

export async function GET(request: Request): Promise<Response> {
  const db = await getDb();
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const category = (url.searchParams.get("category") ?? undefined) as Category | undefined;
  return NextResponse.json({ products: listProducts(db, { q, category }) });
}

export async function POST(request: Request): Promise<Response> {
  if ((await getSessionFromRequest(request)) === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown> | null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body harus object JSON" }, { status: 400 });
  }
  try {
    const db = await getDb();
    const product = createProduct(db, {
      name: body.name as string,
      category: body.category as Category,
      price: body.price as number,
      stock: body.stock as number,
      emoji: body.emoji as string | undefined,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
