import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public Stats API — kľúčové metriky pre verejnú stránku.
 * Nepotrebuje auth (iba agregované počty, žiadne citlivé dáta).
 *
 * GET /api/stats — roky, koncerty, skladby, fanúšikovia
 */
export async function GET() {
  try {
    const [gigs, songs, subscribers] = await Promise.all([
      db.gig.count(),
      db.song.count({ where: { status: "released" } }),
      db.subscriber.count({ where: { active: true } }),
    ]);

    return NextResponse.json({
      yearsActive: new Date().getFullYear() - 1996,
      gigsPlayed: gigs,
      songsReleased: songs,
      fansCount: subscribers,
    });
  } catch (err) {
    console.error("[public stats GET]", err);
    return NextResponse.json({
      yearsActive: new Date().getFullYear() - 1996,
      gigsPlayed: 0,
      songsReleased: 0,
      fansCount: 0,
    });
  }
}
