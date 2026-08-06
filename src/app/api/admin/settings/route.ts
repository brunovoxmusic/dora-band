import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllSettings, isKnownSettingsKey, invalidateContentCache } from "@/lib/content";
import { db } from "@/lib/db";

/** GET — return all settings.* entries (defaults + DB overrides). */
export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await getAllSettings();
  return NextResponse.json({ items });
}

/**
 * PUT — bulk-upsert settings values.
 * Body: { items: [{ key, value }] } — only settings.* keys are accepted.
 */
export async function PUT(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const { items } = await req.json().catch(() => ({}));
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items pole je povinné." }, { status: 422 });
    }

    // Whitelist: only known settings.* keys.
    const valid = items.filter(
      (it: { key?: string; value?: string }) =>
        typeof it?.key === "string" && isKnownSettingsKey(it.key)
    );

    for (const it of valid) {
      await db.siteContent.upsert({
        where: { key: it.key },
        create: {
          key: it.key,
          value: String(it.value ?? ""),
          category: "settings",
        },
        update: { value: String(it.value ?? "") },
      });
    }

    invalidateContentCache();
    return NextResponse.json({ ok: true, updated: valid.length });
  } catch (err) {
    console.error("[settings PUT]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
