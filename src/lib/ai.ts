import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

/**
 * Reusable AI service — Vercel AI SDK + Groq.
 *
 * Architecture:
 *   Browser → /api/admin/ai → streamText() → Groq → llama-3.3-70b-versatile
 *
 * All AI configuration lives here. Never duplicate initialization.
 *
 * Model is read from AI_MODEL env var (default: llama-3.3-70b-versatile).
 * API key is read from GROQ_API_KEY env var.
 *
 * To switch models later, change only AI_MODEL:
 *   AI_MODEL=llama-3.3-70b-versatile  (current default)
 *   AI_MODEL=llama-3.1-8b-instant     (faster, cheaper)
 *   AI_MODEL=mixtral-8x7b-32768       (longer context)
 *
 * To add another provider in the future, install the corresponding
 * @ai-sdk/<provider> package and add a new createX() call here.
 */

// Singleton Groq provider — created once per cold start
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Default model if AI_MODEL is not set
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/**
 * Returns a LanguageModel instance for the current AI_MODEL.
 * Call this in each request handler so env changes are picked up.
 */
export function getModel(): LanguageModel {
  const modelName = process.env.AI_MODEL || DEFAULT_MODEL;
  return groq(modelName);
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
  return !!process.env.GROQ_API_KEY;
}

/**
 * Prompt types for admin content generation.
 * Each type generates a system prompt optimized for that content type.
 */
export type PromptType =
  | "hero-headline"
  | "hero-subtitle"
  | "cta"
  | "seo-title"
  | "seo-description"
  | "meta-keywords"
  | "about-section"
  | "biography"
  | "event-description"
  | "blog-article"
  | "album-description"
  | "facebook-post"
  | "instagram-caption"
  | "youtube-description"
  | "faq"
  | "custom";

export const PROMPT_TYPES: { value: PromptType; label: string; desc: string }[] = [
  { value: "hero-headline", label: "Hero nadpis", desc: "Krátky, úderný nadpis pre Hero sekciu" },
  { value: "hero-subtitle", label: "Hero podnadpis", desc: "Podnadpis dopĺňajúci Hero nadpis" },
  { value: "cta", label: "CTA text", desc: "Call-to-action tlačidlo text" },
  { value: "seo-title", label: "SEO title", desc: "Meta title (max 60 znakov)" },
  { value: "seo-description", label: "SEO description", desc: "Meta description (max 160 znakov)" },
  { value: "meta-keywords", label: "Kľúčové slová", desc: "SEO kľúčové slová, čiarkou oddelené" },
  { value: "about-section", label: "O kapele", desc: "Sekcia o kapele (100-200 slov)" },
  { value: "biography", label: "Biografia", desc: "Plná biografia kapely (200-400 slov)" },
  { value: "event-description", label: "Popis eventu", desc: "Popis koncertu/festivalu" },
  { value: "blog-article", label: "Blog článok", desc: "Článok pre blog/aktuality" },
  { value: "album-description", label: "Popis albumu", desc: "Popis nahrávky/albumu" },
  { value: "facebook-post", label: "Facebook príspevok", desc: "Sociálny príspevok pre Facebook" },
  { value: "instagram-caption", label: "Instagram caption", desc: "Krátky text pre Instagram" },
  { value: "youtube-description", label: "YouTube popis", desc: "Popis videa na YouTube" },
  { value: "faq", label: "FAQ otázka", desc: "Častá otázka + odpoveď" },
  { value: "custom", label: "Vlastný prompt", desc: "Voľný textový prompt" },
];

/**
 * Builds a system prompt based on the content type.
 * All prompts are in Slovak and optimized for D.O.R.A. band.
 */
export function buildSystemPrompt(type: PromptType): string {
  const base = "Si profesionálny copywriter a SEO špecialista pre slovenskú funky-punkovú kapelu D.O.R.A. (Dnes Od Rána Abstinujem) z Púchova, založenú v roku 1996. Píšeš v slovenčine, v energickom, autentickom a punkovo-rebelskom tóne.";

  const prompts: Record<PromptType, string> = {
    "hero-headline": `${base}\n\nVygeneruj krátky, úderný Hero nadpis (max 5 slov). Mal by byť energický a zachytávať ducha kapely.`,
    "hero-subtitle": `${base}\n\nVygeneruj Hero podnadpis (max 10 slov) ktorý dopĺňa nadpis a stručne popisuje kapelu.`,
    "cta": `${base}\n\nVygeneruj call-to-action text (max 5 slov) pre tlačidlo. Mal by povzbudiť k akcii (booking, lístky, kontakt).`,
    "seo-title": `${base}\n\nVygeneruj SEO meta title (max 60 znakov). Musí obsahovať kľúčové slová a byť výstižný.`,
    "seo-description": `${base}\n\nVygeneruj SEO meta description (max 160 znakov). Musí byť výstižná, obsahovať kľúčové slová a vzbudiť záujem.`,
    "meta-keywords": `${base}\n\nVygeneruj 10-15 SEO kľúčových slov, oddelených čiarkou. Zahŕňajú žánre, názov kapely, lokalitu.`,
    "about-section": `${base}\n\nNapíš sekciu "O kapele" (100-200 slov). Popíš históriu, žáner a charakter kapely.`,
    "biography": `${base}\n\nNapíš plnú biografiu kapely (200-400 slov). Zahŕňaj založenie, míľniky, členov, žánre.`,
    "event-description": `${base}\n\nNapíš popis koncertu/eventu (50-100 slov). Stručný, energický, s dátumom a miestom.`,
    "blog-article": `${base}\n\nNapíš krátky blog článok (150-300 slov) o kapele alebo udalosti.`,
    "album-description": `${base}\n\nNapíš popis albumu/nahrávky (50-100 slov). Popíš žáner, nálady, význam.`,
    "facebook-post": `${base}\n\nNapíš Facebook príspevok (max 280 znakov) s hashtagmi. Energický, s call-to-action.`,
    "instagram-caption": `${base}\n\nNapíš Instagram caption (max 150 znakov) s hashtagmi. Krátky, vizuálny, pútavý.`,
    "youtube-description": `${base}\n\nNapíš YouTube popis videa (100-200 slov). Zahŕňaj odkazy, hashtagy, popis obsahu.`,
    "faq": `${base}\n\nVygeneruj častú otázku a odpoveď (FAQ) o kapele. Formát: Q: otázka\\nA: odpoveď.`,
    "custom": `${base}\n\nSplň požiadavku používateľa čo najlepšie.`,
  };

  return prompts[type];
}
