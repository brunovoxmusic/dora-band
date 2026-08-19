# D.O.R.A. — Final Funkcionalita & Logika Prepojení Audit

**Task ID:** AUDIT-FUNC
**Dátum:** 2026 (post-upgrades)
**Scope:** Celá aplikácia `/home/z/my-project/` — admin↔public prepojenia, API endpoints, section visibility, AI funkcie, databáza
**Verdikt:** Aplikácia je **funkčná a stabilná**, ale obsahuje **3 kritické chyby**, **6 major nezrovnalostí admin↔public** a **5 orphan endpoints** (mŕtvych API)

---

## 🚨 KRITICKÉ CHYBY (P0 — treba opraviť)

### C1. CHÝBAJÚCI `/api/admin/upload` endpoint

**Súbor:** `src/components/admin/media-tab.tsx` (riadok 103)
**Kód:** `const res = await fetch("/api/admin/upload", { method: "POST", body: fd });`
**Stav:** Súbor `src/app/api/admin/upload/route.ts` **neexistuje** (overené cez `LS /src/app/api/admin/`).

**Dôsledok:** Tlačidlo „Nahrať obrázok" v admin Media tab vráti 404 pri každom pokuse o upload. Worklog Task #11 deklaruje vytvorenie endpointu, ale súbor reálne chýba.

**Oprava:**
```bash
mkdir -p src/app/api/admin/upload
```
Vytvoriť `src/app/api/admin/upload/route.ts` s:
- `POST` handler s `getSession()` auth kontrolou
- `multipart/form-data` parserom (akceptovať JPEG/PNG/WebP/GIF, max 8 MB)
- sharp processing: full (1920px) + thumbnail (600×600 cover)
- Uloženie do `/public/uploads/` s timestampovaným názvom
- Vytvorenie `MediaItem` záznamu s `url`, `thumbnailUrl`, `altText`, `fileSize`, `fileName`
- Návrat `{ ok: true, item }` s HTTP 201

---

### C2. NEÚPLNÁ BASELINE MIGRÁCIA

**Súbor:** `prisma/migrations/20260819000000_baseline/migration.sql` (105 riadkov)
**Stav:** Migrácia obsahuje iba 5 tabuliek (`BookingInquiry`, `Gig`, `Setlist`, `MerchOrder`, + FK reference na `MerchProduct`). Schéma definuje **25 modelov**.

Súbor obsahuje komentár:
```
-- Poznámka: Tento baseline je ilustračný. Plná schéma (všetkých 25 modelov)
-- je generovaná cez `prisma migrate diff --from-empty --to-schema-datamodel
-- prisma/schema.prisma --script > prisma/migrations/20260819000000_baseline/migration.sql`
```

**Dôsledok:**
- `prisma migrate deploy` v produkcii zlyhá / vytvorí neúplnú schému
- `package.json` script `"vercel-build": "prisma generate && prisma db push --accept-data-loss && next build"` obchádza migrácie pomocou `db push` (funcionálne, ale bez version trackingu)
- Nové Vercel deploymenty budú padať na chýbajúce tabuľky pre 20 modelov (Subscriber, Contact, Venue, Organization, Communication, Booking, Task, AutomationLog, FanSegment, Campaign, KnowledgeItem, Song, Rehearsal, ContentItem, GigFinance, AiUsageLog, MerchProduct, ApprovalQueue, BandMember, SiteContent, SeoMeta)

**Oprava:**
```bash
# Regenerovať kompletný baseline
bun run db:migrate:diff
# alebo
prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script \
  > prisma/migrations/20260819000000_baseline/migration.sql
```

---

### C3. `TestimonialsSection` JE MŔTVY KÓD

**Súbor:** `src/app/page.tsx` (riadoky 202-209)
**Stav:** Render testimonials sekcie je **zakomentovaný**:
```tsx
{/* TODO(DORA): Sekcia „Recenzie & referencie" je DOČASNE SKRYTÁ. */}
{/* {showSection("testimonials") && (<><TestimonialsSection/>...)} */}
```

**Problém:**
- Komponent `TestimonialsSection` je stále **importovaný** v `page.tsx` (riadok 18) — ESLint pravdepodobne nepovolí `unused import` v striktnom mode
- `CONTENT_DEFAULTS["settings.sections.testimonials"]` a `SECTIONS_ORDER` v `settings-tab.tsx` stále obsahujú testimonials toggle
- Admin môže zapnúť/vypnúť prepínač, ktorý **nemá žiadny vizuálny efekt** na verejnej stránke

**Oprava (2 možnosti):**
1. **Odstrániť testimonials úplne:** vymazať import v `page.tsx`, zmazať `testimonials` z `CONTENT_DEFAULTS` aj `SECTIONS_ORDER`, zmazať `TestimonialsSection` komponent a `TESTIMONIALS` z `band-data.ts`
2. **Obnoviť render:** odstrániť komentáre v `page.tsx` a znova aktivovať

---

## ⚠️ MAJOR NEZROVNALOSTI (P1 — admin entity bez prepojenia na verejnú stránku)

Tieto admin entity existujú a majú plnú CRUD podporu, ale verejné sekcie na webe ich **nepoužívajú** — zobrazujú hardcoded static dáta z `band-data.ts`.

| # | Verejná sekcia | Zdroj pre verejnú stránku | Admin entita | API endpoint | Stav |
|---|---|---|---|---|---|
| M1 | Music (`#hudba`) | `TRACKS` statický z `band-data.ts` | `Song` model ✓ | `/api/admin/songs` ✓ | **NEPREPOJENÉ** — admin úpravy Songs neovplyvnia verejnú stránku |
| M2 | Setlist (`#setlist`) | `SETLIST` statický z `band-data.ts` | `Setlist` model ✓ | `/api/admin/setlists` ✓ | **NEPREPOJENÉ** — admin Setlisty neovplyvnia verejnú stránku |
| M3 | Discography (`#diskografia`) | `DISCOGRAPHY` + `GENRES` statické | ❌ Žiadny admin model | ❌ Žiadny endpoint | **BEZ CMS** — úpravy vyžadujú zmenu kódu |
| M4 | FAQ (`#faq`) | `FAQS` statické | ❌ Žiadny admin model | ❌ Žiadny endpoint | **BEZ CMS** |
| M5 | Press Kit (`#press`) | `COPY_TEXTS` statické | ❌ Žiadny admin model | ❌ Žiadny endpoint | **BEZ CMS** |
| M6 | About — MILESTONES | `MILESTONES` statické (len `bioLong` je v CMS) | ❌ Žiadny admin model pre míľniky | ❌ | **BEZ CMS** (časť) |

### M1. MusicSection ↔ Songs admin entita

**Súbory:**
- `src/components/sections/music-section.tsx` (riadok 4): `import { TRACKS } from "@/lib/band-data";`
- `src/components/site/sticky-music-player.tsx` (riadok 9): `import { TRACKS } from "@/lib/band-data";`
- `src/components/admin/songs-tab.tsx` — plná CRUD nad `Song` modelom

**Problém:** Admin môže vytvárať/editovať/mazať skladby v Songs tab, ale verejná hudobná sekcia a sticky player stále zobrazujú `TRACKS` z `band-data.ts`. Neexistuje verejný `/api/songs` endpoint.

**Oprava:**
1. Vytvoriť `src/app/api/songs/route.ts`:
   ```ts
   export async function GET() {
     const items = await db.song.findMany({
       where: { status: "released", videoId: { not: null } },
       orderBy: [{ releaseYear: "desc" }, { title: "asc" }],
       take: 12,
     });
     return NextResponse.json({ items });
   }
   ```
2. Upraviť `MusicSection` + `StickyMusicPlayer` aby fetchovali z `/api/songs` s fallbackom na `TRACKS` ak API zlyhá
3. Pridať seed skript, ktorý migruje statické `TRACKS` do `Song` tabuľky pri prvom spustení

### M2. SetlistSection ↔ Setlists admin entita

Analogicky ako M1. Admin vytvorí setlisty v Setlists tab, ale verejná sekcia zobrazuje `SETLIST` z `band-data.ts`.

**Oprava:** Vytvoriť `/api/setlists?status=published` (alebo podobný) a prerobiť `SetlistSection` na fetch s fallbackom.

### M3-M5. Discography / FAQ / Press — bez CMS

Tieto sekcie nemajú ani admin entity, ani CMS kľúče. Jediná cesta ako ich zmeniť je úprava `band-data.ts` a redeploy.

**Oprava (prioritne):**
1. **FAQ** — pridať `FaqItem` model + admin tab + `/api/faqs` public endpoint. Najväčšia hodnota (FAQ sa často mení).
2. **Press copy-texts** — pridať CMS kľúče `press.copytext.*` do `CONTENT_DEFAULTS` (podobne ako `band.bioLong`). Nízky effort.
3. **Discography** — pridať `Release` model + admin tab + `/api/discography` endpoint. Stredný effort.

---

## 🪦 ORPHAN ENDPOINTS (P2 — existujú, ale nikto ich nevolá)

| # | Endpoint | Volaný z UI? | Poznámka |
|---|---|---|---|
| O1 | `/api/admin/venues` + `/api/admin/venues/[id]` | ❌ Nikde | Existuje, ale žiadny admin tab (CRM, Bookings, Gigs) ho necalluje |
| O2 | `/api/admin/organizations` + `/api/admin/organizations/[id]` | ❌ Nikde | Existuje, ale CRM tab fetchuje contacts priamo, nie organizations |
| O3 | `/api/admin/gig-finance` | ❌ Nikde | Existuje, ale Gigs tab nezmazáva fin. dáta (iba gig entity) |
| O4 | `/api/admin/automations` | ❌ Nikde | Automations tab volá `/api/admin/ai`, nie `/api/admin/automations` |
| O5 | `/api/hero-background` | ❌ Nikde | `page.tsx` (riadok 78) priamo volá `db.mediaItem.findMany`, nie tento endpoint |
| O6 | `/api/route.ts` | ❌ N/A | Obsahuje `return NextResponse.json({ message: "Hello, world!" })` — placeholder, ktorý nemá byť v produkcii |

**Oprava (alternatívy):**
- **O1-O4:** Buď implementovať UI ktoré ich využije, alebo zmazať endpointy (ak plánujete využiť neskôr, označiť komentárom `// TODO(M3): Used by upcoming X tab`)
- **O5:** Zmazať `/api/hero-background` — duplicita priameho DB volania v `page.tsx`
- **O6:** Zmazať alebo zmeniť na health-check endpoint (`{ ok: true, version, env, timestamp }`)

---

## 🧭 ADMIN SHELL & SIDEBAR

### A1. `content-items` tab chýba v sidebar NAV_GROUPS

**Súbor:** `src/components/admin/admin-shell.tsx` (riadok 25-97 — `NAV_GROUPS`)

**Stav:** `AdminTab` type (riadok 18) obsahuje `"content-items"`. `src/app/admin/page.tsx` (riadok 71) renderuje `<ContentItemsTab />`. Command palette (riadok 77) má akciu `nav-content-items`. **ALE** sidebar `NAV_GROUPS` tento tab neobsahuje — používateľ ho nemôže otvoriť z sidebaru, iba cez `⌘K`.

**Oprava:** Pridať do group "Obsah":
```ts
{ id: "content-items", label: "Structured Content", icon: ListTree, /* hasCount: true */ },
```

### A2. Sidebar groups sú logické ✓

Skupiny (`Command Center`, `Live`, `CRM`, `Práca`, `Obsah`, `AI`, `Hudba`, `Biznis`, `Systém`) sú dobre organizované. Zhoda s command palette akciami.

### A3. Command palette akcie zodpovedajú tabom ✓

26 navigačných akcií + 2 systémové akcie (logout, web) zodpovedá všetkým AdminTab hodnotám.

---

## 🎛️ SECTION VISIBILITY (showSection)

### V1. `CONTENT_DEFAULTS` obsahuje všetky 17 sekcií ✓

`src/lib/content.ts` (riadok 74-90) definuje `settings.sections.*` pre všetky ID z `ALL_SECTION_IDS` v `src/lib/settings.ts` (riadok 47-64).

Zoznam sekcií (17):
```
hero, stats, about, members, music, gallery, discography, gigs,
setlist, merch, blog, testimonials, press, faq, social, newsletter, contact
```

### V2. `SECTIONS_ORDER` v settings-tab.tsx zodpovedá ✓

`src/components/admin/settings-tab.tsx` (riadok 41) obsahuje rovnakých 17 ID. Order je logický (zhoda s page.tsx render poradím).

### V3. Navbar skrýva linky ku skrytým sekciám ✓

`src/components/site/navbar.tsx` (riadok 9-17):
```ts
const NAV_LINK_SECTION_MAP: Record<string, string> = {
  "#o-kapele": "about",
  "#clenovia": "members",
  "#hudba": "music",
  "#galeria": "gallery",
  "#diskografia": "discography",
  "#faq": "faq",
  "#kontakt": "contact",
};
```
Po fetchi `/api/sections` sa aplikuje `isVisible(href)`. Booking button je podmienený `isVisible("#kontakt")`. ✓

**Chýba:** Linky na `#gigs`, `#merch`, `#blog`, `#setlist`, `#press`, `#social`, `#newsletter` nie sú v NAV_LINKS (band-data.ts). Navbar ich vôbec neobsahuje. Nie je to bug, ale je to nedokonalé — napr. Merch a Blog nie sú z navigácie dostupné.

### V4. Footer skrýva linky ✓

`src/components/site/footer.tsx` (riadok 8-18) obsahuje 9 mappings vrátane `#press`, `#merch`, `#blog`. Filter cez `isVisible(href)` funguje správne.

### V5. Hero CTA buttony podmienené ✓

`src/components/sections/hero-section.tsx` (riadok 41-42):
```ts
const showBooking = isSectionVisible("contact");
const showPress = isSectionVisible("press");
```
Ak sú oba skryté, fallback zobrazí "Spoznať kapelu" button (riadok 161-169). ✓

### V6. StickyMusicPlayer sa skryje, keď je music skrytá ✓

`src/components/site/sticky-music-player.tsx` (riadok 109):
```ts
if (!musicSectionVisible) return null;
```
+ fetch `/api/sections` pre `sections.music` (riadok 35-44). ✓

### V7. Performance: redundantné `/api/sections` fetche ⚠️

**Problém:** 4 komponenty na jednej page fetchujú `/api/sections` nezávisle:
- `Navbar` (riadok 33)
- `Footer` (riadok 37)
- `StickyMusicPlayer` (riadok 36)
- `HeroSection` (riadok 31)

To je 4× rovnaký HTTP request pri každom načítaní homepage. + 1× server-side v `page.tsx`.

**Oprava:** Extrahovať do `SectionVisibilityContext` providera, ktorý fetchne raz a poskytne `isVisible(sectionId)` hook všetkým klient komponentom.

---

## 🤖 AI FUNKCIE

### AI1. Copilot route + model probe ✓

**Súbor:** `src/app/api/admin/copilot/route.ts`

**Implementácia:**
1. `ensureAIAvailable()` (riadok 174) volá `provider.probeModel()` skôr než `streamText()` — overí, že Groq model je dostupný
2. Ak model nie je dostupný: `503` s user-friendly správou o `GROQ_API_KEY`
3. Počas streamovania chyby typu `model_not_found` → `handleModelFailure()` maže cache → re-probe pri ďalšom volaní
4. `sanitizeForPrompt(rawMessage, 2000)` (riadok 163) chráni pred prompt injection
5. RBAC permissions cez `getUserPermissions(session.uid)` (riadok 170)
6. Usage tracking cez `trackStreamUsage()` (riadok 193)

**Verdikt:** Solídne, funguje správne.

### AI2. Blog generate API — error handling ✓

**Súbor:** `src/app/api/admin/blog/generate/route.ts`

- Auth kontrola (`getSession()`) ✓
- `isAIConfigured()` + `ensureAIAvailable()` dvojité overenie ✓
- `sanitizeForPrompt()` pre `topic`, `keywords`, `context` ✓
- `withUsageTracking()` wrapper trackuje tokeny ✓
- JSON parse s fallbackom (ak AI vráti nevalidný JSON, použije sa raw text) ✓
- Try/catch s `detail` v odpovedi pre debug ✓

**Verdikt:** Error handling je na vysokej úrovni.

### AI3. AI Regenerate v blog editore ✓

**Súbor:** `src/components/admin/blog-tab.tsx` (riadok 350 — `handleAIRegenerate`)

```ts
const res = await fetch("/api/admin/blog/generate", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type, topic: title, tone: "punk", length: "medium", context: excerpt || body.slice(0, 200) }),
});
```
Po úspechu nastaví `body`, `excerpt`, `seoTitle`, `seoDescription`, `keywords` a `status="ai_generated"`. UI tlačidlo "AI Regenerovať" s Sparkles ikonou. ✓

**Verdikt:** Funguje správne. Tlačidlo je podmienené `item.id && title`.

### AI4. ApprovalQueue workflow ✓

**Implementácia:**
1. AI agenti (napr. `taskAgent` v `orchestrator.ts`) vytvoria `ApprovalQueue` záznam so `status="pending"` namiesto priameho vytvorenia Task
2. Admin Approvals tab fetchuje `/api/admin/approvals?status=pending`
3. Schválenie (`POST /api/admin/approvals/[id]/approve`):
   - `case "Task":` → vytvorí `Task` s `aiGenerated: true`
   - `case "ContentItem":` → vytvorí `ContentItem` so `status: "draft"`
   - `case "Contact":` → vytvorí `Contact` s `status: "active"`
   - Iné entity → len označí ako approved (custom akcie sa riešia manuálne)
4. Po schválení: `automationLog` záznam s `trigger: "approval"`
5. Zamietnutie (`POST /api/admin/approvals/[id]/reject`): status=rejected + reviewNotes

**Obmedzenie:** Approve route implementuje len 3 entityTypes (Task, ContentItem, Contact). Ak AI agent vytvorí návrh pre iný entityType (napr. Booking, Email), schválenie len prepne status, ale entitu nevytvorí. `default` vetva v switche to rieši ako "custom akcie sa riešia manuálne".

**Verdikt:** Workflow je správne prepojený pre 3 hlavné entity. Pre rozšírenie na ďalšie entity by sa malo doplniť switch.

### AI5. Alt-text auto-gen — obmedzená funkcionalita ⚠️

**Súbor:** `src/components/admin/ai-tab.tsx` (riadok 71-78)

```ts
const res = await fetch("/api/admin/ai", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "custom", instruction: "Vygeneruj krátky alt-text (max 20 slov) v slovenčine pre obrázok z galérie kapely D.O.R.A." }),
});
```

**Problém:** Inštrukcia posiela generický text, **nie samotný obrázok**. AI generuje rovnaký alt-text pre každý obrázok. Worklog Task #14 spomína VLM-based alt-text generáciu (`POST /api/admin/ai/alttext`), ale tento endpoint v kóde neexistuje a AiTab ho nepoužíva.

**Oprava:** Buď implementovať `/api/admin/ai/alttext` s VLM (z-ai-web-dev-sdk `createVision`) podľa worklogu, alebo zmeniť AltTextTool tak, aby posielal `imageUrl` a AI ho analyzovala.

---

## 🗄️ DATABASE

### D1. PostgreSQL vs SQLite schémy — IDENTICKÉ ✓

**Súbory:**
- `prisma/schema.prisma` (PostgreSQL — default pre Vercel)
- `prisma/schema.sqlite.prisma` (SQLite — pre lokálny dev cez `bun run db:push:dev`)

**Rozdiely (iba kozmetické):**
1. SQLite schema má `output = "../node_modules/.prisma/client"` (separator pre dev)
2. PostgreSQL schema má `@db.Text` anotácie na dlhých textových poliach (PostgreSQL-specifikum, SQLite to nepozná a ignoruje)
3. Bezpečne kompatibilné — obe schémy majú rovnakých 25 modelov, rovnaké fieldy, rovnaké indexy

**Verdikt:** Schémy sú konzistentné.

### D2. Indexes ✓

Všetky modely majú adekvátne indexy vrátane **composite indexes** pre časté query patterns:
- `Gig: [status, date]` — pre "upcoming gigs ordered by date"
- `Subscriber: [active, createdAt]` — pre growth rate query
- `Contact: [status, aiScore]` — pre booking probability query
- `Task: [status, priority, dueDate]` — pre urgent tasks query
- `AiUsageLog: [provider, createdAt]`, `[task, createdAt]` — pre cost queries
- `MerchOrder: [status, createdAt]` — pre monthly revenue aggregation

### D3. FK vzťahy ✓

Všetky FK sú správne typované s `onDelete` sémantikou:
- `SetNull` — pre voliteľné vzťahy (Gig→Venue, Booking→Contact, Setlist→Gig, MerchOrder→Gig, AiUsageLog→AdminUser)
- `Cascade` — pre owned vzťahy (Communication→Contact — keď zmazeme kontakt, zmazeme aj komunikácie)
- `Restrict` — pre MerchOrder→MerchProduct (zakáže zmazať produkt, ktorý má objednávky)

Back-relácie sú správne definované: `Gig` má `setlists`, `merchOrders`, `bookings`, `tasks`; `BookingInquiry` má `bookings`; `AdminUser` má `aiUsageLogs`; `Venue` má `gigs`; `Organization` má `contacts`; `Contact` má `communications`, `bookings`; `MerchProduct` má `orders`; `FanSegment` má `campaigns`; `Gig` má `venueRef`, etc.

---

## 📋 ĎALŠIE POZNÁMKY

### N1. Unused dependencies

`package.json` obsahuje balíky, ktoré nie sú použité v kóde:
- `next-auth` — projekt používa custom HMAC session (`src/lib/auth.ts`), nie next-auth
- `next-intl` — projekt je Slovak-only, žiadna i18n
- `@vercel/blob` — upload prebieha lokálne do `/public/uploads/`, nie Vercel Blob

**Oprava:** `bun remove next-auth next-intl @vercel/blob` (zmenší bundle + zrýchli build).

### N2. ContentItem.type schéma vs UI mismatch

**Schéma** (`prisma/schema.prisma` riadok 499):
```
type String @default("blog") // blog | news | event | page | press_release
```

**Admin UI** (`src/components/admin/content-items-tab.tsx` riadok 43-51):
```ts
const TYPE_LABELS = { blog, news, event, press, page, faq, bio };
```

**Niezrovnalosti:**
- Schéma hovorí `press_release`, admin UI používa `press`
- Admin UI má `faq` a `bio`, ktoré schéma nespomína
- Public `/api/blog` akceptuje parameter `?type=` ale s admin UI hodnotami (`press`, `faq`, `bio`) by sa nemuseli vrátiť žiadne výsledky pri filtrovaní

**Oprava:** Zjednotiť — buď zmeniť schému komentár na `blog | news | event | page | press | faq | bio` alebo zmeniť admin UI TYPE_LABELS aby zodpovedali schéme.

### N3. `showSection()` aplikácia ✓

V `src/app/page.tsx` (riadoky 175-219) je `showSection()` konzistentne aplikované na všetky sekcie okrem testimonials (zakomentovaných).

```tsx
{showSection("hero") && (<><HeroSection/>...</>)}
{showSection("stats") && <StatsSection />}
{showSection("about") && (...)}
...
```

Všetky 16 aktívnych sekcií (okrem testimonials) je správne obalených.

### N4. Admin endpoints auth kontrola ✓

Grep cez `/src/app/api` potvrdil **64 súborov** s `getSession()` kontrolou. Overené, že všetky admin endpoints (vrátane `[id]/approve`, `[id]/reject`, `bulk`, `reorder`, `rescore`, `generate`) majú auth guard.

### N5. Public endpoints (bez auth) ✓

Identifikované 8 verejných endpoints:
- `GET /api/blog` — publikované články (filter published, limit 20) ✓
- `GET /api/members` — aktívni členovia ✓
- `GET /api/merch` — aktívne produkty (bez costPrice) ✓
- `GET /api/stats` — agregované počty ✓
- `GET /api/sections` — bool visibility (žiadne citlivé dáta) ✓
- `GET /api/files` — súbory pre sekcii (filter cez `linkedSections`) ✓
- `GET /api/gigs` — koncerty (filter upcoming/past/all) ✓
- `POST /api/booking` — booking inquiry s rate limit + honeypot + GDPR ✓
- `POST /api/newsletter` — subscriber signup ✓
- `GET /api/content?key=` — iba jeden konkrétny kľúč (whitelist-safe) ✓
- `GET /api/settings` — iba banner + sections (bez maintenance internal) ✓

Žiadny z nich nevracia citlivé dáta (passwordHash, email, costPrice, status internal).

---

## 📊 ZHRNUTIE

| Kategória | Stav | Poznámka |
|---|---|---|
| **Kritické chyby (P0)** | 3 | Upload chýba, migrácia neúplná, testimonials mŕtvy kód |
| **Major nezrovnalosti (P1)** | 6 | Music/Setlist/Discography/FAQ/Press/Milestones neprepojené |
| **Orphan endpoints (P2)** | 6 | Venues, Organizations, GigFinance, Automations, HeroBackground, /api/route |
| **Admin shell issues** | 1 | content-items chýba v sidebar |
| **Section visibility** | ✓ + 1 perf tip | Konsistentné, ale 4× redundantný fetch |
| **AI funkcie** | ✓ + 1 bug | Copilot/blog/approval OK, AltText generuje generický text |
| **Database** | ✓ | Schémy totožné, indexy a FK správne |
| **Auth/Security** | ✓ | Všetkých 64 admin endpoints auth-guarded |

## 🎯 PRIORITIZÁCIA OPRAV

### P0 — Blokujúce (treba opraviť ihneď)
1. **C1:** Vytvoriť `/api/admin/upload/route.ts` — bez neho admin upload nefunguje vôbec
2. **C2:** Regenerovať `migration.sql` — bez neho Vercel deploy zlyhá na 20 modeloch (ak by sa použil `migrate deploy`)

### P1 — Dôležité (do 1 týždňa)
3. **M1+M2:** Vytvoriť `/api/songs` + `/api/setlists` public endpoints a prepojiť MusicSection a SetlistSection
4. **C3:** Rozlúpiť sa s `TestimonialsSection` (vymazať) alebo obnoviť render
5. **A1:** Pridať `content-items` do sidebar NAV_GROUPS

### P2 — Polish (do 2 týždňov)
6. **M3-M5:** Pridať CMS kľúče pre Press copy-texts (najnižší effort); zvážiť `FaqItem` entitu pre FAQ
7. **O5:** Zmazať `/api/hero-background` (duplicita)
8. **O6:** Zmazať `/api/route.ts` alebo zmeniť na health-check
9. **AI5:** Implementovať správnu VLM-based alt-text generáciu
10. **N1:** `bun remove next-auth next-intl @vercel/blob`
11. **N2:** Zjednotiť `ContentItem.type` schému vs admin UI
12. **V7:** Extrahovať `/api/sections` fetch do `SectionVisibilityContext`

### P3 — Udržiavanie (do mesiaca)
13. **O1-O4:** Buď implementovať UI ktoré využije `/api/admin/{venues,organizations,gig-finance,automations}`, alebo zmazať
14. Rozšíriť ApprovalQueue workflow na ďalšie entity (Booking, Email, etc.)

---

## 🔍 METÓDA AUDITU

Tento audit bol vykonaný statickou analýzou kódu:
- Načítanie worklog.md (2002 riadkov) pre historický kontext
- Prečítanie kľúčových súborov: `page.tsx`, `admin-shell.tsx`, `settings-tab.tsx`, `command-palette.tsx`, `navbar.tsx`, `footer.tsx`, `sticky-music-player.tsx`, `hero-section.tsx`, `auth.ts`, `middleware.ts`, `provider.ts`, `orchestrator.ts`, schémy (Postgres + SQLite)
- Grep analýza pre `getSession`, `/api/admin/*`, `/api/sections`, `fetch(` patterns naprieč `src/components` a `src/app/api`
- LS overenie existencie `/src/app/api/admin/upload/` adresára (negatívny výsledok — potvrdzuje C1)
- Cross-check admin tabs v `page.tsx` vs `NAV_GROUPS` v `admin-shell.tsx` vs `CommandPalette` akciách
- Overenie konzistencie PostgreSQL vs SQLite schém (25 modelov, indexy, FK)
- Overenie verejných API endpoints (žiadne citlivé dáta)
- Overenie AI funkcionalít (model probe, error handling, approval workflow)

**Verdikt:** Aplikácia je produkčne-stabilná a prešla rozsiahlym QA (podľa worklogu). Hlavné riziká sú v chýbajúcom `/api/admin/upload` (C1), neúplnej migrácii (C2), a diskrepanciách admin↔public prepojení (M1-M6) — tieto sa musia riešiť pred scale-up.
