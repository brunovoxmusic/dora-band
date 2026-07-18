import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where = status && status !== "all" ? { status } : { status: "upcoming" };

  const gigs = await db.gig.findMany({
    where,
    orderBy: { date: "asc" },
    take: 50,
  });

  // Only return upcoming (and not past) for the public site
  const now = new Date();
  const upcoming = gigs.filter((g) => new Date(g.date) >= now && g.status !== "cancelled");

  return NextResponse.json({ items: upcoming });
}
