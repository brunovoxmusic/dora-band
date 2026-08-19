import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const EVENT_TYPES = ["Festival", "Mestské slávnosti", "Klubový koncert", "Súkromná akcia"];

/**
 * A.4/A.10 — Booking API s bezpečnostnými vylepšeniami:
 * - Rate limiting: 3 dopyty za hodinu na IP (anti spam)
 * - Honeypot field: ak "website" je vyplnený, tichý reject (bot trap)
 * - GDPR consent validation: required checkbox
 * - Strict input validation
 */
export async function POST(req: NextRequest) {
  try {
    // A.1: Rate limiting — 3 dopyty za hodinu na IP
    const ip = getClientIp(req);
    const rateLimitResult = bookingRateLimiter.check(ip);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Neplatný payload." }, { status: 400 });
    }

    // A.10: Honeypot — ak je "website" vyplnený, ide o bota (tichý reject)
    if (body.website && typeof body.website === "string" && body.website.trim().length > 0) {
      // Pretend success, ale neulož (anti-bot)
      return NextResponse.json({ ok: true, id: "honeypot-rejected" }, { status: 201 });
    }

    // A.4: GDPR consent — required
    if (!body.gdprConsent || body.gdprConsent !== true) {
      return NextResponse.json(
        { error: "Súhlas so spracovaním osobných údajov je povinný." },
        { status: 422 }
      );
    }

    const { organizer, email, phone, eventDate, eventLocation, eventType, message } = body;

    // A.10: Striktnejšia validácia
    const errors: string[] = [];
    if (!organizer || typeof organizer !== "string" || organizer.trim().length < 2 || organizer.trim().length > 100)
      errors.push("Meno usporiadateľa je povinné (2-100 znakov).");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)
      errors.push("Platný kontaktný e-mail je povinný.");
    if (!phone || typeof phone !== "string" || phone.trim().length < 6 || phone.trim().length > 30)
      errors.push("Kontaktný telefón je povinný (6-30 znakov).");
    if (!eventDate || typeof eventDate !== "string" || eventDate.length > 50)
      errors.push("Dátum podujatia je povinný.");
    if (!eventLocation || typeof eventLocation !== "string" || eventLocation.trim().length < 2 || eventLocation.trim().length > 200)
      errors.push("Miesto podujatia je povinné (2-200 znakov).");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" "), fields: errors }, { status: 422 });
    }

    const inquiry = await db.bookingInquiry.create({
      data: {
        organizer: organizer.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        eventDate: eventDate.trim(),
        eventLocation: eventLocation.trim(),
        eventType: EVENT_TYPES.includes(eventType) ? eventType : EVENT_TYPES[0],
        message: typeof message === "string" ? message.trim().slice(0, 2000) : "",
        status: "new",
      },
    });

    // Trigger AI inquiry agent (async, non-blocking)
    import("@/lib/agents/orchestrator")
      .then(({ orchestrator }) => orchestrator("inquiry_received", inquiry))
      .catch((e) => console.error("[orchestrator] inquiry_received trigger failed:", e));

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
  } catch (err) {
    console.error("[booking] error:", err);
    return NextResponse.json({ error: "Serverová chyba. Skúste to znova." }, { status: 500 });
  }
}
