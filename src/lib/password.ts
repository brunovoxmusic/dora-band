import bcrypt from "bcryptjs";

/**
 * Password hashing utility — bcrypt with cost factor 12.
 *
 * Used by:
 * - auth.ts (authenticate — verify password against hash)
 * - seed.ts (create admin user with hashed password)
 *
 * Migrácia z plaintext (P0 security fix):
 * Ak AdminUser.password obsahuje plaintext heslo (starý formát),
 * authenticate() ho pri prvom úspešnom prihlásení re-hashne a uloží
 * do poľa passwordHash.
 */

const BCRYPT_ROUNDS = 12;

/** Zahešuje plaintext heslo. */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

/** Overí plaintext heslo proti bcrypt hashe. */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  // Ak hash nevyzerá ako bcrypt (nezačína $2), je to starý plaintext.
  // Pre P0 migráciu: porovnaj priamo (len pre existujúcich adminov pred migráciou).
  if (!hash.startsWith("$2")) {
    return plaintext === hash;
  }
  return bcrypt.compare(plaintext, hash);
}

/** Kontroluje, či je heslo už v bcrypt formáte (nie plaintext). */
export function isHashedPassword(hash: string): boolean {
  return hash.startsWith("$2");
}
