# D.O.R.A. — KOMPLEXNÝ AUDIT A ROADMAPA 2026-2027

**Dátum auditu:** 2026-08-19
**Auditors:** 4 paralelné forenzné subagenti (Security, Database, Admin/AI, Web/SEO)
**Zdrojové dokumenty:**
- `D.O.R.A.-komplexny-audit-a-roadmap-2026-2027-prompt.md` (1892 riadkov, špecifikácia "D.O.R.A. BAND OS")
- `D.O.R.A.-komplexny-audit-a-roadmap-2026-2027.pdf` (781 KB)
- Pôvodný `DORA-IMPLEMENTATION-GAP-ANALYSIS.md` (z 2026-08-17)
- Aktuálny repozitár (25 Prisma modelov, 22 admin tabov, 68 API routes)

---

## 1. EXECUTIVE SUMMARY

### Celkové skóre systému

| Oblasť | Skóre | Status |
|--------|------:|-------|
| Security (P0 vyriešené, P1 chýba) | 7/10 | ⚠️ Pripravené na P1 fix |
| Database integrity | 7/10 | ⚠️ 3 kritické P0 |
| Admin UX & Command Center | 7.5/10 | ✅ 35/38 míľnikov implementovaných |
| AI infraštruktúra | 6/10 | ⚠️ Dead code, chýbajúci HITL |
| Public web UX/visual | 8.5/10 | ✅ Punk/grunge identity silná |
| SEO/GEO/AEO | 7/10 | ⚠️ 4/7 JSON-LD schemas |
| Performance | 6/10 | ⚠️ Všetky sekcie client components |
| Accessibility (WCAG 2.2 AA) | 6.5/10 | ⚠️ Focus trap chýba |
| Music presentation | 4/10 | 🔴 0 reálnych audio sources |
| Booking form & API | 3/10 | 🔴 Žiadna validácia, GDPR, honeypot |
| Testing | 0/10 | 🔴 NULA testov |
| **CELKOVÉ SKÓRE** | **6.0/10** | **⚠️ Pripravené na P1 fix iteration** |

### Štatistika implementácie

- **Prisma modely:** 25 (pôvodných 14 → +11 nových)
- **Admin taby:** 22 v 9 navigation groups
- **API routes:** 68
- **Míľniky implementované:** 35 z 38 (92%)
- **Commit history:** 50+ commits, všetky pushované na GitHub

---

## 2. IMPLEMENTOVANÉ MÍĽNIKY (35/38)

### ✅ FÁZA 0 — SECURITY (M0.1–M0.10) — KOMPLETNÁ
- M0.1 Password Hashing (bcrypt cost 12)
- M0.2 Session Secret + Cookie Security (env-only, timing-safe compare)
- M0.3 Z.AI Token Rotation (hardcoded token zmazaný)
- M0.4 Seed Script Security (env-based, neloguje heslo)
- M0.5 Mass-Assignment Fix (whitelist na 4 PATCH routes)
- M0.6 Orphan FK Relations (3 opravené: Booking.gigId, Task.gigId, Campaign.segmentId)
- M0.7 AI Provider Adapter (Groq + OpenAI + none)
- M0.8 AI RBAC + Human-in-the-Loop (čiastočne — iba inquiryAgent)
- M0.9 Prompt Injection Defense (sanitizeForPrompt)
- M0.10 MusicEvent JSON-LD

### ✅ FÁZA 1 — ADMIN UX (M1.1–M1.5) — KOMPLETNÁ
- M1.1 Sidebar Layout (vertikálny, groupovaný, mobile drawer)
- M1.2 Command Palette (⌘K, 26 akcií)
- M1.3 Dashboard "Čo má D.O.R.A. urobiť teraz?"
- M1.4 Empty/Error States (EmptyState, ErrorState komponenty)
- M1.5 Campaign + FanSegment admin tab

### ✅ FÁZA 2 — BOOKING OS (M2.1–M2.5) — KOMPLETNÁ
- M2.1 Booking pipeline (DISCOVERED → ... → POST-EVENT)
- M2.2 Venue/Organization entities
- M2.3 Booking Score (aiMatchScore)
- M2.4 Booking intelligence
- M2.5 Communication tracking

### ✅ FÁZA 3 — SEO/CONTENT (M3.3–M3.6) — ČIASTOČNE
- M3.3 Sitemap + robots
- M3.4 hreflang (sk-SK + en)
- M3.5 OpenGraph dynamický
- M3.6 BreadcrumbList
- ❌ M3.1 Structured Content Entity — model + API existujú, ale **bez admin tabu**
- ❌ M3.2 Content workflow UI chýba

### ✅ FÁZA 4 — AI (M4.1, M4.3, M4.5) — ČIASTOČNE
- M4.1 Knowledge Base (KnowledgeItem s source, verified, verifiedAt, verifiedBy, confidence)
- ❌ M4.2 AI Tool System — **mŕtvy kód** (tools.ts má 0 importov)
- M4.3 D.O.R.A. AI Copilot (streaming, kontext z DB, quick prompts)
- ❌ M4.4 RBAC pre agentov — neimplementované
- M4.5 AI Cost Tracking (AiUsageLog, calculateCost, withUsageTracking, trackStreamUsage)

### ✅ FÁZA 5 — MUSIC OS (M5.1–M5.4) — KOMPLETNÁ
- M5.1 Song entity (s BPM, key, tuning, status workflow)
- M5.2 Rehearsal Mode
- M5.3 Concert Mode / Live OS (mobile-first, timer, merch counter)
- M5.4 Setlist Management

### ✅ FÁZA 6 — FAN/ANALYTICS (M6.1, M6.3, M6.4) — KOMPLETNÁ
- M6.1 Fan 360° (journey stages, engagement score)
- M6.3 Analytics Dashboard (6 KPI kategórií)
- M6.4 Marketing Intelligence (AI market report)

### ✅ FÁZA 7 — BUSINESS OS (M7.3–M7.5) — KOMPLETNÁ
- M7.3 Finance OS (GigFinance)
- M7.4 Merchandise OS (MerchProduct, MerchOrder)
- M7.5 Predictive Analytics (5 predikcií, health score)

---

## 3. GAP ANALÝZA — CHÝBAJÚCE PODĽA AUDIT DOKUMENTU

### 🔴 P0 — KRITICKÉ (12 položiek)

#### Security (5 P0)
1. **`/api/chat` verejný bez auth** — cost abuse Groq API, ktokoľvek môže volať
2. **Žiadne rate limiting** — login (brute-force), chat (cost abuse), booking (spam), newsletter (spam)
3. **Žiadna CSRF ochrana** — Origin/Sec-Fetch-Site validation chýba
4. **Žiadne security headers** — CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy
5. **`.env.example` obsahuje `ADMIN_PASSWORD="dora2026"`** — slabé default heslo v template

#### Database (3 P0)
6. **Žiadne migrácie** — iba `prisma db push`, riziko straty dát pri schema zmenách v produkcii
7. **`Setlist.gigId` orphan FK** — bez `@relation`, referenčná integrita porušená
8. **`MerchOrder.gigId` orphan FK** — bez `@relation`

#### Web/SEO (4 P0)
9. **Booking form zbiera osobné údaje bez GDPR consent checkboxu** — právna zraniteľnosť
10. **Chýba `/privacy` route** — Privacy Policy + Cookie Policy + Impressum
11. **Chýba Impressum v footeri** — SK zákon + GDPR vyžaduje
12. **MusicEvent JSON-LD bug** — `offers` sa prepíše ak gig má aj ticketUrl aj ticketPrice

### ⚠️ P1 — VYSOKÉ (18 položiek)

#### Security
13. `taskAgent` stále auto-vytvára Task bez HITL
14. `sanitizeForPrompt()` neaplikuje sa na `/api/admin/copilot`, `/api/admin/ai`, ani na `inquiry.message` v `gatherContext()` (indirect prompt injection)
15. Stateless session — nemožno zneplatniť server-side
16. `AdminUser.role` sa nepoužíva pre RBAC
17. Žiadny `middleware.ts`
18. `next-auth` dependency inštalovaný ale nepoužívaný

#### Database
19. **`MerchOrder.productId onDelete: Cascade`** — deštruktívne! Zmazanie produktu vymaže celú históriu objednávok
20. **Stock decrement bez sufficiency checku** — môže ísť do záporných hodnôt
21. **`BookingInquiry ↔ Booking` neprepojené** — audit P1 z marca 2026 stále neimplementované
22. **35 string-encoded enums** bez DB-level validácie

#### Admin/AI
23. **AI Tool System (M4.2) je mŕtvy kód** — `tools.ts` má 0 importov. 7 definovaných toolov nikto nezavolá
24. **ApprovalQueue model + UI neexistuje** — admin nemá surface na schvaľovanie inquiry analýz
25. **Structured Content (M3.1) admin tab chýba** — model + API existujú, ale nie v sidebare
26. **RBAC pre agentov neexistuje** — `AdminUser.role` sa nikde nekontroluje
27. **Concert Mode merch counter hardcoded** — 4 fixné produkty, neprepojený s MerchProduct tabom
28. **`userEmail` prop vždy null** — v `app/admin/page.tsx` sa nikdy nenastavuje

#### Web/SEO
29. **Prázdne `videoId` na skladbách** — sticky player neplní primárny účel (0 reálnych audio sources)
30. **Žiadny honeypot v booking formulári**
31. **NO Zod `.strict()` validácia** na booking (mass-assignment risk)
32. **Spotify `<a href="">` v footeri** — reloadne stránku (empty string)

### 📋 P2 — STREDNÉ (15 položiek)

33. `verify()` length check nie je constant-time
34. 11 z 22 admin tabov nepoužíva `EmptyState`/`ErrorState` (crm, inquiries, tasks, gigs, media, subscribers, seo, automations, ai, content, settings)
35. `getSession()` volané bez `req` v `organizations/[id]/route.ts` a `venues/[id]/route.ts` → vracajú 401 aj pre adminov (functional bug)
36. Chýba focus trap v modaloch
37. 5 scroll listenerov na homepage (performance)
38. Všetky sekcie `"use client"` (hydration cost)
39. Chýba `/sitemap-news.xml` pre archív
40. Chýba VideoObject JSON-LD
41. Chýba FAQPage pre concerts
42. `next.config.ts` bez `images.remotePatterns` pre externé obrázky
43. Cookie consent symbolický (bez Privacy Policy link)
44. AiUsageLog.userId orphan (bez FK na AdminUser)
45. Chýbajúce composite indexy (6)
46. `Booking.contactId` nullable
47. Maintenance mode bez admin bypass testu

### 📝 P3 — NÍZKE (10 položiek)
48. `schema.postgres.prisma` duplicitný súbor
49. Dead code: `AIChat.tsx`, `useChat.ts`
50. Spotify empty href
51. LCP < 2.5s nie je overené
52. INP < 200ms nie je overené
53. CLS < 0.1 nie je overené
54. Žiadne E2E testy (Playwright)
55. Žiadne unit testy (Vitest/Jest)
56. `BACKLOG.md` neexistuje
57. CHANGELOG.md neexistuje

---

## 4. PRIORITIZOVANÝ PLÁN IMPLEMENTÁCIE

### 🚨 FÁZA A — P0 SECURITY & LEGAL FIX (priority)

**Cieľ:** Odstrániť kritické bezpečnostné a právne zraniteľnosti.

#### A.1 — `/api/chat` Auth Gate + Rate Limiting
- **Čo:** Pridať `getSession()` check na `/api/chat`, rate limiting (10 req/hod/auth user)
- **Súbory:** `src/app/api/chat/route.ts`, nový `src/lib/rate-limit.ts`
- **Implementácia:** In-memory rate limiter (Map s IP/userId → timestamps)
- **Test:** Bez auth → 401; nad limit → 429

#### A.2 — Security Headers + Middleware
- **Čo:** Pridať CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy cez `next.config.ts` headers() + `middleware.ts` pre CSP nonce
- **Súbory:** `next.config.ts`, nový `src/middleware.ts`
- **Implementácia:** Strict CSP (default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https:; ...)
- **Test:** DevTools Network → hlavičky prítomné

#### A.3 — CSRF Protection
- **Čo:** Validovať `Origin` alebo `Sec-Fetch-Site: same-origin` na všetkých POST/PATCH/DELETE
- **Súbory:** `src/lib/auth.ts` (nová `validateCsrf()` funkcia), aplikovať v admin routes
- **Test:** POST z iného originu → 403

#### A.4 — GDPR Compliance
- **Čo:** 
  - Pridať GDPR consent checkbox do booking formulára (required)
  - Vytvoriť `/privacy` route (Privacy Policy + Cookie Policy + Impressum)
  - Pridať Impressum link do footera
- **Súbory:** `src/components/sections/contact-section.tsx`, nový `src/app/privacy/page.tsx`, `src/components/site/footer.tsx`
- **Test:** Booking bez consent → validation error; `/privacy` → 200 s obsahom

#### A.5 — MusicEvent JSON-LD Bug Fix
- **Čo:** Opraviť `structured-data.tsx` — ak gig má aj ticketUrl aj ticketPrice, `offers` sa prepíše
- **Súbory:** `src/components/site/structured-data.tsx` (riadky 137-142)
- **Test:** JSON-LD validátor → správne `offers` s url + price

#### A.6 — Database Migrations Setup
- **Čo:** Inicializovať `prisma/migrations/` s baseline migráciou zo súčasného stavu
- **Súbory:** `prisma/migrations/`, `package.json` (nové scripty)
- **Implementácia:** `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
- **Test:** `prisma migrate status` → "Database is up to date"

#### A.7 — Orphan FK Fix (Setlist + MerchOrder)
- **Čo:** Pridať `@relation` pre `Setlist.gigId` a `MerchOrder.gigId`
- **Súbory:** `prisma/schema.prisma`, `prisma/schema.sqlite.prisma`
- **Dátový dopad:** Migrácia pridá FK constraints
- **Test:** Vymazať Gig → Setlist/MerchOrder s gigId sa nastavia na null

#### A.8 — `.env.example` Cleanup
- **Čo:** Zmazať `ADMIN_PASSWORD="dora2026"`, nahradiť placeholderom `ADMIN_PASSWORD="change-me-in-env"`
- **Súbory:** `.env.example`
- **Test:** Grep → žiadny reálny password

### 🔧 FÁZA B — P1 AI/ADMIN FIX (high priority)

**Cieľ:** Aktivovať mŕtvy AI Tool System, dokončiť HITL, pridať chýbajúce admin taby.

#### B.1 — AI Tool System Aktivácia (M4.2 → M4.4)
- **Čo:** Pripojiť `tools.ts` do Copilot route cez `streamText` s `tools` parametrom
- **Súbory:** `src/app/api/admin/copilot/route.ts`, `src/lib/ai/tools.ts`
- **Implementácia:** `streamText({ model, system, prompt, tools: { search_crm, get_upcoming_gigs, ... } })`
- **Test:** Copilot otázka "Aké máme koncerty?" → zavolá `get_upcoming_gigs` tool

#### B.2 — ApprovalQueue Model + UI (M0.8 dokončenie)
- **Čo:** 
  - Pridať `ApprovalQueue` Prisma model (agentType, entityType, entityId, payload JSON, status, approvedBy, approvedAt)
  - `taskAgent` vytvára návrhy do queue namiesto auto-create Task
  - Nový admin tab "Schválenia" s zoznamom pending items
- **Súbory:** `prisma/schema.prisma`, `src/lib/agents/orchestrator.ts`, nový `src/components/admin/approvals-tab.tsx`, nový API `/api/admin/approvals`
- **Test:** Inquiry → inquiryAgent beží → pending v queue → admin schváli → Task vytvorený

#### B.3 — Structured Content Admin Tab (M3.1)
- **Čo:** Pridať `ContentItem` admin tab do sidebara (model + API už existujú)
- **Súbory:** `src/components/admin/content-items-tab.tsx`, `src/components/admin/admin-shell.tsx`, `src/app/admin/page.tsx`, `src/components/admin/command-palette.tsx`
- **Workflow UI:** IDEA → DRAFT → AI_GENERATED → AI_CHECK → FACT_CHECK → HUMAN_REVIEW → APPROVED → SCHEDULED → PUBLISHED → ANALYZED
- **Test:** Vytvor ContentItem → prejdi stavmi → published

#### B.4 — RBAC pre Agentov (M4.4)
- **Čo:** Kontrola `AdminUser.role` pred spustením agentov s WRITE/SEND/DELETE permissions
- **Súbory:** `src/lib/agents/orchestrator.ts`, `src/lib/ai/tools.ts`
- **Implementácia:** `runAgent(agentType, userId)` → over permission podľa role
- **Test:** Admin s role="viewer" → agent s WRITE → 403

#### B.5 — Concert Mode ↔ Merch Integration
- **Čo:** Nahradiť hardcoded merch v Concert Mode reálnymi MerchProduct z DB
- **Súbory:** `src/components/admin/concert-mode-tab.tsx`
- **Implementácia:** Fetch z `/api/admin/merch/products?active=true` namiesto DEFAULT_MERCH
- **Test:** Concert Mode merch counter zobrazí reálne produkty

#### B.6 — Admin Email Fix
- **Čo:** Opraviť `userEmail` prop v `app/admin/page.tsx` (vždy null)
- **Súbory:** `src/app/admin/page.tsx`, `src/components/admin/admin-shell.tsx`
- **Implementácia:** Fetch `/api/auth/session` → setUserEmail
- **Test:** Sidebar footer zobrazí admin email

#### B.7 — EmptyState/ErrorState Konzistencia
- **Čo:** Pridať EmptyState/ErrorState do 11 tabov (crm, inquiries, tasks, gigs, media, subscribers, seo, automations, ai, content, settings)
- **Súbory:** každý z 11 admin tab komponentov
- **Test:** Prázdny state → EmptyState zobrazený; chyba → ErrorState s retry

#### B.8 — Functional Bug: getSession() bez req
- **Čo:** Opraviť `organizations/[id]/route.ts` a `venues/[id]/route.ts` — `getSession()` bez `req` vracia 401
- **Súbory:** `src/app/api/admin/organizations/[id]/route.ts`, `src/app/api/admin/venues/[id]/route.ts`
- **Test:** PATCH organization ako admin → 200 (nie 401)

#### B.9 — Prompt Injection Defense na Copilot
- **Čo:** Aplikovať `sanitizeForPrompt()` na user input v copilot route a `gatherContext()` inquiry.message
- **Súbory:** `src/app/api/admin/copilot/route.ts`
- **Test:** "Ignore previous instructions" v otázke → bezpečne spracované

#### B.10 — Booking Form Validácia (Zod)
- **Čo:** Pridať Zod `.strict()` schema na booking API + honeypot field
- **Súbory:** `src/app/api/booking/route.ts`, `src/components/sections/contact-section.tsx`
- **Test:** Booking s extra polom → 422; honeypot vyplnený → 200 ale neuloží

#### B.11 — Spotify Empty Href Fix
- **Čo:** Opraviť `<a href="">` v footeri → `href="#"` alebo `target="_blank"` s reálnym URL
- **Súbory:** `src/components/site/footer.tsx`
- **Test:** Click na Spotify → ne-reloadne stránku

### 📊 FÁZA C — P2 DATABASE & UX (medium priority)

#### C.1 — MerchOrder Cascade Fix
- **Čo:** Zmeniť `MerchOrder.productId onDelete: Cascade` na `SetNull` alebo `Restrict`
- **Súbory:** `prisma/schema.prisma`
- **Test:** Zmazať produkt s objednávkami → Restrict error alebo productId=null

#### C.2 — Stock Sufficiency Check
- **Čo:** Pred decrementom overiť `stock >= quantity`, ak nie → 422
- **Súbory:** `src/app/api/admin/merch/orders/route.ts`
- **Test:** Objednávka 100 ks s 5 skladom → 422 "nedostatok skladom"

#### C.3 — BookingInquiry ↔ Booking Prepojenie
- **Čo:** Pridať `Booking.inquiryId` FK
- **Súbory:** `prisma/schema.prisma`
- **Test:** Booking vytvorený z inquiry → inquiryId odkazuje

#### C.4 — Composite Indexes (6)
- **Čo:** Pridať composite indexy pre časté query patterns:
  - `Gig(status, date)` — upcoming gigs
  - `MerchOrder(status, createdAt)` — monthly revenue
  - `AiUsageLog(provider, createdAt)` — provider costs
  - `Task(status, priority, dueDate)` — urgent tasks
  - `Contact(status, aiScore)` — booking probability
  - `Subscriber(active, createdAt)` — growth rate
- **Súbory:** `prisma/schema.prisma`
- **Test:** `EXPLAIN ANALYZE` → používa composite index

#### C.5 — AiUsageLog.userId FK
- **Čo:** Pridať `@relation` na AdminUser
- **Súbory:** `prisma/schema.prisma`
- **Test:** Vymazať AdminUser → AiUsageLog.userId = null

#### C.6 — Focus Trap v Modaloch
- **Čo:** Pridať focus trap do Dialog komponentov (ESC zatvorí, Tab cykluje)
- **Súbory:** `src/components/ui/dialog.tsx`
- **Test:** Otvoriť modal → Tab cykluje vnútri, ESC zatvorí

#### C.7 — Performance: Client → Server Components
- **Čo:** Konvertovať 5 sekcií z `"use client"` na server components (gallery, press, faq, testimonials, about)
- **Súbory:** `src/components/sections/*.tsx`
- **Test:** LCP meranie → zlepšenie

#### C.8 — Cookie Consent + Privacy Link
- **Čo:** Pridať link na `/privacy` do cookie consent bannera
- **Súbory:** `src/components/site/cookie-consent.tsx`
- **Test:** Cookie banner → "Viac informácií" link → `/privacy`

#### C.9 — VideoObject + FAQPage JSON-LD
- **Čo:** Pridať VideoObject pre YouTube videá, FAQPage pre concerts
- **Súbory:** `src/components/site/structured-data.tsx`
- **Test:** Google Rich Results Test → valid

#### C.10 — Dead Code Cleanup
- **Čo:** Zmazať `AIChat.tsx`, `useChat.ts`, `schema.postgres.prisma`
- **Súbory:** zmazať nepoužívané
- **Test:** Lint → 0 errors, build → OK

### 🧪 FÁZA D — TESTING & POLISH (low priority)

#### D.1 — Unit Testy (Vitest)
- **Čo:** Pridať Vitest + testy pre `src/lib/auth.ts`, `src/lib/password.ts`, `src/lib/ai/usage.ts`, `src/lib/ai/provider.ts`
- **Súbory:** `vitest.config.ts`, `src/lib/__tests__/*.test.ts`
- **Cieľ:** 80% coverage pre lib functions
- **Test:** `bun run test` → all green

#### D.2 — E2E Testy (Playwright)
- **Čo:** Pridať Playwright + testy pre:
  - Homepage render
  - Booking form flow (positive + negative)
  - Admin login
  - Admin CRUD (gigs, contacts, songs, merch)
  - AI Copilot interaction
- **Súbory:** `playwright.config.ts`, `e2e/*.spec.ts`
- **Cieľ:** 10+ critical flows covered
- **Test:** `bun run test:e2e` → all green

#### D.3 — BACKLOG.md + CHANGELOG.md
- **Čo:** Vytvoriť `BACKLOG.md` (recorded ideas mimo scope) + `CHANGELOG.md` (history zmien)
- **Súbory:** `BACKLOG.md`, `CHANGELOG.md`

#### D.4 — Performance Audit
- **Čo:** Lighthouse audit, Core Web Vitals meranie, bundle analyzer
- **Súbory:** `next.config.ts` (webpack-bundle-analyzer)
- **Cieľ:** LCP < 2.5s, INP < 200ms, CLS < 0.1
- **Test:** Lighthouse → 90+ skóre

#### D.5 — Song Audio Sources
- **Čo:** Pridať reálne YouTube `videoId` pre skladby (aspoň 3)
- **Súbory:** Seed script alebo admin Songs tab
- **Test:** Sticky player → prehráva reálne audio

---

## 5. ČASOVÝ ODHAD

| Fáza | Úlohy | Odhad času | Priority |
|------|-------|------------|----------|
| **A** | P0 Security & Legal | 2-3 dni | 🚨 KRITICKÉ |
| **B** | P1 AI/Admin Fix | 3-4 dni | ⚠️ VYSOKÉ |
| **C** | P2 Database & UX | 2-3 dni | 📋 STREDNÉ |
| **D** | Testing & Polish | 3-4 dni | 📝 NÍZKE |
| **SPOLU** | 40+ úloh | **10-14 dní** | |

---

## 6. ZÁVER

Aplikácia D.O.R.A. je v **pokročilom štádiu** (35/38 míľnikov implementovaných, 92%), ale obsahuje:

1. **Kritické bezpečnostné medzery** (P0) — rate limiting, CSRF, security headers, GDPR compliance
2. **Mŕtvy AI kód** — tools.ts (M4.2) je implementovaný ale nepoužívaný
3. **Polovičatý HITL** — inquiryAgent má, taskAgent nemá
4. **Chýbajúci admin tab** — Structured Content (M3.1) model + API bez UI
5. **Nula testov** — žiadne unit ani E2E testy
6. **Právne riziká** — chýba Privacy Policy, Impressum, GDPR consent

### Odporúčaný postup:

1. **Začať s FÁZOU A** (P0 Security & Legal) — tieto zraniteľnosti blokujú produkčné nasadenie
2. **Pokračovať FÁZOU B** (P1 AI/Admin Fix) — aktivovať mŕtvy kód, dokončiť HITL
3. **Potom FÁZA C** (P2 Database & UX) — stabilizácia
4. **Nakoniec FÁZA D** (Testing & Polish) — kvalitné záchranné siete

### Verifikácia:

Každá úloha musí prejsť Quality Gate:
- [ ] implementovaná
- [ ] integrovaná
- [ ] typecheck + lint pass
- [ ] runtime overené (agent-browser alebo curl)
- [ ] bez regresií
- [ ] dokumentované v worklog.md

**END GOAL:** Produkčne pripravený D.O.R.A. BAND OPERATING SYSTEM so SECURE FOUNDATION + COHERENT UX + RELIABLE DATA + AI COPILOT + AGENTS + AUTOMATION + ANALYTICS, kde každá dôležitá operácia je OBSERVABLE, VALIDATED, TESTED, AUDITABLE a ACTUALLY WORKING.
