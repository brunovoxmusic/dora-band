import { streamText } from "ai";
import { getModel, isAIConfigured, buildSystemPrompt, type PromptType } from "@/lib/ai";
import { getSession } from "@/lib/auth";

/**
 * POST /api/admin/ai
 *
 * Streaming AI content generation endpoint for admin panel.
 * Uses Vercel AI SDK streamText() with Groq provider.
 *
 * Request body:
 *   {
 *     type: PromptType,       // e.g. "hero-headline", "seo-title", "custom"
 *     instruction?: string,   // optional user instruction/context
 *     context?: string,       // optional existing content for reference
 *   }
 *
 * Response: streaming text (AI SDK data stream protocol)
 *
 * Security:
 * - Requires admin session (getSession)
 * - GROQ_API_KEY never exposed to browser
 * - All AI calls go through this server-side route
 */

export async function POST(req: Request) {
  // Auth check — only admin can use AI
  const session = await getSession(req);
  if (!session) {
    return Response.json({ error: "Neoprávnený." }, { status: 401 });
  }

  // Check if AI is configured
  if (!isAIConfigured()) {
    return Response.json(
      {
        error:
          "AI nie je nakonfigurované. Nastavte GROQ_API_KEY v environment variables (Vercel Dashboard → Settings → Environment Variables).",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { type, instruction, context } = body as {
      type: PromptType;
      instruction?: string;
      context?: string;
    };

    if (!type) {
      return Response.json(
        { error: "Chýba parameter 'type'." },
        { status: 422 }
      );
    }

    // Build system prompt based on content type
    const systemPrompt = buildSystemPrompt(type);

    // Build user message
    const userParts: string[] = [];
    if (context) {
      userParts.push(`KONTEXT (existujúci obsah):\n${context}\n`);
    }
    if (instruction) {
      userParts.push(`INŠTRUKCIE:\n${instruction}`);
    }
    if (userParts.length === 0) {
      userParts.push("Vygeneruj obsah podľa typu.");
    }

    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      prompt: userParts.join("\n\n"),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[api/admin/ai] error:", error);
    const message = error instanceof Error ? error.message : "Neznáma chyba";
    // AI SDK error: model not found / API key invalid
    const isModelError = message.includes("does not exist") || message.includes("model_not_found");
    const isApiKeyError = message.includes("API key") || message.includes("401");
    return Response.json(
      {
        error: isModelError
          ? "AI model nie je dostupný. Skontrolujte AI_MODEL env premenné."
          : isApiKeyError
            ? "AI API kľúč je neplatný. Skontrolujte GROQ_API_KEY."
            : `AI generovanie zlyhalo: ${message}`,
        detail: message,
      },
      { status: 500 }
    );
  }
}
