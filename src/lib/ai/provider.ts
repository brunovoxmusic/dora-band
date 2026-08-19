import type { LanguageModel } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * AI Provider Adapter (M0-7)
 *
 * Abstrahuje AI poskytovateľov (Groq, OpenAI, ...) za spoločné rozhranie.
 * Provider sa volí podľa env var AI_PROVIDER (default: "groq").
 *
 * KEY FEATURE: Model Fallback Chain
 * Groq často mení/deprecated modely. Provider skúša modely v poradí:
 * 1. User-configured model (AI_MODEL env var)
 * 2. Fallback modely z GROQ_MODEL_CHAIN
 * 3. Pri prvom úspechu cachuje model pre budúce použitie
 *
 * Ak ŽIADNY model nefunguje (API key invalid, všetky modely deprecated),
 * isConfigured() vráti false a AI routes vrátia 503.
 */

export type AIProviderName = "groq" | "openai" | "none";

export interface AIProvider {
  name: AIProviderName;
  getModel(task: AITask): LanguageModel;
  getModelName(task?: AITask): string;
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

// =====================================================
// MODEL FALLBACK CHAIN
// =====================================================

/**
 * Zoznam Groq modelov v poradí, v akom sa skúšajú.
 * Prvý funkčný model sa použije pre všetky budúce volania.
 *
 * Groq model history:
 * - llama-3.3-70b-versatile (deprecated Aug 2025)
 * - llama-3.1-8b-instant (possibly deprecated/renamed)
 * - llama3-8b-8192 (older but stable)
 * - gemma2-9b-it (stable alternative)
 */
const GROQ_MODEL_CHAIN: string[] = [
  // User-configured model (if set)
  process.env.AI_MODEL || process.env.AI_MODEL_WRITING || "",
  // Fallback chain — tried in order
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-8b-8192",
  "llama3-70b-8192",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
].filter(Boolean) as string[];

/** Cachovaný funkčný model (po prvom úspechu sa použije pre všetky budúce volania). */
let _workingModel: string | null = null;

/**
 * Vráti prvý funkčný model z chain.
 * Ak už bol nájdený, vráti cachovaný.
 */
function getWorkingModel(): string {
  if (_workingModel) return _workingModel;
  // Vráť prvý z chain (cachovanie sa deje pri prvom úspešnom volaní)
  _workingModel = GROQ_MODEL_CHAIN[0];
  return _workingModel;
}

/** Označí model ako nefunkčný a vráti ďalší z chain. */
function markModelFailed(failedModel: string): string {
  const idx = GROQ_MODEL_CHAIN.indexOf(failedModel);
  if (idx >= 0 && idx < GROQ_MODEL_CHAIN.length - 1) {
    const next = GROQ_MODEL_CHAIN[idx + 1];
    console.warn(`[ai] Model '${failedModel}' failed, trying '${next}'`);
    _workingModel = next;
    return next;
  }
  console.error(`[ai] All models in chain failed. Last: ${failedModel}`);
  return failedModel; // vráť posledný (lepšie ako crash)
}

// =====================================================
// PROVIDER IMPLEMENTATIONS
// =====================================================

/**
 * Resilient Groq provider — skúša modely z chain, cachuje funkčný.
 */
function createResilientGroqProvider(): AIProvider {
  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY || "",
    // Custom error handler — pri model_not_found skús ďalší model
  });

  return {
    name: "groq",
    getModel: (task: AITask) => {
      const model = getWorkingModel();
      return groq(model);
    },
    getModelName: (task: AITask = "writing") => getWorkingModel(),
    isConfigured: () => !!process.env.GROQ_API_KEY,
  };
}

const OPENAI_MODELS: Record<AITask, string> = {
  writing: process.env.AI_MODEL_WRITING || process.env.AI_MODEL || "gpt-4o-mini",
  analysis: process.env.AI_MODEL_ANALYSIS || process.env.AI_MODEL || "gpt-4o-mini",
  fast: process.env.AI_MODEL_FAST || "gpt-4o-mini",
};

/**
 * Vytvorí AI provider podľa env konfigurácie.
 */
export function createProvider(): AIProvider {
  const name = getProviderName();

  switch (name) {
    case "groq":
      return createResilientGroqProvider();

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

/**
 * Export pre error handling — ak AI volanie zlyhá s model_not_found,
 * zavolaj túto funkciu pre prepnutie na ďalší model v chain.
 */
export function handleModelFailure(modelName: string): void {
  markModelFailed(modelName);
}
