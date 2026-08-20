import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * POST /api/admin/db-sync
 *
 * Vytvorí chýbajúce tabuľky a stĺpce priamo cez SQL.
 * Rieši problém kde prisma db push na Vercele zlyhal.
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const results: string[] = [];

  // 1. BandMember tabuľka
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BandMember" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "roleEn" TEXT,
        "bio" TEXT,
        "initials" TEXT NOT NULL DEFAULT '',
        "since" TEXT NOT NULL DEFAULT '—',
        "photo" TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "BandMember_pkey" PRIMARY KEY ("id")
      );
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BandMember_active_idx" ON "BandMember"("active");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BandMember_order_idx" ON "BandMember"("order");`);
    results.push("✓ BandMember table ready");
  } catch (err) {
    results.push(`⚠ BandMember: ${err instanceof Error ? err.message.slice(0, 150) : String(err)}`);
  }

  // 2. MediaItem nové stĺpce
  for (const [col, type, def] of [
    ["fileType", "TEXT", "'image'"],
    ["linkedSections", "TEXT", "'[]'"],
    ["fileSize", "INTEGER", "NULL"],
    ["fileName", "TEXT", "NULL"],
  ] as const) {
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "${col}" ${type} DEFAULT ${def};`);
      results.push(`✓ MediaItem.${col}`);
    } catch {
      results.push(`• MediaItem.${col} exists`);
    }
  }

  // 3. Seed BandMember
  try {
    const count = await db.bandMember.count();
    if (count === 0) {
      await db.bandMember.createMany({
        data: [
          { name: "Majo Agafon", role: "Vokály / Rap", roleEn: "Vocals / Rap", bio: "Prínos crossoverového rapu do zvuku kapely.", initials: "MA", since: "—", photo: "/gallery/portrait/portrait-01.jpg", order: 1, active: true },
          { name: "Branislav Guzma", role: "Gitara", roleEn: "Guitar", bio: "Zakladajúci člen.", initials: "BG", since: "1996", photo: "/gallery/portrait/portrait-02.jpg", order: 2, active: true },
          { name: "Matúš Dobeš", role: "Basgitara", roleEn: "Bass", bio: "Pridal sa v roku 2005.", initials: "MD", since: "2005", photo: "/gallery/portrait/portrait-03.jpg", order: 3, active: true },
          { name: "Július Flimmel", role: "Bicie", roleEn: "Drums", bio: "Zakladajúci bubeník.", initials: "JF", since: "1996", photo: "/gallery/portrait/portrait-04.jpg", order: 4, active: true },
        ],
      });
      results.push("✓ Seeded 4 band members");
    } else {
      results.push(`• ${count} band members already exist`);
    }
  } catch (err) {
    results.push(`⚠ Seed: ${err instanceof Error ? err.message.slice(0, 150) : String(err)}`);
  }

  return NextResponse.json({ ok: true, results });
}
