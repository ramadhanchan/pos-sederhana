import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { updateProduct, deleteProduct, ValidationError } from "@/lib/queries";
import type { Category } from "@/lib/types";

type Ctx = { params: { id: string } | Promise<{ id: string }> };

async function getId(ctx: Ctx): Promise<number> {
  const params = await ctx.params;
  return Number(params.id);
}

export async function PUT(request: Request, ctx: Ctx): Promise<Response> {
  const id = await getId(ctx);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 404 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
  }
  try {
    const db = await getDb();
    const product = updateProduct(db, id, {
      name: body.name as string,
      category: body.category as Category,
      price: body.price as number,
      stock: body.stock as number,
      emoji: body.emoji as string | undefined,
    });
    if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  const id = await getId(ctx);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 404 });
  }
  const db = await getDb();
  const ok = deleteProduct(db, id);
  if (!ok) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  return new Response(null, { status: 204 });
}
