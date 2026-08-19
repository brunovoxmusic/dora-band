import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * A.1 — Newsletter API s rate limitingom (anti spam).
 * 3 prihlásenia za hodinu na IP.
 */
export async function POST(req: NextRequest) {
  try {
    // A.1: Rate limiting
    const ip = getClientIp(req);
    const rateLimitResult = newsletterRateLimiter.check(ip);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const { email } = await req.json().catch(() => ({}));
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return NextResponse.json({ error: "Zadajte platný e-mail." }, { status: 422 });
    }
    const clean = email.trim().toLowerCase();

    // Upsert: if exists and inactive, reactivate; if new, create.
    const existing = await db.subscriber.findUnique({ where: { email: clean } });
    if (existing) {
      if (!existing.active) {
        await db.subscriber.update({ where: { id: existing.id }, data: { active: true } });
      }
      return NextResponse.json({ ok: true, message: "Spoľahlivo — bol ste už prihlásený." });
    }

    await db.subscriber.create({ data: { email: clean, source: "website" } });
    return NextResponse.json({ ok: true, message: "Prihlásenie úspešné!" }, { status: 201 });
  } catch (err) {
    console.error("[newsletter] error:", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
