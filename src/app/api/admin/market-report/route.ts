import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getModel } from "@/lib/ai";
import { generateText } from "ai";

/**
 * M6.4 — Marketing Intelligence
 *
 * GET /api/admin/market-report
 *
 * Vygeneruje týždenný market report pomocou AI na základe reálnych DB dát:
 * - Nové booking príležitosti
 * - Aktívne kontakty v pipeline
 * - Nadchádzajúce koncerty
 * - Stav obsahu a kampaní
 * - Odporúčania pre ďalší týždeň
 */

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    // Gather context
    const [upcomingGigs, activeBookings, newInquiries, activeTasks, subscribers, songs, recentAutomations] = await Promise.all([
      db.gig.findMany({ where: { status: "upcoming", date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 5, select: { title: true, date: true, venue: true, city: true } }),
      db.booking.count({ where: { status: { notIn: ["cancelled", "confirmed"] } } }),
      db.bookingInquiry.count({ where: { status: "new" } }),
      db.task.count({ where: { status: { not: "done" } } }),
      db.subscriber.count({ where: { active: true } }),
      db.song.count({ where: { status: "released" } }),
      db.automationLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { agentType: true, trigger: true, status: true, createdAt: true } }),
    ]);

    const context = `D.O.R.A. Market Report — ${new Date().toLocaleDateString("sk-SK")}

== NADCHÁDZAJÚCE KONCERTY ==
${upcomingGigs.length > 0 ? upcomingGigs.map(g => `- ${g.title} | ${new Date(g.date).toLocaleDateString("sk-SK")} | ${g.venue}, ${g.city}`).join("\n") : "Žiadne nadchádzajúce koncerty"}

== BOOKING PIPELINE ==
Aktívne bookingy: ${activeBookings}
Nové dopyty bez odpovede: ${newInquiries}
Aktívne úlohy: ${activeTasks}

== FANBASE ==
Aktívni odberatelia: ${subscribers}
Vydané skladby: ${songs}

== AI AKTIVITA (posledných 5) ==
${recentAutomations.length > 0 ? recentAutomations.map(a => `- ${a.agentType} | ${a.trigger} | ${a.status} | ${new Date(a.createdAt).toLocaleDateString("sk-SK")}`).join("\n") : "Žiadna AI aktivita"}

Vygeneruj market report v slovenčine s týmito sekciami:
1. SÚHRN (2-3 vety o aktuálnom stave)
2. PRIORITY (čo je najdôležitejšie spraviť tento týždeň)
3. PRÍLEŽITOSTI (booking, content, fan engagement)
4. RIZIKÁ (čo môže zlyhať ak sa nezareaguje)
5. ODPORÚČANIA (konkrétne akcie pre tento týždeň)

Buď stručný, konkrétny a úderný. Punkový tón.`;

    const result = await generateText({
      model: getModel("writing"),
      system: "Si marketing stratég pre slovenskú funky-punkovú kapelu D.O.R.A. Analyzuj dáta a navrhni konkrétne akcie. Píš v slovenčine.",
      prompt: context,
    });

    // Log the report generation
    await db.automationLog.create({
      data: {
        agentType: "analytics",
        trigger: "manual",
        input: context,
        output: result.text,
        status: "success",
      },
    });

    return NextResponse.json({
      report: result.text,
      generatedAt: new Date().toISOString(),
      data: { upcomingGigs: upcomingGigs.length, activeBookings, newInquiries, activeTasks, subscribers, songs },
    });
  } catch (err) {
    console.error("[market-report] error:", err);
    return NextResponse.json({ error: "Generovanie reportu zlyhalo." }, { status: 500 });
  }
}
