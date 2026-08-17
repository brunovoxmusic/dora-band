import { generateText, streamText, type LanguageModel } from "ai";
import { db } from "@/lib/db";
import { getProvider, type AITask } from "@/lib/ai/provider";

/**
 * AI service — Vercel AI SDK + provider adapter.
 * Multi-model architecture: different models for different tasks.
 * Provider je abstrahovaný — zmeň AI_PROVIDER v env bez zmeny kódu.
 * Podporovaní: groq (default), openai, none.
 */

export function getModel(task: AITask = "writing"): LanguageModel {
  return getProvider().getModel(task);
}

export function getModelName(): string {
  return getProvider().getModelName("writing");
}

export function isAIConfigured(): boolean {
  return getProvider().isConfigured();
}

// =====================================================
// PROMPT TYPES — 24 content generation modes
// =====================================================

export type PromptType =
  | "hero-headline" | "hero-subtitle" | "cta" | "seo-title" | "seo-description"
  | "meta-keywords" | "about-section" | "biography" | "event-description" | "blog-article"
  | "album-description" | "facebook-post" | "instagram-caption" | "youtube-description"
  | "faq" | "custom"
  // NEW: Advanced content types
  | "press-release" | "newsletter-intro" | "sponsor-pitch" | "setlist-notes"
  | "merch-description" | "fan-message" | "concert-review" | "anniversary-post";

export const PROMPT_TYPES: { value: PromptType; label: string; desc: string; group: string }[] = [
  // Hero & Landing
  { value: "hero-headline", label: "Hero nadpis", desc: "Krátky, úderný nadpis (max 5 slov)", group: "Hero & Landing" },
  { value: "hero-subtitle", label: "Hero podnadpis", desc: "Podnadpis (max 10 slov)", group: "Hero & Landing" },
  { value: "cta", label: "CTA text", desc: "Call-to-action (max 5 slov)", group: "Hero & Landing" },
  // SEO
  { value: "seo-title", label: "SEO title", desc: "Meta title (max 60 znakov)", group: "SEO" },
  { value: "seo-description", label: "SEO description", desc: "Meta description (max 160 znakov)", group: "SEO" },
  { value: "meta-keywords", label: "Kľúčové slová", desc: "10-15 SEO kľúčových slov", group: "SEO" },
  // Content
  { value: "about-section", label: "O kapele", desc: "Sekcia (100-200 slov)", group: "Content" },
  { value: "biography", label: "Biografia", desc: "Plná bio (200-400 slov)", group: "Content" },
  { value: "event-description", label: "Popis eventu", desc: "Popis koncertu (50-100 slov)", group: "Content" },
  { value: "blog-article", label: "Blog článok", desc: "Článok (150-300 slov)", group: "Content" },
  { value: "album-description", label: "Popis albumu", desc: "Popis nahrávky (50-100 slov)", group: "Content" },
  { value: "faq", label: "FAQ", desc: "Otázka + odpoveď", group: "Content" },
  // Social
  { value: "facebook-post", label: "Facebook post", desc: "Príspevok (max 280 znakov)", group: "Social Media" },
  { value: "instagram-caption", label: "Instagram caption", desc: "Krátky text (max 150 znakov)", group: "Social Media" },
  { value: "youtube-description", label: "YouTube popis", desc: "Popis videa (100-200 slov)", group: "Social Media" },
  // NEW: Advanced
  { value: "press-release", label: "Press release", desc: "Tlačová správa (200-300 slov)", group: "Advanced" },
  { value: "newsletter-intro", label: "Newsletter intro", desc: "Úvodný text newslettera", group: "Advanced" },
  { value: "sponsor-pitch", label: "Sponzorský pitch", desc: "Návrh pre sponzora", group: "Advanced" },
  { value: "setlist-notes", label: "Setlist poznámky", desc: "Poznámky k setlistu", group: "Advanced" },
  { value: "merch-description", label: "Merch popis", desc: "Popis merch produktu", group: "Advanced" },
  { value: "fan-message", label: "Správa fanúšikom", desc: "Osobná správa fanúšikom", group: "Advanced" },
  { value: "concert-review", label: "Koncertná recenzia", desc: "Recenzia vystúpenia", group: "Advanced" },
  { value: "anniversary-post", label: "Výročný príspevok", desc: "Príspevok k výročiu", group: "Advanced" },
  { value: "custom", label: "Vlastný prompt", desc: "Voľný text", group: "Advanced" },
];

export function buildSystemPrompt(type: PromptType): string {
  const base = "Si profesionálny copywriter, SEO špecialista a marketing stratég pre slovenskú funky-punkovú kapelu D.O.R.A. (Dnes Od Rána Abstinujem) z Púchova, založenú v roku 1996. Píšeš v slovenčine, v energickom, autentickom a punkovo-rebelskom tóne. Si kreatívny, ale presný. Dodržiavaš limity znakov a formát.";

  const prompts: Record<PromptType, string> = {
    "hero-headline": `${base}\nVygeneruj 3 varianty Hero nadpisu (max 5 slov každý). Oddieľ ich novým riadkom. Každý musí byť iný štýlom (energický, poetický, priamy).`,
    "hero-subtitle": `${base}\nVygeneruj 3 varianty Hero podnadpisu (max 10 slov každý).`,
    "cta": `${base}\nVygeneruj 3 varianty CTA textu (max 5 slov). Rôzne akcie: booking, lístky, kontakt.`,
    "seo-title": `${base}\nVygeneruj 3 varianty SEO meta title (max 60 znakov každý). Rôzne kľúčové slová.`,
    "seo-description": `${base}\nVygeneruj 3 varianty SEO meta description (max 160 znakov každý). Rôzne hook-y.`,
    "meta-keywords": `${base}\nVygeneruj 15-20 SEO kľúčových slov, oddelených čiarkou. Zahŕňaj žánre, názov, lokalitu, členov.`,
    "about-section": `${base}\nNapíš sekciu "O kapele" (100-200 slov). Popíš históriu, žáner, charakter.`,
    "biography": `${base}\nNapíš plnú biografiu (200-400 slov). Založenie, míľniky, členovia, žánre, vplyvy.`,
    "event-description": `${base}\nNapíš popis koncertu/eventu (50-100 slov). Energický, s dátumom a miestom.`,
    "blog-article": `${base}\nNapíš blog článok (150-300 slov). Titulok + perex + telo.`,
    "album-description": `${base}\nNapíš popis albumu/nahrávky (50-100 slov). Žáner, nálady, význam.`,
    "facebook-post": `${base}\nNapíš Facebook príspevok (max 280 znakov + 5 hashtagy).`,
    "instagram-caption": `${base}\nNapíš Instagram caption (max 150 znakov + hashtagy).`,
    "youtube-description": `${base}\nNapíš YouTube popis (100-200 slov). Odkazy, hashtagy, obsah.`,
    "faq": `${base}\nVygeneruj FAQ. Formát: Q: otázka\\nA: odpoveď (50-100 slov).`,
    "press-release": `${base}\nNapíš tlačovú správu (200-300 slov). Profesionálny formát: nadpis, dátum, úvod, telo, kontakt.`,
    "newsletter-intro": `${base}\nNapíš úvod newslettera (50-100 slov). Osobný, teplý tón.`,
    "sponsor-pitch": `${base}\nNapíš sponzorský návrh (150-250 slov). Zhŕň benefíci pre sponzora.`,
    "setlist-notes": `${base}\nNapíš poznámky k setlistu pre koncert. Poradie, nálady, prechody, tempo.`,
    "merch-description": `${base}\nNapíš popis merch produktu (50-100 slov). Materiál, dizajn, dostupnosť.`,
    "fan-message": `${base}\nNapíš osobnú správa fanúšikom (50-100 slov). Vďaka za podporu.`,
    "concert-review": `${base}\nNapíš recenziu vystúpenia (100-200 slov). Atmosféra, energia, highlight.`,
    "anniversary-post": `${base}\nNapíš príspevok k výročiu (100-200 slov). Spomienky, míľniky, vďaka.`,
    "custom": `${base}\nSplň požiadavku používateľa.`,
  };

  return prompts[type];
}

// =====================================================
// AI SUGGESTION ENGINE — proaktívne návrhy
// =====================================================

export type SuggestionType = "content" | "seo" | "booking" | "social" | "fan";

export type Suggestion = {
  type: SuggestionType;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
};

/**
 * Analyzuje dáta v DB a generuje proaktívne návrhy pre admin.
 * Behá cez rôzne modely (inquiries, gigs, subscribers, content) a
 * porovnáva ich pre vytvorenie inteligentných sugescií.
 */
export async function generateSuggestions(): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // 1. Analyze new inquiries without response
  const newInquiries = await db.bookingInquiry.count({ where: { status: "new" } });
  if (newInquiries > 0) {
    suggestions.push({
      type: "booking",
      priority: "high",
      title: `${newInquiries} nových dopytov bez odpovede`,
      description: `Máte ${newInquiries} nespracovaných booking dopytov. AI môže vygenerovať odpovede.`,
      action: "Otvoriť Dopyty",
    });
  }

  // 2. Upcoming gigs without tasks
  const upcomingGigs = await db.gig.findMany({
    where: { status: "upcoming", date: { gte: new Date() } },
    take: 10,
    select: { id: true, title: true, date: true },
  });
  for (const gig of upcomingGigs) {
    const taskCount = await db.task.count({ where: { gigId: gig.id, status: { not: "done" } } });
    if (taskCount === 0) {
      suggestions.push({
        type: "booking",
        priority: "high",
        title: `Koncert "${gig.title}" nemá úlohy`,
        description: `AI môže vygenerovať checklist (promo, social, technika) pre koncert ${new Date(gig.date).toLocaleDateString("sk-SK")}.`,
        action: "Vygenerovať úlohy",
      });
    }
  }

  // 3. Subscribers growth analysis
  const totalSubs = await db.subscriber.count({ where: { active: true } });
  if (totalSubs > 0) {
    const lastWeekSubs = await db.subscriber.count({
      where: { active: true, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });
    if (lastWeekSubs === 0) {
      suggestions.push({
        type: "fan",
        priority: "medium",
        title: "Žiadni noví odberatelia za 7 dní",
        description: "AI navrhuje vytvoriť novú newsletter kampaň alebo sociálny príspevok pre rast fanúšikovskej základne.",
        action: "Vytvoriť kampaň",
      });
    }
  }

  // 4. Media without alt text
  const mediaWithoutAlt = await db.mediaItem.count({ where: { altText: null } });
  if (mediaWithoutAlt > 0) {
    suggestions.push({
      type: "seo",
      priority: "medium",
      title: `${mediaWithoutAlt} obrázkov bez alt-textu`,
      description: "Chýbajúce alt-texty znižujú SEO a prístupnosť. AI môže vygenerovať popisy.",
      action: "Vygenerovať alt-texty",
    });
  }

  // 5. Contacts with low AI score
  const lowScoreContacts = await db.contact.count({ where: { aiScore: { lt: 30 }, status: "active" } });
  if (lowScoreContacts > 0) {
    suggestions.push({
      type: "booking",
      priority: "low",
      title: `${lowScoreContacts} kontaktov s nízkym match skóre`,
      description: "Tieto kontakty majú nízky potenciál pre booking. AI odporúča preskúmať nové príležitosti.",
      action: "Analyzovať kontakty",
    });
  }

  // 6. SEO meta missing for paths
  const seoMetaCount = await db.seoMeta.count();
  if (seoMetaCount === 0) {
    suggestions.push({
      type: "seo",
      priority: "high",
      title: "Žiadne SEO meta dáta",
      description: "AI môže vygenerovať meta title, description a kľúčové slová pre všetky sekcie.",
      action: "Vygenerovať SEO",
    });
  }

  // 7. No recent automation runs
  const recentAutomations = await db.automationLog.count({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (recentAutomations === 0) {
    suggestions.push({
      type: "content",
      priority: "low",
      title: "Žiadne AI automatizácie za 24h",
      description: "AI agenti neboli spustení za posledný deň. Zvážte spustenie content alebo social agenta.",
      action: "Spustiť agenta",
    });
  }

  return suggestions;
}

// =====================================================
// A/B VARIANT GENERATOR — generuje 3 varianty na porovnanie
// =====================================================

export async function generateVariants(params: {
  type: PromptType;
  context?: string;
  instruction?: string;
}): Promise<string[]> {
  const systemPrompt = buildSystemPrompt(params.type);
  const userPrompt = [
    params.context ? `KONTEXT:\n${params.context}\n` : "",
    params.instruction ? `INŠTRUKCIE:\n${params.instruction}\n` : "",
    "Vygeneruj 3 rôzne varianty. Každý variant oddiel s '===VARIANT==='. Každý variant musí byť štýlom aj prístupom odlišný.",
  ].join("\n");

  const result = await generateText({
    model: getModel("writing"),
    system: systemPrompt,
    prompt: userPrompt,
  });

  const variants = result.text.split("===VARIANT===").map(v => v.trim()).filter(Boolean);
  return variants.length >= 1 ? variants : [result.text];
}

// =====================================================
// SEO SCORING — vyhodnotí kvalitu textu pre SEO
// =====================================================

export type SEOScore = {
  score: number;
  titleLength: number;
  descLength: number;
  hasKeywords: boolean;
  suggestions: string[];
};

export async function scoreSEO(params: { title: string; description: string; keywords: string }): Promise<SEOScore> {
  const prompt = `Analyzuj SEO kvalitu pre kapelu D.O.R.A.:
Title: "${params.title}" (${params.title.length} znakov)
Description: "${params.description}" (${params.description.length} znakov)
Keywords: "${params.keywords}"

Vráť JSON:
{
  "score": 0-100,
  "titleLength": ${params.title.length},
  "descLength": ${params.description.length},
  "hasKeywords": true/false,
  "suggestions": ["návrh 1", "návrh 2"]
}

Title ideál: 50-60 znakov. Description ideál: 120-160 znakov.`;

  const result = await generateText({
    model: getModel("analysis"),
    system: "Si SEO analytik. Vráť iba platný JSON.",
    prompt,
  });

  try {
    return JSON.parse(result.text.replace(/```json\n?/g, "").replace(/\n?```/g, ""));
  } catch {
    return { score: 50, titleLength: params.title.length, descLength: params.description.length, hasKeywords: !!params.keywords, suggestions: ["AI analýza zlyhala, skontrolujte manuálne."] };
  }
}
