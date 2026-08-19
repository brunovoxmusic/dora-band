import type { LanguageModel } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * AI Provider Adapter (M0-7)
 *
 * KEY FEATURE: Model Probe + Fallback Chain
 *
 * Groq často deprecated/renames modely. Provider implementuje:
 * 1. Model Probe — pri prvom použití otestuje dostupné modely (malým volaním)
 * 2. Fallback Chain — ak prvý model nefunguje, skúsa ďalšie
 * 3. Caching — prvý funkčný model sa cachuje pre všetky budúce volania
 *
 * Ak ŽIADNY model nefunguje (API key invalid), isConfigured() vráti false
 * a AI routes vrátia 503 s user-friendly správou.
 */

export type AIProviderName = "groq" | "openai" | "none";

export interface AIProvider {
  name: AIProviderName;
  getModel(task: AITask): LanguageModel;
  getModelName(task?: AITask): string;
  isConfigured(): boolean;
  /** Overí, či je model dostupný (probe). Vráti true ak áno. */
  probeModel?(): Promise<boolean>;
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
 * Zoznam Groq modelov v poradí, v akom sa skúšajú pri probe.
 * Prvý funkčný model sa použije pre všetky budúce volania.
 *
 * Aktualizované August 2025 — reálne dostupné Groq modely:
 * https://console.groq.com/docs/models
 *
 * Groq deprecations (August 2025):
 * - llama-3.1-8b-instant → decommissioned, náhrada: openai/gpt-oss-20b
 * - llama-3.3-70b-versatile → decommissioned, náhrada: openai/gpt-oss-120b
 * - llama-3.2-1b-preview → decommissioned
 * - llama-3.2-3b-preview → decommissioned
 *
 * Aktuálne dostupné modely (Groq Cloud, August 2025):
 */
const GROQ_MODEL_CHAIN: string[] = [
  // User-configured model (if set via env)
  process.env.AI_MODEL || process.env.AI_MODEL_WRITING || "",
  // Current production models (August 2025)
  "openai/gpt-oss-20b",           // náhrada za llama-3.1-8b-instant
  "openai/gpt-oss-120b",          // náhrada za llama-3.3-70b-versatile
  "qwen/qwen3.6-27b",             // alternatíva
  // Legacy models (may still work)
  "llama-3.3-70b-versatile",
  "llama3-8b-8192",
  "llama3-70b-8192",
  // Alternative models
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
].filter(Boolean) as string[];

/** Cachovaný funkčný model (po prvom úspešnom probe sa použije pre všetky budúce volania). */
let _workingModel: string | null = null;

/** Stav probe — null = neprobol, true = úspešný, false = všetky modely zlyhali */
let _probeStatus: boolean | null = null;

/** Vráti aktuálny pracovný model (cachovaný alebo prvý z chain). */
function getWorkingModel(): string {
  if (_workingModel) return _workingModel;
  _workingModel = GROQ_MODEL_CHAIN[0];
  return _workingModel;
}

/**
 * Model Probe — otestuje, či je model dostupný pomocou malého volania.
 * Vráti true ak model funguje, false ak nie.
 */
async function probeSingleModel(groq: ReturnType<typeof createGroq>, model: string): Promise<boolean> {
  try {
    const result = await generateText({
      model: groq(model),
      prompt: "ping",
      maxOutputTokens: 1,
    });
    // Ak volanie prešlo bez chyby, model je dostupný
    return true;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    // Rozpoznaj model errors: "does not exist", "model_not_found", "decommissioned"
    const isModelErr = errMsg.includes("does not exist") ||
                       errMsg.includes("model_not_found") ||
                       errMsg.includes("decommissioned") ||
                       errMsg.includes("no longer supported");
    if (isModelErr) {
      console.warn(`[ai-probe] Model '${model}' NOT available: ${errMsg.slice(0, 100)}`);
      return false;
    }
    // Iná chyba (rate limit, network) — model môže byť dostupný, ale dočasne nedostupný
    console.warn(`[ai-probe] Model '${model}' error (non-model, assuming available):`, errMsg.slice(0, 100));
    return true; // predpokladajme že funguje
  }
}

/**
 * Probuje všetky modely z chain a cachuje prvý funkčný.
 * Vráti true ak nájde funkčný model, false ak žiadny nefunguje.
 */
async function probeModels(): Promise<boolean> {
  if (_probeStatus !== null) return _probeStatus;
  if (!process.env.GROQ_API_KEY) {
    _probeStatus = false;
    return false;
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  for (const model of GROQ_MODEL_CHAIN) {
    const isAvailable = await probeSingleModel(groq, model);
    if (isAvailable) {
      console.log(`[ai-probe] Using working model: '${model}'`);
      _workingModel = model;
      _probeStatus = true;
      return true;
    }
  }

  console.error(`[ai-probe] ALL models failed. ${GROQ_MODEL_CHAIN.length} models tested.`);
  _probeStatus = false;
  return false;
}

/**
 * Označí aktuálny model ako nefunkčný a zmaže cache.
 * Pri ďalšom volaní probeModels() sa nájde nový funkčný model.
 */
export function handleModelFailure(modelName: string): void {
  console.warn(`[ai] Model '${modelName}' failed during use, clearing cache for re-probe`);
  _workingModel = null;
  _probeStatus = null;
}

// =====================================================
// PROVIDER IMPLEMENTATIONS
// =====================================================

/**
 * Resilient Groq provider s model probe.
 */
function createResilientGroqProvider(): AIProvider {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY || "" });

  return {
    name: "groq",
    getModel: (task: AITask) => {
      const model = getWorkingModel();
      return groq(model);
    },
    getModelName: (task: AITask = "writing") => getWorkingModel(),
    isConfigured: () => !!process.env.GROQ_API_KEY,
    probeModel: async () => {
      return await probeModels();
    },
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
        probeModel: async () => !!process.env.OPENAI_API_KEY,
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
        probeModel: async () => false,
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
 * Overí, či je AI dostupná (probe model).
 * Používa sa pred AI volaniami na overenie dostupnosti.
 */
export async function ensureAIAvailable(): Promise<boolean> {
  const provider = getProvider();
  if (!provider.isConfigured()) return false;
  if (provider.probeModel) {
    return await provider.probeModel();
  }
  return true;
}
