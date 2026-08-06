import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const EVENT_TYPES = ["Festival", "Mestské slávnosti", "Klubový koncert", "Súkromná akcia"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Neplatný payload." }, { status: 400 });
    }

    const { organizer, email, phone, eventDate, eventLocation, eventType, message } = body;

    const errors: string[] = [];
    if (!organizer || typeof organizer !== "string" || organizer.trim().length < 2)
      errors.push("Meno usporiadateľa je povinné.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push("Platný kontaktný e-mail je povinný.");
    if (!phone || typeof phone !== "string" || phone.trim().length < 6)
      errors.push("Kontaktný telefón je povinný.");
    if (!eventDate || typeof eventDate !== "string") errors.push("Dátum podujatia je povinný.");
    if (!eventLocation || typeof eventLocation !== "string")
      errors.push("Miesto podujatia je povinný.");

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
        message: typeof message === "string" ? message.trim() : "",
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
