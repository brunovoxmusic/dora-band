import { db } from "./db";

/**
 * CMS content layer.
 *
 * Defaults are sourced from band-data.ts. Any key present in the SiteContent
 * table overrides the default. This lets admins edit copy without code changes
 * while keeping a sensible fallback for every key.
 */

// Import the static defaults so we can fall back to them.
import { BAND } from "./band-data";

export const CONTENT_DEFAULTS: Record<string, { value: string; category: string; label: string; type: "text" | "textarea" }> = {
  // Hero
  "hero.eyebrow": { value: "Funky-Punk · Crossover · Púchov SK", category: "hero", label: "Hero — nadpis nad názvom", type: "text" },
  "hero.title": { value: "D.O.R.A.", category: "hero", label: "Hero — hlavný názov", type: "text" },
  "hero.subtitle": { value: "Dnes Od Rána Abstinujem", category: "hero", label: "Hero — podnadpis", type: "text" },
  "hero.tagline": { value: BAND.tagline, category: "hero", label: "Hero — tagline", type: "textarea" },
  "hero.ctaPrimary": { value: "Rezervovať koncert / Booking", category: "hero", label: "Hero — primárne CTA", type: "text" },
  "hero.ctaSecondary": { value: "PR Materiály na stiahnutie", category: "hero", label: "Hero — sekundárne CTA", type: "text" },
  "hero.statusPill": { value: "Booking 2026 — otvorený", category: "hero", label: "Hero — status pill", type: "text" },

  // Band
  "band.name": { value: BAND.name, category: "band", label: "Názov kapely", type: "text" },
  "band.fullName": { value: BAND.fullName, category: "band", label: "Plný názov", type: "text" },
  "band.bio": { value: BAND.bio, category: "band", label: "Krátky bio", type: "textarea" },
  "band.bioLong": { value: BAND.bioLong, category: "band", label: "Dlhý bio", type: "textarea" },
  "band.origin": { value: BAND.origin, category: "band", label: "Pôvod", type: "text" },
  "band.founded": { value: String(BAND.founded), category: "band", label: "Rok založenia", type: "text" },

  // Contact
  "contact.email": { value: BAND.contact.email, category: "contact", label: "Kontakt e-mail", type: "text" },
  "contact.phone": { value: BAND.contact.phone, category: "contact", label: "Kontakt telefón", type: "text" },

  // Social
  "social.facebook": { value: BAND.social.facebook, category: "social", label: "Facebook URL", type: "text" },
  "social.instagram": { value: BAND.social.instagram, category: "social", label: "Instagram URL", type: "text" },
  "social.youtube": { value: BAND.social.youtube, category: "social", label: "YouTube URL", type: "text" },
  "social.spotify": { value: BAND.social.spotify, category: "social", label: "Spotify URL", type: "text" },
  "social.bandcamp": { value: BAND.social.bandcamp, category: "social", label: "Bandcamp URL", type: "text" },

  // Footer
  "footer.copyright": { value: "© {year} D.O.R.A. — Dnes Od Rána Abstinujem. Všetky práva vyhradené.", category: "footer", label: "Footer — copyright", type: "text" },
  "footer.tagline": { value: "Funky-Punk · Púchov, Slovenská republika", category: "footer", label: "Footer — tagline", type: "text" },

  // SEO defaults
  "seo.metaTitle": { value: "D.O.R.A. — Dnes Od Rána Abstinujem | Funky-Punk z Púchova", category: "seo", label: "SEO — meta title", type: "text" },
  "seo.metaDescription": { value: "Legendárna funky-punková formácia D.O.R.A. z Púchova. Aktívna od 1996. Booking, PR materiály, diskografia, fotky a kontakt pre médiá a partnerov.", category: "seo", label: "SEO — meta description", type: "textarea" },
  "seo.keywords": { value: "D.O.R.A., Dnes Od Rána Abstinujem, funky-punk, Púchov, slovenský punk, crossover, kapela, booking, koncert", category: "seo", label: "SEO — kľúčové slová", type: "textarea" },

  // === SITE SETTINGS (VŠEOBECNÉ NASTAVENIA) ===
  // Maintenance mode
  "settings.maintenance.enabled": { value: "false", category: "settings", label: "Údržba — aktivovať režim údržby", type: "text" },
  "settings.maintenance.message": { value: "Momentálne pracujeme na vylepšení webu. Vráťte sa čoskoro — ďakujeme za trpezlivosť! 🛠️", category: "settings", label: "Údržba — správa pre návštevníkov", type: "textarea" },
  "settings.maintenance.title": { value: "Web sa pripravuje", category: "settings", label: "Údržba — nadpis", type: "text" },
  "settings.maintenance.startTime": { value: "", category: "settings", label: "Údržba — naplánovaný začiatok (ISO)", type: "text" },
  "settings.maintenance.endTime": { value: "", category: "settings", label: "Údržba — naplánovaný koniec (ISO)", type: "text" },
  "settings.maintenance.estimatedReturn": { value: "", category: "settings", label: "Údržba — odhad návratu (text, napr. 'o 2 hodiny')", type: "text" },
  "settings.maintenance.contactEmail": { value: "branislav.guzma@gmail.com", category: "settings", label: "Údržba — kontakt e-mail (zobrazený na obrazovke údržby)", type: "text" },
  "settings.maintenance.allowAdminBypass": { value: "true", category: "settings", label: "Údržba — povoliť obídenie pre prihláseného admina", type: "text" },

  // Live announcement banner
  "settings.banner.enabled": { value: "false", category: "settings", label: "Banner — aktivovať oznamovací banner", type: "text" },
  "settings.banner.message": { value: "Nový koncert potvrdený! Pozri sekciu Koncerty 🎸", category: "settings", label: "Banner — text správy", type: "textarea" },
  "settings.banner.type": { value: "info", category: "settings", label: "Banner — typ (info | warning | success | error | promo)", type: "text" },
  "settings.banner.dismissible": { value: "true", category: "settings", label: "Banner — možnosť zavrieť (dismiss)", type: "text" },
  "settings.banner.link": { value: "", category: "settings", label: "Banner — CTA URL (voliteľné)", type: "text" },
  "settings.banner.linkLabel": { value: "", category: "settings", label: "Banner — CTA text (voliteľné)", type: "text" },
  "settings.banner.startAt": { value: "", category: "settings", label: "Banner — začiatok (ISO, voliteľné)", type: "text" },
  "settings.banner.endAt": { value: "", category: "settings", label: "Banner — koniec (ISO, voliteľné)", type: "text" },

  // Section visibility (per public section)
  "settings.sections.hero": { value: "true", category: "settings", label: "Sekcia — Hero (úvod)", type: "text" },
  "settings.sections.about": { value: "true", category: "settings", label: "Sekcia — O kapele", type: "text" },
  "settings.sections.members": { value: "true", category: "settings", label: "Sekcia — Členovia kapely", type: "text" },
  "settings.sections.music": { value: "true", category: "settings", label: "Sekcia — Hudba & Videá", type: "text" },
  "settings.sections.gallery": { value: "true", category: "settings", label: "Sekcia — Galéria", type: "text" },
  "settings.sections.discography": { value: "true", category: "settings", label: "Sekcia — Diskografia", type: "text" },
  "settings.sections.gigs": { value: "true", category: "settings", label: "Sekcia — Koncerty", type: "text" },
  "settings.sections.setlist": { value: "true", category: "settings", label: "Sekcia — Setlist", type: "text" },
  "settings.sections.testimonials": { value: "true", category: "settings", label: "Sekcia — Recenzie", type: "text" },
  "settings.sections.press": { value: "true", category: "settings", label: "Sekcia — PR / Press Kit", type: "text" },
  "settings.sections.faq": { value: "true", category: "settings", label: "Sekcia — FAQ", type: "text" },
  "settings.sections.social": { value: "true", category: "settings", label: "Sekcia — Sociálne siete", type: "text" },
  "settings.sections.newsletter": { value: "true", category: "settings", label: "Sekcia — Newsletter", type: "text" },
  "settings.sections.contact": { value: "true", category: "settings", label: "Sekcia — Kontakt", type: "text" },

  // Brand/site meta
  "settings.site.language": { value: "sk", category: "settings", label: "Web — jazyk (BCP 47)", type: "text" },
  "settings.site.timezone": { value: "Europe/Bratislava", category: "settings", label: "Web — časová zóna", type: "text" },
};

export type ContentEntry = {
  key: string;
  value: string;
  category: string;
  label: string;
  type: "text" | "textarea";
};

/** In-memory cache (per server instance) to avoid hitting the DB on every request. */
let cache: Record<string, string> | null = null;
let cacheTs = 0;
const CACHE_TTL_MS = 30_000; // 30s

async function loadCache(): Promise<Record<string, string>> {
  if (cache && Date.now() - cacheTs < CACHE_TTL_MS) return cache;
  try {
    const rows = await db.siteContent.findMany({ select: { key: true, value: true } });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    cache = map;
    cacheTs = Date.now();
    return map;
  } catch (e) {
    console.warn("[content] DB fetch failed, using defaults:", e instanceof Error ? e.message : e);
    // Return empty map so callers fall back to CONTENT_DEFAULTS
    return {};
  }
}

/** Invalidate the in-memory cache (call after writes). */
export function invalidateContentCache() {
  cache = null;
}

/**
 * Get a single content value, falling back to the static default.
 */
export async function getContent(key: string): Promise<string> {
  const map = await loadCache();
  if (key in map) return map[key];
  return CONTENT_DEFAULTS[key]?.value ?? "";
}

/**
 * Get many content values at once (single DB query).
 */
export async function getContentMap(keys: string[]): Promise<Record<string, string>> {
  const map = await loadCache();
  const out: Record<string, string> = {};
  for (const k of keys) {
    out[k] = k in map ? map[k] : (CONTENT_DEFAULTS[k]?.value ?? "");
  }
  return out;
}

/**
 * Get all content entries (defaults + DB overrides) for the admin UI.
 */
export async function getAllContent(): Promise<ContentEntry[]> {
  const map = await loadCache();
  return Object.entries(CONTENT_DEFAULTS).map(([key, def]) => ({
    key,
    value: key in map ? map[key] : def.value,
    category: def.category,
    label: def.label,
    type: def.type,
  }));
}

/** Parse a "true"/"false" string into boolean (default false). */
export function parseBool(value: string | undefined | null, fallback = false): boolean {
  if (value == null) return fallback;
  const v = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(v)) return true;
  if (["false", "0", "no", "off", ""].includes(v)) return false;
  return fallback;
}

/**
 * Get all settings entries (defaults + DB overrides), category = "settings".
 */
export async function getAllSettings(): Promise<ContentEntry[]> {
  const all = await getAllContent();
  return all.filter((e) => e.category === "settings");
}

/** Get a single setting value as string. */
export async function getSetting(key: string): Promise<string> {
  return getContent(key);
}

/** Get many setting values at once. */
export async function getSettingsMap(keys: string[]): Promise<Record<string, string>> {
  return getContentMap(keys);
}

/**
 * Check if a specific settings.* key is in the defaults registry.
 * Used to whitelist PUT writes from the admin UI.
 */
export function isKnownSettingsKey(key: string): boolean {
  return key in CONTENT_DEFAULTS && CONTENT_DEFAULTS[key].category === "settings";
}
