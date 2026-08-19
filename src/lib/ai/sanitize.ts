/**
 * A.1/A.3 — Prompt Injection Defense
 *
 * Sanitizácia user-provided textov pred vložením do AI promptov.
 *
 * Táto funkcia nie je dokonalá — prompt injection je ťažké úplne zabrániť.
 * Ale znižuje riziko bežných útokov:
 * - "Ignore previous instructions"
 * - Role hijacking ("system:", "assistant:")
 * - "You are now a..."
 * - Code block injection
 *
 * Pre citlivé operácie (booking, content generation) vždy kombinovať s:
 * - Human-in-the-loop approval
 * - Output validation
 * - Audit logging
 */

/**
 * Sanitizuje text pred vložením do AI promptu.
 *
 * @param input - User-provided text
 * @param maxLength - Max dĺžka (default 500 znakov)
 * @returns Sanitized string
 */
export function sanitizeForPrompt(input: string, maxLength = 500): string {
  if (!input || typeof input !== "string") return "";
  let s = input.slice(0, maxLength);
  // Strip control characters (except newlines/tabs)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Neutralize common prompt injection patterns (case-insensitive)
  // Replace with [REDACTED] so the LLM sees something was there
  s = s.replace(/(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?/gi, "[REDACTED]");
  s = s.replace(/(?:system|assistant|user)\s*:/gi, "[REDACTED]");
  s = s.replace(/(?:you are|act as|pretend to be)\s+(?:now|a)\s/gi, "[REDACTED] ");
  s = s.replace(/```[\s\S]*?```/g, "[CODE BLOCK REMOVED]");
  return s;
}

/**
 * Validácia, či text neobsahuje zjavné prompt injection pokusy.
 * Vráti true ak je text podozrivý.
 */
export function hasPromptInjection(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const patterns = [
    /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?/i,
    /(?:system|assistant)\s*:/i,
    /(?:you are|act as|pretend to be)\s+(?:now|a)\s/i,
  ];
  return patterns.some((p) => p.test(input));
}
