import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M5.3 — Concert Mode API
 *
 * GET /api/admin/concert-mode
 *   ?gigId=xxx — vráti gig + setlisty + skladby pre daný koncert
 *   bez gigId — vráti nadchádzajúce koncerty (pick gig)
 *
 * POST /api/admin/concert-mode
 *   Uloží post-event report (pre EVENT_COMPLETE workflow)
 *   { gigId, summary, merchSold, cashCollected, notes, rating }
 *
 * Concert Mode je mobile-first operátorské rozhranie pre live koncert:
 * - Setlist s aktuálnou skladbou a časovačom
 * - Quick notes / next actions
 * - Merch counter
 * - Travel / soundcheck / stage time
 */

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const url = new URL(req.url);
    const gigId = url.searchParams.get("gigId");

    if (gigId) {
      // Detail jedného gig + setlist + songs
      const [gig, setlists, allSongs, finance] = await Promise.all([
        db.gig.findUnique({
          where: { id: gigId },
          include: { venueRef: true },
        }),
        db.setlist.findMany({ where: { gigId }, orderBy: { createdAt: "desc" } }),
        db.song.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, duration: true, musicalKey: true, bpm: true, tuning: true, genre: true, isCover: true, originalArtist: true, status: true } }),
        db.gigFinance.findUnique({ where: { gigId } }),
      ]);

      if (!gig) return NextResponse.json({ error: "Koncert nebol nájdený." }, { status: 404 });

      // Map venueRef -> venue for frontend consistency
      const { venueRef, ...gigRest } = gig;
      const gigWithVenue = { ...gigRest, venue: venueRef };

      // Parse setlist items JSON
      const parsedSetlists = setlists.map(s => ({
        ...s,
        items: typeof s.items === "string" ? JSON.parse(s.items) : s.items,
      }));

      return NextResponse.json({
        gig: gigWithVenue,
        setlists: parsedSetlists,
        songs: allSongs,
        finance,
      });
    }

    // No gigId — list upcoming gigs for picker
    const upcomingGigs = await db.gig.findMany({
      where: {
        status: "upcoming",
        date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // dnes a budúce
      },
      orderBy: { date: "asc" },
      take: 20,
      select: {
        id: true,
        title: true,
        date: true,
        venue: true,
        city: true,
        country: true,
        ticketPrice: true,
        notes: true,
      },
    });

    return NextResponse.json({ upcomingGigs });
  } catch (err) {
    console.error("[concert-mode GET] error:", err);
    return NextResponse.json({ error: "Načítanie Concert Mode zlyhalo." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const body = await req.json();
    const { gigId, summary, merchSold, cashCollected, notes, rating } = body;

    if (!gigId) return NextResponse.json({ error: "gigId je povinný." }, { status: 422 });

    // Mark gig as completed
    const updatedGig = await db.gig.update({
      where: { id: gigId },
      data: {
        status: "completed",
        notes: notes ? `${gigId}\n\n[POST-EVENT ${new Date().toISOString()}]\n${notes}` : undefined,
      },
    });

    // Update finance record with merch/cash if provided
    if (merchSold !== undefined || cashCollected !== undefined) {
      const existingFinance = await db.gigFinance.findUnique({ where: { gigId } });
      await db.gigFinance.upsert({
        where: { gigId },
        update: {
          notes: `${existingFinance?.notes || ""}\n[Post-event] Merch: ${merchSold || 0} kusov, Cash: ${cashCollected || 0}€. Rating: ${rating || "—"}/5. ${summary || ""}`,
        },
        create: {
          gigId,
          fee: 0,
          otherCost: -(cashCollected || 0), // záporný cost = príjem
          notes: `[Post-event] Merch: ${merchSold || 0}, Cash: ${cashCollected || 0}€. ${summary || ""}`,
        },
      });
    }

    // Log automation
    await db.automationLog.create({
      data: {
        agentType: "concert-mode",
        trigger: "manual",
        input: `Post-event report for ${gigId}`,
        output: `Rating: ${rating}/5, Merch: ${merchSold}, Cash: ${cashCollected}€, Summary: ${summary}`,
        status: "success",
      },
    });

    return NextResponse.json({ ok: true, gig: updatedGig });
  } catch (err) {
    console.error("[concert-mode POST] error:", err);
    return NextResponse.json({ error: "Uloženie post-event reportu zlyhalo." }, { status: 500 });
  }
}
