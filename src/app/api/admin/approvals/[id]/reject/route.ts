import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * B.2 — Reject návrh z ApprovalQueue
 *
 * POST /api/admin/approvals/[id]/reject
 *
 * Body: { notes?: string }
 *
 * Zamietne návrh — len ho označí ako rejected, nič sa nevytvára.
 */

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const { id } = await params;
  try {
    const item = await db.approvalQueue.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Návrh nebol nájdený." }, { status: 404 });
    if (item.status !== "pending") {
      return NextResponse.json({ error: `Návrh už je ${item.status}.` }, { status: 422 });
    }

    const b = await req.json().catch(() => ({}));
    const session = await getSession(req);
    const approvedBy = session?.email || "admin";

    await db.approvalQueue.update({
      where: { id },
      data: {
        status: "rejected",
        approvedBy,
        approvedAt: new Date(),
        reviewNotes: b.notes ? String(b.notes) : null,
      },
    });

    // Log automation
    await db.automationLog.create({
      data: {
        agentType: item.agentType,
        trigger: "rejection",
        input: `Rejected ${item.entityType} (${item.action})`,
        output: b.notes ? `Rejected: ${b.notes}` : "Rejected without notes",
        status: "success",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[approvals reject]", err);
    return NextResponse.json({ error: "Zamietnutie zlyhalo." }, { status: 500 });
  }
}
