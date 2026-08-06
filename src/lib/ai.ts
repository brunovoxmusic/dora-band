import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Reusable AI service — Vercel AI SDK + AI Gateway.
 *
 * Architecture:
 *   Browser → /api/chat → streamText() → AI Gateway → zai/glm-5.2
 *
 * Model is read from AI_MODEL env var (default: zai/glm-5.2).
 * API key is read from AI_GATEWAY_API_KEY env var.
 * Base URL defaults to Vercel AI Gateway.
 *
 * To switch providers later, change only env vars:
 *   AI_MODEL=openai/gpt-4o       → OpenAI
 *   AI_MODEL=anthropic/claude-3   → Anthropic
 *   AI_MODEL=groq/llama-3.1-70b   → Groq
 *   AI_MODEL=deepseek/deepseek-chat → DeepSeek
 *   AI_MODEL=Qwen/qwen-2.5-72b    → Qwen
 *
 * No code changes needed — only env var update.
 */

const GATEWAY_BASE_URL =
  process.env.AI_GATEWAY_URL || "https://ai-gateway.vercel.app/v1";

const GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "";

const DEFAULT_MODEL = process.env.AI_MODEL || "zai/glm-5.2";

// Singleton provider instance (created once per cold start)
const provider = createOpenAI({
  baseURL: GATEWAY_BASE_URL,
  apiKey: GATEWAY_API_KEY,
});

/**
 * Returns a LanguageModel instance for the current AI_MODEL.
 * Call this fresh in each request handler (not at module level)
 * so env var changes are picked up.
 */
export function getModel(): LanguageModel {
  const modelName = process.env.AI_MODEL || DEFAULT_MODEL;
  return provider(modelName);
}

/**
 * Returns the current model name (for UI display / debugging).
 */
export function getModelName(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

/**
 * Checks if AI is configured (API key present).
 */
export function isAIConfigured(): boolean {
  return !!process.env.AI_GATEWAY_API_KEY;
}
