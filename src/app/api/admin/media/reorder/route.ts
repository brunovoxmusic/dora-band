import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Reorder media items — accepts an array of {id, order} pairs and updates each.
 * Used by the drag-and-drop interface in the admin media tab.
 */
export async function PATCH(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const { items } = await req.json().catch(() => ({}));
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Pole items je povinné." }, { status: 422 });
    }

    // Update each item's order in a transaction
    await db.$transaction(
      items.map((it: { id: string; order: number }) =>
        db.mediaItem.update({
          where: { id: it.id },
          data: { order: it.order },
        })
      )
    );

    return NextResponse.json({ ok: true, updated: items.length });
  } catch (err) {
    console.error("[media/reorder] error:", err);
    return NextResponse.json({ error: "Serverová chyba pri zmene poradia." }, { status: 500 });
  }
}
