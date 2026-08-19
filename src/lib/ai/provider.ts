import type { LanguageModel } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * AI Provider Adapter (M0-7)
 *
 * Abstrahuje AI poskytovateľov (Groq, OpenAI, ...) za spoločné rozhranie.
 * Provider sa volí podľa env var AI_PROVIDER (default: "groq").
 *
 * Pridanie nového providera:
 * 1. Pridaj case do createProvider()
 * 2. Importuj createXxx z príslušného balíka
 * 3. Nastav AI_PROVIDER=xxx v .env
 */

export type AIProviderName = "groq" | "openai" | "none";

export interface AIProvider {
  name: AIProviderName;
  /** Vráti LanguageModel pre daný task (writing/analysis/fast). */
  getModel(task: AITask): LanguageModel;
  /** Meno modelu pre zobrazenie v UI. */
  getModelName(task?: AITask): string;
  /** Či je provider nakonfigurovaný (má API kľúč). */
  isConfigured(): boolean;
}

export type AITask = "writing" | "analysis" | "fast";

/** Vráti meno providera z env (default: groq). */
export function getProviderName(): AIProviderName {
  const name = (process.env.AI_PROVIDER || "groq").toLowerCase();
  if (name === "openai") return "openai";
  if (name === "none") return "none";
  return "groq";
}

const MODELS: Record<AITask, string> = {
  // Groq model — llama-3.3-70b-versatile deprecated, fallback na llama-3.1-8b-instant
  // Ak máš paid Groq plan, nastav AI_MODEL_WRITING=llama-3.3-70b-versatile v env
  writing: process.env.AI_MODEL_WRITING || process.env.AI_MODEL || "llama-3.1-8b-instant",
  analysis: process.env.AI_MODEL_ANALYSIS || process.env.AI_MODEL || "llama-3.1-8b-instant",
  fast: process.env.AI_MODEL_FAST || "llama-3.1-8b-instant",
};

const OPENAI_MODELS: Record<AITask, string> = {
  writing: process.env.AI_MODEL_WRITING || process.env.AI_MODEL || "gpt-4o-mini",
  analysis: process.env.AI_MODEL_ANALYSIS || process.env.AI_MODEL || "gpt-4o-mini",
  fast: process.env.AI_MODEL_FAST || "gpt-4o-mini",
};

/**
 * Vytvorí AI provider podľa env konfigurácie.
 * Všetky providery sa importujú staticky (tree-shaking odstráni nepoužívané).
 */
export function createProvider(): AIProvider {
  const name = getProviderName();

  switch (name) {
    case "groq": {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY || "" });
      return {
        name: "groq",
        getModel: (task: AITask) => groq(MODELS[task]),
        getModelName: (task: AITask = "writing") => MODELS[task],
        isConfigured: () => !!process.env.GROQ_API_KEY,
      };
    }

    case "openai": {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
      return {
        name: "openai",
        getModel: (task: AITask) => openai(OPENAI_MODELS[task]),
        getModelName: (task: AITask = "writing") => OPENAI_MODELS[task],
        isConfigured: () => !!process.env.OPENAI_API_KEY,
      };
    }

    case "none":
      return {
        name: "none",
        getModel: () => {
          throw new Error("AI_PROVIDER=none — AI is disabled");
        },
        getModelName: () => "disabled",
        isConfigured: () => false,
      };

    default:
      throw new Error(`Unknown AI_PROVIDER: ${name}. Supported: groq, openai, none`);
  }
}

// Singleton — jeden provider per server instance
let _provider: AIProvider | null = null;

/** Vráti singleton AI provider. */
export function getProvider(): AIProvider {
  if (!_provider) {
    _provider = createProvider();
  }
  return _provider;
}
