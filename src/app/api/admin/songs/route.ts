import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET — list songs, optionally filtered by status or genre */
export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const inSetlist = searchParams.get("inSetlist");
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (inSetlist === "true") where.inSetlist = true;
  const items = await db.song.findMany({
    where,
    orderBy: [{ status: "asc" }, { title: "asc" }],
    take: 200,
  });
  return NextResponse.json({ items });
}

/** POST — create new song */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.title) return NextResponse.json({ error: "Názov je povinný." }, { status: 422 });
    const item = await db.song.create({
      data: {
        title: b.title,
        altTitle: b.altTitle || null,
        bpm: typeof b.bpm === "number" ? b.bpm : null,
        musicalKey: b.musicalKey || null,
        tuning: b.tuning || null,
        genre: b.genre || "Funky-Punk",
        status: b.status || "idea",
        duration: b.duration || null,
        lyrics: b.lyrics || null,
        notes: b.notes || null,
        releaseYear: b.releaseYear || null,
        releaseName: b.releaseName || null,
        videoId: b.videoId || null,
        inSetlist: !!b.inSetlist,
        isCover: !!b.isCover,
        originalArtist: b.originalArtist || null,
      },
    });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[songs POST]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
