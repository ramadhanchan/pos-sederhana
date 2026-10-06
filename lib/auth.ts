const SECRET = process.env.SESSION_SECRET ?? "pos-dev-secret";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, { algorithm: "bcrypt" });
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return Bun.password.verify(plain, hash);
}

function base64url(data: ArrayBuffer | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToString(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return bin;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64url(sig);
}

export async function createSession(userId: number, ttlMs: number = DEFAULT_TTL_MS): Promise<string> {
  const payload = base64url(JSON.stringify({ uid: userId, exp: Date.now() + ttlMs }));
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySession(token: string): Promise<number | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;

  try {
    const data = JSON.parse(base64urlToString(payload)) as { uid: number; exp: number };
    if (typeof data.uid !== "number" || typeof data.exp !== "number") return null;
    if (data.exp <= Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}
