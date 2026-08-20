import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

/**
 * POST /api/admin/seed
 *
 * Manuálne spustenie seedu pre produkčnú DB.
 * Vyžaduje admin auth.
 * Idempotentný — preskočí záznamy ktoré už existujú.
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const results: string[] = [];

  try {
    // 1. Admin user
    const adminEmail = process.env.ADMIN_EMAIL || "admin@dora.band";
    const adminPassword = process.env.ADMIN_PASSWORD || "D0ra2026!Secure";
    const existingAdmin = await db.adminUser.findUnique({ where: { email: adminEmail.toLowerCase() } });
    if (!existingAdmin) {
      const passwordHash = await hashPassword(adminPassword);
      await db.adminUser.create({
        data: { email: adminEmail.toLowerCase(), passwordHash, name: "D.O.R.A. Admin", role: "admin" },
      });
      results.push("✓ Created admin user");
    } else {
      results.push("• Admin user already exists");
    }

    // 2. Gigs
    const gigCount = await db.gig.count();
    if (gigCount === 0) {
      await db.gig.createMany({
        data: [
          { title: "Letny pivny festival 2026", date: new Date("2026-07-15T21:00:00Z"), venue: "Areal Zimny stadion", city: "Zilina", country: "SK", ticketUrl: "#kontakt", ticketPrice: "10 EUR", status: "upcoming" },
          { title: "Punk Night Showcase", date: new Date("2026-08-22T20:00:00Z"), venue: "Klub Underground", city: "Bratislava", country: "SK", ticketUrl: "#kontakt", ticketPrice: "8 EUR", status: "upcoming" },
          { title: "Crossover Fest", date: new Date("2026-09-12T19:30:00Z"), venue: "Areál Zimný štadión", city: "Žilina", country: "SK", ticketUrl: "#kontakt", ticketPrice: "12 EUR", status: "upcoming" },
        ],
      });
      results.push("✓ Created 3 gigs");
    } else {
      results.push(`• ${gigCount} gigs already exist`);
    }

    // 3. Media items
    const mediaCount = await db.mediaItem.count();
    if (mediaCount === 0) {
      const concertPhotos = Array.from({ length: 16 }, (_, i) => ({
        title: `Koncertný záchyt ${i + 1}`,
        url: `/gallery/concert/concert-${String(i + 1).padStart(2, "0")}.jpg`,
        thumbnailUrl: `/gallery/concert/concert-${String(i + 1).padStart(2, "0")}-thumb.jpg`,
        category: "concert",
        fileType: "image",
        caption: "Energické vystúpenie na koncertnom pódiu",
        credits: "Foto: archív D.O.R.A.",
        featured: i === 0,
      }));
      const portraitPhotos = Array.from({ length: 5 }, (_, i) => ({
        title: `Portrétny záchyt ${i + 1}`,
        url: `/gallery/portrait/portrait-${String(i + 1).padStart(2, "0")}.jpg`,
        thumbnailUrl: `/gallery/portrait/portrait-${String(i + 1).padStart(2, "0")}-thumb.jpg`,
        category: "portrait",
        fileType: "image",
        caption: "Portrét / zákulisie",
        credits: "Foto: archív D.O.R.A.",
      }));
      await db.mediaItem.createMany({ data: [...concertPhotos, ...portraitPhotos] });
      results.push("✓ Created 21 media items");
    } else {
      results.push(`• ${mediaCount} media items already exist`);
    }

    // 4. Band members
    const memberCount = await db.bandMember.count();
    if (memberCount === 0) {
      await db.bandMember.createMany({
        data: [
          { name: "Majo Agafon", role: "Vokály / Rap", roleEn: "Vocals / Rap", bio: "Prínos crossoverového rapu do zvuku kapely.", initials: "MA", since: "—", photo: "/gallery/portrait/portrait-01.jpg", order: 1, active: true },
          { name: "Branislav Guzma", role: "Gitara", roleEn: "Guitar", bio: "Zakladajúci člen.", initials: "BG", since: "1996", photo: "/gallery/portrait/portrait-02.jpg", order: 2, active: true },
          { name: "Matúš Dobeš", role: "Basgitara", roleEn: "Bass", bio: "Pridal sa v roku 2005.", initials: "MD", since: "2005", photo: "/gallery/portrait/portrait-03.jpg", order: 3, active: true },
          { name: "Július Flimmel", role: "Bicie", roleEn: "Drums", bio: "Zakladajúci bubeník.", initials: "JF", since: "1996", photo: "/gallery/portrait/portrait-04.jpg", order: 4, active: true },
        ],
      });
      results.push("✓ Created 4 band members");
    } else {
      results.push(`• ${memberCount} band members already exist`);
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[seed API] error:", err);
    return NextResponse.json(
      { error: "Seed zlyhal", detail: err instanceof Error ? err.message : String(err), results },
      { status: 500 }
    );
  }
}
