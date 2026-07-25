import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import sharp from "sharp";
import { put } from "@vercel/blob";

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
    const altText = (form.get("altText") as string | null) || null;

    if (!file) return NextResponse.json({ error: "Žiadny súbor." }, { status: 422 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Nepodporovaný formát. Povolené: JPEG, PNG, WebP, GIF." }, { status: 422 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Súbor je príliš veľký (max 8 MB)." }, { status: 422 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize full image: max 1920px wide, JPEG quality 85
    const fullBuffer = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    // Generate thumbnail: 600x600 cover, JPEG quality 75
    const thumbBuffer = await sharp(buffer)
      .resize({ width: 600, height: 600, fit: "cover", position: "centre" })
      .jpeg({ quality: 75, progressive: true })
      .toBuffer();

    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fullName = `uploads/upload-${stamp}.jpg`;
    const thumbName = `uploads/upload-${stamp}-thumb.jpg`;

    // Upload to Vercel Blob (if token available) or fall back to local disk (dev)
    let url: string;
    let thumbnailUrl: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production: Vercel Blob
      const [fullBlob, thumbBlob] = await Promise.all([
        put(fullName, fullBuffer, { access: "public", contentType: "image/jpeg" }),
        put(thumbName, thumbBuffer, { access: "public", contentType: "image/jpeg" }),
      ]);
      url = fullBlob.url;
      thumbnailUrl = thumbBlob.url;
    } else {
      // Dev fallback: local filesystem
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, `upload-${stamp}.jpg`), fullBuffer);
      await writeFile(path.join(uploadDir, `upload-${stamp}-thumb.jpg`), thumbBuffer);
      url = `/uploads/upload-${stamp}.jpg`;
      thumbnailUrl = `/uploads/upload-${stamp}-thumb.jpg`;
    }

    // Compute next order value for this category
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
        altText: altText?.trim() || null,
        featured: false,
        heroBackground: false,
        order: nextOrder,
      },
    });

    return NextResponse.json({ ok: true, item, url, thumbnailUrl }, { status: 201 });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Serverová chyba pri nahrávaní." }, { status: 500 });
  }
}
