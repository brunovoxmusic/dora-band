/**
 * Site settings layer — high-level helpers around the SiteContent table for
 * maintenance mode, live announcement banner, and section visibility toggles.
 *
 * All values are stored as strings in the SiteContent table (category=settings)
 * and parsed here into typed structures. Defaults live in lib/content.ts.
 */

import { getContentMap, parseBool } from "./content";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MaintenanceState = {
  enabled: boolean;
  /** True only if a scheduled window is currently active (start <= now <= end). */
  scheduledActive: boolean;
  /** The effective state — true if maintenance should be shown right now. */
  isActive: boolean;
  title: string;
  message: string;
  startTime: string | null;
  endTime: string | null;
  estimatedReturn: string;
  contactEmail: string;
  allowAdminBypass: boolean;
};

export type BannerType = "info" | "warning" | "success" | "error" | "promo";

export type BannerState = {
  enabled: boolean;
  /** True only if a scheduled window is currently active. */
  scheduledActive: boolean;
  /** Effective — true if banner should be shown right now. */
  isActive: boolean;
  message: string;
  type: BannerType;
  dismissible: boolean;
  link: string;
  linkLabel: string;
  startAt: string | null;
  endAt: string | null;
};

export type SectionId =
  | "hero"
  | "stats"
  | "about"
  | "members"
  | "music"
  | "gallery"
  | "discography"
  | "gigs"
  | "setlist"
  | "merch"
  | "blog"
  | "testimonials"
  | "press"
  | "faq"
  | "social"
  | "newsletter"
  | "contact";

export const ALL_SECTION_IDS: SectionId[] = [
  "hero", "stats", "about", "members", "music", "gallery", "discography",
  "gigs", "setlist", "merch", "blog", "testimonials", "press", "faq",
  "social", "newsletter", "contact",
];

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Hero (úvod)",
  stats: "Štatistiky (čísla kapely)",
  about: "O kapele",
  members: "Členovia kapely",
  music: "Hudba & Videá",
  gallery: "Galéria",
  discography: "Diskografia",
  gigs: "Koncerty",
  setlist: "Setlist",
  merch: "Merch & Obchod",
  blog: "Blog & Novinky",
  testimonials: "Recenzie",
  press: "PR / Press Kit",
  faq: "FAQ",
  social: "Sociálne siete",
  newsletter: "Newsletter",
  contact: "Kontakt",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inWindow(now: Date, startISO: string | null, endISO: string | null): boolean {
  // If neither bound is set, there is no scheduling constraint → considered "always active".
  if (!startISO && !endISO) return true;
  const start = startISO ? Date.parse(startISO) : null;
  const end = endISO ? Date.parse(endISO) : null;
  const t = now.getTime();
  if (start && end) return t >= start && t <= end;
  if (start) return t >= start;
  if (end) return t <= end;
  return true;
}

function normalizeBannerType(raw: string): BannerType {
  const v = (raw || "").trim().toLowerCase() as BannerType;
  if (["info", "warning", "success", "error", "promo"].includes(v)) return v;
  return "info";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All settings.* keys needed in one fetch. */
const SETTING_KEYS = [
  "settings.maintenance.enabled",
  "settings.maintenance.title",
  "settings.maintenance.message",
  "settings.maintenance.startTime",
  "settings.maintenance.endTime",
  "settings.maintenance.estimatedReturn",
  "settings.maintenance.contactEmail",
  "settings.maintenance.allowAdminBypass",
  "settings.banner.enabled",
  "settings.banner.message",
  "settings.banner.type",
  "settings.banner.dismissible",
  "settings.banner.link",
  "settings.banner.linkLabel",
  "settings.banner.startAt",
  "settings.banner.endAt",
  ...ALL_SECTION_IDS.map((s) => `settings.sections.${s}` as const),
  "settings.site.language",
  "settings.site.timezone",
];

export type AllSettings = {
  maintenance: MaintenanceState;
  banner: BannerState;
  sections: Record<SectionId, boolean>;
  site: { language: string; timezone: string };
  /** Raw key→value map (for admin UI). */
  raw: Record<string, string>;
};

/** Load all settings in one DB query and return structured data. */
export async function getAllSettingsStructured(): Promise<AllSettings> {
  const map = await getContentMap(SETTING_KEYS);

  const now = new Date();
  const maintStart = map["settings.maintenance.startTime"] || null;
  const maintEnd = map["settings.maintenance.endTime"] || null;
  const maintScheduledActive = inWindow(now, maintStart, maintEnd);
  const maintEnabled = parseBool(map["settings.maintenance.enabled"]);
  // Effective maintenance: enabled AND (no schedule OR within scheduled window).
  const maintActive = maintEnabled && maintScheduledActive;

  const bannerStart = map["settings.banner.startAt"] || null;
  const bannerEnd = map["settings.banner.endAt"] || null;
  const bannerScheduledActive = inWindow(now, bannerStart, bannerEnd);
  const bannerEnabled = parseBool(map["settings.banner.enabled"]);
  const bannerActive = bannerEnabled && bannerScheduledActive;

  const sections = {} as Record<SectionId, boolean>;
  for (const s of ALL_SECTION_IDS) {
    // Fix: getContentMap vracia "" pre chýbajúce keys, ale parseBool("", true) vracia false.
    // Preto kontrolujeme či key skutočne existuje v raw DB mape.
    const rawValue = map[`settings.sections.${s}`];
    sections[s] = rawValue === "" ? true : parseBool(rawValue, true);
  }

  return {
    maintenance: {
      enabled: maintEnabled,
      scheduledActive: maintScheduledActive,
      isActive: maintActive,
      title: map["settings.maintenance.title"] || "Web sa pripravuje",
      message: map["settings.maintenance.message"] || "",
      startTime: maintStart,
      endTime: maintEnd,
      estimatedReturn: map["settings.maintenance.estimatedReturn"] || "",
      contactEmail: map["settings.maintenance.contactEmail"] || "",
      allowAdminBypass: parseBool(map["settings.maintenance.allowAdminBypass"], true),
    },
    banner: {
      enabled: bannerEnabled,
      scheduledActive: bannerScheduledActive,
      isActive: bannerActive,
      message: map["settings.banner.message"] || "",
      type: normalizeBannerType(map["settings.banner.type"]),
      dismissible: parseBool(map["settings.banner.dismissible"], true),
      link: map["settings.banner.link"] || "",
      linkLabel: map["settings.banner.linkLabel"] || "",
      startAt: bannerStart,
      endAt: bannerEnd,
    },
    sections,
    site: {
      language: map["settings.site.language"] || "sk",
      timezone: map["settings.site.timezone"] || "Europe/Bratislava",
    },
    raw: map,
  };
}

/** Quick check — should we render the maintenance screen? */
export async function getMaintenanceMode(): Promise<MaintenanceState> {
  return (await getAllSettingsStructured()).maintenance;
}

/** Quick check — banner state. */
export async function getBannerState(): Promise<BannerState> {
  return (await getAllSettingsStructured()).banner;
}

/** Quick check — section visibility map. */
export async function getSectionVisibility(): Promise<Record<SectionId, boolean>> {
  return (await getAllSettingsStructured()).sections;
}
