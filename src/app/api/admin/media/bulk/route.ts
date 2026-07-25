import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Bulk actions on media items — feature/unfeature/heroBackground/heroUnset/delete multiple at once.
 * Body: { action: "feature" | "unfeature" | "heroBackground" | "heroUnset" | "delete", ids: string[] }
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const { action, ids } = await req.json().catch(() => ({}));
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids pole je povinné." }, { status: 422 });
    }
    if (!["feature", "unfeature", "heroBackground", "heroUnset", "delete"].includes(action)) {
      return NextResponse.json({ error: "Neplatná akcia." }, { status: 422 });
    }

    if (action === "delete") {
      const result = await db.mediaItem.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ ok: true, affected: result.count });
    }

    if (action === "feature" || action === "unfeature") {
      const result = await db.mediaItem.updateMany({
        where: { id: { in: ids } },
        data: { featured: action === "feature" },
      });
      return NextResponse.json({ ok: true, affected: result.count });
    }

    // heroBackground / heroUnset
    const result = await db.mediaItem.updateMany({
      where: { id: { in: ids } },
      data: { heroBackground: action === "heroBackground" },
    });
    return NextResponse.json({ ok: true, affected: result.count });
  } catch (err) {
    console.error("[media/bulk] error:", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
