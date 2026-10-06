import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserByUsername } from "@/lib/queries";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request): Promise<Response> {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
  }

  const { username, password } = body;
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
  }

  const db = await getDb();
  const user = getUserByUsername(db, username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
  return res;
}
