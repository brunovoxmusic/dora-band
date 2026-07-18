import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view"); // "upcoming" (default) | "past" | "all"

  const now = new Date();

  if (view === "past") {
    const gigs = await db.gig.findMany({
      where: { date: { lt: now }, status: { not: "cancelled" } },
      orderBy: { date: "desc" },
      take: 50,
    });
    return NextResponse.json({ items: gigs });
  }

  if (view === "all") {
    const gigs = await db.gig.findMany({
      where: { status: { not: "cancelled" } },
      orderBy: { date: "desc" },
      take: 100,
    });
    return NextResponse.json({ items: gigs });
  }

  // default: upcoming
  const gigs = await db.gig.findMany({
    where: { status: "upcoming", date: { gte: now } },
    orderBy: { date: "asc" },
    take: 50,
  });
  return NextResponse.json({ items: gigs });
}
