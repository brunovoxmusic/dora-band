import { NextResponse } from "next/server";
import { getSectionVisibility } from "@/lib/settings";

/**
 * Public Sections API — zoznam viditeľných sekcií pre verejnú stránku.
 * Nepotrebuje auth (iba bool hodnoty, žiadne citlivé dáta).
 *
 * GET /api/sections — Record<sectionId, boolean>
 */
export async function GET() {
  try {
    const sections = await getSectionVisibility();
    return NextResponse.json({ sections });
  } catch (err) {
    console.error("[public sections GET]", err);
    // Fallback — všetky sekcie viditeľné
    return NextResponse.json({ sections: null });
  }
}
