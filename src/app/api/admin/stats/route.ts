import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const [inquiries, gigs, media, subscribers, newInquiries, upcomingGigs] = await Promise.all([
    db.bookingInquiry.count(),
    db.gig.count(),
    db.mediaItem.count(),
    db.subscriber.count({ where: { active: true } }),
    db.bookingInquiry.count({ where: { status: "new" } }),
    db.gig.count({ where: { status: "upcoming", date: { gte: new Date() } } }),
  ]);

  const recentInquiries = await db.bookingInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      organizer: true,
      eventType: true,
      status: true,
      createdAt: true,
      eventDate: true,
      eventLocation: true,
    },
  });

  const upcomingGigsList = await db.gig.findMany({
    where: { status: "upcoming", date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 5,
    select: { id: true, title: true, date: true, city: true, venue: true },
  });

  // Inquiry status breakdown for the chart
  const statusBreakdown = await db.bookingInquiry.groupBy({
    by: ["status"],
    _count: true,
  });

  return NextResponse.json({
    counts: { inquiries, gigs, media, subscribers, newInquiries, upcomingGigs },
    recentInquiries,
    upcomingGigs: upcomingGigsList,
    statusBreakdown: statusBreakdown.reduce(
      (acc, s) => ({ ...acc, [s.status]: s._count }),
      {} as Record<string, number>
    ),
  });
}
