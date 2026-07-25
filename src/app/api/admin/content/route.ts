import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllContent, CONTENT_DEFAULTS, invalidateContentCache } from "@/lib/content";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await getAllContent();
  return NextResponse.json({ items });
}

/** Bulk-upsert content values. Body: { items: [{key, value}] } */
export async function PUT(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const { items } = await req.json().catch(() => ({}));
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items pole je povinné." }, { status: 422 });
    }

    const valid = items.filter((it: { key?: string; value?: string }) =>
      it.key && typeof it.key === "string" && it.key in CONTENT_DEFAULTS
    );

    for (const it of valid) {
      await db.siteContent.upsert({
        where: { key: it.key },
        create: {
          key: it.key,
          value: String(it.value ?? ""),
          category: CONTENT_DEFAULTS[it.key].category,
        },
        update: { value: String(it.value ?? "") },
      });
    }

    invalidateContentCache();
    return NextResponse.json({ ok: true, updated: valid.length });
  } catch (err) {
    console.error("[content PUT]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}

// db import — placed at bottom to avoid circular import surface
import { db } from "@/lib/db";
