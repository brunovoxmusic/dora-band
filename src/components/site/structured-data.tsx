import { BAND, MEMBERS, DISCOGRAPHY, GENRES } from "@/lib/band-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dora.band";

/**
 * JSON-LD structured data for SEO — helps Google understand this is a music band.
 * Emits MusicGroup (with members, albums, genres) + WebSite schemas.
 */
export function StructuredData() {
  const musicGroup = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: "D.O.R.A.",
    alternateName: "Dnes Od Rána Abstinujem",
    description: BAND.bio,
    url: SITE_URL,
    image: `${SITE_URL}/gallery/hero-banner.jpg`,
    logo: `${SITE_URL}/dora-logo.svg`,
    foundingDate: "1996",
    foundingLocation: {
      "@type": "Place",
      name: "Púchov",
      address: {
        "@type": "PostalAddress",
        addressCountry: "SK",
        addressRegion: "Trenčín Region",
      },
    },
    genre: GENRES.map((g) => g.value),
    member: MEMBERS.map((m) => ({
      "@type": "OrganizationRole",
      member: {
        "@type": "Person",
        name: m.name,
      },
      roleName: m.role,
      startDate: m.since !== "—" ? m.since : undefined,
    })),
    album: DISCOGRAPHY.map((r) => ({
      "@type": "MusicAlbum",
      name: r.title,
      datePublished: r.year,
      inLanguage: r.language === "Slovenčina" ? "sk" : "en",
    })),
    contactPoint: {
      "@type": "ContactPoint",
      email: BAND.contact.email,
      telephone: BAND.contact.phoneHref,
      contactType: "booking",
      areaServed: "SK",
      availableLanguage: ["Slovak", "Czech", "English"],
    },
    sameAs: [
      BAND.social.facebook,
      BAND.social.instagram,
      BAND.social.youtube,
      // TODO(DORA): Pridať reálny Spotify URL po overení — pozri band-data.ts
      ...(BAND.social.spotify ? [BAND.social.spotify] : []),
    ].filter(Boolean),
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "D.O.R.A. — Dnes Od Rána Abstinujem",
    url: SITE_URL,
    inLanguage: "sk-SK",
    publisher: {
      "@type": "MusicGroup",
      name: "D.O.R.A.",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicGroup) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }}
      />
    </>
  );
}
