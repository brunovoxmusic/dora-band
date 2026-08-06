import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const [inquiries, gigs, media, subscribers, newInquiries, upcomingGigs, contacts, tasks, activeBookings, automations] = await Promise.all([
    db.bookingInquiry.count(),
    db.gig.count(),
    db.mediaItem.count(),
    db.subscriber.count({ where: { active: true } }),
    db.bookingInquiry.count({ where: { status: "new" } }),
    db.gig.count({ where: { status: "upcoming", date: { gte: new Date() } } }),
    db.contact.count(),
    db.task.count({ where: { status: { not: "done" } } }),
    db.booking.count({ where: { status: { notIn: ["cancelled", "confirmed"] } } }),
    db.automationLog.count(),
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

  const statusBreakdown = await db.bookingInquiry.groupBy({
    by: ["status"],
    _count: true,
  });

  // Recent tasks
  const recentTasks = await db.task.findMany({
    where: { status: { not: "done" } },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    take: 5,
    select: { id: true, title: true, dueDate: true, priority: true, aiGenerated: true },
  });

  // Recent automations
  const recentAutomations = await db.automationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, agentType: true, trigger: true, status: true, createdAt: true },
  });

  return NextResponse.json({
    counts: { inquiries, gigs, media, subscribers, newInquiries, upcomingGigs, contacts, tasks, activeBookings, automations },
    recentInquiries,
    upcomingGigs: upcomingGigsList,
    recentTasks,
    recentAutomations,
    statusBreakdown: statusBreakdown.reduce(
      (acc, s) => ({ ...acc, [s.status]: s._count }),
      {} as Record<string, number>
    ),
  });
}
