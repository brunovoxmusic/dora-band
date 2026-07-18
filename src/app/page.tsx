import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { MembersSection } from "@/components/sections/members-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { DiscographySection } from "@/components/sections/discography-section";
import { GigsSection } from "@/components/sections/gigs-section";
import { PressSection } from "@/components/sections/press-section";
import { ContactSection } from "@/components/sections/contact-section";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <MembersSection />
        <GallerySection />
        <DiscographySection />
        <GigsSection />
        <PressSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
