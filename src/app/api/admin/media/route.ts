import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function guard(req: NextRequest) {
  return !!(await getSession(req));
}

export async function GET(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const fileType = searchParams.get("fileType");
  const category = searchParams.get("category");
  const where: Record<string, unknown> = {};
  if (fileType && fileType !== "all") where.fileType = fileType;
  if (category && category !== "all") where.category = category;
  const items = await db.mediaItem.findMany({ where, orderBy: [{ order: "asc" }, { createdAt: "desc" }], take: 200 });
  return NextResponse.json({
    items: items.map(i => ({
      ...i,
      linkedSections: typeof i.linkedSections === "string" ? JSON.parse(i.linkedSections || "[]") : i.linkedSections || [],
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const { title, url, thumbnailUrl, category, caption, altText, credits, featured, fileType, linkedSections, fileSize, fileName } = b;
    if (!title || !url) {
      return NextResponse.json({ error: "title a url sú povinné." }, { status: 422 });
    }
    // Auto-detect fileType z URL ak nie je zadaný
    const detectedType = fileType || detectFileType(url);
    const item = await db.mediaItem.create({
      data: {
        title,
        url,
        thumbnailUrl: thumbnailUrl || null,
        category: category || "concert",
        fileType: detectedType,
        caption: caption || null,
        altText: altText || null,
        credits: credits || "Foto: archív D.O.R.A.",
        linkedSections: JSON.stringify(linkedSections || []),
        fileSize: fileSize || null,
        fileName: fileName || null,
        featured: !!featured,
        order: 0,
      },
    });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[admin/media POST]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}

/** Auto-detekcia typu súboru z URL/koncovky */
function detectFileType(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp"].includes(ext)) return "image";
  if (ext === "svg") return "svg";
  if (ext === "pdf") return "pdf";
  if (["md", "markdown"].includes(ext)) return "markdown";
  if (["txt", "text"].includes(ext)) return "text";
  if (["doc", "docx"].includes(ext)) return "document";
  if (["zip", "rar", "7z"].includes(ext)) return "archive";
  return "other";
}
