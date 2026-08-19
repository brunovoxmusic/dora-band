import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getModel, getModelName } from "@/lib/ai";
import { streamText } from "ai";
import { trackStreamUsage } from "@/lib/ai/usage";

/**
 * M4.3 — D.O.R.A. AI Copilot
 *
 * POST /api/admin/copilot
 *
 * Kontextový AI asistent, ktorý používa reálne DB dáta na odpovedanie
 * na otázky admina. Nepoužíva vymyslené dáta — iba skutočné z DB.
 *
 * Príklady otázok:
 * - "Čo máme dnes spraviť?"
 * - "Ktoré booking dopyty potrebujú follow-up?"
 * - "Aké koncerty máme naplánované?"
 * - "Vytvor návrh emailu pre promotéra"
 */

const SYSTEM_PROMPT = `Si D.O.R.A. AI Copilot — kontextový asistent pre administráciu kapely D.O.R.A. (Dnes Od Rána Abstinujem, funky-punk z Púchova, založená 1996).

Pravidlá:
1. Odpovedaj VÝHRADNE v slovenčine.
2. Používaj IBA dáta z kontextu, ktoré dostaneš. NIč si nevymýšľaj.
3. Ak dáta chýbajú alebo otázku nemôžeš zodpovedať, povedz to otvorene.
4. Buď konkrétny — menuj konkrétne dopyty, koncerty, úlohy z kontextu.
5. Navrhuj akcie, ktoré admin môže vykonať v systéme.
6. Ak ide o návrh emailu/textu, označ ho ako návrh na schválenie.
7. Buď stručný a úderný — punkový tón, žiadne zbytočné omáčky.

Štruktúra odpovede:
- Pri analýze: odrážky s konkrétnymi položkami z DB
- Pri návrhu akcie: jasná odporúčaná akcia + dôvod
- Pri návrhu textu: text v úvodzovkách + "Návrh na schválenie"
`;

/** Zzhromaždi kontext z DB pre AI */
async function gatherContext(): Promise<string> {
  const parts: string[] = [];

  try {
    // Stats
    const [inquiryCount, newInquiries, gigCount, upcomingGigs, taskCount, activeTasks,
           contactCount, bookingCount, activeBookings, subscriberCount, mediaCount,
           songCount, automationCount] = await Promise.all([
      db.bookingInquiry.count(),
      db.bookingInquiry.count({ where: { status: "new" } }),
      db.gig.count(),
      db.gig.count({ where: { status: "upcoming", date: { gte: new Date() } } }),
      db.task.count(),
      db.task.count({ where: { status: { not: "done" } } }),
      db.contact.count(),
      db.booking.count(),
      db.booking.count({ where: { status: { notIn: ["cancelled", "confirmed"] } } }),
      db.subscriber.count({ where: { active: true } }),
      db.mediaItem.count(),
      db.song.count(),
      db.automationLog.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    parts.push(`== STATS ==
Dopyty: ${inquiryCount} celkom, ${newInquiries} nových (bez odpovede)
Koncerty: ${gigCount} celkom, ${upcomingGigs} nadchádzajúcich
Úlohy: ${taskCount} celkom, ${activeTasks} aktívnych (nedokončených)
Kontakty: ${contactCount}
Booking pipeline: ${bookingCount} celkom, ${activeBookings} aktívnych
Newsletter: ${subscriberCount} aktívnych odberateľov
Médiá: ${mediaCount} fotiek
Skladby: ${songCount}
AI automatizácie za 7 dní: ${automationCount}`);

    // Recent inquiries (last 5)
    const recentInquiries = await db.bookingInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, organizer: true, eventType: true, eventDate: true, eventLocation: true, status: true, message: true, createdAt: true },
    });
    if (recentInquiries.length > 0) {
      parts.push(`== POSLEDNÉ DOPYTY (max 5) ==\n${recentInquiries.map(i =>
        `- ${i.organizer} | ${i.eventType} | ${i.eventDate} | ${i.eventLocation} | status: ${i.status} | správa: "${i.message?.slice(0, 100) || "—"}"`
      ).join("\n")}`);
    }

    // Upcoming gigs (next 5)
    const upcomingGigsList = await db.gig.findMany({
      where: { status: "upcoming", date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 5,
      select: { id: true, title: true, date: true, venue: true, city: true, ticketPrice: true },
    });
    if (upcomingGigsList.length > 0) {
      parts.push(`== NADCHÁDZAJÚCE KONCERTY (max 5) ==\n${upcomingGigsList.map(g =>
        `- ${g.title} | ${new Date(g.date).toLocaleDateString("sk-SK")} | ${g.venue}, ${g.city} | vstupné: ${g.ticketPrice || "—"}`
      ).join("\n")}`);
    }

    // Urgent tasks (next 5)
    const urgentTasks = await db.task.findMany({
      where: { status: { not: "done" }, priority: { in: ["urgent", "high"] } },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 5,
      select: { id: true, title: true, priority: true, dueDate: true, gigId: true },
    });
    if (urgentTasks.length > 0) {
      parts.push(`== URGENTNÉ ÚLOHY (max 5) ==\n${urgentTasks.map(t =>
        `- ${t.title} | priorita: ${t.priority} | termín: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString("sk-SK") : "bez termínu"}`
      ).join("\n")}`);
    }

    // Active bookings (not cancelled/confirmed)
    const activeBookingsList = await db.booking.findMany({
      where: { status: { notIn: ["cancelled", "confirmed"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { contact: { select: { name: true, organization: true } } },
    });
    if (activeBookingsList.length > 0) {
      parts.push(`== AKTÍVNE BOOKINGY (max 5) ==\n${activeBookingsList.map(b =>
        `- status: ${b.status} | kontakt: ${b.contact?.name || "—"} | org: ${b.contact?.organization || "—"} | AI score: ${b.aiMatchScore || "—"} | fee: ${b.proposedFee || "—"}`
      ).join("\n")}`);
    }

    // Knowledge base verified facts
    const verifiedFacts = await db.knowledgeItem.findMany({
      where: { verified: true },
      take: 10,
      select: { category: true, key: true, value: true },
    });
    if (verifiedFacts.length > 0) {
      parts.push(`== OVERENÉ FAKTY (Knowledge Base, max 10) ==\n${verifiedFacts.map(f =>
        `- [${f.category}] ${f.key}: ${f.value.slice(0, 150)}`
      ).join("\n")}`);
    }

  } catch (err) {
    parts.push("== CHYBA ==\nNepodarilo sa načítať dáta z DB.");
    console.error("[copilot] context error:", err);
  }

  return parts.join("\n\n");
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const { messages, question } = await req.json().catch(() => ({}));

    // Gather real DB context
    const context = await gatherContext();

    // Build the user message with context
    const userMessage = question || (Array.isArray(messages) ? messages[messages.length - 1]?.content : "") || "";
    const fullPrompt = `KONTEXT Z DATABÁZY:\n${context}\n\n---\n\nOTÁZKA ADMINA:\n${userMessage}`;

    // Stream response
    const startMs = Date.now();
    const result = streamText({
      model: getModel("writing"),
      system: SYSTEM_PROMPT,
      prompt: fullPrompt,
    });

    // M4.5: Log usage asynchronously (fire-and-forget, after stream is consumed)
    void trackStreamUsage(result as never, "copilot", getModelName("writing"), {
      userId: "admin",
      promptPreview: userMessage,
      startMs,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[copilot] error:", err);
    return NextResponse.json({ error: "AI Copilot zlyhal." }, { status: 500 });
  }
}
