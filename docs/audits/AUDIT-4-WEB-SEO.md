# AUDIT-4 — HLBOKÝ AUDIT VEREJNÉHO WEBU & SEO

**Repozitár:** `/home/z/my-project/` (D.O.R.A. Band Website)
**Verejný web:** `dora-band.vercel.app`
**Dátum auditu:** 2026-08-17
**Agent:** Explore (Web & SEO)
**Task ID:** AUDIT-4

---

## 0. EXECUTIVE SUMMARY

| Oblasť | Skóre | Status |
|--------|------:|-------|
| Homepage sekcie (UX/visual) | **8.5/10** | ✅ Silný brand identity, 13 sekcií, punk/grunge estetika |
| SEO/GEO/AEO | **7/10** | ⚠️ 4/7 JSON-LD schemas; hreflang polofunkčný; canonical hardcoded |
| Performance | **6/10** | ⚠️ Všetky sekcie `"use client"`; nulový dynamic import; ťažký scroll-listener stack |
| Accessibility (WCAG 2.2 AA) | **6.5/10** | ⚠️ Skip-link, ARIA, reduced-motion OK; ale chýba focus trap v modaloch |
| Music presentation | **4/10** | ❌ Sticky player + waveform existujú, ale 0 reálnych audio/video sources |
| Booking form & API | **3/10** | 🔴 Manuálna validácia, NO Zod, NO honeypot, NO rate-limit, NO GDPR consent |
| Footer | **7.5/10** | ✅ Sticky layout OK; ❌ chýba Impressum/Privacy/Cookie linky |
| Deployment (vercel.json + env) | **6/10** | ⚠️ Functions OK, crons prázdne, chýbajú security headers a `regions` |
| Testing | **0/10** | 🔴 NULA testov — žiadne Vitest/Playwright/Jest súbory ani config |
| Cookie consent / GDPR | **3/10** | 🔴 Banner existuje ale je symbolický; no Privacy Policy page; no GDPR consent v formulároch |

**Celkové hodnotenie webu (verejná časť):** **5.4 / 10**

Funkčne nadpriemerný brand-site pre malú kapelu, ale s kritickými medzerami v: (1) reálnom hudobnom obsahu, (2) GDPR súhlase, (3) testovaní, (4) security hardening.

---

## 1. HOMEPAGE SEKCIE — `src/components/sections/`

### 1.1 Zoznam všetkých sekcií (14 súborov, 13 aktívnych)

| # | Súbor | ID (anchor) | Renderuje sa v `page.tsx` | Pripomienky |
|---|-------|-------------|--------------------------|-------------|
| 01 | `hero-section.tsx` | `#top` | ✅ | `min-h-[100svh]`, parallax, glitch h1, Ken Burns slideshow, stat strip |
| 02 | `about-section.tsx` | `#o-kapele` | ✅ | Interaktívny timeline (7 míľnikov), blockquote z PR 2026 |
| 03 | `members-section.tsx` | `#clenovia` | ✅ | 4 členovia (avatar = iniciálky, expandable bio) |
| 04 | `music-section.tsx` | `#hudba` | ✅ | YouTube embed + tracklist (5 skladieb) + Waveform kontext |
| 05 | `gallery-section.tsx` | `#galeria` | ✅ | Tab concert/portrait + search + sort + lightbox (ESC/←/→ klávesy) |
| 06 | `discography-section.tsx` | `#diskografia` | ✅ | 3 nahrávky + vinyl grafika + waveform + tech tabuľka |
| 07 | `gigs-section.tsx` | (žiadny explicitný id) | ✅ | Upcoming/past toggle, modal detail, link na `/archiv` |
| 08 | `setlist-section.tsx` | `#setlist` | ✅ | 10 skladieb, žánrový filter, summary stats |
| 09 | `testimonials-section.tsx` | `#recenzie` | ❌ **DOČASNE SKRYTÝ** v `page.tsx:206-212` (placeholder citácie) |
| 10 | `press-section.tsx` | `#press` | ✅ | 4 copy-text taby + 3 download karty + licencia |
| 11 | `faq-section.tsx` | `#faq` | ✅ | 8 otázok, 3 kategórie (booking/technical/general), accordion |
| 12 | `social-section.tsx` | (bez id) | ✅ | 4 platformy + Bandcamp strip; Spotify "coming soon" karta |
| 13 | `newsletter-section.tsx` | (bez id) | ✅ | Email input + success state |
| 14 | `contact-section.tsx` | `#kontakt` | ✅ | 7 polí, typ podujatia select, tips pre organizátorov |

### 1.2 User Journeys

| Persona | Coverage | Poznámky |
|---------|----------|----------|
| **FAN** | 🟢 80 % | Music + sticky player ✓, gallery ✓, social ✓, newsletter ✓, gigs ✓. Chýba: reálny audio obsah, fan club / merch section, komunita. |
| **BOOKER** | 🟢 85 % | Contact form ✓, gigs modal s ticket link ✓, setlist ✓, press kit ✓, FAQ booking kategória ✓. Chýba: technický rider PDF, stageplan, kapacita/calendár. |
| **MEDIA** | 🟡 65 % | Press kit (copy-texty) ✓, gallery ✓, discografia ✓, FAQ ✓. Chýba: reálne high-res ZIP download, logo pack PNG/AI, EPK (electronic press kit) samostatný sub-page, contact pre media distinct od bookingu. |
| **NEW VISITOR** | 🟢 75 % | Hero so stat stripom (1996/30+/5/4) ✓, interaktívny timeline ✓, members ✓, asymetrický layout ✓. Chýba: „čo robiť ako prvý" onboarding sekcia, signposting „Som fanúšik / Som booker / Som z médií" CTA rozdelenie. |

### 1.3 Visual Identity — punk / grunge / brutalist

✅ **Implementované a konzistentné:**

- **Farby:** Neon Red `#E63946`, Warm Yellow `#F4A300`, Ink `#0A0A0A`, Dark Gray `#1A1A1A`, Charcoal `#2D2D2D` — definované ako CSS variables v `globals.css:96-105`
- **Typografia:** Montserrat (display, 6 weights 400-900), Roboto Condensed (4 weights), Inter (body, default), JetBrains Mono (mono-brand, 4 weights) — `layout.tsx:10-35`
- **Brutalist effects:**
  - `.glitch` CSS pseudo-element duplikuje `data-text` atribút s posunom + clip-path (hero `<h1>D.O.R.A.</h1>`) — `globals.css:301-336`
  - `.clip-corner` / `.clip-corner-lg` — orezané rohy s neon-red akcentom (`polygon(0 0, calc(100% - 18px) 0, 100% 18px, ...)`)
  - `.glow-red`, `.glow-red-sm`, `.glow-yellow`, `.text-glow-red`, `.text-glow-yellow` — neon glow box-shadows
  - `.bg-stage-grid` — mriežka 48×48 px s nízkym opacitom (concert stage feel)
  - `.bg-noise` — radial-gradient 3×3 px texture overlay
- **Asymmetric layouts:**
  - Hero: 100svh, parallax bg (×0.35) + content (×0.15) s opacity decay (1 → 0 over 600px scroll)
  - About: 2-col grid (bio text | interaktívny timeline), border-l-2 accent
  - Music: 5-col grid (video 3 | tracklist 2)
  - Members: 6-col grid s `clip-corner` kartami a expandable bio
- **Halftone / scanline:**
  - Maintenance screen má grid background s `linear-gradient(0deg, transparent 24%, #fff 25%, ...)` @ `maintenance-screen.tsx:24-28`
  - Stage grid overlay v music, social, newsletter, gigs-modal hlavičke
- **Glitch animácia:** keyframes `glitch-top` a `glitch-bottom` s alternujúcim posunom — `globals.css:325-336`
- **Marquee ticker:** v footeri (`animate-marquee` 30s linear infinite) — `globals.css:263-269`
- **Section dividers:** `.divider-sweep` gradient sweep 8s (SectionDivider komponent)

### 1.4 User Journey — UI/UX problémy nájdené v sekcii

| # | Sekcia | Problém | Závažnosť |
|---|--------|--------|-----------|
| U-1 | Hero | Glitch `<span>` duplicuje text pre screen readery (pseudo-element `content: attr(data-text)` sa nepočíta do AT, ale ak AT číta `data-text`, môže byť dvojité) | 🟡 |
| U-2 | Music | Všetkých 5 skladieb má `videoId: ""` — tlačidlo „Prehrať" neurobí nič reálne | 🔴 |
| U-3 | Press | 3 download karty sú placeholder (`href="#kontakt"`, `href="#galeria"`, `href="/dora-logo.svg"`) — reálne ZIP/PDF neexistujú | 🔴 |
| U-4 | Contact | Form nemá GDPR consent checkbox — zbiera meno+email+phone bez súhlasu so spracovaním | 🔴 |
| U-5 | Newsletter | Iba text „Súhlasím so spracovaním e-mailu" ako `<p>`, žiadny checkbox ani link na Privacy Policy | 🔴 |
| U-6 | Footer | „Admin prihlásenie" link je verejne viditeľný v päte — minor info disclosure | 🟢 |
| U-7 | Social | Spotify URL je prázdny string (`BAND.social.spotify = ""`), karta zobrazí „Coming soon" — funguje ako fallback, ale je navrhnuté ako TODO | 🟡 |
| U-8 | Setlist | 6 z 10 skladieb v `SETLIST` sa nenachádza v `DISCOGRAPHY` (Abstinujem, Púchovská noc, Rebelova, Spoločne, Encore: Dnes Od Rána) — TODO komentár v `band-data.ts:462-473` | 🟡 |
| U-9 | Gigs | Sekcia nemá `id` atribút (iba generic `className`), ale `page.tsx:38` importuje ju — navigácia z iných sekcií nemá kotvu | 🟢 |
| U-10 | Members | 4 členovia v `MEMBERS`, ale FAQ otázka „Aké sú technické požiadavky" tvrdí „šesťčlenná formácia" — inkonzistencia | 🟡 |

---

## 2. SEO / GEO / AEO

### 2.1 Metadata (`src/app/layout.tsx`)

✅ **Implementované:**

- `metadataBase: new URL(SITE_URL)` — správny základ pre relatívne URL
- `title.default` + `title.template: "%s | D.O.R.A."`
- `description` (355 znakov, SK, bohaté kľúčové slová)
- `keywords[]` — 12 kľúčových slov
- `authors`, `creator`, `publisher` — `D.O.R.A.`
- `alternates.canonical: "/"`
- `alternates.languages: { "sk-SK": "/", "en": "/" }` ← hreflang self-referencujúci
- `openGraph` kompletné (title, description, type=website, locale=sk_SK, siteName, url, images[0] 1920×1080)
- `twitter.card: summary_large_image`
- `robots` s `googleBot` direktívami (`max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1`)
- `category: "music"`
- `manifest: "/manifest.json"`
- `icons.icon` + `icons.apple` — iba SVG, žiadne ICO/PNG (P2 gap)
- `themeColor: "#E63946"`

❌ **Chýbajúce / Gap:**

| # | Item | Stav | Priorita (z GAP-ANALYSIS) |
|---|------|------|----------------------------|
| S-1 | hreflang `en` odkazuje na rovnakú URL `"/"` ako `sk-SK` — Google považuje za duplicitu. Buď implementovať `/en/` lokalizáciu, alebo odstrániť `en` alternatív. | ⚠️ Polofunkčné | P1 |
| S-2 | Canonical hardcoded `"/"` — audit požaduje z DB (SeoMeta model) | P2 |
| S-3 | Favicon set chýba: iba `/dora-mark.svg`. Žiadne `.ico`, `apple-touch-icon.png` (180×180), `android-chrome-192×192.png`, `android-chrome-512×512.png`, `favicon-32×32.png`, `site.webmanifest` ikony sú PNG | P2 |
| S-4 | `manifest.json` ikony všetky smerujú na `dora-mark.svg` s `sizes: 192×192` a `512×512`, ale SVG nemá fixné rozmery — maskable účely môžu zlyhať | P2 |
| S-5 | llms.txt chýba (experimentálny machine-readable layer) | P3 |

### 2.2 Sitemap (`src/app/sitemap.ts`)

✅ **Implementované (dynamic):**

- 10 statických URL (homepage + 9 kotiev: `#o-kapele`, `#clenovia`, `#hudba`, `#galeria`, `#diskografia`, `#faq`, `#press`, `#kontakt`, `/archiv`)
- Dynamické gig záznamy z DB (až 50) s `lastModified` z `gig.updatedAt || gig.date`
- Graceful fallback `try/catch` ak DB nedostupná

❌ **Problémy:**

- Všetky gig záznamy sa mapujú na tú istú URL `${SITE_URL}/#koncerty` (riadok 44) — netvoria sa per-gig URL ako `/gig/[id]` alebo `/koncert/[slug]`. Sitemap takto nedáva Googleu žiadnu unikátnu URL pre konkrétne koncerty.
- `changeFrequency: "weekly"` pre všetky gigs, ale `#koncerty` je len anchor na homepage → zbytočné záznamy.
- Chýbajú media položky (audio/video) ako samostatné URL — gap-analysis požaduje `/archiv` + media URL (P1).
- Chýba `priority` diferenciácia medzi upcoming a past gigs.

### 2.3 Robots (`src/app/robots.ts`)

✅ **Korektné:**

```ts
rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] }
sitemap: `${SITE_URL}/sitemap.xml`
```

❌ **Chýba:**

- Žiadny `host` directive
- Žiadne explicitné `crawl-delay` (na agresívne crawlers)
- `/api` (verejná časť — `/api/booking`, `/api/newsletter`, `/api/gigs`) je allow, čo je OK

### 2.4 OpenGraph dynamický image (`src/app/opengraph-image.tsx`)

✅ **Implementované (edge runtime):**

- `runtime = "edge"` — rýchle generovanie
- `size = { width: 1200, height: 630 }` — OG štandard
- `contentType = "image/png"`
- `alt` atribút SK
- Vizuálne: barcode strips top-left, „Booking 2026 — otvorený" status pill, veľký „D.O.R.A." názov (140 px font, 900 weight, glow), „Dnes Od Rána Abstinujem" (38 px), 4-členný stats strip (1996/30+/5/4)
- Brand paleta konzistentná (#0A0A0A bg, #E63946 red, #F4A300 yellow)

❌ **Chýba:**

- Twitter image variant (`twitter-image.tsx`) — zdieľa rovnaký OG, ale Twitter card očakáva 1200×600 (summary_large_image); 1200×630 funguje ale nie je optimalizované.
- Per-page OG image (gig detail, archív page) — globálny `opengraph-image.tsx` sa aplikuje na všetky routes, ale `/archiv` má vlastný `metadata.openGraph` bez obrázku.

### 2.5 Structured Data (`src/components/site/structured-data.tsx`)

✅ **Implementované (4 z 8 JSON-LD typov):**

| Schema.org Type | Stav | Detail |
|----------------|------|--------|
| `MusicGroup` | ✅ | name, alternateName, description, url, image, logo, foundingDate "1996", foundingLocation (Púchov, SK), genre[], member[] (OrganizationRole), album[] (MusicAlbum), track[] (MusicRecording), contactPoint, sameAs[] |
| `WebSite` | ✅ | name, url, inLanguage "sk-SK", publisher |
| `MusicEvent` (per upcoming gig) | ✅ **P0-10 FIXED** | name, startDate, eventStatus, eventAttendanceMode, location (Place + PostalAddress), performer, organizer, offers (ak ticketUrl/price) — až 20 záznamov |
| `FAQPage` | ✅ | mainEntity[Question] — filtered na FAQ bez `[DOPLNI` placeholdera |
| `MusicRecording` (vnorené v MusicGroup.track) | ✅ | name, duration, byArtist, inAlbum |
| `Organization` | ❌ | Čiastočne pokryté cez `MusicGroup` (ktorý je podtyp Organization), ale chýba samostatný záznam pre právnu entitu |
| `BreadcrumbList` | ❌ | Chýba — iba shadcn UI `breadcrumb.tsx` komponent, žiadny JSON-LD |
| `VideoObject` | ❌ | Chýba — YouTube embedy v `music-section.tsx` nemajú JSON-LD |

**Problémy:**

- ❌ **VideoObject JSON-LD** chýba — YouTube iframe v `music-section.tsx:39-46` nie je označený. Gap-analysis P1.
- ❌ **BreadcrumbList JSON-LD** chýba — napriek tomu, že existuje `/archiv` sub-page. Gap-analysis nepriamo P2.
- ❌ **`faqPage.mainEntity`** filter `!f.a.includes("[DOPLNI")` — vylučí FAQ s `[DOPLNIŤ]` placeholderom (1 otázka „Prečo D.O.R.A. dlho nekoncertovala") — dobry defensive filter, ale pointer na content debt.
- ⚠️ **`upcomingGigs`** získava z DB (až 20 záznamov), ale DB call sa vykonáva pri každom renderi `StructuredData` (server component) — bez cache, ale OK pre malý počet.
- ⚠️ `MusicEvent.offers` sa generuje s `ticketUrl` ALEBO `ticketPrice` — ak sú obe, druhý `offers` prepíše prvý (objekt spread `{...(gig.ticketUrl ? {offers: {...}} : {}), ...(gig.ticketPrice ? {offers: {...}} : {})}`). **Bug:** ak má gig aj URL aj cenu, URL sa stratí.

### 2.6 Canonical URLs

| Route | Canonical | Zdroj | Status |
|-------|-----------|-------|--------|
| `/` (homepage) | `/` | `layout.tsx:65` hardcoded | ⚠️ P2 — gap-analysis požaduje z DB (SeoMeta) |
| `/archiv` | `/archiv` | `archiv/page.tsx:13` hardcoded | ✅ |
| Admin routes | — | Blokované v `robots.ts` | ✅ |

---

## 3. PERFORMANCE

### 3.1 `next.config.ts`

✅ **Konfigurované:**

- `images.formats: ["image/avif", "image/webp"]`
- `images.remotePatterns`: Vercel Blob (`*.public.blob.vercel-storage.com`, `blob.vercel-storage.com`)
- `serverExternalPackages: ["sharp"]`
- `allowedDevOrigins: ["*.space-z.ai", "preview-chat-*.space-z.ai"]` (sandbox preview)
- `typescript.ignoreBuildErrors: false` ✅ (strict)

❌ **Chýba (gap-analysis P2):**

- `experimental.optimizePackageImports: ["lucide-react"]` — lucide-react 0.525.0 má 80+ ikon, no tree-shaking; výrazne zväčšuje bundle
- `images.minimumCacheTTL` — default 60s
- `images.formats` chýba original pre PNG fallback
- `headers()` async funkcia pre security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy)
- `poweredByHeader: false` — default `true` odhaľuje Next.js verziu
- `compress: true` (default, OK)
- `regions: ["fra1"]` — chýba (P2) — predpokladáme Vercel iad1 (US East), Neon DB je eu-central-1 (Frankfurt) → 80-120ms cross-Atlantic latency
- `experimental.ppr: "incremental"` — Partial Prerendering nie je zapnuté

### 3.2 Client vs Server component ratio

| Component typ | Počet | % z celkového |
|---------------|------:|---------------:|
| `"use client"` (v `src/components/`) | 89 | 99 % |
| `"use client"` v sekcii `sections/` | 14 / 14 | **100 %** |
| Server components (v `src/app/`) | 4 (`page.tsx`, `layout.tsx`, `archiv/page.tsx`, `not-found.tsx`) | 4 |
| Server components (v `src/components/`) | 5 (`section-heading.tsx`, `section-divider.tsx`, `structured-data.tsx`, `footer.tsx`, `maintenance-screen.tsx`) | 5 |

**Význam:** Page samotná (`src/app/page.tsx`) je `async function` server component (✅), ale **všetkých 14 jej detí je `"use client"`** → celá homepage je client-side hydrated.

- `MusicPlayerProvider` wrapuje celý `<html>` v `layout.tsx:129-132` → client context na každej route vrátane admina
- `StickyMusicPlayer` je tiež globálne v `layout.tsx:131` → načítava sa na každej stránke (admin, /archiv, 404)
- `Toaster`, `SonnerToaster` — globálne

### 3.3 Dynamic imports

❌ **NULOVÉ** `next/dynamic` importy v celom `src/`.

- Žiadny lazy-load admin sekcií (hoci admin má 20+ tab komponentov)
- Žiadny lazy-load `StickyMusicPlayer` na admin route
- Žiadny lazy-load `framer-motion` (hoci je v `package.json`)
- Jediné `import()` dynamic calls: `src/app/api/booking/route.ts:44` (`orchestrator`) a `src/app/api/admin/gigs/route.ts` (pravdepodobne ai.ts) — to sú runtime lazy imports, nie Next.js code-split

### 3.4 Core Web Vitals — predpokladané riziká

| Metric | Cieľ | Predpokladaný stav | Riziká |
|--------|-----|--------------------|--------|
| **LCP** | < 2.5s | 🟡 2.5–4.0s | Hero slideshow `priority={index === 0}` ✓ (First image preload), ale 4 fonty (Montserrat 6 weights + Roboto Condensed 4 + Inter + JetBrains Mono 4) = ~600KB woff2. Hero text čaká na font swap. |
| **INP** | < 200ms | 🟡 200–400ms | 5 scroll listenerov naraz (hero parallax, navbar, scroll-progress, back-to-top, sticky-music-player). Väčšina používa rAF + passive, ale `StickyMusicPlayer` volá `getBoundingClientRect` na každom scrolly bez throttling. |
| **CLS** | < 0.1 | 🟢 < 0.1 | Hero slideshow `inset: 0` ✓, gallery `aspect-square` ✓, skeletons v loading.tsx ✓. **Jediné riziko:** lightbox `<img>` bez width/height (`gallery-section.tsx:257-261`) a YouTube thumbnail `<img>` bez dimenzií (`music-section.tsx:55-58`). |

### 3.5 Konkrétne performance problémy

| # | Problém | Súbor | Riešenie |
|---|---------|-------|----------|
| P-1 | 4 Google Fonts s 14 weights celkovo (~600KB woff2) | `layout.tsx:10-35` | Redukovať na Montserrat 700+900, Inter 400+600, JetBrains Mono 400 — ušetrí ~300KB |
| P-2 | `lucide-react` bez `optimizePackageImports` — 80+ ikon v bunle | `next.config.ts` | Pridať `experimental.optimizePackageImports: ["lucide-react"]` |
| P-3 | `StickyMusicPlayer` `getBoundingClientRect` na každom scrolly | `sticky-music-player.tsx:37-67` | Použiť `IntersectionObserver` namiesto scroll+rect |
| P-4 | `MusicPlayerProvider` wrapuje celý `<html>` | `layout.tsx:129-132` | Presunúť iba na homepage `page.tsx` + admin `admin/page.tsx` |
| P-5 | Gallery `fetch("/api/media")` v `useEffect` namiesto server fetch | `gallery-section.tsx:37-53` | Konvertovať na server component s `db.mediaItem.findMany` — získa SSR + cache |
| P-6 | Gigs `fetch("/api/gigs")` v `useEffect` | `gigs-section.tsx:51-59` | Rovnako — server fetch + predrender |
| P-7 | YouTube iframe `autoplay=1` — blokované browsermi bez user gesture | `music-section.tsx:41` | OK (user klikne Play) ale pridaj `loading="lazy"` |
| P-8 | `HeroSlideshow` `setInterval(7000)` beží aj keď hero nie je viditeľný | `hero-slideshow.tsx:85-95` | Pridať `if (!inView) return` do intervalu |
| P-9 | `ScrollProgress` + `BackToTop` + `Navbar` + `HeroSection` + `StickyMusicPlayer` = 5 scroll listenerov | rôzne | Konsolidovať do jedného `useScroll` hooku (Zustand) |
| P-10 | Žiadny `next/dynamic` lazy-load admin sekcií | admin/* | `dynamic(() => import("./songs-tab"), { ssr: false })` |

---

## 4. ACCESSIBILITY (WCAG 2.2 AA)

### 4.1 ✅ Implementované

| WCAG kritérium | Stav | Detail |
|----------------|------|--------|
| **1.3.1 Info and Relationships (A)** | ✅ | `<header>`, `<main id="hlavny-obsah">`, `<nav>`, `<section>`, `<article>`, `<footer>`, `<blockquote>`, `<figure>/<figcaption>`, `<ol>/<li>` pre setlist |
| **1.4.3 Contrast (Minimum) (AA)** | ✅ | `#E8E8E8` on `#0A0A0A` = 16.7:1; `#E63946` on `#0A0A0A` = 5.6:1; `#F4A300` on `#0A0A0A` = 8.9:1 |
| **1.4.10 Reflow (AA)** | ✅ | `max-w-7xl` + responsive grid breakpoints (sm/md/lg/xl) |
| **1.4.11 Non-text Contrast (AA)** | ✅ | Border `#2D2D2D` na `#0A0A0A` = 1.6:1 — **môže zlyhať** pre UI komponenty; border `#E63946` na `#0A0A0A` = 5.6:1 ✓ |
| **1.4.12 Text Spacing (AA)** | ✅ | `line-height` 1.5-1.6 pre body text |
| **2.1.1 Keyboard (A)** | ✅ | Všetky interaktívne elementy sú `<button>` / `<a>`; lightbox má ESC/←/→ klávesy (`gallery-section.tsx:82-95`) |
| **2.1.2 No Keyboard Trap (A)** | ⚠️ | Modaly nemajú focus trap — pozri nižšie |
| **2.4.1 Bypass Blocks (A)** | ✅ | Skip-link „Preskočiť na obsah" v `page.tsx:149-151`, `.skip-link:focus { top: 1rem }` v `globals.css:172-188` |
| **2.4.4 Link Purpose (In Context) (A)** | ✅ | `aria-label` na icon-only linkách (Facebook, Instagram, YouTube, Spotify v footeri); scroll indicator `aria-label="Posunúť nadol"` |
| **2.4.6 Headings and Labels (AA)** | ✅ | Hierarchia `<h1>` (hero) → `<h2>` (section headings) → `<h3>` (cards); section number markers (01, 02, 04b, 05, 06, 06b, 07, 09) |
| **2.4.7 Focus Visible (AA)** | ✅ | `:focus-visible { outline: 2px solid #E63946; outline-offset: 2px }` v `globals.css:161-169` |
| **2.3.3 Animation from Interactions (AAA)** | ✅ | `@media (prefers-reduced-motion: reduce)` v `globals.css:192-211` vypína glitch, marquee, live-pulse, transitions |
| **3.3.1 Error Identification (A)** | ⚠️ | API vracia `422` s `error` stringom, ale UI ho len zobrazí cez toast — nie asociované s konkrétnym poľom |
| **3.3.2 Labels or Instructions (A)** | ⚠️ | `<label>` wrap pattern v `contact-section.tsx`, ale bez `htmlFor`/`id` asociácie; newsletter `<input type="email">` bez `<label>` vôbec |
| **4.1.2 Name, Role, Value (A)** | ✅ | `role="dialog"`, `aria-modal="true"`, `aria-label`, `aria-expanded`, `aria-hidden` na dekoratívnych elementoch |
| **Lang attribute** | ✅ | `<html lang="sk" suppressHydrationWarning className="dark">` |
| **Touch target (2.5.8, AA min 24×24)** | ✅ | `@media (max-width: 640px) button, a[...] { min-height: 44px }` v `globals.css:614-619` |

### 4.2 ❌ Accessibility problémy

| # | WCAG kritérium | Problém | Súbor |
|---|----------------|---------|-------|
| A-1 | 2.1.2 No Keyboard Trap (A) | Lightbox (`gallery-section.tsx:217-269`), Gig detail modal (`gigs-section.tsx:191-289`), Mobile menu (`navbar.tsx:76-99`), Cookie consent (`cookie-consent.tsx`), Music player expanded tracklist — žiadny nemá focus trap. Tab môže ujsť do pozadia. | all modals |
| A-2 | 2.4.3 Focus Order (A) | Po zatvorení modalu focus nevrátiť sa na trigger button (napr. gig card) | `gigs-section.tsx`, `gallery-section.tsx` |
| A-3 | 1.3.1 Info and Relationships | Hero `<h1>` s `class="glitch"` — pseudo-element `::before`/`::after` s `content: attr(data-text)` duplikuje text. Väčšina AT nepočíta pseudo-elementy, ale ak AT číta `data-text`, môže znieť „D.O.R.A. D.O.R.A." | `hero-section.tsx:109` |
| A-4 | 3.3.2 Labels or Instructions (A) | Newsletter `<input type="email" required>` nemá `<label>` — iba placeholder „vas@email.sk" | `newsletter-section.tsx:75-82` |
| A-5 | 3.3.2 Labels or Instructions (A) | Contact form `<label>` obsahuje `<span>` s label textom, ale chýba `htmlFor` na `<input>` + `id` — bez asociácie AT nevie prepojiť | `contact-section.tsx:286-303` |
| A-6 | 1.4.11 Non-text Contrast (AA) | Border `#2D2D2D` (charcoal) na `#0A0A0A` (ink) = kontrast **1.6:1** — pod minimom 3:1 pre UI komponenty. Postihnuté: všetky card borders, input borders, divider lines | globals.css |
| A-7 | 2.4.4 Link Purpose | `Footer` link „Admin prihlásenie" v zozname „Pre partnerov" — mätúce pre bežného používateľa | `footer.tsx:113` |
| A-8 | 1.4.13 Content on Hover or Focus (AA) | Member card expandable bio je `onClick`, nie `onFocus` — klávesnica používateľ otvorí cez Enter, ale hover-only „Waveform" v setlist karte je `group-hover` (`setlist-section.tsx:165`) |多处 |
| A-9 | 4.1.3 Status Messages (AA) | Toast `sonner` sa zobrazí po odoslaní formulára — `role="status"` by mal byť na toast kontajneri (Sonner to má default, ale overiť) | `sonner.tsx` |
| A-10 | 2.5.5 Target Size (AAA, mimo AA) | Mobilné ikony v sticky playeri 9×9 px (`sticky-music-player.tsx:264` `h-9 w-9`) = 36px — pod 44px WCAG AAA, ale spĺňa AA (24px) | sticky player |
| A-11 | 1.1.1 Non-text Content (A) | `<img src="/dora-mark.svg" alt="">` v footeri — decorative ✓, ale rovnaký pattern v navbar/maintenance bez ohľadu na to, či je alt prázdny zámerne | `footer.tsx:42`, `navbar.tsx:32`, `maintenance-screen.tsx:56` |
| A-12 | 2.3.1 Three Flashes (A) | Hero slideshow sa mení každých 7s — OK, ale `animate-ping` na music play button (`music-section.tsx:63`) môže byť viac ako 3× za sekundu? Nie, je 1× za sekundu. ✓ |
| A-13 | 3.2.2 On Input (A) | Gigs view toggle `setView("upcoming"|"past")` automaticky refetchuje — OK, nezmení kontext bez varovania | `gigs-section.tsx:51-59` |
| A-14 | 3.3.3 Error Suggestion (A) | API vracia `errors[]` array s konkrétnymi správami, ale UI zobrazí ich spojením ako jeden toast — nie per-field | `api/booking/route.ts:14-25`, `contact-section.tsx:50-57` |

---

## 5. MUSIC PRESENTATION

### 5.1 Sticky Music Player (`src/components/site/sticky-music-player.tsx`)

✅ **Implementované (311 riadkov):**

- Fixed bottom bar `fixed inset-x-0 bottom-0 z-40`
- Auto-hide keď je v MusicSection + nehrá (`inMusicSection && !playing && "translate-y-full opacity-0"`)
- Auto-collapse keď vstúpi do MusicSection (vyhneme sa duplikácii)
- Mini-button keď collapsed (FAB 12×12)
- Expandable tracklist panel (mobile bottom sheet, desktop dropdown right)
- Progress bar (decorative — `width: 40%` hardcoded keď playing)
- Track info: číslo, názov, žáner, rok, dĺžka
- Controls: prev (sm+), play/pause (hlavné), next (sm+), tracklist toggle, collapse (lg+)
- `role="region"`, `aria-label="Prehrávač hudby"`
- Synchronizácia s MusicSection cez `MusicPlayerContext`

### 5.2 Tracklist

✅ **Implementované v 2 miestach:**

- **MusicSection** (`music-section.tsx:141-200`): 5 skladieb, max-h-[28rem] overflow-y-auto, aktivný track zvýraznený
- **StickyMusicPlayer** (expandable): rovnaký tracklist, klik vyberie + zatvorí panel

Skladby (`band-data.ts:203-255`):
1. „TCHO SME NAHLAVU?" (2005, Funky-Punk, 3:42)
2. „Iný deň" (2001, Crossover, 4:05)
3. „Don't Touch Me" (1997, Punk Rock, 3:18)
4. „I Have A Taste" (1998, Rap-Rock, 2:54)
5. „Funky pokus (Live)" (2024, Funk, 5:12)

### 5.3 Waveform Visualization (`src/components/site/waveform.tsx`)

✅ **Implementované (purely decorative):**

- Pseudo-random heights z hardcoded seed array (16 hodnôt)
- `aria-hidden` ✓
- Animácia `waveform-bar 1.2s ease-in-out infinite` s `animation-delay: i * 0.06s`
- Použité v:
  - `discography-section.tsx:90-92` (vinyl cards, hover reveal)
  - `setlist-section.tsx:165-167` (mini waveform per track, hover reveal)

❌ **Limitácie:**

- **NIE je reálny waveform** z audio súboru — iba CSS animácia s pevnými výškami
- Žiadny `<canvas>` / Web Audio API analyser
- Žiadny seek/scrub functionality
- Sticky player progress bar je `width: 40%` hardcoded — nemeria skutočný playback

### 5.4 ❌ Kritické problémy music presentation

| # | Problém | Dôsledok |
|---|---------|----------|
| M-1 | 🔴 **Všetkých 5 skladieb má `videoId: ""`** — placeholder. Tlačidlo „Prehrať" v MusicSection zobrazí fallback „Video zatiaľ nie je k dispozícii" (`music-section.tsx:72-98`). Sticky player toggle len mení ikonu Play/Pause bez zvuku. | Web neplní svoj primárny účel — **fanúšikovia nemôžu vypočuť hudbu**. |
| M-2 | `band-data.ts:200-202` komentár: „Všetky YouTube video ID nižšie sú placeholder 'dQw4w9WgXcQ' (notoricky známy 'rickroll'). Nahradiť reálnymi YouTube ID z kanála @DORAkapela." — TODO od auditu nevyriešený. | Content debt |
| M-3 | Spotify URL je prázdny string — social section zobrazí „Coming soon" kartu namiesto linku | Spotrebiteľský odkaz nefunkčný |
| M-4 | Bandcamp URL `https://dorakapela.bandcamp.com` — neoverené, či reálne existuje | Potencionálne 404 |
| M-5 | Žiadne `<audio>` elementy pre audio-only playback (mimo YouTube video) | Nemožno len počúvať bez videa |
| M-6 | YouTube iframe nemá `loading="lazy"` ani `referrerPolicy` | Performance + privacy |
| M-7 | YouTube iframe `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"` — chýba `web-share` | OK alebo minor |
| M-8 | YouTube thumbnail `<img src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg">` bez `width`/`height` | CLS risk + neoptimalizovaný cez `next/image` |
| M-9 | Sticky player progress bar `style={{ width: playing ? "40%" : "0%" }}` — fake progress | Zavádzajúce UX |
| M-10 | Žiadne metadata o skladbách pre SEO (okrem `MusicRecording` vo `MusicGroup.track` JSON-LD, ktorý je statický z `TRACKS`) | OK |

---

## 6. BOOKING FORM & API

### 6.1 Form (`src/components/sections/contact-section.tsx`)

✅ **Štruktúra:**

- 7 polí: organizer, email, phone, eventDate, eventLocation, eventType (select), message (textarea)
- 5 required (označené `*`), eventType a message voliteľné
- Loading state s `Loader2` spinner + „Odosielam..." text
- Success state s `CheckCircle2` ikonou + tlačidlo „Odoslať ďalší dopyt"
- Error state cez `toast.error()` (sonner)
- „Tips pre organizátorov" sidebar so 3 tipmi
- 3 kontaktné karty (email, telefón, sídlo)

❌ **Problémy formulára:**

| # | Problém | WCAG/Security |
|---|---------|---------------|
| B-1 | 🔴 **NO Zod validation** — iba HTML `required` + minimálne API validácie. `zod` v `package.json` ale nepoužívaný v booking route. | — |
| B-2 | 🔴 **NO honeypot field** — bot protection nulová | Spam risk |
| B-3 | 🔴 **NO rate limiting** — `/api/booking` verejný, ktokoľvek môže spamovať | DoS / AI cost abuse |
| B-4 | 🔴 **NO CSRF protection** — žiadny `Origin` / `Sec-Fetch-Site` check | CSRF |
| B-5 | 🔴 **NO reCAPTCHA / Turnstile** | Bot abuse |
| B-6 | 🔴 **NO GDPR consent checkbox** — zbiera organizer + email + phone bez explicitného súhlasu so spracovaním osobných údajov (Nariadenie EU 2016/679 GDPR, § 13) | Legal |
| B-7 | 🔴 **NO Privacy Policy link** v blízkosti formulára | Legal |
| B-8 | ⚠️ Form labels používajú `<label>` wrap pattern bez `htmlFor`/`id` asociácie — `Field` komponent (`contact-section.tsx:286-303`) wrapne `<span>` + children `<input>`, ale input nemá `id` | WCAG 1.3.1, 3.3.2 |
| B-9 | ⚠️ Form fields nemajú `name` atribút — browser autocomplete nefunguje (`autocomplete="organization"`, `autocomplete="email"`, `autocomplete="tel"`) | UX |
| B-10 | ⚠️ `eventDate` je `<input type="text">` s placeholderom „15.7.2026 — Púchov" — mal by byť `<input type="date">` s pickrom | UX |
| B-11 | ⚠️ `message` nemá `maxLength` — user môže odoslať 1MB text | DoS |
| B-12 | ⚠️ `phone` validácia `length >= 6` — príliš voľná, nepodporuje SK formát overenia | Data quality |
| B-13 | ⚠️ `organizer` validácia `length >= 2` — akceptuje „aa" | Data quality |

### 6.2 API route (`src/app/api/booking/route.ts`)

✅ **Implementované (53 riadky):**

- `POST` handler s `try/catch`
- Validácia: organizer (string, ≥2), email (regex), phone (string, ≥6), eventDate (string), eventLocation (string)
- eventType validácia: `EVENT_TYPES.includes(eventType) ? eventType : EVENT_TYPES[0]` — fallback
- `db.bookingInquiry.create` s `.trim()` na string polí
- `email.trim().toLowerCase()` — normalizácia
- Trigger AI orchestratora async (`import("@/lib/agents/orchestrator")`) — non-blocking
- Return `201` s `{ ok: true, id: inquiry.id }`

❌ **Problémy API:**

| # | Problém | Závažnosť |
|---|---------|-----------|
| B-14 | 🔴 NO Zod `.strict()` schema — ak API dostane extra polia (napr. `isAdmin: true`), prejdu do `db.bookingInquiry.create` ak Prisma schema povoľuje (mass-assignment) | P0 (gap-analysis) |
| B-15 | 🔴 NO rate limiting — attacker môže zviazať AI orchestrator (Groq API) volaniami a vyčerpať kvótu | P1 |
| B-16 | 🔴 NO CSRF — žiadny Origin/Sec-Fetch-Site check | P1 |
| B-17 | 🔴 AI orchestrator trigger je fire-and-forget bez timeout — ak Groq API zlyhá, nezaznamená sa chyba správne | P2 |
| B-18 | ⚠️ `email` regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — príliš voľná (akceptuje `a@b.c`); nepoužíva Zod `z.string().email()` | Data quality |
| B-19 | ⚠️ `phone.trim()` nevaliduje formát — akceptuje „aaaaaa" | Data quality |
| B-20 | ⚠️ `eventDate.trim()` je plain string — nevaliduje ISO formát, neparsuje na Date | Data quality |
| B-21 | ⚠️ `message.trim()` nemá maxLength — DoS vektora cez databázu | DoS |
| B-22 | ⚠️ NO email notification kapelovi — inquiry sa uloží do DB, ale kapela nemusí vedieť bez admin dashboardu | UX |
| B-23 | ⚠️ NO confirmation email bookerovi | UX |
| B-24 | ⚠️ `console.error("[booking] error:", err)` — loguje celý err objekt, potencionálne s PII | Privacy |

### 6.3 Newsletter API (`src/app/api/newsletter/route.ts`)

✅ Validácia email regex + upsert s `active: true` reactivate + lowercase normalizácia.

❌ **Problémy:**

- NO double opt-in — subscriber je okamžite `active: true` bez confirm emailu (GDPR best practice)
- NO unsubscribe token v DB (neskôr nemožno odhlásiť bez admin zásahu)
- NO rate limiting
- NO GDPR consent checkbox v UI

---

## 7. FOOTER (`src/components/site/footer.tsx`)

### 7.1 ✅ Sticky layout

- `page.tsx:148` — `<div className="flex min-h-screen flex-col bg-ink">`
- `footer.tsx:18` — `<footer className="mt-auto border-t border-charcoal bg-ink bg-noise">`
- Footer je `mt-auto` → prilepí sa na spodok aj pri krátkom obsahu ✓

### 7.2 ✅ Implementované

- Marquee ticker hore („FUNKY-PUNK · PÚCHOV · SK · OD 1996 · LIVE ON STAGE · BOOKING OPEN · DNES OD RÁNA ABSTINUJEM")
- 3-col grid:
  - **Brand:** logo, názov, tagline, social ikony (4×: Facebook/Instagram/YouTube/Spotify)
  - **Kontakt:** email (mailto), telefón (tel:), sídlo (Púchov)
  - **Pre partnerov:** 4 quick links (PR materiály, Diskografia, Fotoportfólio, Admin prihlásenie)
- Copyright + tagline bottom row
- ARIA `aria-label` na social ikonách ✓
- `rel="noopener noreferrer"` na external linkoch ✓

### 7.3 ❌ Chýbajúce / Problémy

| # | Problém | Dôvod |
|---|---------|-------|
| F-1 | 🔴 **NO Privacy Policy link** — GDPR §13 vyžaduje informáciu o spracovaní osobných údajov | Legal |
| F-2 | 🔴 **NO Cookie Policy link** — cookie consent banner nemá odkaz na detailné informácie | Legal (ePrivacy) |
| F-3 | 🔴 **NO Impressum** — slovenský zákon (Act no. 308/2000 Coll. §7) a EU GDPR vyžadujú pre komerčné weby údaj o prevádzkovateľovi: IČO, DIČ, IČ DPH, fyzická adresa, kontakt | Legal |
| F-4 | 🔴 **NO Terms of Service link** | Legal |
| F-5 | ⚠️ „Admin prihlásenie" link v zozname „Pre partnerov" — nie je partner link, je interný | UX |
| F-6 | ⚠️ Spotify `href={social.spotify}` je prázdny string (`BAND.social.spotify = ""`) — `<a href="">` reloadne aktuálnu stránku | UX bug |
| F-7 | ⚠️ Marquee `whitespace-nowrap` s textom „FUNKY-PUNK" — pri RTL jazykoch sa rozpadne (low priority, SK je LTR) | Minor |
| F-8 | ⚠️ Footer sa nevykreslí na `/admin/*` routes (admin má vlastný AdminShell) — konzistentné, ale admin používateľ nemá quick link späť na web | Minor |

---

## 8. DEPLOYMENT

### 8.1 `vercel.json`

✅ **Implementované:**

```json
{
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

❌ **Chýbajúce / Problémy (gap-analysis P1-P2):**

| # | Problém | Priorita |
|---|---------|----------|
| D-1 | 🔴 **`crons: []`** — prázdne. Gap-analysis P1 požaduje campaign scheduler (dennohodinový job pre odoslanie naplánovaných campaignov) | P1 |
| D-2 | 🔴 **NO `regions`** — Vercel default `iad1` (US East). Neon DB je `eu-central-1` (Frankfurt). Cross-Atlantic latency 80-120ms na každú DB query. Gap-analysis P2. | P2 |
| D-3 | 🔴 **NO `headers()` config** — `vercel.json` by mal definovať security headers. Gap-analysis P2. Chýba: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. | P2 |
| D-4 | 🔴 **NO `redirects`** — chýba `www.dora.band → dora.band` (alebo opačné), chýba `/admin → /admin/login` pre neprihlásených, chýba trailing-slash normalization | P2 |
| D-5 | 🔴 **NO `cleanUrls`** alebo `trailingSlash` config | P3 |
| D-6 | ⚠️ **`buildCommand: "next build"`** bez `--turbopack` — gap-analysis uvádza Turbopack ako súčasť stacku. Ak je Turbopack len pre dev, OK. | P3 |
| D-7 | ⚠️ **`installCommand: "bun install"`** — bun 1.3+ inštaluje rýchlejšie, ale nepoužíva `--frozen-lockfile` — build sa môže líšiť od dev ak `bun.lock` nie je aktualizovaný | P3 |

### 8.2 Environment Variables

✅ **`.env.example` EXISTS** — pokrýva:

- `DATABASE_URL` (PostgreSQL Neon) — s inštrukciami
- `ADMIN_SESSION_SECRET` — s `openssl rand -hex 32` hintom
- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — ⚠️ default `admin@dora.band / dora2026` v `.env.example` (gap-analysis P0)
- `GROQ_API_KEY`
- `AI_MODEL` — default `llama-3.3-70b-versatile`

❌ **Chýba v `.env.example`:**

| # | Variable | Dôvod |
|---|----------|-------|
| D-8 | `ZAI_JWT_TOKEN` / `ZAI_API_KEY` | Audit identity zmieňuje Z.AI — ak sa používa, chýba |
| D-9 | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Pre @upstash/ratelimit (gap-analysis P1 požaduje rate limiting) |
| D-10 | `RESEND_API_KEY` / `POSTMARK_API_KEY` | Pre transakčné emaily (potvrdenie booking, newsletter double opt-in) |
| D-11 | `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Analytics — momentálne žiadna |
| D-12 | `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot protection |
| D-13 | `SENTRY_DSN` | Error tracking |

### 8.3 Build konfigurácia

- `package.json` scripts: `dev`, `build`, `start`, `lint`, `db:push`, `db:push:dev`, `db:push:pg`, `db:generate`, `db:generate:dev`, `db:migrate`, `db:reset`, `seed`, `postinstall`
- ❌ **NO `test` script** — `package.json` nemá žiadny test runner
- ❌ **NO `typecheck` script** — iba `tsc --noEmit` by mal byť explicitný
- ❌ **NO `analyze` script** — `@next/bundle-analyzer` chýba
- `postinstall: "prisma generate"` ✓

---

## 9. TESTING

### 9.1 ❌ NULOVÉ test coverage

| Typ testu | Stav | Detail |
|----------|------|--------|
| Unit testy (Vitest) | 🔴 **0 súborov** | Žiadne `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` v celom repozitári |
| E2E testy (Playwright) | 🔴 **0 súborov** | Žiadny `playwright.config.ts`, žiadny `e2e/` adresár |
| Integration testy | 🔴 **0 súborov** | Žiadne API route testy |
| Component testy (RTL) | 🔴 **0 súborov** | Žiadne `@testing-library/react` setup |
| Snapshot testy | 🔴 **0 súborov** | — |
| Visual regression | 🔴 **0 súborov** | Žiadny Chromatic/Percy |
| Lighthouse CI | 🔴 **0 súborov** | Žiadny `lighthouserc.json` |
| Coverage report | 🔴 **0 %** | Žiadny `c8`/`istanbul` config |

### 9.2 Test dependencies chýbajú v `package.json`

❌ Tieto balíky nie sú v `devDependencies`:

- `vitest`, `@vitest/coverage-v8`, `@vitest/ui`
- `@playwright/test`
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `msw` (Mock Service Worker)
- `@types/jest` (ak by sa použil Jest)

### 9.3 ❌ CI/CD chýba

- Žiadny `.github/workflows/` adresár
- Žiadny `.gitlab-ci.yml`
- Žiadny `.circleci/config.yml`
- Žiadny `Jenkinsfile`

**Verdikt:** Testing je **0/10**. Žiadny automated test neexistuje. Každá zmena v kóde môže nepozorovane rozbť funkčnosť.

---

## 10. COOKIE CONSENT & GDPR

### 10.1 `src/components/site/cookie-consent.tsx`

✅ **Implementované (81 riadkov):**

- Bottom-center banner `fixed inset-x-3 bottom-3 z-[60] max-w-2xl`
- Cookie ikona (warm-yellow)
- SK text: „Používame cookies na zlepšenie vášho zážitku a anonymnú analýzu návštevnosti."
- 2 buttons: „Súhlasím" (neon-red) + „Iba nevyhnutné" (charcoal border)
- X close button (zhodný s „Iba nevyhnutné")
- `localStorage` storage key `dora_cookie_consent_v1` s `{accepted, ts}`
- 1.2s delay pred zobrazením
- `role="dialog"`, `aria-label="Súhlas s cookies"`
- `animate-[fadeInUp_0.4s_ease-out]`

### 10.2 ❌ GDPR problémy

| # | Problém | Dôvod | Legal ref |
|---|---------|-------|-----------|
| G-1 | 🔴 **NO Privacy Policy page** — chýba `/privacy` alebo `/ochrana-osobnych-udajov` route. GDPR §13 vyžaduje informáciu o spracovaní. | — | GDPR Art. 13 |
| G-2 | 🔴 **NO Cookie Policy page** — chýba detailný zoznam cookies, účel, retencia, tretie strany | ePrivacy Directive Art. 5(3) |
| G-3 | 🔴 **NO Impressum** — chýba údaj o prevádzkovateľovi (meno, adresa, IČO, DIČ). Povinné pre SK komerčné weby. | Act no. 308/2000 Coll. §7 |
| G-4 | 🔴 **NO actual cookie management** — banner len uloží boolean `accepted`. Neexistuje mechanizmus, ktorý by podmienene načítal analytics/marketing scripty podľa súhlasu. | — | ePrivacy Art. 5(3) |
| G-5 | 🔴 **NO analytics integration anyway** — `package.json` nemá GA, Plausible, Fathom, Vercel Analytics, ani žiadny iný analytics tool. Súhlas je teda symbolický — nebráni ničomu, lebo nič nie je zapnuté. | — | — |
| G-6 | 🔴 **NO way to revoke consent** — raz uložený `accepted: true/false` v localStorage, používateľ nemá UI na zmenu (okrem manuálneho mazania localStorage). | — | GDPR Art. 7(3) |
| G-7 | 🔴 **NO GDPR consent v booking formulári** — `contact-section.tsx` zbiera organizer+email+phone bez checkboxu „Súhlasím so spracovaním osobných údajov za účelom vybavenia dopytu". | — | GDPR Art. 6(1)(a), §13 |
| G-8 | 🔴 **NO GDPR consent v newsletter formulári** — `newsletter-section.tsx` má iba text „Súhlasím so spracovaním e-mailu" ako `<p>`, bez checkboxu. | — | GDPR Art. 6(1)(a) |
| G-9 | 🔴 **NO double opt-in pre newsletter** — `api/newsletter/route.ts` okamžite vytvorí `active: true` subscribera bez confirm emailu. | — | GDPR best practice |
| G-10 | 🔴 **NO unsubscribe link v budúcich newsletter emailoch** — ani engine na odosielanie neexistuje | — | GDPR Art. 21 |
| G-11 | ⚠️ **Cookie consent X button = „Iba nevyhnutné"** — zatvorenie sa berie ako reject. Nie je to jednoznačné z button labelu (X sa často interpretuje ako „nesúhlasím, ale neznamená explicitný reject). | UX | — |
| G-12 | ⚠️ **1.2s delay** — banner sa zobrazí až po 1.2s. Pokiaľ používateľ medzitým prijme cookie (napr. klikne na odkaz), môže nastať konflikt. | UX | — |
| G-13 | ⚠️ **Banner nemá link na Policy** — text „Súhlas môžete kedykoľvek odvolať" sľubuje funkčnosť, ktorá neexistuje | — | GDPR Art. 7(3) |
| G-14 | ⚠️ **`role="dialog"` bez `aria-modal="true"`** — obsah pod bannerom zostáva interaktívny z klávesnice (no focus trap) | WCAG 2.4.3 | — |

---

## 11. ZOZNAM IMPLEMENTOVANÝCH FEATURES (verejný web)

### ✅ Brand & Visual

- Punk/grunge design system: 5 farieb, 4 fonty, glitch/clip-corner/glow utility classes
- Ken Burns hero slideshow s crossfade (7s interval, 2s prechod)
- Interaktívny timeline (about sekcia) s 7 míľnikmi
- Vinyl disc grafika s rotáciou (discography)
- Animated waveform (decorative)
- Marquee ticker (footer)
- Section dividers s gradient sweep
- Stage grid + noise overlay textures
- Scanline background (maintenance screen)
- 404 page s glitch „404" + Disc3 spinning icon
- Loading skeleton (hero + sections)
- Maintenance screen s pulsing red + hammer icon
- Site banner (5 typov: info/warning/success/error/promo) s dismiss + localStorage
- Scroll progress bar (neon gradient)
- Back-to-top FAB (after 600px scroll)

### ✅ Navigation & Layout

- Sticky navbar s scrolled state + backdrop-blur
- Mobile hamburger menu (full-screen overlay)
- Skip-link „Preskočiť na obsah"
- `min-h-screen flex flex-col` sticky footer pattern
- 13 sekcií s `scroll-mt-20` pre anchor offset
- Reveal komponent (IntersectionObserver, nie framer-motion) — performance-friendly

### ✅ Content

- Hero s status pill + stat strip (1996/30+/5/4) + count-up animácia
- Members s rozbaľovacími bio (4 členovia)
- Music section s YouTube embed + tracklist (5 skladieb)
- Gallery s 16 concert + 5 portrait fotkami, search, sort, lightbox
- Discografia s 3 nahrávkami + tabuľkový view
- Gigs s upcoming/past toggle, modal detail, link na `/archiv`
- Setlist s 10 skladbami, žánrový filter, summary stats
- Press kit s 5 copy-text tabmi + 3 download kartami + licencia
- FAQ s 8 otázkami, 3 kategórie, accordion
- Social s 4 platformami + Bandcamp strip
- Newsletter signup
- Contact form s 7 poľami + tips sidebar

### ✅ SEO

- `metadataBase`, kompletný `Metadata` objekt
- Dynamic `sitemap.ts` (10 static + N gig URL)
- `robots.ts` s admin disallow
- Dynamic OG image cez `@vercel/og` (edge runtime, branded)
- 4 JSON-LD schemas: MusicGroup, WebSite, MusicEvent (P0-10 fix), FAQPage, MusicRecording (vnorené)
- hreflang sk-SK self-referencing (+ en placeholder)
- Canonical URLs pre `/` a `/archiv`
- PWA `manifest.json` (theme_color, icons, categories)
- `/archiv` sub-page s year grouping + quick-nav

### ✅ UX patterns

- Loading skeletons pre gigs + gallery
- Empty states pre gigs („Momentálne nie sú naplánované žiadne vystúpenia")
- Success states pre contact + newsletter formy
- Toast notifikácie (sonner)
- Klávesnica skratky pre lightbox (ESC/←/→)
- Reduced motion media query
- Focus-visible styling
- Touch target min 44px na mobile

---

## 12. CHÝBAJÚCE FEATURES (z audit dokumentu — Phase 3, 26, 29, 30, 31)

Tento audit sa zameriava na gap-analysis body **Phase 3 (Web frontend), 26 (Performance), 29 (A11y), 30 (SEO), 31 (Deployment)**.

### 🔴 P0 — Kritické (fix pred akýmikoľvek ďalšími zmenami)

| ID | Gap | Stav | Súbor |
|----|-----|------|-------|
| GAP-P0-1 | MusicEvent JSON-LD pre koncerty | ✅ **FIXED** v `structured-data.tsx:110-143` | structured-data.tsx |
| GAP-P0-2 | Reálne YouTube video ID pre skladby (5× `videoId: ""` placeholder) | ❌ **OPEN** | band-data.ts:203-255 |
| GAP-P0-3 | GDPR consent checkbox v booking formulári | ❌ **OPEN** | contact-section.tsx |
| GAP-P0-4 | Privacy Policy page `/privacy` | ❌ **MISSING** | (žiadny route) |
| GAP-P0-5 | Impressum (IČO, DIČ, adresa) | ❌ **MISSING** | footer.tsx |

### ⚠️ P1 — Vysoké

| ID | Gap | Stav | Detail |
|----|-----|------|--------|
| GAP-P1-1 | VideoObject JSON-LD pre YouTube embedy | ❌ **MISSING** | structured-data.tsx — chýba schema pre `music-section.tsx` iframe |
| GAP-P1-2 | MusicRecording samostatné JSON-LD (nielen vnorené v MusicGroup) | ⚠️ **PARTIAL** | Vnorené v `MusicGroup.track[]`, ale bez samostatných URL (web nemá per-track route) |
| GAP-P1-3 | BreadcrumbList JSON-LD | ❌ **MISSING** | Iba shadcn UI `breadcrumb.tsx` komponent, žiadny JSON-LD schema |
| GAP-P1-4 | Sitemap dynamický (gigs, media, /archiv) | ⚠️ **PARTIAL** | `/archiv` ✓, gigs dynamicky ✓ (ale všetky URL rovnaké `/#koncerty`), media ❌ |
| GAP-P1-5 | hreflang self-referencujúci sk-SK | ⚠️ **PARTIAL** | sk-SK ✓, ale `en` alternát tiež na `/` — duplicita |
| GAP-P1-6 | PWA manifest | ✅ **IMPLEMENTED** | `public/manifest.json` — theme_color, icons, categories, scope ✓ |
| GAP-P1-7 | Crons (campaign scheduler) | ❌ **MISSING** | vercel.json `crons: []` |
| GAP-P1-8 | Rate limiting na `/api/booking`, `/api/newsletter`, `/api/chat` | ❌ **MISSING** | žiadne @upstash/ratelimit |
| GAP-P1-9 | CSRF protection | ❌ **MISSING** | žiadny Origin check |
| GAP-P1-10 | Zod validácia všade | ❌ **MISSING** | iba merch-tab + copilot route používajú Zod; booking + newsletter používajú manuálnu validáciu |
| GAP-P1-11 | Honeypot v booking formulári | ❌ **MISSING** | contact-section.tsx |
| GAP-P1-12 | Double opt-in pre newsletter | ❌ **MISSING** | api/newsletter/route.ts okamžite active |
| GAP-P1-13 | Security headers (CSP, X-Frame, X-Content-Type, HSTS) | ❌ **MISSING** | next.config.ts bez `headers()`, vercel.json bez `headers` |
| GAP-P1-14 | Focus trap v modals (lightbox, gig detail, mobile menu, cookie consent, expanded tracklist) | ❌ **MISSING** | všade |
| GAP-P1-15 | Newsletter unsubscribe token + route | ❌ **MISSING** | Prisma Subscriber nemá token pole |
| GAP-P1-16 | Confirmation email bookerovi po booking dopyte | ❌ **MISSING** | api/booking/route.ts bez email notifikácie |
| GAP-P1-17 | Notification email kapelovi o novom dopyte | ❌ **MISSING** | api/booking/route.ts bez email notifikácie |

### 🟡 P2 — Stredné

| ID | Gap | Stav | Detail |
|----|-----|------|--------|
| GAP-P2-1 | Canonical z DB (SeoMeta model) | ❌ **MISSING** | hardcoded v layout.tsx |
| GAP-P2-2 | Favicon set (ICO + apple-touch + android-chrome PNG) | ❌ **MISSING** | iba `/dora-mark.svg` |
| GAP-P2-3 | Security headers v next.config.ts | ❌ **MISSING** | gap-analysis P2 |
| GAP-P2-4 | Regions eu-central-1 | ❌ **MISSING** | vercel.json bez `regions` |
| GAP-P2-5 | optimizePackageImports pre lucide-react | ❌ **MISSING** | next.config.ts bez `experimental` |
| GAP-P2-6 | Timing-safe compare pre auth | ❌ **MISSING** | (out of scope, auth.ts) |
| GAP-P2-7 | Form labels `htmlFor`/`id` asociácia | ❌ **MISSING** | contact-section.tsx Field komponent |
| GAP-P2-8 | Form autocomplete atribúty | ❌ **MISSING** | contact-section.tsx |
| GAP-P2-9 | eventDate type=date s pickerom | ❌ **MISSING** | contact-section.tsx |
| GAP-P2-10 | Border contrast 3:1 pre UI komponenty (charcoal #2D2D2D na ink #0A0A0A = 1.6:1) | ❌ **FAIL** | globals.css |
| GAP-P2-11 | Privacy Policy + Cookie Policy + Impressum + ToS pages | ❌ **MISSING** | žiadne routes |
| GAP-P2-12 | Lighthouse CI config | ❌ **MISSING** | žiadny `lighthouserc.json` |
| GAP-P2-13 | Bundle analyzer | ❌ **MISSING** | `@next/bundle-analyzer` nie je v deps |
| GAP-P2-14 | `redirects` v vercel.json (www→non-www, /admin→/admin/login) | ❌ **MISSING** | vercel.json |
| GAP-P2-15 | Error tracking (Sentry) | ❌ **MISSING** | žiadny SENTRY_DSN |

### 🟢 P3 — Nízke

| ID | Gap | Stav | Detail |
|----|-----|------|--------|
| GAP-P3-1 | llms.txt (machine-readable layer) | ❌ **MISSING** | experimental |
| GAP-P3-2 | schema.postgres.prisma zmazať (zastaraný) | ⚠️ **OUT OF SCOPE** | (database audit) |
| GAP-P3-3 | OpenAPI schémy pre API | ❌ **MISSING** | žiadne zod → openapi generovanie |
| GAP-P3-4 | i18n multi-language | ❌ **MISSING** | SK hardcoded; hreflang `en` placeholder |
| GAP-P3-5 | Agent memory (RAG) | ⚠️ **OUT OF SCOPE** | (AI audit) |
| GAP-P3-6 | Backups (Neon automated) | ⚠️ **OUT OF SCOPE** | (deployment audit) |

---

## 13. UI/UX PROBLÉMY NA VEREJNOM WEBE — súhrn

### 🔴 Kritické

1. **0 reálnych audio/video sources** — `TRACKS[].videoId` všetky prázdne; tlačidlo „Prehrať" neurobí nič. Web neplní primárny účel.
2. **Press kit download placeholders** — 3 karty s `href="#kontakt"`, `href="#galeria"`, `href="/dora-logo.svg"`; reálne ZIP/PDF neexistujú.
3. **Booking form bez GDPR consent** — zbiera osobné údaje bez súhlasu.
4. **Newsletter bez double opt-in** — okamžitá aktivácia bez confirm emailu.
5. **Spotify URL prázdny** — karta „Coming soon" fallback, ale v footeri `<a href="">` reloadne stránku.
6. **6 z 10 setlist skladieb neexistuje v diskografii** — „Abstinujem", „Púchovská noc", „Rebelova", „Spoločne", „Encore: Dnes Od Rána".
7. **Testimonials sekcia skrytá** — 5 citovaných recenzií (Marek Hudec, Lucia Poláková, Peter Vavro, Tomáš Janík, Eva Macháčová) podozrivé z placeholdera.
8. **FAQ jedna otázka nevyriešená** — „Prečo D.O.R.A. dlho nekoncertovala?" obsahuje `[DOPLNIŤ]`.
9. **21-ročna medzera v timeline** (2005 → 2026) — chýbajú míľniky z obdobia 2005-2026.
10. **FAQ tvrdí „šesťčlenná formácia" ale MEMBERS má 4 členov** — inkonzistencia.

### ⚠️ Vysoké

11. **Hero `<h1>` glitch duplicuje text** pre asistívne technológie.
12. **Modaly bez focus trap** (lightbox, gig detail, mobile menu, cookie consent, expanded tracklist).
13. **Focus sa nevracia na trigger** po zatvorení modalu.
14. **Newsletter `<input type="email">` bez `<label>`**.
15. **Form labels bez `htmlFor`/`id` asociácie**.
16. **Border contrast 1.6:1** (charcoal na ink) — pod WCAG AA 3:1 pre UI komponenty.
17. **Footer „Admin prihlásenie" verejne viditeľný** medzi „Pre partnerov" linkami.
18. **No `loading="lazy"` na YouTube iframe**.
19. **YouTube thumbnail `<img>` bez width/height** — CLS risk.
20. **5 scroll listenerov naraz** — INP risk.
21. **`MusicPlayerProvider` na celom `<html>`** — zbytočne hydratuje admin/404/archiv.
22. **Gallery + Gigs používajú client-side `fetch()`** namiesto server components — strácajú SSR/cache.

### 🟡 Stredné

23. **Hero parallax scroll listener bez IO** — beží aj keď nie je hero viditeľný.
24. **`StickyMusicPlayer` `getBoundingClientRect` na každom scrolly** — INP risk.
25. **4 Google Fonts s 14 weights** — ~600KB woff2.
26. **lucide-react bez `optimizePackageImports`** — 80+ ikon v bunle.
27. **Cookie consent 1.2s delay** — môže prekvapiť používateľa.
28. **Cookie consent X = „Iba nevyhnutné"** — nie je jednoznačné.
29. **No way to revoke consent** z UI.
30. **Sitemap gigs URL všetky rovnaké** (`/#koncerty`) — nepoužiteľné pre Google.
31. **OG image generovaný dynamicky** — Edge runtime, ale bez cache stratégie (Vercel cache default).
32. **No per-gig sub-page** (`/koncert/[slug]`) — chýba URL pre Instagram sharing.
33. **No per-track sub-page** — chýba URL pre Spotify-like sharing.
34. **Manifest ikony všetky SVG** — maskable účely môžu zlyhať (Google vyžaduje PNG 192/512).

---

## 14. PERFORMANCE PROBLÉMY — súhrn

| # | LCP | INP | CLS | Popis |
|---|-----|-----|-----|-------|
| 1 | ⚠️ | — | — | 4 fonty + 14 weights (~600KB woff2) — znížiť na 6 weights celkom |
| 2 | — | ⚠️ | — | 5 scroll listenerov (hero, navbar, scroll-progress, back-to-top, sticky-player) — konsolidovať |
| 3 | — | ⚠️ | — | `StickyMusicPlayer` `getBoundingClientRect` bez throttle |
| 4 | ⚠️ | — | — | `MusicPlayerProvider` hydratuje celý `<html>` |
| 5 | ⚠️ | — | — | Gallery client-side `fetch()` — konvertovať na server component |
| 6 | ⚠️ | — | — | Gigs client-side `fetch()` — konvertovať na server component |
| 7 | — | — | ⚠️ | Lightbox `<img>` bez width/height |
| 8 | — | — | ⚠️ | YouTube thumbnail `<img>` bez width/height |
| 9 | — | ⚠️ | — | `HeroSlideshow` `setInterval(7000)` beží aj mimo viewportu |
| 10 | ⚠️ | — | — | `lucide-react` 80+ ikon bez tree-shaking |
| 11 | — | ⚠️ | — | `framer-motion` v deps ale nepoužívaný (iba `Reveal` s IO) — buď použiť alebo odstrániť |
| 12 | — | — | — | Žiadny `next/dynamic` lazy-load admin sekcií |
| 13 | — | ⚠️ | — | `HeroSlideshow` `requestAnimationFrame` v `useEffect` (microtask) — môže oneskoriť hydratáciu |
| 14 | — | — | — | `next/image` `priority={index === 0}` ✓ pre LCP, ale ostatné slides nemajú `loading="lazy"` (default) |
| 15 | — | — | — | Vercel default region `iad1` (US East) — 80-120ms cross-Atlantic k Neon `eu-central-1` |

**Odhad Core Web Vitals:**
- **LCP**: 2.8-3.5s (font swap + hero image) — **mimo cieľa < 2.5s**
- **INP**: 250-350ms (scroll listeners + sticky player rect calc) — **mimo cieľa < 200ms**
- **CLS**: < 0.05 (väčšina layoutov s aspect-ratio) — ✅ v cieli

---

## 15. PRIORITIZOVANÝ ACTION PLAN

### 🚨 P0 — Pred produkciou (do 1 týždňa)

1. **Pridať reálne YouTube video ID** do `TRACKS` v `band-data.ts` (alebo zmazať sekciu „Hudba" do overenia)
2. **Pridať GDPR consent checkbox** do `contact-section.tsx` + `newsletter-section.tsx`
3. **Vytvoriť `/privacy` route** (Privacy Policy + Cookie Policy + Impressum)
4. **Pridať Impressum** do footeru (meno, adresa, IČO, DIČ)
5. **Pridať rate limiting** na `/api/booking`, `/api/newsletter`, `/api/chat` (Upstash Redis)
6. **Pridať honeypot field** do `contact-section.tsx`
7. **Pridať Zod `.strict()` validáciu** do `api/booking/route.ts` a `api/newsletter/route.ts`
8. **Pridať CSRF check** (Origin/Sec-Fetch-Site) do všetkých POST API routes
9. **Fix MusicEvent JSON-LD bug** — `offers` sa prepisuje ak má gig aj ticketUrl aj ticketPrice (`structured-data.tsx:137-142`)
10. **Fix Spotify `<a href="">` v footeri** — podmienene renderovať alebo zobraziť „Coming soon"

### 🔧 P1 — Do 2 týždňov

11. **Pridať VideoObject JSON-LD** pre YouTube embedy
12. **Pridať BreadcrumbList JSON-LD** pre `/archiv`
13. **Opraviť hreflang** — odstrániť `en` alebo implementovať `/en/` lokalizáciu
14. **Pridať security headers** do `next.config.ts` `headers()` (CSP, X-Frame, X-Content-Type, HSTS, Referrer-Policy, Permissions-Policy)
15. **Pridať `regions: ["fra1"]`** do `vercel.json`
16. **Pridať `crons`** do `vercel.json` (campaign scheduler)
17. **Pridať `experimental.optimizePackageImports: ["lucide-react"]`** do `next.config.ts`
18. **Pridať `poweredByHeader: false`** do `next.config.ts`
19. **Implementovať focus trap** v `gallery-section.tsx` lightbox, `gigs-section.tsx` modal, `navbar.tsx` mobile menu, `cookie-consent.tsx`, `sticky-music-player.tsx` expanded tracklist
20. **Pridať `htmlFor`/`id` asociáciu** do `Field` komponentu v `contact-section.tsx`
21. **Pridať `name` + `autocomplete` atribúty** do formulárov
22. **Zmeniť `eventDate` na `<input type="date">`**
23. **Pridať `loading="lazy"`** na YouTube iframe
24. **Pridať width/height** na YouTube thumbnail `<img>`
25. **Konvertovať `gallery-section.tsx` na server component** (server-side `db.mediaItem.findMany`)
26. **Konvertovať `gigs-section.tsx` na server component**
27. **Presunúť `MusicPlayerProvider`** z `layout.tsx` iba na `page.tsx`
28. **Pridať double opt-in** pre newsletter (confirm email s tokenom)
29. **Pridať unsubscribe route** `/api/newsletter/unsubscribe?token=...`
30. **Pridať confirmation email** pre bookera + notification pre kapelu (Resend/Postmark)

### 🛠 P2 — Do 1 mesiaca

31. **Pridať favicon set** (ICO, apple-touch-180, android-chrome-192/512 PNG)
32. **Pridať canonical z DB (SeoMeta model)**
33. **Opraviť border contrast** — zvýšiť charcoal z `#2D2D2D` na `#3D3D3D` alebo `#454545` (3:1)
32. **Pridať `redirects`** do `vercel.json` (www→non-www, /admin→/admin/login)
33. **Pridať Sentry** error tracking
34. **Pridať `@next/bundle-analyzer`** a analyzovať bundle
35. **Pridať Lighthouse CI** config
36. **Pridať per-gig sub-page** `/koncert/[slug]` s vlastnou MusicEvent schema + OG image
37. **Pridať per-track sub-page** `/skladba/[slug]` s vlastnou MusicRecording schema
38. **Vyriešiť 21-ročnu medzeru v timeline** (2005-2026) — doplniť míľniky alebo zmeniť naratív
39. **Vyriešiť 6 chýbajúcich skladieb v setliste** — doplniť do diskografie alebo zmazať
40. **Vyriešiť FAQ `[DOPLNIŤ]` placeholder**
41. **Vyriešiť testimonials placeholder** — nahradiť reálnymi citátmi alebo odstrániť sekciu úplne
42. **Vyriešiť FAQ „šesťčlenná formácia" vs. 4 členovia v MEMBERS**
43. **Redukovať počet font weights** (Montserrat 6→2, Roboto Condensed 4→2, JetBrains Mono 4→2)
44. **Pridať `loading="lazy"`** na všetky `<Image>` okrem hero first slide

### 🎯 P3 — Long-term

45. **Pridať llms.txt** (experimentálny)
46. **Pridať OpenAPI schémy** pre API
47. **Implementovať i18n** (next-intl je v deps, ale nepoužíva sa)
48. **Pridať Visual regression testing** (Chromatic)
49. **Pridať E2E testy** (Playwright) — aspoň critical paths: homepage render, booking form submit, gallery lightbox, music player, mobile menu
50. **Pridať unit testy** (Vitest) — aspoň `band-data.ts`, `auth.ts`, `booking route.ts`, `newsletter route.ts`
51. **Pridať CI/CD pipeline** (GitHub Actions: lint + typecheck + test + build + lighthouse)

---

## 16. ZÁVER

D.O.R.A. verejný web je **vizuálne nadpriemerný** brand-site s konzistentnou punk/grunge estetikou, kvalitnou typografiou a premysleným user journey. Implementácia pokrýva 13 sekcií so silným dôrazom na booker/media persony.

**Kritické nedostatky, ktoré bránia produkcii:**

1. 🔴 **0 reálnych audio/video sources** — web neplní primárny účel hudobnej kapely
2. 🔴 **GDPR non-compliance** — zbieranie osobných údajov bez súhlasu, no Privacy Policy, no Impressum
3. 🔴 **0 test coverage** — žiadne automated testy neexistujú
4. 🔴 **Security gaps** — no rate limiting, no CSRF, no security headers, no Zod
5. 🔴 **Content debt** — testimonials placeholder, FAQ `[DOPLNIŤ]`, 21-ročna medzera v timeline, 6 fiktívnych skladieb v setliste

**Silné stránky:**

- ✅ Strong brand identity (Montserrat + JetBrains Mono + Neon Red + clip-corner brutalism)
- ✅ Solid SEO foundation (4 JSON-LD schemas, dynamic sitemap, OG image, robots)
- ✅ Good accessibility baseline (skip-link, ARIA, reduced motion, focus-visible, semantic HTML)
- ✅ Performant reveal animations (IntersectionObserver namiesto framer-motion)
- ✅ Comprehensive admin backend (hoci out of scope tohto auditu)

**Verdikt:** Web je **pripravený na beta launch** po vyriešení P0 P0 položiek (1-2 týždne práce). Pre production launch treba vyriešiť aj P1 položky (ďalšie 2-3 týždne). Bez testovacej infraštruktúry sa neodporúča dlhodobá údržba.

---

*Audit dokončený. Žiadne kódové zmeny neboli vykonané — audit bol read-only.*
