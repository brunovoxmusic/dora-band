import type { MetadataRoute } from "next";

const SITE_URL = "https://dora.band";

export default function sitemap(): MetadataRoute.Sitemap {
  const sections = [
    "",
    "#o-kapele",
    "#clenovia",
    "#hudba",
    "#galeria",
    "#diskografia",
    "#faq",
    "#press",
    "#kontakt",
  ];

  return sections.map((section) => ({
    url: `${SITE_URL}/${section}`,
    lastModified: new Date(),
    changeFrequency: section === "" ? ("weekly" as const) : ("monthly" as const),
    priority: section === "" ? 1 : 0.8,
  }));
}
