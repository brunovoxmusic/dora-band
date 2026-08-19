import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * B.2 — Approve návrh z ApprovalQueue
 *
 * POST /api/admin/approvals/[id]/approve
 *
 * Schváli návrh a vykoná akciu podľa entityType:
 * - Task → vytvorí Task záznam
 * - ContentItem → vytvorí ContentItem (draft)
 * - Contact → vytvorí Contact
 * - Iný → len označí ako approved (custom akcie sa riešia manuálne)
 *
 * Po schválení sa záznam označí status=approved, approvedBy, approvedAt.
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

    const session = await getSession(req);
    const approvedBy = session?.email || "admin";
    const payload = typeof item.payload === "string" ? JSON.parse(item.payload) : item.payload;
    let createdEntity: { type: string; id?: string } | null = null;

    // Vykonaj akciu podľa entityType
    switch (item.entityType) {
      case "Task": {
        const task = await db.task.create({
          data: {
            title: String(payload.title || "Bez názvu"),
            description: payload.description ? String(payload.description) : null,
            priority: String(payload.priority || "medium"),
            status: "todo",
            dueDate: payload.dueDate ? new Date(String(payload.dueDate)) : null,
            gigId: item.gigId || (payload.gigId ? String(payload.gigId) : null),
            aiGenerated: true,
          },
        });
        createdEntity = { type: "Task", id: task.id };
        break;
      }
      case "ContentItem": {
        const content = await db.contentItem.create({
          data: {
            title: String(payload.title || "Bez názvu"),
            slug: String(payload.slug || `draft-${Date.now()}`),
            type: String(payload.type || "blog"),
            status: "draft",
            body: String(payload.body || ""),
            excerpt: payload.excerpt ? String(payload.excerpt) : null,
            aiGenerated: true,
          },
        });
        createdEntity = { type: "ContentItem", id: content.id };
        break;
      }
      case "Contact": {
        const contact = await db.contact.create({
          data: {
            name: String(payload.name || ""),
            email: String(payload.email || ""),
            phone: payload.phone ? String(payload.phone) : null,
            type: String(payload.type || "fan"),
            organization: payload.organization ? String(payload.organization) : null,
            city: payload.city ? String(payload.city) : null,
            notes: payload.notes ? String(payload.notes) : null,
            aiScore: Number(payload.aiScore) || 0,
            status: "active",
          },
        });
        createdEntity = { type: "Contact", id: contact.id };
        break;
      }
      default:
        // Pre iné entityTypes len označ ako approved (custom akcie sa riešia manuálne)
        createdEntity = { type: item.entityType };
    }

    // Označ návrh ako approved
    await db.approvalQueue.update({
      where: { id },
      data: {
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Log automation
    await db.automationLog.create({
      data: {
        agentType: item.agentType,
        trigger: "approval",
        input: `Approved ${item.entityType} (${item.action})`,
        output: `Created: ${createdEntity.type}${createdEntity.id ? ` #${createdEntity.id}` : ""}`,
        status: "success",
      },
    });

    return NextResponse.json({ ok: true, createdEntity });
  } catch (err) {
    console.error("[approvals approve]", err);
    return NextResponse.json({ error: "Schválenie zlyhalo." }, { status: 500 });
  }
}
