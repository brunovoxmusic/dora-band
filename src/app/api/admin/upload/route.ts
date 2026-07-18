import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = (form.get("title") as string | null) || "Nahratý obrázok";
    const category = (form.get("category") as string | null) || "concert";
    const credits = (form.get("credits") as string | null) || "Foto: archív D.O.R.A.";

    if (!file) return NextResponse.json({ error: "Žiadny súbor." }, { status: 422 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Nepodporovaný formát. Povolené: JPEG, PNG, WebP, GIF." }, { status: 422 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Súbor je príliš veľký (max 8 MB)." }, { status: 422 });
    }

    // Generate a safe filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, safeName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/${safeName}`;

    // Create a MediaItem record so it appears in the admin media list + public gallery
    const item = await db.mediaItem.create({
      data: {
        title: title.trim() || "Nahratý obrázok",
        url,
        thumbnailUrl: url, // same as url; could add sharp processing later
        category,
        credits,
        featured: false,
      },
    });

    return NextResponse.json({ ok: true, item, url }, { status: 201 });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Serverová chyba pri nahrávaní." }, { status: 500 });
  }
}
