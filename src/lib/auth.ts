import { db } from "./db";
import { hashPassword, verifyPassword, isHashedPassword } from "./password";

/**
 * Session auth for the admin dashboard.
 *
 * P0 SECURITY FIXES (Fáza 0):
 * - Session secret: env-only, throw ak chýba (žiaden fallback)
 * - Cookie: secure flag v produkcii
 * - Token verify: timing-safe compare (crypto.timingSafeEqual)
 * - Password: bcrypt hash (nie plaintext)
 * - Auto-migrácia: plaintext → bcrypt pri prvom prihlásení
 */

// P0-2: Žiaden fallback secret — ak env chýba, crash na štarte (fail-safe)
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error(
    "ADMIN_SESSION_SECRET environment variable is required. " +
      "Generate with: openssl rand -hex 32"
  );
}

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

/**
 * P0-2: Timing-safe token verification.
 * Používa Node.js crypto.timingSafeEqual namiesto `===` pre anti-timing-attack.
 */
async function verify(token: string): Promise<string | null> {
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const expected = await sign(payload);

  // Timing-safe compare using Node.js crypto
  const { timingSafeEqual } = await import("crypto");
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? payload : null;
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
    if (!payload.exp || Date.now() > payload.exp) return null;
    return { uid: payload.uid, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * P0-1: Authenticate with bcrypt password verification.
 * Ak má user starý plaintext password (pred migráciou), auto-migruje na bcrypt.
 */
export async function authenticate(email: string, password: string) {
  try {
    const user = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return null;

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    // P0-1 auto-migrácia: ak passwordHash je plaintext, re-hash a ulož
    if (!isHashedPassword(user.passwordHash)) {
      const newHash = await hashPassword(password);
      await db.adminUser.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      console.log(`[auth] Auto-migrated password to bcrypt for user ${user.email}`);
    }

    return user;
  } catch (err) {
    console.error("[auth] DB error during authenticate:", err);
    throw new Error("Prihlásenie zlyhalo. Skontrolujte databázu a skúste znova.");
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  // P0-2: Secure flag v produkcii (HTTPS only)
  secure: process.env.NODE_ENV === "production",
};
