# FINAL-UI-AUDIT — Responzivita, dizajn a UI/UX aplikácie D.O.R.A.

**Repozitár:** `/home/z/my-project/` (D.O.R.A. Band Website)
**Dátum auditu:** 2026-08-19
**Agent:** Explore (UI/UX)
**Task ID:** AUDIT-UI
**Rozsah:** 14 section komponentov · 26 admin tabov · 8 site komponentov · globals.css · layout.tsx

---

## 0. EXECUTIVE SUMMARY

| Oblasť | Skóre | Status |
|--------|------:|-------|
| Responzivita landing sekcií | **7.5/10** | 🟡 Väčšina OK, ale 4 nekonzistentné paddingy + chýbajúce `id`/`scroll-mt-20` na gigs/stats |
| Responzivita admin dashboardu | **7/10** | 🟡 Sidebar drawer OK, ale booking Kanban (min-w-[1200px]) a niekoľko malých modálok chýba max-h |
| Dizajn konzistencia | **7.5/10** | 🟡 Brand paleta konzistentná, ale v niektorých sekciách zmes `clip-corner` vs `clip-corner-lg`, rôzne noise opacity |
| Accessibility (WCAG 2.2 AA) | **5/10** | 🔴 Skip-link ✓, focus-visible ✓, reduced-motion ✓ — ale modály bez focus-trap, mobile menu bez Escape, blog/gigs modály bez role/aria-modal |
| Sticky footer | **8.5/10** | 🟢 `flex min-h-screen flex-col` + `mt-auto` správne; malé riziko na admin pages (bez footer logic) |
| Overlapy fixed prvkov | **4/10** | 🔴 StickyMusicPlayer × BackToTop × CookieConsent sa vizuálne bijú v zóne `bottom-0..120px` |
| Mobile menu (navbar) | **4/10** | 🔴 Žiadny Escape handler, žiadny body scroll lock, žiadny focus trap, žiadne `role="dialog"` |

**Celkové hodnotenie:** **6.2 / 10**

Brand identity a vizuálny jazyk sú silné, základná responzivita funguje (390px / 768px / 1280px), ale **kritické chyby v accessibility modálov** a **vizuálne kolízie fixed prvkov** znižujú profesionálny dojem. Väčšina problémov je riešiteľná malými, cielenými zmenami.

---

## 1. RESPONZIVITA — LANDING SEKCIE

### 1.1 Hero (`hero-section.tsx`)

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| `min-h-[100svh]` | ✅ | Správne použitie `svh` (small viewport height) — nezasahuje do mobile URL baru |
| CTAs layout | ✅ | `flex-col gap-3 sm:flex-row` — správne stackovanie |
| Stat strip grid | ✅ | `grid-cols-2 sm:grid-cols-4` — OK pre mobil |
| Scroll indicator | ⚠️ | `hidden sm:flex` — schovaný na mobile (vedomé, ale znižuje affordance na mobile) |
| Hero text sizes | ✅ | `text-5xl sm:text-7xl lg:text-8xl` — plynulé škálovanie |
| Stat cells `useCountUp` | ✅ | Animácia sa spustí až pri scroll do view |
| SVG geometric lines | ⚠️ | `viewBox="0 0 1440 900"` — na mobile na šírku orezané, ale je to dekorácia |

**Verdikt:** ✅ OK. Žiadne kritické responzivné problémy.

### 1.2 Stats (`stats-section.tsx`) 🔴

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Section `id` | ❌ | **Chýba `id`** (žiadny anchor) — inconsistent s ostatnými sekciami |
| `scroll-mt-20` | ❌ | **Chýba** — anchor scroll nezarovná pod navbar |
| Padding | ⚠️ | `py-16 sm:py-20` — **menší** než štandard `py-20 sm:py-28` |
| Grid breakpoints | ✅ | `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` — OK |
| StatCard hover | ✅ | `hover:border-neon-red/40 hover:bg-ink clip-corner` |

**Oprava:**
```tsx
// stats-section.tsx:73
<section id="statistiky" className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28">
```

### 1.3 Members (`members-section.tsx`)

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Grid 1/2/4 | ✅ | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — správne |
| Member photo aspect | ✅ | `aspect-[3/4]` — konzistentné |
| Expandable bio | ✅ | `grid-rows-[1fr]/[0fr]` animácia — smooth |
| `aria-expanded` | ✅ | Yes na toggle button |
| Loading skeleton | ⚠️ | `Array.from({ length: 4 })` — na mobile by malo byť 1 alebo 2 (zbytočne 4 prázdne karty na úzkom mobile) |

**Verdikt:** ✅ OK. Drobné: loading skeleton počet.

### 1.4 Music (`music-section.tsx`)

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Grid layout | ✅ | `grid gap-6 lg:grid-cols-5` + `lg:col-span-3`/`lg:col-span-2` |
| Video aspect ratio | ✅ | `aspect-video` — 16:9, responzívne |
| Tracklist height | ⚠️ | `max-h-[28rem]` (448px) — na mobile je viewport ~700px, takže 448px zaberá 64% — OK, ale tracklist panel môže byť príliš nízky |
| YouTube iframe | ✅ | Lazy render s `key` swap pri play |
| Now playing bar | ✅ | `flex items-center gap-3` — vracia sa na mobile do single-line |
| Track button | ✅ | `aria-label="Prehrať: ${title}"` |

**Verdikt:** ✅ OK. Žiadne kritické problémy.

### 1.5 Gigs (`gigs-section.tsx`) 🔴

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Section `id` | ❌ | **CHÝBA** — jediná hlavná sekcia bez `id` |
| `scroll-mt-20` | ❌ | **Chýba** — kotvový odkaz z navbaru (keby existoval) by sa zarovnal pod navbar |
| Padding | ⚠️ | `py-20 sm:py-24` — **menší** než štandard `sm:py-28` |
| Gig card grid | ✅ | `grid-cols-[auto_1fr_auto]` s `sm:gap-6 sm:p-5` — adaptive |
| Date block | ✅ | `h-16 w-16 sm:h-20 sm:w-20` — správne škálovanie |
| Modal max-h | ❌ | **Modal nemá `max-h-[90vh] overflow-y-auto`** — na mobile s dlhými notes môže pretečiť viewport |
| Modal body scroll lock | ❌ | **Chýba** `document.body.style.overflow = "hidden"` |
| Modal Escape | ❌ | **Žiadny Escape handler** — iba klik na backdrop |

**Oprava (gigs-section.tsx:204):**
```tsx
<div
  className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray clip-corner-lg"
  onClick={(e) => e.stopPropagation()}
>
```

A pridať do `GigDetailModal`:
```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
  window.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  return () => {
    window.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
  };
}, [onClose]);
```

### 1.6 Gallery (`gallery-section.tsx`)

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Grid 2/3/4 | ✅ | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` — štandard |
| Toolbar layout | ✅ | `flex-col gap-3 sm:flex-row sm:items-center` — stackuje na mobile |
| Search input width | ⚠️ | `w-36 sm:w-44` — na mobile (375px) je 144px dostatočné, ale na veľmi úzkych (320px) tesné |
| Lightbox image | ✅ | `max-h-[78vh] w-auto object-contain` |
| Lightbox prev/next buttons | ⚠️ | `absolute left-4`/`right-4` — na mobile (375px) môžu prekryť obrázok; lepšie by bolo `bottom-4 left-4 right-4` (full-width tap row) |
| Escape handler | ✅ | Áno, len tu z sections |
| Body scroll lock | ✅ | Áno |
| `role="dialog"` + `aria-modal` + `aria-label` | ✅ | Plnohodnotné |

**Verdikt:** 🟢 Gallery je **vzorová** sekcia z hľadiska accessibility. Ostatné modály by mali kópiu tejto implementácie.

### 1.7 Merch (`merch-section.tsx`)

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Product grid | ✅ | `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — adaptívne |
| Filter buttons | ⚠️ | **Bez `clip-corner`** — inconsistent s inými sekundárnymi buttonmi |
| Product card hover | ✅ | `hover:border-neon-red/40` + scale obrázku |
| Sizes wrap | ✅ | `flex flex-wrap gap-1` |
| Bestseller badge | ✅ | `absolute right-3 top-3 z-10` |
| Empty state | ✅ | Definované |

**Oprava (merch-section.tsx:87, 101):** Pridať `clip-corner` na filter buttons pre konzistenciu.

### 1.8 Blog (`blog-section.tsx`) 🔴

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Featured + side layout | ✅ | `lg:grid-cols-3` s `lg:col-span-2` — stackuje na mobile |
| Featured title size | ✅ | `text-2xl sm:text-3xl` |
| Side article emoji box | ✅ | `h-10 w-10 shrink-0` |
| Modal max-h | ✅ | `max-h-[85vh] overflow-y-auto` |
| Modal `role="dialog"` | ❌ | **CHÝBA** — iba `onClick` close, žiadne aria attrs |
| Modal `aria-modal` | ❌ | Chýba |
| Modal `aria-label` | ❌ | Chýba |
| Modal Escape | ❌ | **Žiadny handler** |
| Modal body scroll lock | ❌ | **Chýba** |
| Modal focus trap | ❌ | Chýba |
| Featured article clickable | ⚠️ | `<article onClick={...}>` — nie je `<button>`, nie je keyboard accessible |

**Oprava:** Rovnaký pattern ako `gallery-section.tsx` — pridať `role="dialog" aria-modal="true" aria-label="Článok"`, Escape handler, body scroll lock.

### 1.9 Contact (`contact-section.tsx`)

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Form layout | ✅ | `lg:grid-cols-5` s `lg:col-span-2` (info) + `lg:col-span-3` (form) |
| Form fields grid | ✅ | `grid gap-4 sm:grid-cols-2` pre prvé 4 polia |
| GDPR consent | ✅ | Checkbox + link na privacy |
| Honeypot | ✅ | `aria-hidden` + off-screen |
| Submit button state | ✅ | `disabled:opacity-60` + spinner |
| Success state | ✅ | Inline replacement, button na reset |
| `dora-input` style | ✅ | Custom focus glow s neon-red |
| Required indicator | ✅ | `*` v neon-red |

**Verdikt:** ✅ Vzorová implementácia formulára.

### 1.10 Footer (`footer.tsx`)

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| `mt-auto` | ✅ | Správne — prilepí sa dolu aj na krátkych pages |
| Grid 3 columns | ⚠️ | `md:grid-cols-3` — používa `md:` namiesto `lg:` (jediný miesto v codebase) |
| Legal links | ✅ | Privacy/Cookies/Impressum |
| Social icons | ✅ | Filter prázdnych hrefs, `aria-label` |
| Marquee ticker | ✅ | `animate-marquee` s 2× duplikátom pre seamless loop |
| Logo `alt=""` | ✅ | Decoratívny |

**Oprava (footer.tsx:84):**
```tsx
<div className="grid gap-10 md:grid-cols-3">
// zmeň na (pre konzistenciu so zvyškom codebase, ktorý používa sm:/lg:):
<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
```
Avšak `md:grid-cols-3` je prijateľné, ak chceme 3-stĺpcový layout už od 768px (mobile-friendly). **Odporúčam nechať `md:`, ale pridať `sm:grid-cols-2` medzikrok.**

### 1.11 Navbar (`navbar.tsx`) 🔴

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Desktop nav visible | ✅ | `hidden lg:flex` |
| Mobile menu trigger | ✅ | `lg:hidden` hamburger |
| Mobile menu overlay | ⚠️ | `fixed inset-0 top-16 z-40 bg-ink/98 backdrop-blur-xl` |
| Mobile menu `role="dialog"` | ❌ | **Chýba** |
| Mobile menu `aria-modal` | ❌ | **Chýba** |
| Mobile menu `aria-label` | ❌ | Chýba |
| Mobile menu Escape | ❌ | **Žiadny handler** |
| Mobile menu body scroll lock | ❌ | **Chýba** `document.body.style.overflow = "hidden"` |
| Mobile menu focus trap | ❌ | Tab môže skočiť za overlay do footeru |
| `bannerOffset` aplikácia | ⚠️ | `<header style={{ top: bannerOffset }}>` — OK, ale `top-16` mobilného menu sa neprispôsobí banneru |
| Trigger button `aria-expanded` | ✅ | Yes |
| Trigger button `aria-label` | ✅ | `open ? "Zavrieť menu" : "Otvoriť menu"` |

**Oprava (navbar.tsx):**
```tsx
useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
  window.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  return () => {
    window.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
  };
}, [open]);

// Mobile menu container:
<div
  role="dialog"
  aria-modal="true"
  aria-label="Hlavná navigácia"
  className="fixed inset-0 top-16 z-40 bg-ink/98 backdrop-blur-xl lg:hidden"
>
```

---

## 2. ADMIN RESPONZIVITA

### 2.1 `admin-shell.tsx`

| Aspekt | Stav | Poznámky |
|--------|------|----------|
| Sidebar drawer (mobile) | ✅ | `-translate-x-full` / `translate-x-0` + backdrop |
| Sidebar fixed desktop | ✅ | `lg:translate-x-0` |
| Sidebar width | ✅ | `w-64` (256px) — štandard |
| Mobile top bar | ✅ | `sticky top-0 z-30 h-16` |
| Content padding | ✅ | `p-4 sm:p-6 lg:p-8` |
| Body scroll lock (sidebar open) | ❌ | **Chýba** — môžu scrollovať pozadím |
| Sidebar Escape | ❌ | Žiadny handler |
| Sidebar `role="dialog"` | ❌ | Chýba (mohol byť na mobile) |
| Command palette (⌘K) | ✅ | Vlastná komponenta, Escape handler |
| AI Copilot | ✅ | Toggle s Ctrl+Shift+A |
| `min-h-screen flex flex-col` + `mt-auto` | ❌ | **Admin nemá sticky footer logic** — sidebar navyše fixne, takže content môže "skončiť" bez footeru. Admin ale nepotrebuje footer, takže OK. |

### 2.2 Admin taby — grid breakpoint analýza

| Tab | Hlavný grid | Mobil stav |
|-----|-------------|-------------|
| `stats-tab` | `sm:grid-cols-2 lg:grid-cols-4` ✅ | Stack |
| `analytics-tab` | `sm:grid-cols-2 lg:grid-cols-3` ✅ | Stack |
| `predictions-tab` | `sm:grid-cols-2 lg:grid-cols-4` ✅ | Stack |
| `inquiries-tab` | `lg:grid-cols-5` (list 3 + detail 2) ⚠️ | Detail pod listom, **neauto-scrolluje** |
| `gigs-tab` | `max-h-[70vh] overflow-y-auto` list + modal | OK |
| `booking-tab` | **`min-w-[1200px] grid-cols-8`** 🔴 | Horizontálny scroll, mobilne použiteľné ale nepríjemné |
| `media-tab` | `sm:grid-cols-2 lg:grid-cols-4` (upload area `xl:grid-cols-6`) | OK |
| `merch-tab` | `sm:grid-cols-2 lg:grid-cols-4` | OK |
| `tasks-tab` | `sm:grid-cols-3` | OK |
| `members-tab` | `sm:grid-cols-2 lg:grid-cols-4` | OK |
| `blog-tab` | `sm:grid-cols-4` (top), `sm:grid-cols-2 lg:grid-cols-3` (list) | OK |
| `songs-tab` | `sm:grid-cols-2 lg:grid-cols-3` | OK |
| `rehearsals-tab` | list scroll + modal | OK |
| `setlists-tab` | list + modal | OK |
| `concert-mode-tab` | `sm:grid-cols-2` | OK |
| `crm-tab` | `lg:grid-cols-2` pre list+detail ⚠️ | Detail pod listom |
| `campaigns-tab` | `max-h-[65vh]` list + modal | OK |
| `automations-tab` | `lg:grid-cols-2` | OK |
| `ai-usage-tab` | `sm:grid-cols-2 lg:grid-cols-4` | OK |
| `approvals-tab` | `sm:grid-cols-3` | OK |
| `knowledge-tab` | list + modal | OK |
| `content-tab` | `max-h-[65vh]` list | OK |
| `content-items-tab` | `sm:grid-cols-2 lg:grid-cols-3` | OK |
| `seo-tab` | `sm:grid-cols-2` | OK |
| `settings-tab` | `lg:grid-cols-2` | OK |
| `subscribers-tab` | `max-h-[60vh]` list | OK |

**Kritické nálezy:**

#### 2.2.1 Booking-tab Kanban 🔴
```tsx
// booking-tab.tsx:151
<div className="grid min-w-[1200px] grid-cols-8 gap-3">
```
- `min-w-[1200px]` núti horizontálny scroll aj na tabletoch (768-1024px).
- 8 stĺpcov na mobile nepoužiteľné.
- **Oprava:** Pridať `overflow-x-auto scroll-dora` (už je tam) + indikátor pre mobil „Posuňte vľavo/vpravo".

#### 2.2.2 Inquiries-tab & CRM-tab — list/detail split 🔴
- `lg:grid-cols-5` znamená, že na mobile sa detail panel zobrazí pod listom.
- Klik na inquiry v listu → detail sa aktualizuje pod listom, ale používateľ to nevidí (musí manuálne scroll dole).
- **Oprava:** Auto-scroll na detail panel alebo modal na mobile:
```tsx
useEffect(() => {
  if (selected && window.innerWidth < 1024) {
    document.getElementById('inquiry-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, [selected]);
```

### 2.3 Admin modály — accessibility audit

| Tab / komponenta | Modal typ | `role="dialog"` | `aria-modal` | `aria-label` | Escape | Body lock | max-h |
|------------------|-----------|:-:|:-:|:-:|:-:|:-:|:-:|
| `gallery-section` Lightbox | custom div | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `gigs-section` GigDetailModal | custom div | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `blog-section` ArticleModal | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/media-tab` Form | custom div | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `admin/gigs-tab` Form | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/gigs-tab` GigProject | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/songs-tab` Form | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/crm-tab` Form | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/campaigns-tab` Form | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/rehearsals-tab` Form | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/setlists-tab` Form | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/knowledge-tab` Form | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/booking-tab` Detail | custom div | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin/content-items-tab` | **shadcn Dialog** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin/members-tab` | **shadcn Dialog** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin/blog-tab` (2 modály) | **shadcn Dialog** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin/merch-tab` | **shadcn Dialog** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin/concert-mode-tab` | **shadcn Dialog** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin/approvals-tab` | **shadcn Dialog** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Zhrnutie:**
- ✅ 6 admin tabov používa shadcn `Dialog` → plne accessible.
- ❌ **8 admin tabov používa custom `<div onClick>` modály bez `role`/`aria-modal`/Escape/body-lock.**
- ❌ 2 sekcie (gigs, blog) majú custom modály s rovnakými problémami.

**Hromadná oprava:** Vytvoriť shared `<DoraModal>` wrapper (alebo prepísť všetky custom modály na shadcn `Dialog`).

---

## 3. DIZAJN KONZISTENCIA

### 3.1 Brand paleta

| Token | Hex | Použitie |
|-------|-----|----------|
| `--neon-red` | `#E63946` | ✅ Konzistentné — primárna CTA, accent, status "new/upcoming" |
| `--warm-yellow` | `#F4A300` | ✅ Konzistentné — sekundárny accent, eyebrow, "soldout/reviewed" |
| `--ink` | `#0A0A0A` | ✅ Background, button text |
| `--charcoal` | `#2D2D2D` | ✅ Borders, secondary backgrounds |
| `--dark-gray` | `#1A1A1A` | ✅ Card backgrounds, sidebar |
| `--silver` | `#C0C0C0` | ✅ Tertiary text, "archived/cancelled" |
| `--off-white` | `#E8E8E8` | ✅ Primary text |

**Inconsistencies nájdené:**

| Problém | Súbor | Popis |
|---------|-------|-------|
| `green-500` / `green-400` | `inquiries-tab.tsx`, `stats-tab.tsx`, `booking-tab.tsx`, `gigs-tab.tsx` | Status "confirmed" používa **zelenú mimo brand palety**. Pôvodne brand má `deep-red` (#9B1B30), ale nie zelenú. ⚠️ |
| `sky-500`, `cyan-500`, `indigo-500`, `purple-500`, `emerald-300`, `violet-400`, `emerald-500` | `blog-section.tsx` (TYPE_META), `booking-tab.tsx` (PIPELINE), `inquiries-tab.tsx` (status) | Blog typy a booking fázy používajú **Tailwind default paletu** namiesto brand tokenov |
| `text-emerald-300` | `blog-section.tsx:25` | Event blog typ |

**Odporúčanie:** Pridať do brand palety `--success-green` (#10B981) a `--info-blue` (#3B82F6) ako nové tokeny, alebo prejsť všetky statusy na brand paletu (`neon-red` = high priority, `warm-yellow` = medium, `silver` = neutral).

### 3.2 Fonty

| Font | Variable | Použitie | Stav |
|------|----------|----------|------|
| Montserrat | `--font-montserrat` / `.font-display` | H1-H6, hero title, stat numbers | ✅ |
| Roboto Condensed | `--font-roboto-condensed` / `.font-condensed` | Blockquotes, secondary display | ✅ |
| Inter | `--font-inter` / `body` | Body text (default) | ✅ |
| JetBrains Mono | `--font-jetbrains-mono` / `.font-mono-brand` | Labels, badges, tech text | ✅ |

**Inconsistencies:**
- `globals.css:151`: `h1, h2, h3...` majú `font-family: var(--font-montserrat), var(--font-roboto-condensed), system-ui, sans-serif;` — OK, fallback reťazec.
- `body` má `font-family: var(--font-inter)` — OK.
- Všetky custom utility class-y (`.font-display`, `.font-condensed`, `.font-mono-brand`) definované ✅.

### 3.3 `clip-corner` použitie

```css
.clip-corner      { clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%); }
.clip-corner-lg   { clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%); }
```

| Typ | Použitie na | Poznámky |
|-----|-------------|----------|
| `clip-corner` (18px) | card hover, button, contact cards, member cards, gallery grid items, blog cards, stats cards, discography cards, social cards, merch cards, FAQ CTA, newsletter input, contact form, success states | ✅ Konzistentné |
| `clip-corner-lg` (28px) | hero CTA primary, navbar booking CTA, gigs modal, music video frame, contact modal, cookie consent, admin form modals, login page | ✅ Konzistentné |

**Nekonzistencie:**
- `merch-section.tsx` filter buttons (line 87, 101): **bez `clip-corner`** — mali by byť konzistentné.
- `cookie-consent.tsx` "Súhlasím" button (line 68): **bez `clip-corner`** — mali by byť.
- `gigs-section.tsx` view toggle (line 81-89): bez `clip-corner`.
- `blog-section.tsx` type tabs (line 70-77): bez `clip-corner` (border-bottom indicator namiesto toho).
- `press-section.tsx` copy tabs (line 70-77): bez `clip-corner` (border-bottom indicator).
- `about-section.tsx` timeline buttons: bez `clip-corner` (left border accent namiesto).

Tieto sú **vedomé štýlové výnimky** pre tabov a toggle buttony, takže nie sú chyby, ale dizajnové rozhodnutia. Filter buttons v merch by ale mali byť konzistentné s ostatnými filter buttonmi v `members-section`/`gallery-section`/`setlist-section`/`faq-section`, ktoré používajú `border` bez `clip-corner` — takže vlastne merch je **v súlade**. ✅

### 3.4 Hover efekty

| Typ efektu | Použité na | Konzistencia |
|------------|------------|--------------|
| `hover:border-neon-red/40` | cards (members, gallery, blog, merch, stats) | ✅ |
| `hover:border-neon-red/60` | contact cards, hero CTAs | ✅ |
| `hover:border-warm-yellow/50` | discography cards | ⚠️ Iný ako štandard |
| `hover:border-off-white/30` | admin stat cards, booking cards | ✅ Admin špecifické |
| `hover:bg-charcoal/30` | gigs card, setlist track | ✅ |
| `hover:bg-charcoal/40` | social cards, music tracklist | ✅ |
| `hover:text-neon-red` | navbar links, footer links | ✅ |
| `hover:text-warm-yellow` | footer "partner links" | ✅ |
| `hover:bg-deep-red hover:glow-red` | primary CTAs | ✅ |
| Bottom accent line `scale-x-0 group-hover:scale-x-100` | members, blog, discography, social | ✅ Konzistentné |
| `group-hover:scale-110` obrázok | gallery, members, merch | ✅ |

**Verdikt:** 🟢 Hover systém je konzistentný. Drobné rozdiely v border opacity (40/60) sú vedome — primárne interaktívne prvky majú silnejší hover.

### 3.5 Section padding

| Sekcia | Padding | Kategória |
|--------|---------|-----------|
| hero | `min-h-[100svh] pt-24 pb-16` | Full-height (special) |
| about | `py-20 sm:py-28` | 🟢 Štandard |
| members | `py-20 sm:py-28` | 🟢 Štandard |
| music | `py-20 sm:py-28` | 🟢 Štandard |
| gallery | `py-20 sm:py-28` | 🟢 Štandard |
| discography | `py-20 sm:py-28` | 🟢 Štandard |
| **gigs** | `py-20 sm:py-24` | 🔴 **Nekonzistentné** |
| setlist | `py-20 sm:py-28` | 🟢 Štandard |
| merch | `py-20 sm:py-28` | 🟢 Štandard |
| blog | `py-20 sm:py-28` | 🟢 Štandard |
| press | `py-20 sm:py-28` | 🟢 Štandard |
| faq | `py-20 sm:py-28` | 🟢 Štandard |
| testimonials | `py-20 sm:py-28` | 🟢 Štandard |
| contact | `py-20 sm:py-28` | 🟢 Štandard |
| **stats** | `py-16 sm:py-20` | 🟡 Komorná (auxiliary) |
| **newsletter** | `py-16 sm:py-20` | 🟡 Komorná (auxiliary) |
| **social** | `py-16 sm:py-20` | 🟡 Komorná (auxiliary) |

**Verdikt:** 3 "auxiliary" sekcie (stats, newsletter, social) vedomé menšie. **Gigs-section je chyba** — mala by byť `sm:py-28`.

**Oprava (gigs-section.tsx:62):**
```tsx
<section id="koncerty" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-28">
```

### 3.6 Borders

| Typ | Použitie | Stav |
|-----|----------|------|
| `border-t border-charcoal` | všetky sekcie | ✅ 100% konzistentné |
| `border border-charcoal` | cards, inputs, secondary containers | ✅ |
| `border-l-2 border-neon-red` | about-section bio, hero eyebrow | ✅ |
| `border-b border-charcoal` | table rows, modal headers | ✅ |
| `border-dashed border-charcoal` | empty states | ✅ |
| `divide-y divide-charcoal/50` | list separators | ✅ |

### 3.7 Background noise opacity inconsistency

| Súbor | `bg-noise opacity-` | 
|-------|---------------------|
| `merch-section.tsx:134` (vnútri product image) | `opacity-10` |
| `blog-section.tsx:74` | `opacity-20` |
| `stats-section.tsx:75` | `opacity-20` |
| `members-section.tsx:53` | `opacity-30` |
| `setlist-section.tsx:51` | `opacity-30` |
| `faq-section.tsx:43` | `opacity-40` |

**Verdikt:** 🟡 5 rôznych opacity hodnôt pre rovnaký effect. Odporúčam štandardizovať na `opacity-25` (alebo 30) pre section backgrounds a `opacity-10` pre element accents.

---

## 4. ACCESSIBILITY

### 4.1 Skip link ✅
```tsx
// page.tsx:152-154
<a href="#hlavny-obsah" className="skip-link">Preskočiť na obsah</a>
// globals.css:172-188 — position:absolute, top:-100%, focus:top-1rem
```
✅ Implementované správne. `#hlavny-obsah` je na `<main>`.

### 4.2 ARIA labels

| Komponent | Stav |
|-----------|------|
| Navbar menu trigger | ✅ `aria-label` + `aria-expanded` |
| Music section play button | ✅ `aria-label="Prehrať: ${title}"` |
| Music section pause/play toggle | ✅ |
| Gigs modal | ✅ `aria-label="Detail: ${gig.title}"` |
| Gallery thumbnails | ✅ `aria-label="Otvoriť fotografiu: ${item.title}"` |
| Gallery lightbox | ✅ `role="dialog"` + `aria-modal` + `aria-label` |
| Gallery sort select | ✅ `aria-label="Zoradiť podľa"` |
| Members bio toggle | ✅ `aria-label` + `aria-expanded` |
| FAQ accordion | ✅ `aria-expanded` (ale chýba `aria-controls`/`id`) |
| Back-to-top | ✅ `aria-label="Návrat hore"` |
| Sticky music player | ✅ `role="region"` + `aria-label` |
| Cookie consent | ✅ `role="dialog"` + `aria-label` |
| Hero scroll indicator | ✅ `aria-label="Posunúť nadol"` |
| Hero SVG decorative | ✅ `aria-hidden` |
| Contact honeypot | ✅ `aria-hidden="true"` |

**Chýbajúce:**
- ❌ `blog-section` article modal — bez `role`/`aria-modal`/`aria-label`
- ❌ `gigs-section` GigDetailModal — má `role/aria-modal/aria-label`, ale chýba Escape + body lock
- ❌ Všetky admin custom modály (8 tabov) — bez `role/aria-modal/aria-label`
- ❌ Navbar mobile menu — bez `role/aria-modal/aria-label`
- ❌ FAQ accordion — bez `aria-controls` (mapping button → panel)

### 4.3 Alt text na obrázkoch

| Obrázok | `alt` | Stav |
|---------|-------|------|
| Hero slideshow | `altText || title` | ✅ |
| Gallery items (Image) | `altText || title` | ✅ |
| Gallery lightbox | `altText || title` | ✅ |
| Member photos | `${name} — ${role}` | ✅ |
| Merch product images | `p.name` | ✅ |
| Music YouTube thumbnail | `alt=""` (decoratívny, button má aria-label) | ✅ |
| Navbar/footer logo SVG | `alt=""` (decoratívny) | ✅ |
| Admin sidebar logo | `alt=""` | ✅ |
| Login page logo | `alt=""` | ✅ |

**Verdikt:** ✅ 100% alt text pokrytie.

### 4.4 Focus visible styles ✅
```css
/* globals.css:161-169 */
:focus-visible {
  outline: 2px solid #E63946;
  outline-offset: 2px;
  border-radius: 1px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```
✅ Silný, brand-konzistentný focus indikátor.

**Ale:** Chýba `:focus-visible` špecifický pre modály (keď focus skočí dovnútra modálu, mal by byť viditeľný close button focus). Väčšina modálov nemá autofocus na prvom poli/close buttone.

### 4.5 Keyboard navigation

| Interakcia | Stav |
|------------|------|
| Skip link | ✅ |
| Navbar tab | ✅ |
| Hero CTAs tab | ✅ |
| Music play button | ✅ |
| Gallery lightbox Esc/←/→ | ✅ |
| Gigs modal Escape | ❌ |
| Blog modal Escape | ❌ |
| FAQ accordion | ✅ (button-based) |
| About timeline | ✅ (button-based) |
| Members bio toggle | ✅ |
| Contact form fields | ✅ |
| Mobile menu Escape | ❌ |
| Admin modals Escape | ❌ (iba media-tab + command-palette + gallery) |
| Booking Kanban drag | ❌ (žiadny keyboard equivalent) |
| Concert mode | ✅ (Radix Dialog) |

**Focus trap:** Žiadny z custom modálov nemá focus trap. Focus môže opustiť modal a skočiť do pozadia.

### 4.6 Reduced motion

```css
/* globals.css:192-211 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .glitch::before, .glitch::after { animation: none !important; opacity: 0 !important; }
  .animate-marquee, .animate-live, .animate-pulse { animation: none !important; }
}
```
✅ Redukovaná motion globálne aplikovaná. Hero slideshow má vlastný override (`transition: opacity 400ms linear !important`).

**Ale:** `useCountUp` hook (hero stat strip + stats section) nepreforčuje `prefers-reduced-motion` — animuje sa aj keď užívateľ preferuje reduced motion. Mal by skontrolovať `window.matchMedia('(prefers-reduced-motion: reduce)')` a skočiť rovno na konečnú hodnotu.

---

## 5. STICKY FOOTER

### 5.1 Root layout

```tsx
// page.tsx:151
<div className="flex min-h-screen flex-col bg-ink">
  <a href="#hlavny-obsah" className="skip-link">...</a>
  <ScrollProgress />
  <SiteBanner banner={banner} />
  <Navbar bannerOffset={banner.isActive ? 40 : 0} />
  ...
  <main id="hlavny-obsah" className="flex-1">
    {/* sekcie */}
  </main>
  <Footer content={c} />  {/* ← mt-auto vo vnútri Footer komponenty */}
  <BackToTop />
  <CookieConsent />
</div>
```

```tsx
// footer.tsx:64
<footer className="mt-auto border-t border-charcoal bg-ink bg-noise">
```

✅ `flex min-h-screen flex-col` na root + `mt-auto` na footri = **sticky footer funguje správne** aj na krátkych pages.

### 5.2 Admin shell (bez sticky footer logic)

```tsx
// admin-shell.tsx:172
<div className="min-h-screen bg-ink bg-noise">
  {/* sidebar + main, bez flex-col + mt-auto */}
</div>
```

⚠️ Admin nemá footer, takže sticky-footer logika nie je potrebná. Ak by sa pridával admin footer, treba `flex min-h-screen flex-col` na root + `mt-auto` na footri.

### 5.3 Login page

```tsx
// admin/login/page.tsx:54
<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
```
✅ Centrovaný obsah, bez footer (vhodné pre login).

### 5.4 Privacy page (`/privacy`)

(Nezkontrolované — mimo rozsah tohto auditu. Odporúčam samostatnú kontrolu.)

---

## 6. OVERLAPY FIXED PRVKOV — KRITICKÉ 🔴

Toto je **najväčší vizuálny problém** webu:

### 6.1 Zoznam fixed prvkov v spodnej časti viewportu

| Komponent | Pozícia | Z-index | Výška | Kedy viditeľný |
|-----------|---------|---------|-------|----------------|
| `StickyMusicPlayer` bar | `fixed inset-x-0 bottom-0 z-40` | 40 | ~60-70px | Vždy (keď nie je v music section + nehrá) |
| `StickyMusicPlayer` collapsed mini-button | `fixed bottom-4 right-4 z-50` | 50 | 48px (h-12) | Keď user zroluje prehrávač |
| `BackToTop` | `fixed bottom-5 right-5 z-40` | 40 | 44px (h-11) | Keď `scrollY > 600` |
| `CookieConsent` | `fixed inset-x-3 bottom-3 z-[60]` | 60 | ~120-160px | Prvý návšteva, do rozhodnutia |

### 6.2 Konflikty

**Konflikt 1: StickyMusicPlayer bar × BackToTop**
- Player bar: `bottom-0 inset-x-0 z-40` (full-width)
- BackToTop: `bottom-5 right-5 z-40` (v pravom dolnom rohu)
- Oba z-40 → BackToTop (renderovaný neskôr v DOM) sa zobrazí nad player barom
- **Vizuálny výsledok:** BackToTop button "leží" na vrchu player baru v pravom dolnom rohu — prekrýva progress bar a controls.

**Konflikt 2: CookieConsent × StickyMusicPlayer**
- CookieConsent: `bottom-3 z-[60]` — zaberá spodných ~150px
- StickyMusicPlayer: `bottom-0 z-40`
- CookieConsent (z-60) prekrýva StickyMusicPlayer (z-40) úplne
- **Vizuálny výsledok:** Pri prvej návšteve je player úplne zakrytý cookie bannerom.

**Konflikt 3: CookieConsent × BackToTop**
- CookieConsent prekrýva BackToTop (oba v spodnej časti)

**Konflikt 4: StickyMusicPlayer collapsed mini-button × BackToTop**
- Mini-button: `bottom-4 right-4 z-50` (48px)
- BackToTop: `bottom-5 right-5 z-40` (44px)
- Skoro rovnaká pozícia — prekrývajú sa vizuálne

### 6.3 Opravné riešenia

**Riešenie A — Dynamický offset BackToTop:**
```tsx
// back-to-top.tsx
const [playerVisible, setPlayerVisible] = useState(false);
useEffect(() => {
  // Pozor, či je sticky player viditeľný
  const check = () => {
    const player = document.querySelector('[data-sticky-player]');
    setPlayerVisible(player ? !player.classList.contains('translate-y-full') : false);
  };
  // ... listen on scroll, etc.
}, []);

className={cn(
  "fixed right-5 z-40 transition-all duration-300",
  playerVisible ? "bottom-20" : "bottom-5"  // 80px when player visible, 20px otherwise
)}
```

**Riešenie B — Posun CookieConsent vyššie:**
```tsx
// cookie-consent.tsx
className={cn(
  "fixed inset-x-3 z-[60] mx-auto max-w-2xl border border-charcoal bg-ink/95 p-4 shadow-2xl backdrop-blur-xl clip-corner-lg sm:p-5",
  // bottom-24 (96px) ak je player bar; bottom-3 inak
  playerVisible ? "bottom-24" : "bottom-3"
)}
```

**Riešenie C (najjednoduchšie, odporúčané):**
- BackToTop z-40 → z-30 (pod playerom)
- BackToTop `bottom-5` → `bottom-20` (80px) keď je player bar viditeľný
- CookieConsent `bottom-3` → `bottom-24` (96px) keď je player bar viditeľný
- Všetky tri komponenty zdieľajú `MusicPlayerContext` alebo nový `BottomBarOffsetContext` pre koordináciu

---

## 7. ĎALŠIE NÁLEZY

### 7.1 `useCountUp` nerešpektuje reduced motion
`src/hooks/use-count-up.ts` — animuje vždy. Mal by skontrolovať:
```ts
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) { setValue(target); return; }
```

### 7.2 `useEffect` cleanup v mobile menu navbar
Keď user klikne na navbar mobile link (line 118-123), `setOpen(false)` zatvorí menu, ale **body scroll nie je zamknutý** (kedže nie je ani odomknutý — pozri §1.11).

### 7.3 Mobile menu `top-16` × `bannerOffset`
Keď je banner aktívny, `<header style={{ top: 40 }}>` posúva navbar dole. Ale mobile menu overlay má `top-16` (64px) — medzi navbarom a menu by bola 24px medzera s pozadím. Treba:
```tsx
style={{ top: bannerOffset ? `${64 + bannerOffset}px` : '64px' }}
```

### 7.4 `bg-noise` nie je v `tailwind.config.ts` ani v `@layer utilities`
`bg-noise` je definovaný v `globals.css:257-260` v rámci `@layer utilities`. ✅ OK.

### 7.5 Sticky music player — `prefers-reduced-motion`
Sticky player animácia `slideUpPlayer` (globals.css:652-661) nie je v reduced-motion override zozname. Pridať:
```css
@media (prefers-reduced-motion: reduce) {
  [data-sticky-player] { animation: none !important; }
}
```

### 7.6 Hero `min-h-[100svh]` × parallax
Hero má `style={{ transform: translateY(${contentOffset}px) }}` — na mobile môže posun až 60px spôsobiť, že spodok heroa "vystúpi" z viewportu a `min-h-[100svh]` stratí význam. Testovať na mobile.

### 7.7 `inquiries-tab` detail panel sticky iba nad `lg`
`sticky top-24` funguje len v `lg:col-span-2` kontexte (keď je detail vedľa listu). Na mobile sa detail renderuje pod listom bez sticky. ✅ OK, ale bez auto-scrollu (pozri §2.2.2).

### 7.8 `press-section.tsx` copy tabs — `flex-wrap gap-1` na mobile
4 taby s dlhými slovenskými názvami (Festival/Koncert/Všeobecný/Krátke info) sa na mobile (375px) zalamujú na 2-3 riadky. Acceptable, ale lepšie by bolo icon-only na mobile.

### 7.9 `cookie-consent.tsx` tlačidlá bez `clip-corner`
"Súhlasím" button je `bg-neon-red px-4 py-2` bez `clip-corner`. Ostatné primárne buttony v appke používajú `clip-corner glow-red-sm`. Inconsistent.

### 7.10 Hero stat strip stat cells bez `clip-corner`
`StatCell` (hero-section.tsx:199-206) je `bg-ink/90 px-4 py-4 backdrop-blur transition-colors hover:bg-charcoal/60` — bez `clip-corner`. Stats-section `StatCard` má `clip-corner`. Inconsistent.

---

## 8. PRIORITIZOVANÝ ZOZNAM OPRAV

### 🔴 P0 — Kritické (týždenný sprint)

1. **Modal accessibility — hromadná oprava**
   - Vytvoriť `src/components/site/dora-modal.tsx` ako wrapper nad shadcn `Dialog`
   - Prepísať 8 admin custom modálov + 2 section modály (gigs, blog) na tento wrapper
   - Získať: `role/aria-modal/aria-label`, Escape, body scroll lock, focus trap, max-h

2. **Navbar mobile menu accessibility**
   - Pridať `role="dialog"`, `aria-modal="true"`, `aria-label`
   - Escape handler + body scroll lock
   - Focus trap (prvý focusable → posledný → prvý)

3. **Fixed prvky overlap (§6)**
   - BackToTop: `bottom-20` keď je sticky player viditeľný
   - CookieConsent: `bottom-24` keď je sticky player viditeľný
   - Zdieľaný context alebo `IntersectionObserver` na `[data-sticky-player]`

4. **`gigs-section.tsx` — pridať `id`, `scroll-mt-20`, padding `sm:py-28`, modal `max-h-[90vh] overflow-y-auto`, Escape, body lock**

### 🟡 P1 — Dôležité (dvojtýždenný sprint)

5. **`stats-section.tsx` — pridať `id="statistiky"`, `scroll-mt-20`**
6. **`blog-section.tsx` modal — pridať `role="dialog"`, `aria-modal`, `aria-label`, Escape, body lock**
7. **`useCountUp` hook — rešpektovať `prefers-reduced-motion`**
8. **`prefers-reduced-motion` — pridať `[data-sticky-player]` animáciu override**
9. **FAQ accordion — pridať `aria-controls` + `id` pre mapping button↔panel**
10. **`inquiries-tab` / `crm-tab` — auto-scroll na detail panel na mobile**

### 🟢 P2 — Kozmetické (mesačný sprint)

11. **Brand paleta — štandardizovať status farby** (green-500 → brand token alebo ponechať ako výnimku pre statusy)
12. **`bg-noise opacity-` štandardizovať** na jednu hodnotu (25 alebo 30)
13. **Hero `StatCell` pridať `clip-corner`** pre konzistenciu so stats-section
14. **CookieConsent "Súhlasím" pridať `clip-corner glow-red-sm`** pre konzistenciu
15. **Footer `md:grid-cols-3` → `sm:grid-cols-2 lg:grid-cols-3`** (konzistencia s codebase)
16. **Booking Kanban — mobilný indikátor "← posuňte →"** (UX hint pre horizontálny scroll)
17. **Navbar mobile menu `top-16` × `bannerOffset` — kompenzovať 40px**
18. **Admin shell — body scroll lock pri otvorenom sidebar draweri na mobile**

---

## 9. ZHRNUTIE — ČO JE DOBRE ✅

- **Brand identity** — silný, konzistentný punk/grunge estetika (neon-red × warm-yellow × ink × charcoal)
- **Font systém** — Montserrat/Roboto Condensed/Inter/JetBrains Mono, správne použité
- **`clip-corner` utility** — dobre definovaná, konzistentne aplikovaná na cards/buttons
- **Hover systém** — `hover:border-neon-red/40` + bottom accent line + scale — konzistentný
- **Skip link** — implementovaný
- **Focus-visible** — silný brand-konzistentný outline
- **Reduced motion** — globálne override (okrem useCountUp + sticky player anim)
- **Alt text** — 100% pokrytie
- **Sticky footer** — `flex min-h-screen flex-col` + `mt-auto` funguje správne
- **Gallery lightbox** — vzorová implementácia (role/aria/escape/body-lock/max-h)
- **shadcn Dialog v 6 admin taboch** — plne accessible
- **Cookie consent** — GDPR-compliant s explicit decline option
- **Contact form** — honeypot + GDPR consent + custom focus glow
- **Music section** — YouTube lazy load s `key` swap, aria-label na všetkých buttons
- **Member bio toggle** — `aria-expanded` + grid-rows animácia
- **Sticky music player** — auto-hide v music section, collapse/expand, mobile tracklist sheet

## 10. ZHRNUTIE — ČO TREBA OPRAVIŤ 🔴

- **Custom modály (10×)** — bez `role/aria-modal/aria-label/Escape/body-lock/focus-trap`
- **Navbar mobile menu** — bez `role/aria-modal/aria-label/Escape/body-lock/focus-trap`
- **Fixed prvky overlap** — StickyMusicPlayer × BackToTop × CookieConsent sa bijú v bottom zone
- **Gigs section** — chýba `id`, `scroll-mt-20`, padding je menší, modal bez max-h
- **Stats section** — chýba `id`, `scroll-mt-20`
- **`useCountUp`** — nerešpektuje reduced motion
- **Brand farby pre statusy** — green/sky/cyan/indigo/purple mimo brand palety
- **Admin sidebar drawer** — bez body scroll lock na mobile

---

## 11. NAVRH NUTNÝCH ZMIE V KÓDE (quick wins)

### 11.1 `gigs-section.tsx` — komplexná oprava

```diff
- <section className="relative border-t border-charcoal bg-ink py-20 sm:py-24">
+ <section id="koncerty" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-28">
```

### 11.2 `stats-section.tsx`

```diff
- <section className="relative border-t border-charcoal bg-dark-gray py-16 sm:py-20">
+ <section id="statistiky" className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28">
```

### 11.3 `navbar.tsx` — Escape + body lock + aria

```diff
+ useEffect(() => {
+   if (!open) return;
+   const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
+   window.addEventListener("keydown", onKey);
+   document.body.style.overflow = "hidden";
+   return () => {
+     window.removeEventListener("keydown", onKey);
+     document.body.style.overflow = "";
+   };
+ }, [open]);

  {open && (
-   <div className="fixed inset-0 top-16 z-40 bg-ink/98 backdrop-blur-xl lg:hidden">
+   <div
+     role="dialog"
+     aria-modal="true"
+     aria-label="Hlavná navigácia"
+     className="fixed inset-0 top-16 z-40 bg-ink/98 backdrop-blur-xl lg:hidden"
+   >
```

### 11.4 `back-to-top.tsx` — offset pre sticky player

```diff
+ const [playerVisible, setPlayerVisible] = useState(false);
+ useEffect(() => {
+   const check = () => {
+     const player = document.querySelector('[data-sticky-player]');
+     if (!player) return setPlayerVisible(false);
+     const rect = player.getBoundingClientRect();
+     setPlayerVisible(rect.bottom > 0 && rect.top < window.innerHeight);
+   };
+   check();
+   window.addEventListener("scroll", check, { passive: true });
+   window.addEventListener("resize", check);
+   return () => {
+     window.removeEventListener("scroll", check);
+     window.removeEventListener("resize", check);
+   };
+ }, []);

  className={cn(
-   "fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 ...",
+   "fixed right-5 z-40 inline-flex h-11 w-11 ... transition-all duration-300",
+   playerVisible ? "bottom-20" : "bottom-5",
    show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
  )}
```

### 11.5 `hooks/use-count-up.ts` — reduced motion check

```diff
  useEffect(() => {
+   if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
+     setValue(target);
+     return;
+   }
    // ... existing animation logic
  }, [target]);
```

### 11.6 `globals.css` — sticky player animácia do reduced motion override

```diff
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      ...
    }
    .glitch::before, .glitch::after { ... }
    .animate-marquee, .animate-live, .animate-pulse { animation: none !important; }
+   [data-sticky-player] { animation: none !important; }
+   .hero-slide { transition: opacity 200ms linear !important; }
  }
```

---

**Koniec auditu.** Celkový stav UI/UX je **6.2/10** — silný brand identity, ale systematické accessibility chyby v modáloch a vizuálne kolízie fixed prvkov znižujú profesionálny dojem. Implementácia P0 oprav (modal wrapper + navbar a11y + fixed overlap coordination) by viedla na **8+/10**.

**Ďalšie kroky:** Implementovať P0 opravy (§8) → re-auditovať → implementovať P1 → re-auditovať → P2 (kozmetické).
