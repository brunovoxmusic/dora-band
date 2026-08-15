import type { Metadata } from "next";
import { Montserrat, Roboto_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { StructuredData } from "@/components/site/structured-data";
import { MusicPlayerProvider } from "@/lib/music-player-context";
import { StickyMusicPlayer } from "@/components/site/sticky-music-player";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dora.band";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "D.O.R.A. — Dnes Od Rána Abstinujem | Funky-Punk z Púchova",
    template: "%s | D.O.R.A.",
  },
  description:
    "Legendárna funky-punková formácia D.O.R.A. z Púchova. Na scéne od roku 1996 — tri desaťročia autentickej, energickej a spoločensky angažovanej hudby. Booking, PR materiály, diskografia, fotky a kontakt pre médiá a partnerov.",
  keywords: [
    "D.O.R.A.",
    "Dnes Od Rána Abstinujem",
    "funky-punk",
    "Púchov",
    "slovenský punk",
    "crossover",
    "kapela",
    "booking",
    "koncert",
    "Slovensko",
    "punk rock",
    "rap-rock",
  ],
  authors: [{ name: "D.O.R.A." }],
  creator: "D.O.R.A.",
  publisher: "D.O.R.A.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "D.O.R.A. — Dnes Od Rána Abstinujem",
    description: "Legendárna funky-punková formácia z Púchova. Na scéne od roku 1996 — tri desaťročia autentickej, energickej a spoločensky angažovanej hudby. Booking, PR materiály, diskografia, fotky.",
    type: "website",
    locale: "sk_SK",
    siteName: "D.O.R.A.",
    url: SITE_URL,
    images: [
      {
        url: "/gallery/hero-banner.jpg",
        width: 1920,
        height: 1080,
        alt: "D.O.R.A. naživo na koncertnom pódiu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "D.O.R.A. — Dnes Od Rána Abstinujem",
    description: "Legendárna funky-punková formácia z Púchova. Na scéne od roku 1996 — tri desaťročia autentickej, energickej a spoločensky angažovanej hudby.",
    images: ["/gallery/hero-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" suppressHydrationWarning className="dark">
      <body
        className={`${montserrat.variable} ${robotoCondensed.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <StructuredData />
        <MusicPlayerProvider>
          {children}
          <StickyMusicPlayer />
        </MusicPlayerProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
