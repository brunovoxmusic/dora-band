import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Music2 } from "lucide-react";
import { BAND } from "@/lib/band-data";

export function Footer({ content }: { content?: Record<string, string> }) {
  const c = content ?? {};
  const email = c["contact.email"] || email;
  const phone = c["contact.phone"] || phone;
  const phoneHref = phone.replace(/[\s\/]/g, "");
  const copyright = (c["footer.copyright"] || "© {year} D.O.R.A. — Dnes Od Rána Abstinujem. Všetky práva vyhradené.").replace("{year}", String(new Date().getFullYear()));
  const tagline = c["footer.tagline"] || "Funky-Punk · Púchov, Slovenská republika";
  const social = {
    facebook: c["social.facebook"] || social.facebook,
    instagram: c["social.instagram"] || social.instagram,
    youtube: c["social.youtube"] || social.youtube,
    spotify: c["social.spotify"] || social.spotify,
  };
  return (
    <footer className="mt-auto border-t border-charcoal bg-ink bg-noise">
      {/* Top ticker / marquee */}
      <div className="overflow-hidden border-b border-charcoal/60 bg-dark-gray py-3">
        <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex items-center gap-8">
              {["FUNKY-PUNK", "PÚCHOV · SK", "OD 1996", "LIVE ON STAGE", "BOOKING OPEN", "DNES OD RÁNA ABSTINUJEM"].map(
                (t, i) => (
                  <span key={`${dup}-${i}`} className="flex items-center gap-8">
                    <span className="font-mono-brand text-xs uppercase tracking-[0.3em] text-silver/70">{t}</span>
                    <span className="h-1 w-1 rounded-full bg-neon-red" />
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <img src="/dora-mark.svg" alt="" className="h-10 w-10" />
              <div>
                <p className="font-display text-xl font-extrabold text-neon-red">D.O.R.A.</p>
                <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                  Dnes Od Rána Abstinujem
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm text-off-white/60">
              Legendárna funky-punková formácia z Púchova. Aktívna od roku {BAND.founded}. Energické koncerty,
              autentický zvuk, spoločensky angažované texty.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Facebook, href: social.facebook, label: "Facebook" },
                { Icon: Instagram, href: social.instagram, label: "Instagram" },
                { Icon: Youtube, href: social.youtube, label: "YouTube" },
                { Icon: Music2, href: social.spotify, label: "Spotify" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center border border-charcoal text-silver transition-all hover:border-neon-red hover:text-neon-red hover:-translate-y-0.5"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">{"// Kontakt"}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="group flex items-center gap-3 text-off-white/80 transition-colors hover:text-neon-red"
                >
                  <Mail className="h-4 w-4 text-neon-red" />
                  <span className="break-all">{email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${phoneHref}`}
                  className="group flex items-center gap-3 text-off-white/80 transition-colors hover:text-neon-red"
                >
                  <Phone className="h-4 w-4 text-neon-red" />
                  <span>{phone}</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-off-white/80">
                <MapPin className="h-4 w-4 text-neon-red" />
                <span>Púchov, Slovenská republika</span>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <p className="font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">{"// Pre partnerov"}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { href: "#press", label: "PR materiály na stiahnutie" },
                { href: "#diskografia", label: "Diskografia & žánre" },
                { href: "#galeria", label: "Fotoportfólio" },
                { href: "/admin/login", label: "Admin prihlásenie" },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-off-white/70 transition-colors hover:text-warm-yellow hover:underline underline-offset-4"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-charcoal pt-6 text-xs text-silver/60 sm:flex-row sm:items-center">
          <p>{copyright}</p>
          <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em]">{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
