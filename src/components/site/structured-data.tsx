import { BAND, MEMBERS, DISCOGRAPHY, GENRES, FAQS, TRACKS } from "@/lib/band-data";
import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dora.band";

/**
 * JSON-LD structured data for SEO.
 *
 * P0-10: Added MusicEvent schema for upcoming concerts.
 * Also added MusicRecording + FAQPage schemas.
 *
 * This is a SERVER component — fetches gigs from DB at render time.
 */
export async function StructuredData() {
  // Fetch upcoming gigs from DB (graceful fallback if DB unavailable)
  let upcomingGigs: Array<{
    id: string;
    title: string;
    date: Date;
    venue: string;
    city: string;
    country: string;
    ticketUrl: string | null;
    ticketPrice: string | null;
  }> = [];
  try {
    upcomingGigs = await db.gig.findMany({
      where: { status: "upcoming", date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 20,
      select: { id: true, title: true, date: true, venue: true, city: true, country: true, ticketUrl: true, ticketPrice: true },
    });
  } catch {
    // DB unavailable — skip MusicEvent schema
  }

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
    track: TRACKS.map((t) => ({
      "@type": "MusicRecording",
      name: t.title,
      duration: t.duration,
      byArtist: { "@type": "MusicGroup", name: "D.O.R.A." },
      inAlbum: {
        "@type": "MusicAlbum",
        name: t.release,
      },
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

  // P0-10: MusicEvent schema for each upcoming concert
  const musicEvents = upcomingGigs.map((gig) => ({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: gig.title,
    startDate: gig.date.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: gig.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: gig.city,
        addressCountry: gig.country,
      },
    },
    performer: {
      "@type": "MusicGroup",
      name: "D.O.R.A.",
      sameAs: SITE_URL,
    },
    organizer: {
      "@type": "Organization",
      name: "D.O.R.A.",
      email: BAND.contact.email,
    },
    ...(gig.ticketUrl && gig.ticketUrl !== "#contact"
      ? { offers: { "@type": "Offer", url: gig.ticketUrl, availability: "https://schema.org/InStock" } }
      : {}),
    ...(gig.ticketPrice
      ? { offers: { "@type": "Offer", price: gig.ticketPrice, availability: "https://schema.org/InStock" } }
      : {}),
  }));

  // FAQPage schema
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.filter((f) => f.a && !f.a.includes("[DOPLNI")).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
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
      {musicEvents.map((event, i) => (
        <script
          key={`event-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(event) }}
        />
      ))}
      {faqPage.mainEntity.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
        />
      )}
    </>
  );
}
