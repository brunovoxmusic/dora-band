import { NextResponse } from "next/server";
import { getAllSettingsStructured } from "@/lib/settings";

/**
 * Public settings endpoint — returns only what the public frontend needs:
 * banner state + section visibility map. Maintenance state is checked
 * server-side in page.tsx (and bypassed for admins).
 */
export async function GET() {
  try {
    const s = await getAllSettingsStructured();
    return NextResponse.json({
      banner: {
        isActive: s.banner.isActive,
        message: s.banner.message,
        type: s.banner.type,
        dismissible: s.banner.dismissible,
        link: s.banner.link,
        linkLabel: s.banner.linkLabel,
      },
      sections: s.sections,
      site: s.site,
    });
  } catch (err) {
    console.error("[/api/settings GET]", err);
    // Fail safe: no banner, all sections visible.
    return NextResponse.json({
      banner: { isActive: false, message: "", type: "info", dismissible: true, link: "", linkLabel: "" },
      sections: {},
      site: { language: "sk", timezone: "Europe/Bratislava" },
    });
  }
}
