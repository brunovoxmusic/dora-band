import type { Metadata } from "next";
import { Montserrat, Roboto_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

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

export const metadata: Metadata = {
  title: "D.O.R.A. — Dnes Od Rána Abstinujem | Funky-Punk z Púchova",
  description:
    "Legendárna funky-punková formácia D.O.R.A. z Púchova. Aktívna od 1996. Booking, PR materiály, diskografia, fotky a kontakt pre médiá a partnerov.",
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
  ],
  authors: [{ name: "D.O.R.A." }],
  openGraph: {
    title: "D.O.R.A. — Dnes Od Rána Abstinujem",
    description: "Legendárna funky-punková formácia z Púchova. Aktívna od 1996.",
    type: "website",
    locale: "sk_SK",
  },
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
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
