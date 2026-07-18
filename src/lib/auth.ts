import { db } from "./db";

// Lightweight session auth for the admin dashboard.
// Uses a signed HTTP-only cookie. NOT a replacement for NextAuth in production,
// but sufficient for this demo and avoids extra dependencies.

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "dora-funky-punk-2026-secret";
const COOKIE_NAME = "dora_admin_session";

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

async function verify(token: string): Promise<string | null> {
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const expected = await sign(payload);
  if (expected === token) return payload;
  return null;
}

export async function createSession(userId: string, email: string): Promise<string> {
  const payload = JSON.stringify({ uid: userId, email, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  return sign(Buffer.from(payload).toString("base64url"));
}

export async function getSession(req?: Request): Promise<{ uid: string; email: string } | null> {
  const cookie = req?.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  const token = match[1];
  const payloadB64 = await verify(token);
  if (!payloadB64) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return { uid: payload.uid, email: payload.email };
  } catch {
    return null;
  }
}

export async function authenticate(email: string, password: string) {
  const user = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}

export const SESSION_COOKIE = COOKIE_NAME;
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
