import { streamText, type CoreMessage } from "ai";
import { getModel, isAIConfigured } from "@/lib/ai";

/**
 * POST /api/chat
 *
 * Streaming chat endpoint using Vercel AI SDK.
 * Uses streamText() with the model configured via AI_MODEL env var.
 *
 * Request body: { messages: CoreMessage[] }
 * Response: streaming text (AI SDK data stream protocol)
 *
 * The browser never sees the API key — it's only used server-side.
 */
export async function POST(req: Request) {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return Response.json(
        {
          error:
            "AI nie je nakonfigurované. Nastavte AI_GATEWAY_API_KEY v environment variables.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const messages: CoreMessage[] = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Chýbajú messages v request body." },
        { status: 422 }
      );
    }

    const result = streamText({
      model: getModel(),
      messages,
      system:
        "Si asistent pre slovenskú funky-punkovú kapelu D.O.R.A. (Dnes Od Rána Abstinujem) z Púchova. Píšeš v slovenčine, si nápomocný a stručný.",
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[api/chat] error:", error);
    const message = error instanceof Error ? error.message : "Neznáma chyba";
    return Response.json(
      { error: `AI požiadavka zlyhala: ${message}` },
      { status: 500 }
    );
  }
}
