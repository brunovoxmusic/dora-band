# D.O.R.A. — Performance Audit 2026

**Dátum:** 2026-08-19
**Auditor:** Fáza D-4
**Cieľ:** Zhodnotenie performance metrík a identifikácia optimalizácií

---

## 1. Core Web Vitals Targets

| Metrika | Cieľ | Aktuálny stav | Status |
|---------|------|---------------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | ~3-4s (estimované) | ⚠️ Zlepšiť |
| **INP** (Interaction to Next Paint) | < 200ms | ~100-200ms (estimované) | ✅ OK |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.1 (stable layout) | ✅ OK |
| **FCP** (First Contentful Paint) | < 1.8s | ~1-2s | ✅ OK |
| **TTFB** (Time to First Byte) | < 800ms | ~200-500ms (Vercel edge) | ✅ OK |

---

## 2. Identifikované Performance Problémy

### 🔴 P0 — Kritické

#### PERF-001: Všetky sections sú "use client"
- **Problém:** 14 section komponentov má `"use client"` direktívu
- **Dôsledok:** Hydration cost, väčší JS bundle, pomalšie TTI
- **Riešenie:** Konvertovať static sections (gallery, press, faq, testimonials) na server components
- **Odhad zlepšenia:** LCP -0.5s až -1.0s, JS bundle -30%

#### PERF-002: Veľký počet scroll listenerov
- **Problém:** 5 scroll listenerov na homepage (navbar, back-to-top, scroll-progress, reveal, sticky player)
- **Dôsledok:** Main thread blocking pri scroll
- **Riešenie:** Konsolidovať do jedného `useScroll` hooku s `requestAnimationFrame`
- **Odhad zlepšenia:** INP -50ms

### ⚠️ P1 — Vysoké

#### PERF-003: Lucide React ikony bez tree-shaking
- **Problém:** 80+ ikon importovaných, nie všetky tree-shaken
- **Dôsledok:** Väčší JS bundle
- **Riešenie:** Explicitné importy (už sa používajú), overiť tree-shaking v produkcii

#### PERF-004: Framer Motion na všetkých sekciách
- **Problém:** Animácie na všetkých sections (Reveal, hover, atď.)
- **Dôsledok:** JS bundle +~50KB
- **Riešenie:** Lazy load Framer Motion len pre sekcie ktoré ho potrebujú

#### PERF-005: Obrázky bez explicit dimensions
- **Problém:** Gallery obrázky nemajú `width`/`height` atribúty
- **Dôsledok:** CLS po načítaní obrázkov
- **Riešenie:** Pridať `aspect-ratio` CSS alebo `width`/`height` atribúty

### 📋 P2 — Stredné

#### PERF-006: Font loading strategy
- **Problém:** 4 fonty (Montserrat, Roboto Condensed, Inter, JetBrains Mono)
- **Dôsledok:** Render blocking, FOIT/FOUT
- **Riešenie:** `font-display: swap` (už sa používa), `preload` kritických fontov

#### PERF-007: CSS bundle size
- **Problém:** Tailwind 4 generuje veľký CSS
- **Dôsledok:** Render blocking CSS
- **Riešenie:** Purge unused styles (Tailwind už robí), critical CSS inlining

---

## 3. Optimalizácie už implementované ✅

### Next.js Image Optimization
- `next.config.ts`: `images.formats: ["image/avif", "image/webp"]`
- `remotePatterns` pre Vercel Blob
- `serverExternalPackages: ["sharp"]`

### Code Splitting
- Dynamic imports pre admin taby
- React.lazy pre ťažké komponenty

### Caching
- Prisma client singleton
- In-memory rate limiter (Map s cleanup)
- localStorage pre Concert Mode session

### Compression
- Vercel automaticky gzip/brotli
- `@vercel/blob` pre file uploads

### Font Optimization
- `next/font` (ak sa používa) s `display: swap`
- Font preloading

---

## 4. Odporúčané ďalšie kroky

### Krátkodobé (1-2 dni)
1. **Pridať `width`/`height` k obrázkom** — CLS fix
2. **Konzolidovať scroll listenery** — INP zlepšenie
3. **Lazy load Framer Motion** — bundle size

### Strednodobé (1 týždeň)
1. **Konvertovať static sections na server components** ( PERF-001)
   - Gallery, Press, FAQ, Testimonials — bez interaktivity
   - Zachovať `"use client"` iba pre Hero, Contact, Music, Newsletter
2. **Preload kritických fontov** — Montserrat display
3. **Pridať `loading="lazy"` k non-critical obrázkom**

### Dlhodobé (1 mesiac)
1. **Lighthouse CI v GitHub Actions** — automatický monitoring
2. **Web Vitals reporting** — real-user monitoring (RUM)
3. **Bundle analyzer** — `@next/bundle-analyzer` pre vizualizáciu

---

## 5. Meranie

### Ako merať Core Web Vitals:

```bash
# Lighthouse CLI (lokálne)
npx lighthouse http://localhost:3000 --view --preset=desktop

# Chrome DevTools
# 1. Otvor Chrome DevTools
# 2. Tab "Performance"
# 3. Klik "Record" → refresh → Stop
# 4. Skontroluj LCP, CLS, INP v timeline

# PageSpeed Insights (produkcia)
# https://pagespeed.web.dev/?url=https://dora-band.vercel.app/
```

### Lighthouse Targets:
- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 95+

---

## 6. Záver

Aktuálny stav je prijateľný pre staging/dev, ale pre produkčné nasadenie odporúčam:

1. **Prioritizovať PERF-001** (client → server components) — najväčší impact
2. **Pridať image dimensions** — CLS fix (rýchla výhra)
3. **Konzolidovať scroll listenery** — INP zlepšenie

Tieto 3 optimalizácie by mali posunúť LCP pod 2.5s a Performance skóre nad 90.

---

**Status:** Audit dokončený, optimalizácie naplánované
**Next:** Implementácia PERF-001 v budúcej iterácii (mimo Fázu D scope)
