import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { CookieConsent } from "@/components/site/cookie-consent";
import { SectionDivider } from "@/components/site/section-divider";
import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { MembersSection } from "@/components/sections/members-section";
import { MusicSection } from "@/components/sections/music-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { DiscographySection } from "@/components/sections/discography-section";
import { GigsSection } from "@/components/sections/gigs-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { PressSection } from "@/components/sections/press-section";
import { NewsletterSection } from "@/components/sections/newsletter-section";
import { FaqSection } from "@/components/sections/faq-section";
import { ContactSection } from "@/components/sections/contact-section";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <SectionDivider />
        <AboutSection />
        <SectionDivider />
        <MembersSection />
        <MusicSection />
        <SectionDivider />
        <GallerySection />
        <SectionDivider />
        <DiscographySection />
        <GigsSection />
        <SectionDivider />
        <TestimonialsSection />
        <SectionDivider />
        <PressSection />
        <FaqSection />
        <SectionDivider />
        <NewsletterSection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
      <CookieConsent />
    </div>
  );
}
