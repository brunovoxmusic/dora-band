import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { CookieConsent } from "@/components/site/cookie-consent";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { SectionDivider } from "@/components/site/section-divider";
import { HeroSection } from "@/components/sections/hero-section";
import { StatsSection } from "@/components/sections/stats-section";
import { AboutSection } from "@/components/sections/about-section";
import { MembersSection } from "@/components/sections/members-section";
import { MusicSection } from "@/components/sections/music-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { DiscographySection } from "@/components/sections/discography-section";
import { GigsSection } from "@/components/sections/gigs-section";
import { SetlistSection } from "@/components/sections/setlist-section";
import { MerchSection } from "@/components/sections/merch-section";
import { BlogSection } from "@/components/sections/blog-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { PressSection } from "@/components/sections/press-section";
import { NewsletterSection } from "@/components/sections/newsletter-section";
import { SocialSection } from "@/components/sections/social-section";
import { FaqSection } from "@/components/sections/faq-section";
import { ContactSection } from "@/components/sections/contact-section";
import { SiteBanner, type BannerConfig } from "@/components/site/site-banner";
import { MaintenanceScreen } from "@/components/site/maintenance-screen";
import { getContentMap, CONTENT_DEFAULTS } from "@/lib/content";
import { db } from "@/lib/db";
import { getAllSettingsStructured } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// Type for hero slide images
type HeroSlide = {
  id: string;
  url: string;
  altText: string | null;
  title: string;
};

export default async function HomePage() {
  // Fetch CMS-editable content + hero slides + site settings.
  // Wrapped in try/catch so the page renders even if the database is not yet
  // initialized (e.g. first Vercel deploy before db:push/seed).
  let c: Record<string, string> = {};
  let heroSlides: HeroSlide[] = [];
  let settings: Awaited<ReturnType<typeof getAllSettingsStructured>> | null = null;
  let isAdmin = false;

  try {
    const contentKeys = [
      "hero.eyebrow", "hero.title", "hero.subtitle", "hero.tagline",
      "hero.ctaPrimary", "hero.ctaSecondary", "hero.statusPill",
      "band.bioLong",
      "contact.email", "contact.phone",
      "social.facebook", "social.instagram", "social.youtube", "social.spotify", "social.bandcamp",
      "footer.copyright", "footer.tagline",
    ];

    // Fill with defaults first (guarantees content even if DB is empty)
    for (const key of contentKeys) {
      if (key in CONTENT_DEFAULTS) {
        c[key] = CONTENT_DEFAULTS[key].value;
      }
    }

    // Then try to fetch DB overrides
    try {
      const dbContent = await getContentMap(contentKeys);
      c = { ...c, ...dbContent };
    } catch (e) {
      console.warn("[homepage] CMS content fetch failed, using defaults:", e instanceof Error ? e.message : e);
    }

    // Try to fetch hero background slides
    try {
      heroSlides = await db.mediaItem.findMany({
        where: { heroBackground: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, url: true, altText: true, title: true },
        take: 20,
      });
      console.log("[homepage] Hero slides fetched:", heroSlides.length, heroSlides.map(s => s.url.slice(-30)));
    } catch (e) {
      console.warn("[homepage] Hero slides fetch failed, using static fallback:", e instanceof Error ? e.message : e);
    }

    // Try to fetch site settings (maintenance, banner, sections)
    try {
      settings = await getAllSettingsStructured();
    } catch (e) {
      console.warn("[homepage] Settings fetch failed:", e instanceof Error ? e.message : e);
    }

    // Check admin session (allows bypass of maintenance mode)
    try {
      const h = await headers();
      const req = { headers: h } as unknown as Request;
      const session = await getSession(req);
      if (session) isAdmin = true;
    } catch (e) {
      console.warn("[homepage] Session check failed:", e instanceof Error ? e.message : e);
    }
  } catch (err) {
    console.error("[homepage] Unexpected error, rendering with defaults:", err);
  }

  // === MAINTENANCE MODE CHECK ===
  // Render maintenance screen if:
  //  - maintenance.isActive is true, AND
  //  - viewer is not admin (or admin bypass is disabled)
  //  - URL doesn't have ?preview=1 (allows admin to preview normal page)
  const previewOverride = false; // would need searchParams — handled by middleware later

  if (
    settings?.maintenance.isActive &&
    !previewOverride &&
    !(isAdmin && settings.maintenance.allowAdminBypass)
  ) {
    return (
      <MaintenanceScreen
        maintenance={settings.maintenance}
        adminBypass={isAdmin}
        now={new Date()}
      />
    );
  }

  // Admin previewing maintenance mode: show normal page + a sticky warning
  const showMaintenanceBadge =
    settings?.maintenance.isActive && isAdmin && settings.maintenance.allowAdminBypass;

  // Build banner config (server-side — passed as prop to client component)
  const banner: BannerConfig = settings
    ? {
        isActive: settings.banner.isActive,
        message: settings.banner.message,
        type: settings.banner.type,
        dismissible: settings.banner.dismissible,
        link: settings.banner.link,
        linkLabel: settings.banner.linkLabel,
      }
    : { isActive: false, message: "", type: "info", dismissible: true, link: "", linkLabel: "" };

  // Section visibility
  const vis = settings?.sections ?? null;
  const showSection = (id: keyof NonNullable<typeof vis>): boolean => vis ? vis[id] : true;

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <a href="#hlavny-obsah" className="skip-link">
        Preskočiť na obsah
      </a>
      <ScrollProgress />
      {/* Banner is fixed at top — when active, navbar should still render
          underneath. The SiteBanner component is fixed and z-55; navbar z-50.
          Both are visible simultaneously when banner is short. */}
      <SiteBanner banner={banner} />
      {/* Banner is fixed top-0 z-55 (~40px tall when active). When active,
          push the navbar down by 40px so they stack cleanly. */}
      <Navbar bannerOffset={banner.isActive ? 40 : 0} />

      {/* Admin preview badge while maintenance is on */}
      {showMaintenanceBadge && (
        <div className="fixed bottom-4 right-4 z-[70] inline-flex items-center gap-2 border border-warm-yellow bg-warm-yellow/10 px-3 py-2 backdrop-blur-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-warm-yellow" />
          <span className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
            Údržba aktívna — vy vidíte web ako admin
          </span>
        </div>
      )}

      <main id="hlavny-obsah" className="flex-1">
        {showSection("hero") && (
          <>
            <HeroSection content={c} heroSlides={heroSlides} />
            <SectionDivider />
          </>
        )}
        {showSection("stats") && <StatsSection />}
        {showSection("about") && (
          <>
            <AboutSection bioLong={c["band.bioLong"]} />
            <SectionDivider />
          </>
        )}
        {showSection("members") && <MembersSection />}
        {showSection("music") && <MusicSection />}
        {showSection("gigs") && <GigsSection />}
        {showSection("setlist") && <SetlistSection />}
        {showSection("gallery") && (
          <>
            <SectionDivider />
            <GallerySection />
            <SectionDivider />
          </>
        )}
        {showSection("discography") && <DiscographySection />}
        {showSection("merch") && <MerchSection />}
        {showSection("blog") && <BlogSection />}
        {/* TODO(DORA): Sekcia „Recenzie & referencie“ je DOČASNE SKRYTÁ. */}
        {/* {showSection("testimonials") && (
          <>
            <SectionDivider />
            <TestimonialsSection />
            <SectionDivider />
          </>
        )} */}
        {showSection("press") && <PressSection />}
        {showSection("faq") && <FaqSection />}
        {showSection("social") && (
          <>
            <SectionDivider />
            <SocialSection content={c} />
          </>
        )}
        {showSection("newsletter") && <NewsletterSection />}
        {showSection("contact") && <ContactSection content={c} />}
      </main>
      <Footer content={c} />
      <BackToTop />
      <CookieConsent />
    </div>
  );
}
