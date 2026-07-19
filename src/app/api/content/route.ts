import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/content";

/** Public read-only content endpoint (only returns SEO-safe keys). */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key) {
    return NextResponse.json({ key, value: await getContent(key) });
  }
  return NextResponse.json({ error: "Zadajte ?key=" }, { status: 422 });
}
