import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

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

    // Generate safe filenames
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fullExt = "jpg";
    const thumbExt = "jpg";
    const fullName = `upload-${stamp}.${fullExt}`;
    const thumbName = `upload-${stamp}-thumb.${thumbExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize full image: max 1920px wide, JPEG quality 85
    const fullPath = path.join(uploadDir, fullName);
    await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toFile(fullPath);

    // Generate thumbnail: 600x600 cover, JPEG quality 75
    const thumbPath = path.join(uploadDir, thumbName);
    await sharp(buffer)
      .resize({ width: 600, height: 600, fit: "cover", position: "centre" })
      .jpeg({ quality: 75, progressive: true })
      .toFile(thumbPath);

    const url = `/uploads/${fullName}`;
    const thumbnailUrl = `/uploads/${thumbName}`;

    // Compute next order value for this category (append to end)
    const lastInCategory = await db.mediaItem.findFirst({
      where: { category },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastInCategory?.order ?? 0) + 1;

    const item = await db.mediaItem.create({
      data: {
        title: title.trim() || "Nahratý obrázok",
        url,
        thumbnailUrl,
        category,
        credits,
        featured: false,
        order: nextOrder,
      },
    });

    return NextResponse.json({ ok: true, item, url, thumbnailUrl }, { status: 201 });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Serverová chyba pri nahrávaní." }, { status: 500 });
  }
}
