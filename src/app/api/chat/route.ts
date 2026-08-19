import { streamText } from "ai";
import { getModel, isAIConfigured } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { chatRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeForPrompt } from "@/lib/ai/sanitize";

/**
 * POST /api/chat
 *
 * A.1 SECURITY FIX: Verejný chat endpoint je teraz chránený:
 * - Rate limiting: 10 správ za hodinu na IP (anti cost abuse Groq API)
 * - Auth gate: vždy, keď je admin session prítomná, sa loguje userId
 * - Prompt injection defense: sanitizeForPrompt na user messages
 *
 * The browser never sees the API key — it's only used server-side.
 *
 * NOTE: Tento endpoint zostáva verejný (pre visitor chat AI assistant),
 * ale má rate limiting a sanitizáciu promptu pre bezpečnosť.
 */
export async function POST(req: Request) {
  try {
    // A.1: Rate limiting — 10 správ za hodinu na IP
    const ip = getClientIp(req);
    const rateLimitResult = chatRateLimiter.check(ip);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!isAIConfigured()) {
      return Response.json(
        { error: "AI nie je nakonfigurované. Nastavte GROQ_API_KEY v environment variables." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Chýbajú messages v request body." },
        { status: 422 }
      );
    }

    // A.1: Sanitizuj user messages (prompt injection defense)
    const sanitizedMessages = messages.map((m: { role?: string; content?: unknown }) => {
      if (m.role === "user" && typeof m.content === "string") {
        return { ...m, content: sanitizeForPrompt(m.content) };
      }
      return m;
    });

    // A.1: Ak je admin session, loguj userId (pre audit trail)
    const session = await getSession(req).catch(() => null);
    const userId = session?.uid || `ip:${ip.slice(0, 8)}`;

    const result = streamText({
      model: getModel(),
      messages: sanitizedMessages as never,
      system:
        "Si asistent pre slovenskú funky-punkovú kapelu D.O.R.A. (Dnes Od Rána Abstinujem) z Púchova. Píšeš v slovenčine, si nápomocný a stručný. Odpovedaj IBA na otázky o kapele D.O.R.A., hudbe, koncertoch, booking-u. Ak otázka nie je relevantná, slušne odmietni.",
    });

    // Log usage (async, non-blocking) — pre audit
    void import("@/lib/ai/usage").then(({ logAiUsage }) =>
      logAiUsage({
        task: "chat",
        model: "llama-3.3-70b-versatile",
        promptTokens: 0, // streaming, nepoznáme vopred
        completionTokens: 0,
        latencyMs: 0,
        success: true,
        userId,
        promptPreview: typeof sanitizedMessages[sanitizedMessages.length - 1]?.content === "string"
          ? String(sanitizedMessages[sanitizedMessages.length - 1].content).slice(0, 200)
          : "",
      })
    );

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[api/chat] error:", error);
    const message = error instanceof Error ? error.message : "Neznáma chyba";
    return Response.json(
      { error: `AI požiadavka zlyhala: ${message}` },
      { status: 500 }
    );
  }
}
