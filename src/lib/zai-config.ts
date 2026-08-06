import { writeFileSync, existsSync } from "fs";
import path from "path";

/**
 * Writes .z-ai-config synchronously at MODULE LOAD TIME (not request time).
 *
 * Vercel serverless functions don't include dotfiles in the bundle.
 * The z-ai-web-dev-sdk looks for .z-ai-config in:
 *   1. process.cwd() (=/var/task/ on Vercel — writable during execution)
 *   2. os.homedir()
 *   3. /etc/
 *
 * We write synchronously at module level so the file exists BEFORE
 * any ZAI.create() call. This runs once per cold start.
 */

const EMBEDDED_CONFIG = JSON.stringify({
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  chatId: "chat-4812f2dc-ee3a-4f2f-9354-00654b1a2b89",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzkxZmUyZmEtYTBhYS00ZTExLTkxOTItZDMzMDg4OWNkMGMxIiwiY2hhdF9pZCI6ImNoYXQtNDgxMmYyZGMtZWUzYS00ZjJmLTkzNTQtMDA2NTRiMWEyYjg5IiwicGxhdGZvcm0iOiJ6YWkifQ.jxrqIdaybXT7NEEwUP7PFp9iB6B4NfUBcFpkgHhMdMg",
  userId: "c91fe2fa-a0aa-4e11-9192-d330889cd0c1",
});

// Write IMMEDIATELY at module load (synchronous, before any exports are used)
const configContent = process.env.ZAI_CONFIG || EMBEDDED_CONFIG;
const configPath = path.join(process.cwd(), ".z-ai-config");

try {
  if (!existsSync(configPath)) {
    writeFileSync(configPath, configContent, "utf-8");
    console.log("[z-ai] Config written to CWD:", configPath);
  }
} catch (e) {
  // CWD might be read-only, try /tmp
  try {
    writeFileSync("/tmp/.z-ai-config", configContent, "utf-8");
    // Also set HOME to /tmp so SDK finds it there
    process.env.HOME = "/tmp";
    console.log("[z-ai] Config written to /tmp, HOME set to /tmp");
  } catch (e2) {
    console.error("[z-ai] Failed to write config:", e2);
  }
}

// Also export an async version for explicit calls (backward compat)
export async function ensureZaiConfig() {
  // Already written at module load — this is a no-op
}
