import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getModel } from "@/lib/ai";
import { generateText } from "ai";

/**
 * M2.4 — Booking Score v2: Re-scoreable + explainable.
 *
 * POST /api/admin/bookings/[id]/rescore
 *
 * Analyzuje booking + contact data cez AI a vráti:
 * - score (0-100)
 * - factor breakdown (genreFit, locationFit, commercialFit, contactQuality, timing)
 * - priority (high/medium/low)
 * - recommendation (next action)
 * - reasoning (prečo toto skóre)
 *
 * Score je explainable — admin vidí každý faktor a jeho príspevok.
 */

type ScoreFactors = {
  genreFit: number;
  locationFit: number;
  commercialFit: number;
  contactQuality: number;
  timing: number;
};

type ScoreResult = {
  score: number;
  factors: ScoreFactors;
  priority: "high" | "medium" | "low";
  recommendation: string;
  reasoning: string;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;

  try {
    // 1. Načítaj booking s contact + gig
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        contact: true,
        gig: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking nenájdený." }, { status: 404 });
    }

    // 2. Zhromaždi kontext pre AI analýzu
    const contact = booking.contact;
    const gig = booking.gig;
    const contactComms = contact
      ? await db.communication.count({ where: { contactId: contact.id } })
      : 0;
    const contactBookings = contact
      ? await db.booking.count({ where: { contactId: contact.id } })
      : 0;

    const context = [
      `BOOKING: status=${booking.status}, proposedFee=${booking.proposedFee || "neuvedené"}`,
      contact ? `CONTACT: ${contact.name}, typ=${contact.type}, organizácia=${contact.organization || "neuvedená"}, mesto=${contact.city || "neuvedené"}, aiScore=${contact.aiScore}, komunikácie=${contactComms}, bookings=${contactBookings}` : "CONTACT: žiadny",
      gig ? `GIG: ${gig.title}, dátum=${gig.date.toISOString().split("T")[0]}, venue=${gig.venue}, mesto=${gig.city}, krajina=${gig.country}` : "GIG: žiadny",
    ].join("\n");

    // 3. AI analýza s explainable score
    const prompt = `Analyzuj booking pre slovenskú funky-punkovú kapelu D.O.R.A. (Púchov, založená 1996).

${context}

Vyhodnoť booking podľa týchto faktorov (každý 0-100):
1. genreFit — Zhoda žánru eventu s D.O.R.A. (funky-punk, crossover, punk rock)
2. locationFit — Geografická vhodnosť (SK/CZ = vyššie, ďalej = nižšie)
3. commercialFit — Komerčná vhodnosť (fee, rozpočet, typ eventu)
4. contactQuality — Kvalita kontaktu (existencia org, komunikácia, história)
5. timing — Časová vhodnosť (dátum, termín na prípravu)

Vráť IBA platný JSON:
{
  "score": 0-100,
  "factors": {
    "genreFit": 0-100,
    "locationFit": 0-100,
    "commercialFit": 0-100,
    "contactQuality": 0-100,
    "timing": 0-100
  },
  "priority": "high|medium|low",
  "recommendation": "konkrétna odporúčaná akcia v slovenčine",
  "reasoning": "stručné vysvetlenie v slovenčine prečo toto skóre"
}`;

    const result = await generateText({
      model: getModel("analysis"),
      system: "Si booking analytik pre kapelu D.O.R.A. Vráť iba platný JSON. Nevymýšľaj údaje — ak niečo chýba, zníž skóre daného faktora.",
      prompt,
    });

    // 4. Parsuj AI odpoveď
    let analysis: ScoreResult;
    try {
      const cleaned = result.text.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      // Fallback: jednoduchý výpočet bez AI
      analysis = {
        score: 50,
        factors: {
          genreFit: 50,
          locationFit: 50,
          commercialFit: 50,
          contactQuality: 50,
          timing: 50,
        },
        priority: "medium",
        recommendation: "Manuálne zhodnoťte booking.",
        reasoning: "AI analýza zlyhala — manuálne hodnotenie.",
      };
    }

    // 5. Ulož score + analysis do DB
    await db.booking.update({
      where: { id },
      data: {
        aiMatchScore: analysis.score,
        aiAnalysis: JSON.stringify(analysis, null, 2),
        updatedAt: new Date(),
      },
    });

    // 6. Log automation
    await db.automationLog.create({
      data: {
        agentType: "booking",
        trigger: "manual",
        input: JSON.stringify({ bookingId: id, context }),
        output: JSON.stringify(analysis),
        status: "success",
      },
    });

    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error("[bookings rescore]", err);
    return NextResponse.json({ error: "Re-scoring zlyhal." }, { status: 500 });
  }
}
