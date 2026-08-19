import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dora.band";

/**
 * M3.3 — Dynamic sitemap
 *
 * Generates sitemap entries from:
 * - Homepage + section anchors (static)
 * - /archiv page
 * - Upcoming + past gigs (dynamic from DB)
 * - Media gallery items (dynamic from DB)
 *
 * Graceful fallback if DB unavailable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages + section anchors
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/#o-kapele`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/#clenovia`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/#hudba`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/#galeria`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/#diskografia`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/#faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/#press`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/#kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/archiv`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  // Dynamic entries from DB (gigs)
  let gigEntries: MetadataRoute.Sitemap = [];
  try {
    const gigs = await db.gig.findMany({
      where: { status: { in: ["upcoming", "past"] } },
      orderBy: { date: "desc" },
      take: 50,
      select: { id: true, date: true, updatedAt: true },
    });
    gigEntries = gigs.map(g => ({
      url: `${SITE_URL}/#gigs`,
      lastModified: g.updatedAt || g.date,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch { /* DB unavailable — skip */ }

  return [...staticEntries, ...gigEntries];
}
