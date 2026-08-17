import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M6.3 — Analytics Dashboard API
 *
 * Vráti KPI rozdelené na kategórie:
 * - LIVE (bookings, conversion, upcoming gigs)
 * - CRM (leads, contacts, response rate)
 * - FAN (subscribers, engagement, segments)
 * - MUSIC (songs, released, setlist)
 * - CONTENT (media, automations, knowledge)
 * - BUSINESS (booking pipeline value, fee analysis)
 */

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    // === LIVE ===
    const [totalGigs, upcomingGigs, pastGigs, confirmedBookings, cancelledBookings] = await Promise.all([
      db.gig.count(),
      db.gig.count({ where: { status: "upcoming", date: { gte: new Date() } } }),
      db.gig.count({ where: { status: "past" } }),
      db.booking.count({ where: { status: "confirmed" } }),
      db.booking.count({ where: { status: "cancelled" } }),
    ]);

    const live = {
      totalGigs,
      upcomingGigs,
      pastGigs,
      confirmedBookings,
      cancelledBookings,
      conversionRate: totalGigs > 0 ? Math.round((confirmedBookings / totalGigs) * 100) : 0,
    };

    // === CRM ===
    const [totalContacts, activeContacts, totalBookings, activeBookings, totalInquiries, newInquiries] = await Promise.all([
      db.contact.count(),
      db.contact.count({ where: { status: "active" } }),
      db.booking.count(),
      db.booking.count({ where: { status: { notIn: ["cancelled", "confirmed"] } } }),
      db.bookingInquiry.count(),
      db.bookingInquiry.count({ where: { status: "new" } }),
    ]);

    // Contact type breakdown
    const contactTypes = await db.contact.groupBy({
      by: ["type"],
      _count: true,
    });

    const crm = {
      totalContacts,
      activeContacts,
      totalBookings,
      activeBookings,
      totalInquiries,
      newInquiries,
      responseRate: totalInquiries > 0 ? Math.round(((totalInquiries - newInquiries) / totalInquiries) * 100) : 0,
      contactTypes: contactTypes.reduce((acc, t) => ({ ...acc, [t.type]: t._count }), {} as Record<string, number>),
    };

    // === FAN ===
    const [totalSubscribers, activeSubscribers, newThisWeek] = await Promise.all([
      db.subscriber.count(),
      db.subscriber.count({ where: { active: true } }),
      db.subscriber.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    // Fan journey breakdown
    const journeyStages = await db.subscriber.groupBy({
      by: ["journeyStage"],
      _count: true,
    });

    // Segment breakdown
    const segments = await db.subscriber.groupBy({
      by: ["segment"],
      _count: true,
    });

    // City breakdown (top 5)
    const cityCounts = await db.subscriber.groupBy({
      by: ["city"],
      _count: true,
      orderBy: { _count: { city: "desc" } },
      take: 5,
    });

    const fan = {
      totalSubscribers,
      activeSubscribers,
      newThisWeek,
      growthRate: activeSubscribers > 0 ? Math.round((newThisWeek / activeSubscribers) * 100) : 0,
      journeyStages: journeyStages.reduce((acc, s) => ({ ...acc, [s.journeyStage]: s._count }), {} as Record<string, number>),
      segments: segments.filter(s => s.segment).reduce((acc, s) => ({ ...acc, [s.segment!]: s._count }), {} as Record<string, number>),
      topCities: cityCounts.filter(c => c.city).map(c => ({ city: c.city!, count: c._count })),
    };

    // === MUSIC ===
    const [totalSongs, releasedSongs, setlistSongs, rehearsals, plannedRehearsals] = await Promise.all([
      db.song.count(),
      db.song.count({ where: { status: "released" } }),
      db.song.count({ where: { inSetlist: true } }),
      db.rehearsal.count(),
      db.rehearsal.count({ where: { status: "planned" } }),
    ]);

    // Song status breakdown
    const songStatuses = await db.song.groupBy({
      by: ["status"],
      _count: true,
    });

    const music = {
      totalSongs,
      releasedSongs,
      setlistSongs,
      rehearsals,
      plannedRehearsals,
      songStatuses: songStatuses.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {} as Record<string, number>),
    };

    // === CONTENT ===
    const [totalMedia, mediaWithAlt, totalKnowledge, verifiedKnowledge, totalAutomations, automationsThisWeek] = await Promise.all([
      db.mediaItem.count(),
      db.mediaItem.count({ where: { NOT: { altText: null } } }),
      db.knowledgeItem.count(),
      db.knowledgeItem.count({ where: { verified: true } }),
      db.automationLog.count(),
      db.automationLog.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    const content = {
      totalMedia,
      mediaWithAlt,
      mediaAltCoverage: totalMedia > 0 ? Math.round((mediaWithAlt / totalMedia) * 100) : 0,
      totalKnowledge,
      verifiedKnowledge,
      knowledgeVerificationRate: totalKnowledge > 0 ? Math.round((verifiedKnowledge / totalKnowledge) * 100) : 0,
      totalAutomations,
      automationsThisWeek,
    };

    // === BUSINESS (booking pipeline value) ===
    const pipelineBookings = await db.booking.findMany({
      where: { status: { notIn: ["cancelled"] } },
      select: { proposedFee: true, actualFee: true, aiMatchScore: true, status: true },
    });

    // Extract numeric fee values (fees are stored as strings like "500 EUR")
    const fees = pipelineBookings
      .map(b => b.actualFee || b.proposedFee)
      .filter(Boolean)
      .map(f => {
        const match = f!.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });

    const avgMatchScore = pipelineBookings.length > 0
      ? Math.round(pipelineBookings.filter(b => b.aiMatchScore !== null).reduce((sum, b) => sum + (b.aiMatchScore || 0), 0) / Math.max(1, pipelineBookings.filter(b => b.aiMatchScore !== null).length))
      : 0;

    const business = {
      pipelineValue: fees.reduce((sum, f) => sum + f, 0),
      avgFee: fees.length > 0 ? Math.round(fees.reduce((sum, f) => sum + f, 0) / fees.length) : 0,
      avgMatchScore,
      pipelineCount: pipelineBookings.length,
    };

    return NextResponse.json({
      live,
      crm,
      fan,
      music,
      content,
      business,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[analytics] error:", err);
    return NextResponse.json({ error: "Nepodarilo sa načítať analytiku." }, { status: 500 });
  }
}
