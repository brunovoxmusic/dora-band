# D.O.R.A. — FINAL TECH & SEO AUDIT

**Task ID:** AUDIT-TECH
**Dátum auditu:** 2026-08-19
**Auditor:** Explore sub-agent (Tech/SEO focus)
**Repozitár:** `/home/z/my-project/` (D.O.R.A. Band Website)
**Scope:** SEO/GEO/AEO · Performance · Security · Build & Deploy · Testing
**Metóda:** Statický read-only audit (riadený čítaním súborov + ESLint + tsc + vitest)
**Verdikt:** Aplikácia je funkčná a vizuálne bohatá, ale obsahuje **5 P0 kritických chýb**, **12 P1** a **18 P2** technických nedostatkov, ktoré blokujú truly production-ready stav.

> Komplementárne k `FINAL-FUNC-AUDIT.md` (funkcia/prepojenia) a `FINAL-UI-AUDIT.md` (UX/vizuál).
> Tento report sa sústreďuje na **SEO, performance, security, build pipeline a test coverage**.

---

## 0. EXECUTIVE SUMMARY

| Oblasť | Skóre | Status | Hlavné riziká |
|--------|------:|--------|---------------|
| **SEO / GEO / AEO** | **6.0/10** | ⚠️ Polovičaté | 3 rickroll YouTube IDs v JSON-LD, mŕtva SeoMeta, polovičatý hreflang, sitemap spam |
| **Performance** | **5.0/10** | 🔴 Ťažký bundle | 17/17 sekcií "use client", 0 dynamic import, 26 admin tabs v jednom bundli |
| **Security** | **7.5/10** | ✅ P0 vyriešené | In-memory rate limiter nefunkčný na Vercel multi-instance, verejný `/api/chat` |
| **Build & Deploy** | **5.5/10** | ⚠️ Riskantný | `prisma db push --accept-data-loss` v build skripte, ESLint vypnutý |
| **Testing** | **4.5/10** | 🔴 Podkritické | 14.44% coverage vs 60% threshold, žiadne API/admin unit testy |

**Celkové technické hodnotenie:** **5.7 / 10**

---

## 1. SEO / GEO / AEO AUDIT

### 1.1 `src/app/layout.tsx` — Metadata (✅ väčšinou OK)

| Pole | Stav | Poznámka |
|------|------|----------|
| `title.default` | ✅ | „D.O.R.A. — Dnes Od Rána Abstinujem \| Funky-Punk z Púchova" (≤60 znakov) |
| `title.template` | ✅ | `"%s \| D.O.R.A."` |
| `description` | ✅ | 187 znakov, obsahuje kľúčové slová (mierne nad odporúčaných 160) |
| `keywords` | ✅ | 12 relevantných kľúčových slov |
| `authors/creator/publisher` | ✅ | "D.O.R.A." |
| `alternates.canonical` | ⚠️ | Iba `"/"` (relatívne) — funguje cez `metadataBase`, ale neobsahuje path pre sub-pages |
| `alternates.languages` | ❌ | `"sk-SK": "/", "en": "/"` — **en neexistuje** (žiadny EN preklad). Polovičatý hreflang horší než žiadny. |
| `openGraph.title/description/type/locale/siteName/url` | ✅ | |
| `openGraph.images` | ⚠️ | `/gallery/hero-banner.jpg` 1920×1080 — správne, ale Next.js nepoužíva dynamický `opengraph-image.tsx` keď je statický `images` v metadata |
| `twitter.card/title/description/images` | ✅ | `summary_large_image` |
| `robots.index/follow/googleBot` | ✅ | `max-image-preview:large`, `max-snippet:-1`, `max-video-preview:-1` |
| `category` | ✅ | `"music"` |
| `manifest` | ✅ | `/manifest.json` |
| `icons` | ⚠️ | Iba SVG — chýba PNG fallback pre staršie prehliadače a Apple Touch (≤180×180) |
| `viewport.themeColor` | ✅ | `#E63946` (v samostatnom `viewport` exporte podľa Next.js 16) |

#### 🔴 P0 — Polovičatý hreflang
```ts
alternates: {
  canonical: "/",
  languages: { "sk-SK": "/", "en": "/" },  // ← "en" vedie na slovenskú stránku
}
```
Google Search Console vyhodí varovanie „Return tags error" — en alternate neobsahuje EN obsah.
**Oprava:** Kým neexistuje i18n routing, `languages` zmazať. Korektný hreflang:
```ts
alternates: { canonical: "/" }  // bez languages kým nepríde EN verzia
```

---

### 1.2 `src/app/sitemap.ts` (⚠️ Bug)

**Súbor:** `src/app/sitemap.ts` (53 riadkov)

#### ✅ Implementované
- 10 statických URLs (`/`, `/#o-kapele`, `/#clenovia`, `/#hudba`, `/#galeria`, `/#diskografia`, `/#faq`, `/#press`, `/#kontakt`, `/archiv`)
- Dynamické načítanie gigov z DB (try/catch fallback)
- `lastModified`, `changeFrequency`, `priority` správne nastavené

#### ❌ P1 — Súbor: `sitemap.ts:43-48`
```ts
gigEntries = gigs.map(g => ({
  url: `${SITE_URL}/#koncerty`,  // ← všetkých 50 gigov mapuje na rovnakú URL!
  lastModified: g.updatedAt || g.date,
  changeFrequency: "weekly" as const,
  priority: 0.6,
}));
```
**Problém:** Neexistuje `/#koncerty` anchor — `GigsSection` komponent nemá `id` atribút (overené cez `rg "id=\"" src/components/sections/gigs-section.tsx`). Všetkých 50 gigov v sitemap generuje **50 duplikátnych URL**, ktoré sa resolved na `/` (homepage). Google to vyhodnotí ako sitemap spam.

**Oprava:**
1. Pridať `id="koncerty"` do `<section>` v `gigs-section.tsx`, ALEBO
2. Vytvoriť per-gig detail page `/koncerty/[id]` a sitemap mapovať na ňu, ALEBO
3. Zmazať `gigEntries` z sitemap (gigy sa už objavujú na homepage cez GigsSection).

---

### 1.3 `src/app/robots.ts` (✅ OK)

```ts
rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] },
sitemap: `${SITE_URL}/sitemap.xml`,
```
✅ Správne pravidlá, `/admin` a `/api/admin` disallownuté, sitemap referencovaná.
⚠️ Minor: chýba `host` directive (deprecated, ale niektoré crawly ju ešte rešpektujú).

---

### 1.4 `src/app/opengraph-image.tsx` (✅ Funkčné, ⚠️ Inconsistency)

**Súbor:** `src/app/opengraph-image.tsx` (147 riadkov)

#### ✅ Implementované
- Edge runtime, 1200×630 PNG
- Brandované: barcode strip, status pill „Booking 2026 — otvorený", D.O.R.A. (140px neon-red), tagline, bio, 4-stat strip
- `alt`, `size`, `contentType` exports správne

#### ⚠️ P2 — Inconsistent stats
OG image stats panel:
```ts
{ k: "1996", v: "ZALOŽENÁ" },
{ k: "30+", v: "ROKOV NA SCÉNE" },
{ k: "5", v: "NAHRÁVKY" },      // ← ale DISCOGRAPHY má 3 releases
{ k: "4", v: "ŽÁNROV" },        // ← ale GENRES má 5 záznamov
```
VS skutočnosť v `band-data.ts`:
- `DISCOGRAPHY.length === 3` (1997 Don't Touch Me, 2001 Iný deň, 2005 TCHO SME NAHLAVU?)
- `GENRES.length === 5` (Funky-Punk, Crossover, Punk Rock, Rap-Rock, Slovenský punk)

**Oprava:** Buď zmeniť OG image na `3` a `5`, alebo doplniť chýbajúce releases do `DISCOGRAPHY` (podľa audit_copy_content.docx).

---

### 1.5 `src/components/site/structured-data.tsx` — JSON-LD (⚠️ 5 schema issues)

**Súbor:** `src/components/site/structured-data.tsx` (210 riadkov)

#### ✅ Implementované (5 schemas)
1. **MusicGroup** — `@type`, `name`, `alternateName`, `description`, `url`, `image`, `logo`, `foundingDate`, `foundingLocation`, `genre[]`, `member[]` (OrganizationRole + Person), `album[]` (MusicAlbum), `track[]` (MusicRecording), `contactPoint` (ContactPoint), `sameAs[]`
2. **WebSite** — `name`, `url`, `inLanguage`, `publisher`
3. **MusicEvent[]** — pre každý upcoming gig: `name`, `startDate`, `eventStatus`, `eventAttendanceMode`, `location`, `performer`, `organizer`, `offers`
4. **FAQPage** — filter `!f.a.includes("[DOPLNI")` vyhodí TODO odpovede ✅
5. **VideoObject[]** — pre tracks s neprázdnym `videoId`

#### 🔴 P0-1 — VideoObject schema ukazuje na RICKROLL videá
```ts
const videoObjects = TRACKS
  .filter((t) => t.videoId && t.videoId.length > 0)  // ← filter prejde na 3 rickroll IDs
  .map((t) => ({ ... contentUrl: `https://www.youtube.com/watch?v=${t.videoId}` }))
```
V `band-data.ts:217,228,238`:
```ts
videoId: "dQw4w9WgXcQ",  // Rick Astley - Never Gonna Give You Up
videoId: "9bZkp7q19f0",  // PSY - Gangnam Style
videoId: "kJQP7kiw5Fk",  // Luis Fonsi - Despacito
```
TODO komentár hovorí „nahradiť", ale hodnoty **nejsú prázdne**. Filter `videoId.length > 0` ich pustí do JSON-LD. Google indexuje `VideoObject` ako oficiálne video kapely → SEO katastrofa.

**Oprava:** Nahradiť všetky 3 s prázdnym stringom (`""`):
```ts
videoId: "",  // TODO(DORA): Reálne YouTube ID z @DORAkapela
```
Filter už má fallback: prázdne videoId sa nezobrazí ani v UI (music-section.tsx:38-99), ani v JSON-LD.

#### 🔴 P0-2 — MusicEvent `offers.price` je string namiesto Number
```ts
offers: { "@type": "Offer", url: gig.ticketUrl, price: gig.ticketPrice, ... }
//                                  ^^^^^^^^^^^^^^^^^^^^^^^^
// gig.ticketPrice = "10 EUR predpredaj / 15 EUR na mieste"
```
Schema.org `Offer.price` očakáva **Number** (alebo Number ako string). Súčasná hodnota „10 EUR predpredaj / 15 EUR na mieste" neprejde [Rich Results Test](https://search.google.com/test/rich-results).

**Oprava:**
```ts
// Parsuj číslo z ticketPrice
const priceMatch = gig.ticketPrice?.match(/(\d+(?:\.\d+)?)/);
const price = priceMatch ? Number(priceMatch[1]) : undefined;
const offers = {
  "@type": "Offer",
  url: gig.ticketUrl,
  ...(price ? { price, priceCurrency: "EUR" } : {}),
  availability: "https://schema.org/InStock",
};
```

#### ⚠️ P1-1 — MusicGroup `image` chýba `@id`
```ts
image: `${SITE_URL}/gallery/hero-banner.jpg`,
```
Schema.org očakáva `ImageObject` s `@id`, `url`, `width`, `height`. Plain string funguje, ale pre lepšiu interlinking medzi schemas:
```ts
image: { "@type": "ImageObject", url: `${SITE_URL}/gallery/hero-banner.jpg`, width: 1920, height: 1080 }
```

#### ⚠️ P1-2 — MusicEvent chýba `endDate`
`MusicEvent` môže mať `endDate` pre viacdnové festivaly. Súčasné koncerty sú single-day, ale bez `endDate` niektoré validátory varujú.

#### ⚠️ P2-1 — WebSite schema chýba `potentialAction` (SearchAction)
Pre AEO (Answer Engine Optimization) by mal WebSite schema obsahovať:
```ts
potentialAction: {
  "@type": "SearchAction",
  target: `${SITE_URL}/?q={search_term_string}`,
  "query-input": "required name=search_term_string"
}
```
Hoci web nemá search, SearchAction pomáha brandovému SEO (Google Knowledge Panel).

---

### 1.6 Canonical URLs

| Route | Canonical | Stav |
|-------|-----------|------|
| `/` (homepage) | `/` (relatívne, resolved cez metadataBase) | ✅ |
| `/archiv` | `/archiv` (explicit `alternates.canonical`) | ✅ |
| `/privacy` | ❌ chýba | ❌ |
| `/admin/*` | ❌ noindex chýba | ⚠️ |

**P2-1 — Privacy page chýba canonical:**
```ts
// src/app/privacy/page.tsx
export const metadata: Metadata = {
  title: `Ochrana osobných údajov — ${BAND.name}`,
  // Pridať: alternates: { canonical: "/privacy" }
};
```

**P2-2 — Admin routes nemajú noindex:**
`/admin/login` a `/admin` nemajú `robots: { index: false, follow: false }`. Aj keď `robots.ts` disallowne `/admin`, Google môže stále indexovať ak nájde odkaz. Pridať do `src/app/admin/login/page.tsx`:
```ts
export const metadata: Metadata = { robots: { index: false, follow: false } };
```

---

### 1.7 `next.config.ts` — Images & Headers

**Súbor:** `next.config.ts` (29 riadkov)

#### ✅ Implementované
- `images.formats: ["image/avif", "image/webp"]` (modern formats)
- `images.remotePatterns` pre Vercel Blob storage
- `serverExternalPackages: ["sharp"]`
- `allowedDevOrigins` pre sandbox preview
- `typescript.ignoreBuildErrors: false`

#### ❌ P1 — Chýba `headers()` config
Žiadne security headers v next.config (kompenzované middleware.ts, ale duplicita by nezaškodila pre fallback ak middleware zlyhá).

#### ❌ P2 — Chýba `images.remotePatterns` pre sociálne platformy
YouTube thumbnails (`i.ytimg.com`), Facebook CDN, Instagram CDN nie sú povolené v `remotePatterns`. `music-section.tsx:55` používa:
```ts
src={`https://i.ytimg.com/vi/${activeTrack.videoId}/hqdefault.jpg`}
```
…ako plain `<img>` (workaround), ale next/image by neprešiel. Buď povoliť `i.ytimg.com`, alebo sticky s plain `<img>` (avšak ESLint `@next/next/no-img-element` je vypnutý — pozri 4.4).

---

### 1.8 SEO Summary Table

| Kontrola | Stav | Akcia |
|----------|------|-------|
| `metadata` kompletná | ✅ | — |
| hreflang | ❌ polovičatý | Zmazať `languages` kým nepríde i18n |
| sitemap.xml | ⚠️ duplicitné URLs | Pridať `id="koncerty"` alebo zmazať gigEntries |
| robots.txt | ✅ | — |
| JSON-LD MusicGroup | ✅ + 1 P1 | Pridať `image.@id` |
| JSON-LD WebSite | ⚠️ | Pridať `potentialAction` (SearchAction) |
| JSON-LD MusicEvent | ❌ P0 price bug | Parsuj Number z ticketPrice, pridaj `priceCurrency` |
| JSON-LD FAQPage | ✅ | — |
| JSON-LD VideoObject | ❌ P0 rickroll | Vyprázdniť 3 fake videoIds |
| OG image | ✅ + 1 P2 | Synchronizuj stats (5/4 ↔ 3/5) |
| Per-path SEO (SeoMeta) | ❌ dead data | Implementuj `generateMetadata()` |

---

## 2. PERFORMANCE AUDIT

### 2.1 "use client" Sekcie — ❌ P0 Kritické

**Metóda:** `rg -l '"use client"' src/components/sections` → **17/17** súborov

| # | Súbor | Render content | Mal by byť RSC? |
|---|-------|-----------------|------------------|
| 1 | `hero-section.tsx` | Parallax + slideshow + count-up | ⚠️ čisto interaktívny |
| 2 | `about-section.tsx` | Timeline (useState active) | ⚠️ menší interakčný |
| 3 | `members-section.tsx` | Expandable bio | ⚠️ malý interakčný |
| 4 | `music-section.tsx` | YouTube iframe + tracklist | ⚠️ player |
| 5 | `gallery-section.tsx` | Lightbox + search/sort | ⚠️ veľký interakčný |
| 6 | `discography-section.tsx` | Hover waveforms | ⚠️ dekoratívny |
| 7 | `gigs-section.tsx` | Modal + filter | ⚠️ interakčný |
| 8 | `setlist-section.tsx` | Filter | ⚠️ malý interakčný |
| 9 | `testimonials-section.tsx` | Carousel | ❌ SKRYTÝ v page.tsx:202-209 (dead code) |
| 10 | `press-section.tsx` | Copy-to-clipboard | ⚠️ interakčný |
| 11 | `faq-section.tsx` | Accordion + filter | ⚠️ interakčný |
| 12 | `social-section.tsx` | Statické karty | ❌ **mal by byť RSC** |
| 13 | `newsletter-section.tsx` | Form | ⚠️ interakčný |
| 14 | `contact-section.tsx` | Form + honeypot | ⚠️ interakčný |
| 15 | `blog-section.tsx` | Statický zoznam | ❌ **mal by byť RSC** |
| 16 | `merch-section.tsx` | Statický zoznam | ❌ **mal by byť RSC** |
| 17 | `stats-section.tsx` | Count-up | ⚠️ interakčný |

**Dôsledok:** 100% stránky je client-rendered. Strata SSR výhod:
- HTML payload sa nedá streamovať
- Server Components fetch (CMS, gigs) sa deje v `page.tsx` (server), ale výsledok sa serializuje do client props → hydration double-platí za dáta
- TTFB > LCP na mobile (305 KB homepage HTML per worklog Task 21)

#### 🔴 P0 — Refaktor 4 statických sekcií na RSC
1. `social-section.tsx` — žiadny useState, len karty. Pridať na server.
2. `blog-section.tsx` — statický zoznam. Pridať na server.
3. `merch-section.tsx` — statický zoznam. Pridať na server.
4. `testimonials-section.tsx` — je skrytý (dead code), zmazať alebo odkomentovať.

---

### 2.2 Dynamic Imports — ❌ P0 ZERO

```bash
$ rg "next/dynamic|React.lazy" src/  # → No matches
```

**0 dynamic imports v celom `src/`**. To znamená:
- Lightbox komponent v `gallery-section.tsx` je v rovnakom bundli ako hero, hoci sa zobrazí len pri kliknutí.
- Modal v `gigs-section.tsx` je eagerly loaded.
- CookieConsent banner sa nemusí objaviť (localStorage), ale stále sa parsuje.

#### 🔴 P0 — Lazy load interaktívnych komponentov
```tsx
// page.tsx
const GallerySection = dynamic(() => import("@/components/sections/gallery-section").then(m => ({ default: m.GallerySection })), { ssr: true, loading: () => <SectionSkeleton /> });
const GigsSection = dynamic(() => import("@/components/sections/gigs-section").then(m => ({ default: m.GigsSection })), { ssr: true });
```

---

### 2.3 Admin Bundle — ❌ P0 Kritické

**Súbor:** `src/app/admin/page.tsx` (89 riadkov)
**Admin tabs:** 26 (`stats | analytics | predictions | inquiries | gigs | crm | tasks | automations | booking | media | subscribers | content | content-items | blog | members | seo | ai | ai-usage | knowledge | approvals | songs | rehearsals | setlists | concert-mode | merch | campaigns | settings`)

Všetkých 26 tab komponentov sa **eagerly importuje** v `admin/page.tsx` → jeden gigantický client bundle (recharts, framer-motion, @dnd-kit, @mdxeditor, all Radix UI).

**Odhad veľkosti admin bundlu:** ~1.5–2 MB gzipped (odhad na základe dependency zoznamu v `package.json`).

#### 🔴 P0 — Lazy load admin tabov
```tsx
const StatsTab = dynamic(() => import("@/components/admin/stats-tab").then(m => ({ default: m.StatsTab })));
const AiTab = dynamic(() => import("@/components/admin/ai-tab").then(m => ({ default: m.AiTab })));
// ... pre každý tab
```
Initial admin load spadne z ~2 MB na ~300 KB (shell + aktivný tab).

---

### 2.4 Image Optimization

| Súbor | Použitie | Stav |
|-------|----------|------|
| `hero-slideshow.tsx` | `next/image` s `priority={index===0}` | ✅ |
| `gallery-section.tsx` | `next/image` s `fill` + `sizes` | ✅ |
| `footer.tsx` | `<img src="/dora-mark.svg">` | ⚠️ SVG je OK ako `<img>` |
| `navbar.tsx` | `<img src="/dora-mark.svg">` | ⚠️ SVG OK |
| `admin-shell.tsx` (2×) | `<img src="/dora-mark.svg">` | ⚠️ SVG OK |
| `maintenance-screen.tsx` | `<img src="/dora-mark.svg">` | ⚠️ SVG OK |
| `members-tab.tsx:153` | `<img src={m.photo}>` (member photo) | ❌ Mal by byť `next/image` |
| `members-tab.tsx:284` | `<img src={p}>` (placeholder) | ❌ Mal by byť `next/image` |
| `ai-tab.tsx:122` | `<img src={m.thumbnailUrl}>` | ❌ Mal by byť `next/image` |
| `music-section.tsx:54` | `<img src="https://i.ytimg.com/...">` | ⚠️ YT thumb — pridaj do `remotePatterns` a použi `next/image` |

#### 🔴 P1 — `@next/next/no-img-element` rule je VYPNUTÁ v ESLint
`eslint.config.mjs:28`:
```js
"@next/next/no-img-element": "off",
```
Toto umožňuje neoptimalizované `<img>` tagy bez varovania. **Zapnúť** a fixovať 3 RSC-nevhodné usage.

---

### 2.5 Font Loading Strategy

```ts
const montserrat = Montserrat({ subsets: ["latin", "latin-ext"], weight: ["400","500","600","700","800","900"], display: "swap" });
const robotoCondensed = Roboto_Condensed({ subsets: ["latin", "latin-ext"], weight: ["400","500","600","700"], display: "swap" });
const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400","500","600","700"], display: "swap" });
```

✅ Všetky 4 fonty:
- `display: "swap"` (FOIT avoided, FOUT acceptable)
- `latin-ext` subset (slovak diacritics)
- CSS variables (`--font-montserrat` atď.)

⚠️ **P2 — 4 fonty = 4 network requesty:** Odhad ~120 KB gzipped pre všetky weights/subsets. Zvážiť:
- Odstrániť nepoužité weights (skontrolovať `rg "font-(thin|extralight|medium|black)" src/`)
- Subset JetBrains Mono na `latin-ext` (slovak komenty v kóde)

---

### 2.6 Duplicate Network Fetches

**Súbor:** `src/app/page.tsx:178-219` (server-side, OK) + `src/components/site/footer.tsx:37` (client-side) + `src/components/sections/hero-section.tsx:31` (client-side)

```ts
// footer.tsx
useEffect(() => { fetch("/api/sections")... }, []);

// hero-section.tsx
useEffect(() => { fetch("/api/sections")... }, []);
```

❌ **P1 — Duplicitný fetch `/api/sections`:** 2 client-side useEffects volajú rovnaký endpoint. Navyše `page.tsx` už na serveri fetchol settings cez `getAllSettingsStructured()`. Posiela sa 2× klientovi.

**Oprava:** Server komponent posiela `sections` ako prop do Footer + HeroSection, klientsky fetch len ako fallback.

---

### 2.7 Performance Summary Table

| Kontrola | Stav | Skóre |
|----------|------|-------|
| RSC adoption | ❌ 0/17 sekcií | 0/10 |
| Dynamic imports | ❌ 0/∞ | 0/10 |
| Admin code splitting | ❌ 26 tabs eager | 2/10 |
| next/image adoption | ⚠️ 2/11 (18%) | 4/10 |
| Font loading | ✅ swap + latin-ext | 8/10 |
| Duplicate fetches | ⚠️ 2× /api/sections | 5/10 |
| Sticky player všade | ⚠️ zbytočne na /admin | 6/10 |
| **Performance celkovo** | | **5/10** |

---

## 3. SECURITY AUDIT

> Po Fáze 0 (M0.1–M0.10) je security výrazne stabilnejší. Tento audit rešpektuje existujúci `AUDIT-1-SECURITY.md` a dopĺňa aktuálne nálezy.

### 3.1 `src/middleware.ts` — CSP & Security Headers (✅ P0 OK)

| Header | Stav | Detail |
|--------|------|--------|
| `Content-Security-Policy` | ✅ | Dev: `'unsafe-inline' 'unsafe-eval'`, Prod: `'unsafe-inline'` + vercel.live |
| `X-Frame-Options` | ✅ | `DENY` |
| `X-Content-Type-Options` | ✅ | `nosniff` |
| `Referrer-Policy` | ✅ | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | ✅ | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Strict-Transport-Security` | ✅ | `max-age=63072000; includeSubDomains; preload` (iba prod) |
| `Cross-Origin-Opener-Policy` | ✅ | `same-origin-allow-popups` |
| `Cross-Origin-Resource-Policy` | ✅ | `same-site` |
| `X-DNS-Prefetch-Control` | ⚠️ | `on` — deprecated, spôsobuje zbytočné DNS prefetch |
| `X-Download-Options` | ⚠️ | `noopen` — IE-only, moderné prehliadače ignorujú |
| `X-Permitted-Cross-Domain-Policies` | ⚠️ | `none` — Adobe Flash era, šum |

#### ✅ CSRF Protection
```ts
function isCsrfSafe(req: NextRequest): boolean {
  // 1. Skip non-state-changing methods
  // 2. Skip /api/webhook (future)
  // 3. Sec-Fetch-Site: same-origin → OK
  // 4. Origin header check
  // 5. Dev mode passthrough
  // 6. Prod: reject if no Origin + no Sec-Fetch-Site
}
```
✅ Implementácia je konzervatívna a správna.

---

### 3.2 Rate Limiting — ⚠️ P1 Architektonický nedostatok

**Súbor:** `src/lib/rate-limit.ts` (167 riadkov, in-memory Map)

| Endpoint | Limit | Stav |
|----------|-------|------|
| `/api/auth/login` | 5 / 15 min / IP | ✅ `loginRateLimiter` |
| `/api/booking` | 3 / hour / IP | ✅ `bookingRateLimiter` |
| `/api/newsletter` | 3 / hour / IP | ✅ `newsletterRateLimiter` |
| `/api/chat` | 10 / hour / IP | ✅ `chatRateLimiter` |
| `/api/admin/*` | ❌ NONE | ❌ Žiadny admin rate limit |
| `/api/admin/ai/*` | ❌ NONE | ❌ AI cost abuse cez admin session |

#### ❌ P1 — In-memory limiter nefunguje na Vercel
`RateLimiter` trieda používa `Map<string, number[]>` v module scope. Vercel serverless:
- Každá funkcia je samostatná inštancia
- Mapa sa nuluje pri cold starte
- N+1 paralelných requestov = N+1 lístkov

**Dôsledok:** Brute-force login (5 pokusov / 15 min) sa reálne neobmedzuje — útočník pošle 50 paralelných requestov, každý si dostane vlastný limit.

**Oprava:** `@upstash/ratelimit` (Redis-backed) alebo `@vercel/kv`:
```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
export const loginLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "login",
});
```

#### ❌ P1 — Žiadny rate limit na admin/AI routes
Admin session môže zneužiť AI route ako cost-abuse vektor. Pridať:
```ts
export const aiRateLimiter = new RateLimiter({ windowMs: 60_000, max: 20, prefix: "ai" }); // 20 req/min
```
…v `/api/admin/ai/route.ts`, `/api/admin/ai/variants/route.ts`, `/api/admin/copilot/route.ts`, `/api/admin/blog/generate/route.ts`.

---

### 3.3 `getSession()` Coverage — ✅ P0 OK

**Metóda:** `rg -l "getSession" src/app/api/admin` → **62 admin routes**

```bash
$ ls src/app/api/admin/**/route.ts | wc -l
62
$ rg -l "getSession" src/app/api/admin | wc -l
62
```

✅ 100% admin API routes volá `getSession()`. Žiadny orphan route bez auth.

---

### 3.4 `sanitizeForPrompt` — ✅ P0 OK + 22 test cases

**Súbor:** `src/lib/ai/sanitize.ts` (52 riadkov)
**Test coverage:** `src/lib/ai/__tests__/sanitize.test.ts` — 22 test cases ✅

✅ Odstraňuje:
- „Ignore previous instructions"
- „Disregard all prior"
- „Forget previous"
- Role hijacking `system:`, `assistant:`, `user:`
- „You are now a", „Act as", „Pretend to be a"
- Code bloky (```...```)
- Control characters (okrem `\n` `\t`)
- Skracuje na `maxLength` (default 500)

✅ Používa sa v `/api/chat/route.ts:48`.

⚠️ **P2 — Sanitizácia sa neaplikuje na admin AI volania:**
- `/api/admin/ai/route.ts` — `instruction` a `context` vstupujú do promptu bez sanitizácie
- `/api/admin/copilot/route.ts` — rovnako

**Oprava:** V `buildSystemPrompt()` alebo pred volaním `streamText()` aplikovať `sanitizeForPrompt()` aj na admin inputs.

---

### 3.5 `.env.example` — ✅ Bez reálnych hesiel

**Súbor:** `.env.example` (49 riadkov)

| Premenná | Hodnota v `.env.example` | Stav |
|----------|---------------------------|------|
| `DATABASE_URL` | `postgresql://user:password@ep-xxx...` | ✅ placeholder |
| `ADMIN_SESSION_SECRET` | `replace-with-a-random-32-char-hex-string` | ✅ placeholder |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_xxxxxxxxxxxx` | ✅ placeholder |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | ✅ placeholder |
| `ADMIN_EMAIL` | `admin@dora.band` | ⚠️ nie je secret, OK |
| `ADMIN_PASSWORD` | `CHANGE-ME-TO-A-STRONG-PASSWORD` | ✅ placeholder |
| `GROQ_API_KEY` | `""` (prázdne) | ✅ |

✅ Žiadne reálne heslá, žiadne leaknuté tokeny. `.env.example` je safe commitnúť.

---

### 3.6 Security Summary Table

| Kontrola | Stav | Skóre |
|----------|------|-------|
| Password hashing (bcrypt 12) | ✅ | 9/10 |
| Session secret (env-only, throw on missing) | ✅ | 10/10 |
| Cookie security (httpOnly, sameSite, secure) | ✅ | 9/10 |
| Timing-safe token verify | ✅ | 9/10 |
| All admin routes guarded (62/62) | ✅ | 10/10 |
| CSP + security headers | ✅ | 8/10 (3 zastarané IE/Flash hlavičky) |
| CSRF protection | ✅ | 9/10 |
| Rate limiting (in-memory) | ⚠️ | 4/10 (Vercel multi-instance break) |
| Admin AI rate limit | ❌ | 0/10 |
| Public `/api/chat` | ⚠️ | 5/10 (rate-limited, ale otvorený cost vektor) |
| `sanitizeForPrompt` | ✅ + 22 testov | 9/10 (chýba admin AI) |
| Honeypot on booking form | ✅ | 9/10 |
| GDPR consent required | ✅ | 10/10 |
| `.env.example` clean | ✅ | 10/10 |
| **Security celkovo** | | **7.5/10** |

---

## 4. BUILD & DEPLOY AUDIT

### 4.1 `package.json` scripts (⚠️ Riskantné)

| Script | Príkaz | Stav |
|--------|--------|------|
| `dev` | `next dev -p 3000 2>&1 \| tee dev.log` | ✅ |
| `build` | `prisma db push --accept-data-loss && next build` | ❌ **P0 RISK** |
| `start` | `next start` | ✅ |
| `lint` | `eslint .` | ✅ (exit 0, ale nič nezachytá — pozri 4.4) |
| `vercel-build` | `prisma generate && prisma db push --accept-data-loss && next build` | ❌ **P0 RISK** |
| `db:push` | `prisma db push` | ✅ |
| `db:push:dev` | `prisma db push --schema=prisma/schema.sqlite.prisma` | ✅ |
| `db:generate` / `db:generate:dev` | `prisma generate` | ✅ |
| `db:migrate` / `db:migrate:deploy` / `db:migrate:status` | `prisma migrate ...` | ✅ |
| `seed` | `bun run src/lib/seed.ts` | ✅ |
| `test` | `vitest run` | ✅ |
| `test:coverage` | `vitest run --coverage` | ✅ (ale neprejde thresholdom — pozri 5) |
| `test:e2e` | `playwright test` | ✅ |
| `postinstall` | `prisma generate` | ✅ |

#### 🔴 P0 — `--accept-data-loss` v build skripte
```json
"build": "prisma db push --accept-data-loss && next build"
"vercel-build": "prisma generate && prisma db push --accept-data-loss && next build"
```
`prisma db push --accept-data-loss` sa spustí na **každom Vercel builde**. Ak sa schema.prisma zmení tak, že vyžaduje drop tabuľky (napr. zmena typu stĺpca), Vercel **s silently zmaže dáta**.

**Oprava:**
```json
"build": "next build",
"vercel-build": "prisma generate && prisma migrate deploy && next build",
"db:push": "prisma db push",
"db:push:force": "prisma db push --accept-data-loss"
```
Používať `prisma migrate deploy` pre production, `--accept-data-loss` len pre vynútený dev reset.

---

### 4.2 Prisma Schema Sync — ✅ OK

**Metóda:** `diff <(rg "^model " schema.prisma) <(rg "^model " schema.sqlite.prisma)` → žiadny rozdiel.

| Súbor | Provider | Počet modelov | @db.Text | Indexy |
|-------|----------|--------------|----------|--------|
| `prisma/schema.prisma` | `postgresql` | 27 | ✅ (long fields) | ✅ |
| `prisma/schema.sqlite.prisma` | `sqlite` | 27 | ❌ (SQLite nepodporuje) | ✅ |

✅ Obe schémy sú úplne synchronizované — 27 modelov, identické polia, identické indexy (composite indexy z auditu C4 zahrnuté).

⚠️ **P2 — `output` rozdiel:**
- PostgreSQL: `output = "../node_modules/.prisma/client"` (predvolený, OK)
- SQLite: `output = "../node_modules/.prisma/client"` (explicit, OK)

✅ Obe generujú do rovnakého umiestnenia. Žiadny konflikt.

---

### 4.3 `tsconfig.json` — ✅ Strict Mode OK

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,           // ← ✅
    "noImplicitAny": false,   // ← ⚠️ relaxnuté (mohlo by byť true)
    "noEmit": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "incremental": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "examples", "mini-services", "skills"]
}
```

✅ `strict: true` zapnuté.
⚠️ `noImplicitAny: false` — relaxnuté, dovoľuje implicitné `any`. Pre production hardening zmeniť na `true` a fixovať existujúce `any` typy.

**Verifikácia:** `bun run tsc --noEmit` → exit 0 ✅ (žiadne TS errory)

---

### 4.4 `eslint.config.mjs` — ❌ P0 ESLint VYPNUTÝ

**Súbor:** `eslint.config.mjs` (51 riadkov)

```js
rules: {
  // VŠETKY best-practice rules vypnuté:
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/no-non-null-assertion": "off",
  "@typescript-eslint/ban-ts-comment": "off",
  "@typescript-eslint/prefer-as-const": "off",
  "@typescript-eslint/no-unused-disable-directive": "off",
  "react-hooks/exhaustive-deps": "off",       // ← spôsobuje stale closure bugs!
  "react-hooks/purity": "off",
  "react/no-unescaped-entities": "off",
  "react/display-name": "off",
  "react/prop-types": "off",
  "react-compiler/react-compiler": "off",
  "@next/next/no-img-element": "off",          // ← umožňuje <img> bez optimalizácie
  "@next/next/no-html-link-for-pages": "off",
  "prefer-const": "off",
  "no-unused-vars": "off",
  "no-console": "off",                        // ← console.error v produku
  "no-debugger": "off",                       // ← debugger príkazy v produku
  "no-empty": "off",
  "no-irregular-whitespace": "off",
  "no-case-declarations": "off",
  "no-fallthrough": "off",
  "no-mixed-spaces-and-tabs": "off",
  "no-redeclare": "off",
  "no-undef": "off",
  "no-unreachable": "off",
  "no-useless-escape": "off",
}
```

**`bun run lint` exit 0** — ale ESLint je **v podstate no-op**. Zachytá iba syntax chyby, nič viac.

#### 🔴 P0 — Zapnúť kritické rules
```js
rules: {
  // TypeScript — zapnúť
  "@typescript-eslint/no-explicit-any": "warn",          // postupne na "error"
  "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/ban-ts-comment": "error",

  // React — kritické
  "react-hooks/exhaustive-deps": "warn",                  // stale closure detector
  "@next/next/no-img-element": "error",                   // next/image enforcement

  // JavaScript — základné
  "prefer-const": "error",
  "no-console": ["warn", { allow: ["warn", "error"] }],
  "no-debugger": "error",
  "no-unreachable": "error",
  "no-empty": ["error", { allowEmptyCatch: true }],
}
```

Po zapnutí očakávať ~50–100 warningov, postupne fixovať.

---

### 4.5 `vercel.json` — ⚠️ Neúplný

**Súbor:** `vercel.json` (24 riadky)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "bun install",
  "functions": {
    "src/app/api/admin/ai/route.ts": { "maxDuration": 30 },
    "src/app/api/admin/ai/variants/route.ts": { "maxDuration": 30 },
    "src/app/api/admin/ai/seo-score/route.ts": { "maxDuration": 30 },
    "src/app/api/admin/bookings/[id]/rescore/route.ts": { "maxDuration": 30 },
    "src/app/api/chat/route.ts": { "maxDuration": 30 }
  },
  "crons": []
}
```

#### ✅ OK
- `framework: nextjs`, `installCommand: bun install`
- AI routes majú `maxDuration: 30` (Vercel Hobby limit je 60s, Pro 300s)
- Schema-validné

#### ⚠️ P2 — Chýbajúce settings
- `regions: ["fra1"]` (Frankfurt — najbližšie k SK/CZ publiku)
- `crons: []` — prázdne, OK, ale mohlo by obsahovať napr. `db:cleanup` pre AutomationLog staršie ako 90 dní
- `headers: []` — by duplikovalo middleware.ts, ale pre static asset cache by pomohlo:
  ```json
  "headers": [{
    "source": "/gallery/(.*).jpg",
    "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
  }]
  ```

---

### 4.6 Build & Deploy Summary Table

| Kontrola | Stav | Skóre |
|----------|------|-------|
| `vercel-build` pipeline | ⚠️ `--accept-data-loss` | 4/10 |
| Prisma schemas sync | ✅ 27/27 modelov | 10/10 |
| TypeScript strict mode | ✅ strict + noImplicitAny:false | 8/10 |
| ESLint rules | ❌ všetko off | 1/10 |
| `vercel.json` functions | ✅ AI 30s | 7/10 |
| `.env.example` clean | ✅ | 10/10 |
| `postinstall: prisma generate` | ✅ | 10/10 |
| **Build & Deploy celkovo** | | **5.5/10** |

---

## 5. TESTING AUDIT

### 5.1 `vitest.config.ts` — ✅ Setup OK

```ts
coverage: {
  provider: "v8",
  include: ["src/lib/**/*.ts"],         // ← iba lib/, nie api/ ani components/
  exclude: ["src/lib/db.ts", "src/lib/seed.ts", "src/lib/agents/**", "src/lib/ai/provider.ts"],
  thresholds: { statements: 60, branches: 50, functions: 60, lines: 60 },
}
```

#### ✅ OK
- v8 coverage provider
- Thresholds nastavené (60/50/60/60)
- Setup file `vitest.setup.ts` (mock env vars)

#### ❌ P1 — Coverage include je príliš úzky
`include: ["src/lib/**/*.ts"]` nezahŕňa:
- `src/app/api/**` — žiadne API route testy
- `src/components/**` — žiadne UI testy
- `src/hooks/**` — žiadne hook testy
- `src/lib/agents/**` — excluded z coverage

---

### 5.2 Vitest Coverage Report — ❌ P0 Threshold NEPOREBRÁNÝ

```
$ bun run test:coverage

Test Files  5 passed (5)
Tests       62 passed (62)
Duration    1.61s

 % Coverage report from v8
------------------|---------|----------|---------|---------|--------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|--------------------
All files         |   14.91 |    10.16 |   21.51 |   14.44 |
 lib              |   10.08 |     5.03 |     8.69 |   10.66 |
  ai.ts           |       0 |        0 |       0 |       0 | 12-309
  auth.ts         |       0 |        0 |       0 |       0 | 16-114           ← KRITICKÉ: 0% coverage
  band-data.ts    |       0 |      100 |     100 |       0 | 4-463
  content.ts      |       0 |        0 |       0 |       0 | 14-198
  password.ts    |       0 |        0 |       0 |       0 | 16-35           ← KRITICKÉ: 0% coverage
  rate-limit.ts  |   67.56 |       40 |      50 |   68.57 |
  settings.ts    |       0 |        0 |       0 |       0 | 66-222
  utils.ts       |       0 |      100 |       0 |       0 | 5
 lib/ai          |    23.4 |    19.54 |   39.39 |   21.09 |
  rbac.ts        |   18.75 |    33.33 |      40 |   21.42 |
  sanitize.ts    |     100 |     100 |     100 |     100 | ✅
  tool-adapter.ts|       0 |        0 |       0 |       0 | 23-62
  tools.ts       |   17.64 |        0 |      50 |   13.04 | 43-196
  usage.ts       |   19.44 |    13.63 |      25 |   19.44 | 75-199

ERROR: Coverage for lines (14.44%) does not meet global threshold (60%)
ERROR: Coverage for functions (21.51%) does not meet global threshold (60%)
ERROR: Coverage for statements (14.91%) does not meet global threshold (60%)
ERROR: Coverage for branches (10.16%) does not meet global threshold (50%)
```

#### 🔴 P0 — Coverage 14.44% vs 60% threshold (75% deficit)
`auth.ts` a `password.ts` majú **0% coverage** — bezpečnostne kritické súbory bez testov!

---

### 5.3 Existujúce testy (✅ 62 passed)

| Súbor | Testov | Coverage |
|-------|--------|----------|
| `src/lib/__tests__/rate-limit.test.ts` | 8 | 67.5% stmts |
| `src/lib/ai/__tests__/sanitize.test.ts` | 22 | 100% ✅ |
| `src/lib/ai/__tests__/tools.test.ts` | 14 | 17.6% stmts |
| `src/lib/ai/__tests__/rbac.test.ts` | 8 | 18.7% stmts |
| `src/lib/ai/__tests__/usage.test.ts` | 10 | 19.4% stmts |

✅ Všetky 62 testov prechádza (< 2s).
✅ `sanitize.test.ts` má 100% coverage — vzorový test súbor.

---

### 5.4 `playwright.config.ts` — ✅ Setup OK

```ts
testDir: "./e2e",
fullyParallel: true,
baseURL: "http://localhost:3000",
trace: "on-first-retry",
screenshot: "only-on-failure",
projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
webServer: { command: "bun run dev", url: "http://localhost:3000", reuseExistingServer: !process.env.CI, timeout: 60_000 }
```

⚠️ **P2 — Iba Chromium project.** Chýba:
- `firefox` project (cross-browser coverage)
- `webkit` project (Safari rendering)
- Mobile project (`devices["iPhone 13"]` alebo podobný)

---

### 5.5 Existujúce E2E testy (3 súbory, 14 testov)

| Súbor | Testov | Coverage |
|-------|--------|----------|
| `e2e/homepage.spec.ts` | 5 | Homepage render, nav, footer, JSON-LD, security headers |
| `e2e/booking-privacy.spec.ts` | 6 | GDPR consent, honeypot, privacy page, anchors |
| `e2e/admin-auth.spec.ts` | 7 | Login flow, protected routes, public API access |

#### ❌ Chýbajúce E2E testy pre kritické funkcie:

| # | Flow | Prečo kritické |
|---|------|----------------|
| 1 | Music section — klik na track → YouTube iframe embed | Hlavná interakcia pre návštevníkov |
| 2 | Gallery — lightbox open/close, keyboard nav (← → ESC) | A11y + UX |
| 3 | FAQ accordion — click expand, category filter | AEO content |
| 4 | Setlist filter — genre filter buttons | Interakcia |
| 5 | /archiv page — render past gigs, year quick-nav | SEO |
| 6 | Hero slideshow — crossfade + Ken Burns | Visuálna feature |
| 7 | Cookie consent — accept/reject, localStorage persist | GDPR |
| 8 | Newsletter signup — success state, validation | Konverzia |
| 9 | Admin login happy path — valid creds → dashboard | Smoke test |
| 10 | Admin CRUD gig (create → edit → delete) | Admin smoke |
| 11 | Sitemap.xml 200 + valid XML | SEO |
| 12 | Robots.txt 200 + disallow paths | SEO |
| 13 | /api/gigs → 200 + JSON structure | Public API |
| 14 | /api/settings → 200 + sections map | Public API |
| 15 | Maintenance mode — server-rendered screen | Critical feature |
| 16 | Site banner — visible when active, dismissible | Critical feature |

#### ❌ Chýbajúce unit testy pre kritické súbory:

| Súbor | Coverage | Priorita |
|-------|----------|----------|
| `src/lib/auth.ts` | 0% | P0 (security) |
| `src/lib/password.ts` | 0% | P0 (security) |
| `src/lib/content.ts` | 0% | P1 (CMS) |
| `src/lib/settings.ts` | 0% | P1 (maintenance/banner) |
| `src/lib/ai.ts` | 0% | P1 (AI orchestrácia) |
| `src/lib/ai/tool-adapter.ts` | 0% | P1 (AI tools) |
| `src/lib/ai/usage.ts` | 19% | P2 |
| `src/lib/ai/rbac.ts` | 18% | P1 (RBAC) |
| `src/lib/ai/tools.ts` | 17% | P2 |
| `src/lib/utils.ts` | 0% | P2 |
| `src/app/api/booking/route.ts` | — | P1 |
| `src/app/api/newsletter/route.ts` | — | P1 |
| `src/app/api/auth/login/route.ts` | — | P1 |
| `src/middleware.ts` | — | P1 (CSRF + headers) |

---

### 5.6 Testing Summary Table

| Kontrola | Stav | Skóre |
|----------|------|-------|
| Vitest setup + thresholds | ✅ | 8/10 |
| Vitest coverage threshold prešiel | ❌ 14.44% vs 60% | 1/10 |
| Počet unit testov | 62 | 4/10 |
| `sanitize.test.ts` 100% coverage | ✅ vzorový | 10/10 |
| `auth.ts` / `password.ts` 0% coverage | ❌ P0 | 0/10 |
| Playwright setup | ✅ | 7/10 |
| Playwright cross-browser | ❌ iba Chromium | 3/10 |
| Počet E2E testov | 14 (3 súbory) | 5/10 |
| E2E coverage critical flows | ❌ chýba 16 flows | 3/10 |
| **Testing celkovo** | | **4.5/10** |

---

## 6. KRITICKÉ CHYBY SÚHRN (P0 — Blokujú production deploy)

### P0-1 ❌ Rickroll YouTube IDs v band-data.ts
**Súbor:** `src/lib/band-data.ts:217, 228, 238`
**Hodnoty:** `"dQw4w9WgXcQ"` (Rick Astley), `"9bZkp7q19f0"` (PSY), `"kJQP7kiw5Fk"` (Despacito)
**Dopad:** Music section embeduje nesprávne YouTube videá, VideoObject JSON-LD ukazuje na nepravé videá, Google indexuje kapelu ako autora týchto videí.
**Oprava (1 min):**
```ts
videoId: "",  // TODO(DORA): Reálne YouTube ID z @DORAkapela
```
Aplikovať na 3 miesta. Music section + structured-data.tsx už mávajú fallback pre prázdne `videoId`.

### P0-2 ❌ Polovičatý hreflang v layout.tsx
**Súbor:** `src/app/layout.tsx:67-70`
```ts
languages: { "sk-SK": "/", "en": "/" }  // en vedie na SK stránku
```
**Dopad:** Google Search Console varovanie „Return tags error".
**Oprava (30s):** Zmazať `languages` blok kým neexistuje EN verzia.

### P0-3 ❌ `prisma db push --accept-data-loss` v build skripte
**Súbor:** `package.json:7, 10`
**Dopad:** Vercel build môže silently zmazať produkčné dáta pri schéme zmene.
**Oprava (2 min):**
```json
"build": "next build",
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

### P0-4 ❌ ESLint kompletne vypnutý
**Súbor:** `eslint.config.mjs:11-45`
**Dopad:** Stale closure bugs (`react-hooks/exhaustive-deps` off), `<img>` namiesto `next/image`, `console.log` v produku, debugger príkazy.
**Oprava (10 min):** Pozri 4.4 — zapnúť kritické rules ako `warn`, postupne na `error`.

### P0-5 ❌ Vitest coverage 14.44% vs 60% threshold
**Súbor:** `vitest.config.ts:19-24`, `src/lib/auth.ts`, `src/lib/password.ts` (0% coverage)
**Dopad:** Bezpečnostne kritický kód bez testov. CI neprechádza `test:coverage`.
**Oprava (2 dni):** Pridať unit testy pre `auth.ts`, `password.ts`, `content.ts`, `settings.ts`, `booking/route.ts`, `newsletter/route.ts`.

---

## 7. PRIORITIZOVANÝ ACTION PLAN

### Týždeň 1 — P0 Quick Wins (≈ 2 hod)
- [ ] **P0-1:** Vyprázdniť 3 rickroll YouTube IDs v `band-data.ts` → `videoId: ""`
- [ ] **P0-2:** Zmazať `languages` blok z `layout.tsx` alternates
- [ ] **P0-3:** Zmeniť `build` / `vercel-build` skripty na `prisma migrate deploy`
- [ ] **P1:** Pridať `id="koncerty"` do `gigs-section.tsx` `<section>` (sitemap fix)
- [ ] **P1:** Pridať `alternates: { canonical: "/privacy" }` do `privacy/page.tsx`
- [ ] **P1:** Pridať `robots: { index: false }` do `admin/login/page.tsx` a `admin/page.tsx`

### Týždeň 1–2 — SEO Hardening (≈ 4 hod)
- [ ] **P0-2 MusicEvent offers:** Parsuj Number z `ticketPrice`, pridaj `priceCurrency: "EUR"`
- [ ] **P1 MusicGroup.image:** Konvertuj na `ImageObject` s `@id`, `width`, `height`
- [ ] **P1 WebSite.potentialAction:** Pridaj `SearchAction` (i keď web nemá search)
- [ ] **P1 OG image stats:** Synchronizuj (5/4 ↔ 3/5) podľa DISCOGRAPHY/GENRES
- [ ] **P2 next.config images.remotePatterns:** Pridaj `i.ytimg.com` pre YouTube thumbs
- [ ] **P2 next.config headers:** Pridaj cache headers pre `/gallery/*.jpg`
- [ ] **P2 vercel.json regions:** Pridaj `regions: ["fra1"]` (Frankfurt)

### Týždeň 2 — Performance Refactor (≈ 3 dni)
- [ ] **P0 Admin lazy load:** `dynamic()` pre 26 admin tabov → initial 2 MB → ~300 KB
- [ ] **P0 Statické sekcie na RSC:** `social-section.tsx`, `blog-section.tsx`, `merch-section.tsx` zmazať `"use client"`
- [ ] **P0 Dynamic import:** Lazy load Gallery lightbox, Gigs modal, FAQ accordion
- [ ] **P1 ESLint:** Zapnúť `@next/next/no-img-element: error`, fixnúť 3 `<img>` v admin taboch
- [ ] **P1 Duplicate fetch:** `/api/sections` volať raz (server) a poslať propom do Footer + Hero

### Týždeň 3 — Testing (≈ 4 dni)
- [ ] **P0 auth.ts tests:** hashPassword, verifyPassword, createSession, getSession, authenticate (≥15 testov)
- [ ] **P0 password.ts tests:** bcrypt hash, plaintext migration, edge cases (≥8 testov)
- [ ] **P0 middleware.ts tests:** CSRF, security headers, dev vs prod CSP (≥10 testov)
- [ ] **P1 booking API tests:** happy path, validation, honeypot, GDPR, rate limit (≥12 testov)
- [ ] **P1 E2E gallery lightbox:** open, keyboard nav, close
- [ ] **P1 E2E admin CRUD:** login → create gig → edit → delete
- [ ] **P1 E2E music section:** track click → YouTube iframe
- [ ] **P1 E2E /archiv page:** render, year quick-nav
- [ ] **P2 Playwright cross-browser:** pridať Firefox + WebKit projecty

### Týždeň 4 — Security Hardening (≈ 2 dni)
- [ ] **P1 Rate limiter Redis:** `@upstash/ratelimit` + `@upstash/redis` (Vercel multi-instance)
- [ ] **P1 Admin AI rate limit:** `aiRateLimiter` (20 req/min) na 5 AI routes
- [ ] **P1 sanitizeForPrompt na admin AI:** aplikovať na `instruction` + `context` v `buildSystemPrompt()`
- [ ] **P2 Session model v DB:** `jti`, `userId`, `expiresAt`, `revokedAt` — pre server-side revocation
- [ ] **P2 Cleanup stale headers:** `X-DNS-Prefetch-Control`, `X-Download-Options`, `X-Permitted-Cross-Domain-Policies`

---

## 8. VERIFIKÁCIA AKCIÍ

Po implementovaní P0 fixes spustiť:

```bash
# 1. Lint (po zapnutí rules)
bun run lint  # ← očakávať ~50 warnings, postupne fixovať

# 2. Type check
bun run tsc --noEmit  # ← musí byť exit 0

# 3. Unit testy
bun run test  # ← musí byť 62+ testov passed

# 4. Coverage (cieľ: ≥ 60%)
bun run test:coverage  # ← musí exit 0 (po pridaní auth/password/middleware testov)

# 5. E2E testy
bun run test:e2e  # ← musí byť 14+ testov passed

# 6. Build
bun run build  # ← musí exit 0 bez --accept-data-loss

# 7. SEO validation
curl https://localhost:3000/sitemap.xml | xmllint --noout -
curl https://localhost:3000/robots.txt
curl https://localhost:3000/api/gigs | jq .

# 8. Google Rich Results Test
# https://search.google.com/test/rich-results
# URLs: /, /archiv, /privacy
```

---

## 9. ZÁVER

Aplikácia D.O.R.A. má **silný brand identity, bohatú funkcionalitu (26 admin tabs, AI tools, CMS) a P0 security fixes z Fázy 0 vyriešené**. Avšak **technická kvalita** ako production-ready webu má medzery:

1. **SEO:** Polovičatý hreflang + mŕtva SeoMeta + rickroll v JSON-LD + sitemap spam = priemerné 6/10.
2. **Performance:** 17/17 sekcií ako `"use client"`, 0 dynamic imports, 2 MB admin bundle = priemerné 5/10.
3. **Security:** Väčšina P0 vyriešená, ale in-memory rate limiter nefunguje na Vercel = silné 7.5/10.
4. **Build:** `--accept-data-loss` v skripte + ESLint kompletne vypnutý = priemerné 5.5/10.
5. **Testing:** 62 testov prechádza, ale coverage 14.44% vs 60% threshold = priemerné 4.5/10.

**Odporúčanie:** Implementovať P0 fixes (týždeň 1, ~2 hod) pred ďalšími feature builds. Po P0 + P1 (~3 týždne) je aplikácia pripravená na production hardening.

---

*Audit ukončený 2026-08-19. Pre detaily o funkčnosti a UX pozri `FINAL-FUNC-AUDIT.md` a `FINAL-UI-AUDIT.md`. Pre hlboký security audit pozri `AUDIT-1-SECURITY.md`.*
