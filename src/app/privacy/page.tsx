import { Metadata } from "next";
import { BAND } from "@/lib/band-data";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { BackToTop } from "@/components/site/back-to-top";
import { ScrollProgress } from "@/components/site/scroll-progress";

export const metadata: Metadata = {
  title: `Ochrana osobných údajov — ${BAND.name}`,
  description: "Privacy Policy, Cookie Policy a Impressum pre webové stránky kapely D.O.R.A.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const bandLocation = BAND.origin || "Púchov, Slovenská republika";
  const responsiblePerson = "Branislav Guzma — líder kapely";
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main className="min-h-screen bg-dark-gray pt-24 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <article className="prose prose-invert prose-sm sm:prose-base max-w-none">
            <header className="mb-12 border-b border-charcoal pb-8">
              <p className="font-mono-brand text-xs uppercase tracking-[0.3em] text-neon-red mb-2">
                Právne informácie
              </p>
              <h1 className="text-4xl sm:text-5xl font-display font-black uppercase tracking-tight text-white">
                Ochrana osobných údajov
              </h1>
              <p className="text-silver mt-3 text-sm">
                Platnosť od: august 2026 · Posledná aktualizácia: 19. augusta 2026
              </p>
            </header>

            {/* GDPR Privacy Policy */}
            <section className="mb-10">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                1. Privacy Policy
              </h2>
              <div className="space-y-4 text-silver leading-relaxed text-sm">
                <p>
                  Kapela <strong className="text-white">{BAND.name}</strong> ({BAND.tagline}, sídlo: {bandLocation}) spracováva osobné údaje v zhode s nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov.
                </p>
                <h3 className="text-white font-semibold mt-6 mb-2">1.1 Aké údaje spracovávame</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Meno a priezvisko</strong> — z booking formulára</li>
                  <li><strong>E-mailová adresa</strong> — z booking formulára a newslettera</li>
                  <li><strong>Telefónne číslo</strong> — z booking formulára</li>
                  <li><strong>IP adresa</strong> — pre bezpečnostné účely (rate limiting, anti-spam)</li>
                  <li><strong>Technické údaje</strong> — cookies (viď sekcia 2)</li>
                </ul>
                <h3 className="text-white font-semibold mt-6 mb-2">1.2 Účel spracovania</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Vybavenie bookingových požiadaviek (zmluvný záujem, čl. 6 ods. 1 písm. b GDPR)</li>
                  <li>Newsletter — odosielanie informácií o koncertoch (súhlas, odhlásiteľný kedykoľvek)</li>
                  <li>Ochrana pred spamom a zneužitím (oprávnený záujem, čl. 6 ods. 1 písm. f GDPR)</li>
                  <li>Analýza návštevnosti (súhlas cez cookie banner)</li>
                </ul>
                <h3 className="text-white font-semibold mt-6 mb-2">1.3 Doba uchovávania</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Bookingové dopyty: 24 mesiacov po poslednom kontakte</li>
                  <li>Newsletter odberatelia: do odhlásenia</li>
                  <li>Logy (IP adresa): 30 dní</li>
                  <li>Cookies: podľa typu (viď sekcia 2)</li>
                </ul>
                <h3 className="text-white font-semibold mt-6 mb-2">1.4 Vaše práva</h3>
                <p>Máte právo na:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Prístup k osobným údajom (kópia)</li>
                  <li>Opravu nesprávnych údajov</li>
                  <li>Vymazanie ("právo byť zabudnutý")</li>
                  <li>Obmedzenie spracovania</li>
                  <li>Prenosnosť údajov</li>
                  <li>Namietať voči spracovaniu</li>
                  <li>Odvolať súhlas kedykoľvek</li>
                </ul>
                <p className="mt-4">
                  Uplatnenie práv: e-mailom na <a href={`mailto:${BAND.contact.email}`} className="text-warm-yellow underline hover:text-neon-red">{BAND.contact.email}</a>.
                  Odpovieme do 30 dní.
                </p>
                <p className="mt-4">
                  Ak nie sme spokojní s vybavením, môžete podať sťažnosť Úradu na ochranu osobných údajov SR (<a href="https://dataprotection.gov.sk" target="_blank" rel="noopener noreferrer" className="text-warm-yellow underline hover:text-neon-red">dataprotection.gov.sk</a>).
                </p>
              </div>
            </section>

            {/* Cookie Policy */}
            <section id="cookies" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                2. Cookie Policy
              </h2>
              <div className="space-y-4 text-silver leading-relaxed text-sm">
                <p>Táto webová stránka používa nasledovné cookies:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-charcoal text-xs">
                    <thead className="bg-ink text-white">
                      <tr>
                        <th className="p-2 border-r border-charcoal">Cookie</th>
                        <th className="p-2 border-r border-charcoal">Účel</th>
                        <th className="p-2 border-r border-charcoal">Doba</th>
                        <th className="p-2">Typ</th>
                      </tr>
                    </thead>
                    <tbody className="text-silver">
                      <tr className="border-t border-charcoal">
                        <td className="p-2 border-r border-charcoal font-mono">dora_consent</td>
                        <td className="p-2 border-r border-charcoal">Zapamätanie súhlasu s cookies</td>
                        <td className="p-2 border-r border-charcoal">12 mesiacov</td>
                        <td className="p-2">Nutné</td>
                      </tr>
                      <tr className="border-t border-charcoal bg-ink/30">
                        <td className="p-2 border-r border-charcoal font-mono">dora_admin_session</td>
                        <td className="p-2 border-r border-charcoal">Admin prihlásenie (httpOnly)</td>
                        <td className="p-2 border-r border-charcoal">7 dní</td>
                        <td className="p-2">Nutné</td>
                      </tr>
                      <tr className="border-t border-charcoal">
                        <td className="p-2 border-r border-charcoal font-mono">_ga, _ga_*</td>
                        <td className="p-2 border-r border-charcoal">Google Analytics (ak povolené)</td>
                        <td className="p-2 border-r border-charcoal">24 mesiacov</td>
                        <td className="p-2">Analytické</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4">
                  Cookies môžete kedykoľvek vymazať v nastaveniach svojho prehliadača. Nutné cookies nie je možné vypnúť (sú potrebné pre fungovanie webu).
                </p>
              </div>
            </section>

            {/* Impressum */}
            <section id="impressum" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                3. Impressum
              </h2>
              <div className="space-y-3 text-silver leading-relaxed text-sm border border-charcoal bg-ink/50 p-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-silver/60 mb-1">Prevádzkovateľ</p>
                  <p className="text-white font-semibold">{BAND.name}</p>
                  <p>{BAND.tagline}</p>
                </div>
                <div className="pt-3 border-t border-charcoal">
                  <p className="text-xs uppercase tracking-wider text-silver/60 mb-1">Sídlo</p>
                  <p>{bandLocation}</p>
                  <p>Slovenská republika</p>
                </div>
                <div className="pt-3 border-t border-charcoal">
                  <p className="text-xs uppercase tracking-wider text-silver/60 mb-1">Kontakt</p>
                  <p>E-mail: <a href={`mailto:${BAND.contact.email}`} className="text-warm-yellow underline hover:text-neon-red">{BAND.contact.email}</a></p>
                  <p>Telefón: <a href={`tel:${BAND.contact.phone.replace(/[\s\/]/g, "")}`} className="text-warm-yellow underline hover:text-neon-red">{BAND.contact.phone}</a></p>
                </div>
                <div className="pt-3 border-t border-charcoal">
                  <p className="text-xs uppercase tracking-wider text-silver/60 mb-1">Zodpovedná osoba</p>
                  <p>{responsiblePerson}</p>
                </div>
                <div className="pt-3 border-t border-charcoal">
                  <p className="text-xs uppercase tracking-wider text-silver/60 mb-1">IČO / DIČ</p>
                  <p>{BAND.name} nie je obchodná spoločnosť — funguje ako občianske združenie / nezisková umelecká činnosť.</p>
                </div>
                <div className="pt-3 border-t border-charcoal">
                  <p className="text-xs uppercase tracking-wider text-silver/60 mb-1">Hosting</p>
                  <p>Vercel Inc. (next.js deployment)</p>
                  <p>Databáza: Neon Postgres (EU)</p>
                </div>
              </div>
            </section>

            {/* Zodpovednosť */}
            <section className="mb-10">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                4. Obmedzenie zodpovednosti
              </h2>
              <div className="space-y-3 text-silver leading-relaxed text-sm">
                <p>
                  Obsah týchto webových stránok je poskytovaný "tak ako je". Kapela {BAND.name} nenesie zodpovednosť za prípadné nepresnosti, chyby alebo škody vzniknuté používaním týchto stránok.
                </p>
                <p>
                  Obrázky, texty a iný obsah môžu byť chránené autorskými právami tretích strán. Všetky práva vyhradené. Akékoľvek šírenie obsahu bez predchádzajúceho súhlasu je zakázané.
                </p>
              </div>
            </section>

            {/* Kontakt */}
            <section className="mb-10">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                5. Kontakt pre ochranu údajov
              </h2>
              <div className="border border-neon-red/30 bg-neon-red/5 p-6">
                <p className="text-silver text-sm leading-relaxed">
                  Pre otázky týkajúce sa ochrany osobných údajov nás kontaktujte:
                </p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-white font-semibold">{BAND.name}</p>
                  <p>E-mail: <a href={`mailto:${BAND.contact.email}`} className="text-warm-yellow underline hover:text-neon-red">{BAND.contact.email}</a></p>
                  <p>Telefón: <a href={`tel:${BAND.contact.phone.replace(/[\s\/]/g, "")}`} className="text-warm-yellow underline hover:text-neon-red">{BAND.contact.phone}</a></p>
                </div>
              </div>
            </section>

            <footer className="mt-16 pt-8 border-t border-charcoal text-center text-xs text-silver/60">
              <p>© {new Date().getFullYear()} {BAND.name}. Všetky práva vyhradené.</p>
              <p className="mt-2">Tento dokument je právne záväzný v zmysle GDPR a zákona č. 18/2018 Z. z.</p>
            </footer>
          </article>
        </div>
      </main>
      <BackToTop />
      <Footer />
    </>
  );
}
