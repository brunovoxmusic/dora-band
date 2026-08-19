import { db } from "@/lib/db";
import { getProviderName, type AITask } from "@/lib/ai/provider";

/**
 * M4.5 — AI Cost Tracking
 *
 * Centralizované logovanie AI volaní: tokeny, latencia, odhadovaná cena.
 * Používa sa na sledovanie nákladov naprieč systémom (copilot, market-report, content, ...).
 *
 * Cenník je hard-coded podľa verejných cien Groq/OpenAI (August 2024).
 * Update cien: pozri docs/ai-pricing.md alebo weby providerov.
 */

// =====================================================
// CENNÍK — USD per 1M tokenov
// =====================================================

type Pricing = { inputPer1M: number; outputPer1M: number };

const GROQ_PRICING: Record<string, Pricing> = {
  // Groq hosted open models (August 2024 prices)
  "llama-3.3-70b-versatile": { inputPer1M: 0.59, outputPer1M: 0.79 },
  "llama-3.1-70b-versatile": { inputPer1M: 0.59, outputPer1M: 0.79 },
  "llama-3.1-8b-instant": { inputPer1M: 0.05, outputPer1M: 0.08 },
  "llama-3.1-8b": { inputPer1M: 0.05, outputPer1M: 0.08 },
  "llama3-70b-8192": { inputPer1M: 0.59, outputPer1M: 0.79 },
  "llama3-8b-8192": { inputPer1M: 0.05, outputPer1M: 0.08 },
  "mixtral-8x7b-32768": { inputPer1M: 0.24, outputPer1M: 0.24 },
  "gemma2-9b-it": { inputPer1M: 0.2, outputPer1M: 0.2 },
};

const OPENAI_PRICING: Record<string, Pricing> = {
  "gpt-4o": { inputPer1M: 5.0, outputPer1M: 15.0 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gpt-4-turbo": { inputPer1M: 10.0, outputPer1M: 30.0 },
  "gpt-3.5-turbo": { inputPer1M: 0.5, outputPer1M: 1.5 },
};

const FALLBACK_PRICING: Pricing = { inputPer1M: 0.5, outputPer1M: 1.0 };

/** Vráti cenu v USD pre zadaný provider, model a počet tokenov. */
export function calculateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const table = provider === "openai" ? OPENAI_PRICING : provider === "groq" ? GROQ_PRICING : {};
  const pricing = table[model] || FALLBACK_PRICING;
  const cost =
    (promptTokens / 1_000_000) * pricing.inputPer1M +
    (completionTokens / 1_000_000) * pricing.outputPer1M;
  // Round to 6 decimal places
  return Math.round(cost * 1_000_000) / 1_000_000;
}

// =====================================================
// USAGE LOG ENTRY
// =====================================================

export interface UsageLogInput {
  task: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  userId?: string;
  promptPreview?: string;
}

/** Zapíše záznam o AI volaní do DB. Non-blocking (fire-and-forget). */
export async function logAiUsage(input: UsageLogInput): Promise<void> {
  const provider = getProviderName();
  const totalTokens = input.promptTokens + input.completionTokens;
  const costUsd = calculateCost(provider, input.model, input.promptTokens, input.completionTokens);

  try {
    await db.aiUsageLog.create({
      data: {
        provider,
        model: input.model,
        task: input.task,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        totalTokens,
        latencyMs: input.latencyMs,
        costUsd,
        success: input.success,
        errorMessage: input.errorMessage || null,
        userId: input.userId || null,
        promptPreview: (input.promptPreview || "").slice(0, 200) || null,
      },
    });
  } catch (err) {
    // Log but never throw — tracking must not break the AI call
    console.error("[ai-usage] failed to log:", err);
  }
}

// =====================================================
// WRAPPER HELPERS
// =====================================================

/**
 * Pomocná funkcia pre non-streaming AI volania (generateText).
 * Zmeria latenciu a zapíše usage log.
 *
 * @example
 * const result = await withUsageTracking("market-report", "llama-3.3-70b", async () => {
 *   return generateText({ model, prompt });
 * });
 */
export async function withUsageTracking<T extends { usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }>(
  task: AITask | string,
  model: string,
  fn: () => Promise<T>,
  opts?: { userId?: string; promptPreview?: string },
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const latencyMs = Date.now() - start;
    const usage = result.usage || {};
    void logAiUsage({
      task: typeof task === "string" ? task : task,
      model,
      promptTokens: usage.promptTokens || 0,
      completionTokens: usage.completionTokens || 0,
      latencyMs,
      success: true,
      userId: opts?.userId,
      promptPreview: opts?.promptPreview,
    });
    return result;
  } catch (err) {
    const latencyMs = Date.now() - start;
    void logAiUsage({
      task: typeof task === "string" ? task : task,
      model,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      userId: opts?.userId,
      promptPreview: opts?.promptPreview,
    });
    throw err;
  }
}

/**
 * Pomocná funkcia pre streaming AI volania (streamText).
 * Použitie: po dokončení streamu zavolaj trackStreamUsage(result, task, model).
 *
 * @example
 * const result = streamText({ model, prompt });
 * // ... posli stream ...
 * await trackStreamUsage(result, "copilot", "llama-3.3-70b");
 */
export async function trackStreamUsage(
  result: { usage?: Promise<{ promptTokens?: number; completionTokens?: number; totalTokens?: number }> | { promptTokens?: number; completionTokens?: number; totalTokens?: number }; totalUsage?: Promise<{ promptTokens?: number; completionTokens?: number; totalTokens?: number }> },
  task: string,
  model: string,
  opts?: { userId?: string; promptPreview?: string; startMs?: number },
): Promise<void> {
  const start = opts?.startMs ?? Date.now();
  try {
    // Vercel AI SDK: result.usage je Promise (streaming), alebo objekt (non-streaming)
    let usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;
    if (result.totalUsage && typeof (result.totalUsage as Promise<unknown>).then === "function") {
      usage = await (result.totalUsage as Promise<typeof usage>);
    } else if (result.usage) {
      if (typeof (result.usage as Promise<unknown>).then === "function") {
        usage = await (result.usage as Promise<typeof usage>);
      } else {
        usage = result.usage as typeof usage;
      }
    }
    const latencyMs = Date.now() - start;
    void logAiUsage({
      task,
      model,
      promptTokens: usage?.promptTokens || 0,
      completionTokens: usage?.completionTokens || 0,
      latencyMs,
      success: true,
      userId: opts?.userId,
      promptPreview: opts?.promptPreview,
    });
  } catch (err) {
    const latencyMs = Date.now() - start;
    void logAiUsage({
      task,
      model,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      userId: opts?.userId,
      promptPreview: opts?.promptPreview,
    });
  }
}
