import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { CookieConsent } from "@/components/site/cookie-consent";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { SectionDivider } from "@/components/site/section-divider";
import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { MembersSection } from "@/components/sections/members-section";
import { MusicSection } from "@/components/sections/music-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { DiscographySection } from "@/components/sections/discography-section";
import { GigsSection } from "@/components/sections/gigs-section";
import { SetlistSection } from "@/components/sections/setlist-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { PressSection } from "@/components/sections/press-section";
import { NewsletterSection } from "@/components/sections/newsletter-section";
import { SocialSection } from "@/components/sections/social-section";
import { FaqSection } from "@/components/sections/faq-section";
import { ContactSection } from "@/components/sections/contact-section";
import { getContentMap } from "@/lib/content";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch CMS-editable content (falls back to defaults if not in DB)
  const [c, heroSlides] = await Promise.all([
    getContentMap([
      "hero.eyebrow", "hero.title", "hero.subtitle", "hero.tagline",
      "hero.ctaPrimary", "hero.ctaSecondary", "hero.statusPill",
      "band.bioLong",
      "contact.email", "contact.phone",
      "social.facebook", "social.instagram", "social.youtube", "social.spotify", "social.bandcamp",
      "footer.copyright", "footer.tagline",
    ]),
    db.mediaItem.findMany({
      where: { heroBackground: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, url: true, altText: true, title: true },
      take: 20,
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <a href="#hlavny-obsah" className="skip-link">
        Preskočiť na obsah
      </a>
      <ScrollProgress />
      <Navbar />
      <main id="hlavny-obsah" className="flex-1">
        <HeroSection content={c} heroSlides={heroSlides} />
        <SectionDivider />
        <AboutSection bioLong={c["band.bioLong"]} />
        <SectionDivider />
        <MembersSection />
        <MusicSection />
        <SectionDivider />
        <GallerySection />
        <SectionDivider />
        <DiscographySection />
        <GigsSection />
        <SetlistSection />
        <SectionDivider />
        <TestimonialsSection />
        <SectionDivider />
        <PressSection />
        <FaqSection />
        <SectionDivider />
        <SocialSection content={c} />
        <NewsletterSection />
        <ContactSection content={c} />
      </main>
      <Footer content={c} />
      <BackToTop />
      <CookieConsent />
    </div>
  );
}
