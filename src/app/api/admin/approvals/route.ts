import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * B.2 — ApprovalQueue API
 *
 * GET  /api/admin/approvals         — zoznam návrhov (default: pending)
 * POST /api/admin/approvals         — vytvor návrh (pre agentov)
 *
 * Query params:
 * - ?status=pending|approved|rejected (default: pending)
 * - ?agentType=task|content|booking|...
 */

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const agentType = searchParams.get("agentType");

    const where: Record<string, unknown> = { status };
    if (agentType) where.agentType = agentType;

    const items = await db.approvalQueue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Parse payload JSON pre frontend (safe — handle null/invalid)
    const parsed = items.map((item) => ({
      ...item,
      payload: safeJsonParse(item.payload, {}),
    }));

    return NextResponse.json({ items: parsed });
  } catch (err) {
    console.error("[approvals GET]", err);
    return NextResponse.json(
      { error: "Načítanie schválení zlyhalo.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/** Safe JSON parse — vráti fallback ak je hodnota null alebo ak parse zlyhá */
function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const b = await req.json();
    if (!b.agentType || !b.entityType || !b.action || !b.payload) {
      return NextResponse.json({ error: "agentType, entityType, action, payload sú povinné." }, { status: 422 });
    }

    const item = await db.approvalQueue.create({
      data: {
        agentType: b.agentType,
        entityType: b.entityType,
        action: b.action,
        payload: typeof b.payload === "string" ? b.payload : JSON.stringify(b.payload),
        reasoning: b.reasoning || null,
        gigId: b.gigId || null,
        status: "pending",
      },
    });

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[approvals POST]", err);
    return NextResponse.json({ error: "Vytvorenie návrhu zlyhalo." }, { status: 500 });
  }
}
