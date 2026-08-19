import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** PATCH — update song (mass-assignment whitelist) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.title === "string") data.title = b.title;
    if (typeof b.altTitle === "string") data.altTitle = b.altTitle || null;
    if (typeof b.bpm === "number") data.bpm = b.bpm;
    if (typeof b.musicalKey === "string") data.musicalKey = b.musicalKey || null;
    if (typeof b.tuning === "string") data.tuning = b.tuning || null;
    if (typeof b.genre === "string") data.genre = b.genre;
    if (typeof b.status === "string") data.status = b.status;
    if (typeof b.duration === "string") data.duration = b.duration || null;
    if (typeof b.lyrics === "string") data.lyrics = b.lyrics || null;
    if (typeof b.notes === "string") data.notes = b.notes || null;
    if (typeof b.releaseYear === "string") data.releaseYear = b.releaseYear || null;
    if (typeof b.releaseName === "string") data.releaseName = b.releaseName || null;
    if (typeof b.videoId === "string") data.videoId = b.videoId || null;
    if (typeof b.inSetlist === "boolean") data.inSetlist = b.inSetlist;
    if (typeof b.isCover === "boolean") data.isCover = b.isCover;
    if (typeof b.originalArtist === "string") data.originalArtist = b.originalArtist || null;

    const item = await db.song.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

/** DELETE — delete song */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.song.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
