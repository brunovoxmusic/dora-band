# D.O.R.A. — ENGINEERING ROADMAP

**Zdroj:** D.O.R.A. IMPLEMENTATION GAP ANALYSIS (2026-08-17)
**Cieľ:** Premena z "website + admin" na D.O.R.A. BAND OPERATING SYSTEM
**Princíp:** Inkrementálne míľniky, overené zmeny, žiadne "AI slot" správanie

---

## FÁZA 0 — SECURITY FIRST (P0)

**Cieľ:** Odstrániť všetky kritické bezpečnostné zraniteľnosti pred akýmikoľvek ďalšími zmenami.

### M0.1 — Password Hashing
- **Čo:** bcrypt hashovanie hesiel namiesto plaintext
- **Súbory:** `src/lib/auth.ts`, `src/lib/seed.ts`, `prisma/schema.prisma`
- **Dátový dopad:** Migrácia `AdminUser.password String` → `passwordHash String`
- **Test plán:** Login s existujúcim adminom (re-hash pri prvom login), nový admin cez seed
- **Rollback:** Ak migrácia zlyhá, zachovať pôvodnú schému v git

### M0.2 — Session Secret + Cookie Security
- **Čo:** Odstrániť fallback secret, pridať `secure: true`, timing-safe compare
- **Súbory:** `src/lib/auth.ts`
- **Test:** Bez `ADMIN_SESSION_SECRET` env → crash na štarte; v produkcii cookie má Secure flag

### M0.3 — Z.AI Token Rotation
- **Čo:** Rotovať leaknutý Z.AI JWT token, presunúť do env var
- **Súbory:** `src/lib/zai-config.ts`, `.env`, `.env.example`
- **Test:** Bez `ZAI_TOKEN` env → fallback na prázdny, žiadny hardcoded token v kóde

### M0.4 — Seed Script Security
- **Čo:** Seed číta `ADMIN_EMAIL` + `ADMIN_PASSWORD` z env, hashuje heslo, neloguje ho
- **Súbory:** `src/lib/seed.ts`
- **Test:** Bez env → throw; s env → admin vytvorený s hashom, bez logu hesla

### M0.5 — Mass-Assignment Fix
- **Čo:** 4 PATCH routes používajú explicitný whitelist namiesto `...rest`
- **Súbory:** `src/app/api/admin/contacts/[id]/route.ts`, `tasks/[id]`, `bookings/[id]`, `campaigns/[id]`
- **Test:** PATCH s `id` alebo `createdAt` v body → ignorovať/odmietnuť

### M0.6 — Orphan FK Relations
- **Čo:** Pridať @relation pre `Booking.gigId`, `Task.gigId`, `Campaign.segmentId`
- **Súbory:** `prisma/schema.prisma`
- **Dátový dopad:** Migrácia (pridanie FK constraints)
- **Test:** Vymazať Gig → Booking/Task s gigId sa nastavia na null

### M0.7 — AI Provider Adapter
- **Čo:** Abstrahovať Groq cez `AIProvider` interface
- **Súbory:** `src/lib/ai.ts` (refaktor), nový `src/lib/ai/provider.ts`
- **Test:** Zmena env `AI_PROVIDER=openai` → používa OpenAI namiesto Groq

### M0.8 — AI RBAC + Human-in-the-Loop
- **Čo:** inquiryAgent neauto-vytvára záznamy; vytvorí `ApprovalQueue` návrhy
- **Súbory:** `src/lib/agents/orchestrator.ts`, nový `prisma` model `ApprovalQueue`
- **Test:** Verejný booking inquiry → návrh v admin queue, nie auto-create

### M0.9 — Prompt Injection Defense
- **Čo:** Sanitizácia `inquiry.message` pred vložením do promptu
- **Súbory:** `src/lib/agents/orchestrator.ts`
- **Test:** Inquiry s "ignore previous instructions" → bezpečne spracované

### M0.10 — MusicEvent JSON-LD
- **Čo:** Pridať MusicEvent structured data pre nadchádzajúce koncerty
- **Súbory:** `src/components/site/structured-data.tsx`
- **Test:** Google Rich Results Test → valid MusicEvent

**Quality Gate pre Fázu 0:**
- [ ] Lint: 0 errors
- [ ] Build: úspešný
- [ ] Login funguje s hashovaným heslom
- [ ] Admin API vracia 401 bez auth
- [ ] Mass-assignment blokovaný
- [ ] AI inquiry neauto-vytvára záznamy
- [ ] MusicEvent v JSON-LD

---

## FÁZA 1 — ADMIN UX FOUNDATION (P1)

**Cieľ:** Transformovať admin z "collection of tabs" na Command Center.

### M1.1 — Sidebar Layout
- **Čo:** Nahradiť horizontálny flex-wrap 13 tabov vertikálnym sidebarom s groupovaním
- **Štruktúra:** COMMAND CENTER / WORK (Tasks, Calendar) / LIVE (Shows, Booking) / CRM (Contacts, Fans) / CONTENT (CMS, Media, Campaigns) / AI (Agents, Knowledge) / SYSTEM (SEO, Settings, Users)
- **Súbory:** `src/app/admin/page.tsx` (refaktor), nový `src/components/admin/sidebar.tsx`
- **Mobile:** Drawer s hamburgerom

### M1.2 — Command Palette (⌘K)
- **Čo:** Globálne vyhľadávanie + rýchle akcie cez `cmdk` library
- **Akcie:** New booking, search contact, create task, open next gig, ask AI
- **Súbory:** Nový `src/components/admin/command-palette.tsx`
- **Hook:** `use-keyboard-shortcuts.ts` (už existuje v media-tab, zovšeobecniť)

### M1.3 — Dashboard → "Čo má D.O.R.A. urobiť teraz?"
- **Čo:** Dashboard povrchuje urgentné úlohy, follow-upy, AI návrhy, nadchádzajúce koncerty
- **Súbory:** `src/components/admin/stats-tab.tsx` (refaktor na "command center")
- **Dáta:** Agregácia z Tasks, Bookings, Inquiries, AutomationLog

### M1.4 — Empty/Error States
- **Čo:** Konzistentné grafické empty states + error states s retry buttonom
- **Súbory:** Všetky admin tab komponenty
- **Komponent:** Nový `src/components/admin/empty-state.tsx` + `error-state.tsx`

### M1.5 — Campaign + FanSegment Admin Tabs
- **Čo:** Pridať UI taby pre modely, ktoré už majú API ale nemajú UI
- **Súbory:** Nový `src/components/admin/campaigns-tab.tsx`, `segments-tab.tsx`

---

## FÁZA 2 — BOOKING OS (P1)

**Cieľ:** Transformovať booking na skutočný CRM pipeline.

### M2.1 — Extended Booking Pipeline
- **Čo:** Rozšíriť booking statusy z 5 na 14 (discovered→qualified→lead→contacted→replied→negotiation→offer_sent→hold→confirmed→contract→promotion→event→post_event→repeat)
- **Súbory:** `prisma/schema.prisma` (enum), `booking-tab.tsx` (Kanban s viac stĺpcami)

### M2.2 — Venue / Organization / Event Entities
- **Čo:** Samostatné modely namiesto stringov na Gigu a Contacte
- **Súbory:** `prisma/schema.prisma` (3 nové modely + migrácia)
- **API:** Nové `/api/admin/venues`, `/api/admin/organizations`, `/api/admin/events`

### M2.3 — Contact 360°
- **Čo:** ContactDetail agreguje communications + bookings + tasks + gigs + timeline
- **Súbory:** `src/components/admin/crm-tab.tsx` (refaktor ContactDetail)

### M2.4 — Booking Score v2
- **Čo:** Explainable score s faktormi (genre fit, location fit, commercial fit, etc.)
- **Súbory:** `src/lib/agents/orchestrator.ts` (bookingAgent refaktor)
- **UI:** Factor breakdown v booking karte

### M2.5 — Gig ako Project Object
- **Čo:** Každý potvrdený koncert = mini-projekt s tasks, promo, travel, technical
- **Súbory:** `gigs-tab.tsx` (GigDetail modal → Gig Project view)
- **Workflow:** T-30 → T-21 → T-14 → T-7 → T-3 → T0 → T+1 → T+7

---

## FÁZA 3 — CONTENT OS + SEO (P1)

**Cieľ:** Prechod z key/value na structured content + doplnenie chýbajúcich SEO.

### M3.1 — Structured Content Entity
- **Čo:** Nový `Content` model (title, slug, type, status, language, author, body, excerpt, SEO, media, tags, publishAt, version, approvals)
- **Súbory:** `prisma/schema.prisma`, nový API + admin tab
- **Workflow:** IDEA → DRAFT → AI_GENERATED → AI_CHECK → FACT_CHECK → HUMAN_REVIEW → APPROVED → SCHEDULED → PUBLISHED → ANALYZED

### M3.2 — JSON-LD Structured Data
- **Čo:** Pridať MusicRecording, VideoObject, FAQPage, BreadcrumbList schemas
- **Súbory:** `src/components/site/structured-data.tsx` (dynamicky fetch z DB)

### M3.3 — Dynamic Sitemap
- **Čo:** Fetch gigs + media + /archiv z DB, generovať dynamický sitemap
- **Súbory:** `src/app/sitemap.ts` (refaktor)

### M3.4 — hreflang + Canonical z DB
- **Čo:** Self-referencujúci `sk-SK` hreflang; canonical z `SeoMeta` tabuľky
- **Súbory:** `src/app/layout.tsx`

### M3.5 — PWA Manifest + Favicon Set
- **Čo:** `public/manifest.json` + favicon.ico + apple-touch-icon + android-chrome
- **Súbory:** `public/manifest.json`, `src/app/layout.tsx` (metadata.icons)

### M3.6 — vercel.json + Crons
- **Čo:** Opraviť cesty v functions, pridať cron pre Campaign scheduler
- **Súbory:** `vercel.json`, nový `/api/cron/campaigns` route

---

## FÁZA 4 — AI COPILOT + AGENTS (P1)

**Cieľ:** Transformovať AI z "generátora textu" na operatívnych agentov.

### M4.1 — Knowledge Base
- **Čo:** `KnowledgeItem` model (category, key, value, source, verified, verifiedAt, verifiedBy, confidence)
- **Súbory:** `prisma/schema.prisma`, nový admin tab, API
- **Obsah:** Band identity, history, members, songs, releases, booking rules, brand voice

### M4.2 — AI Tool System
- **Čo:** Definovať tools (search_crm, get_contact, create_lead, create_task, draft_email, etc.)
- **Súbory:** Nový `src/lib/ai/tools.ts`, `src/lib/agents/orchestrator.ts` (použiť tool-calling)
- **Permissions:** Každý tool má READ/WRITE/CREATE/EXECUTE flag

### M4.3 — D.O.R.A. AI Copilot
- **Čo:** Kontextový AI asistent v adminu („Čo máme dnes spraviť?")
- **Súbory:** Nový `src/components/admin/ai-copilot.tsx` (fixed bottom-right)
- **Dáta:** Používa reálnne DB dáta (tasks, bookings, inquiries)

### M4.4 — Agent Permission Model
- **Čo:** Každý agent má explicitné permissions (Content Agent: READ CMS + WRITE DRAFT + NO PUBLISH)
- **Súbory:** `src/lib/ai/permissions.ts`, `prisma/schema.prisma` (AgentPermission model)

### M4.5 — AI Cost Tracking
- **Čo:** Logovať provider, model, tokens, latency, cost pre každý AI call
- **Súbory:** Rozšíriť `AutomationLog` model, admin UI pre cost dashboard

---

## FÁZA 5 — MUSIC OS + LIVE OS (P2)

### M5.1 — Song Database
- **Čo:** `Song` model (title, version, lyrics, BPM, key, tuning, genre, status, demo, recording, stems, artwork, tabs, setlist usage, rights)
- **Workflow:** IDEA → DEMO → ARRANGEMENT → REHEARSAL → RECORDING → MIX → MASTER → RELEASED
- **Súbory:** `prisma/schema.prisma`, nový admin tab, API

### M5.2 — Rehearsal Mode
- **Čo:** `Rehearsal` model (date, members, songs, setlist, new material, BPM, tuning, arrangement status, problems, recordings, notes)
- **Súbory:** `prisma/schema.prisma`, nový admin tab

### M5.3 — Concert Mode (Live OS)
- **Čo:** Mobile-first koncertný mód (venue, soundcheck, stage time, travel, setlist, technical notes, hospitality, fee)
- **Súbory:** Nový `/admin/live` route, responsívny UI
- **Post-event:** EVENT_COMPLETE → automatický post-event workflow

### M5.4 — Setlist Management
- **Čo:** Prepojiť Setlist s Song modelom (nie hardcoded v band-data.ts)
- **Súbory:** `prisma/schema.prisma` (SetlistItem model), refaktor setlist-section.tsx

---

## FÁZA 6 — FAN OS + ANALYTICS (P2)

### M6.1 — Fan 360°
- **Čo:** Rozšíriť Subscriber na Fan (newsletter, event attendance, favorite content, social interactions, location, interests, engagement, source)
- **Segmenty:** LOCAL, CORE_FANS, CASUAL, LIVE_FANS, SUPERFANS, PRESS, INDUSTRY, BOOKERS
- **Súbory:** `prisma/schema.prisma` (Fan model), admin tab

### M6.2 — Fan Journey Tracking
- **Čo:** VISITOR → LISTENER → FOLLOWER → SUBSCRIBER → EVENT_ATTENDEE → REPEAT_ATTENDEE → SUPERFAN
- **Súbory:** Fan model s `journeyStage` poľom

### M6.3 — Analytics Dashboard
- **Čo:** KPI rozdelené na LIVE, CRM, FAN, CONTENT, MUSIC, WEB, BUSINESS
- **Súbory:** `src/components/admin/analytics-tab.tsx`
- **North Star:** D.O.R.A. LIVE GROWTH (qualified bookings + confirmed shows + audience growth + fan engagement)

### M6.4 — Marketing Intelligence
- **Čo:** Týždenný Market Report (nové festivaly, relevantné, venue, booking opportunities, content opportunities)
- **Súbory:** AI agent + cron + admin UI

---

## FÁZA 7 — ADVANCED INTELLIGENCE (P3)

### M7.1 — AI Visibility Monitor
- **Čo:** Automatické testovanie AI odpovedí („slovenské funky punk kapely", „kapely z Púchova")
- **Súbory:** Cron + AI agent + admin dashboard

### M7.2 — Booking Opportunity Map
- **Čo:** Geografická mapa kde D.O.R.A. hrala, má kontakty, má leads, white spaces
- **Súbory:** Admin UI s map komponentom

### M7.3 — Finance OS
- **Čo:** Gig revenue (fee, travel, accommodation, equipment, promotion, costs) → net gig value + profitability score
- **Súbory:** `prisma/schema.prisma` (GigFinance model), admin tab

### M7.4 — Merch Management
- **Čo:** Produkty, sklad, objednávky, event sales, revenue, best sellers
- **Súbory:** `prisma/schema.prisma` (MerchProduct, MerchOrder), admin tab

### M7.5 — Predictive Analytics
- **Čo:** AI predikcie (booking probability, fan engagement trends, revenue forecast)
- **Súbory:** AI agent + analytics dashboard

---

## IMPLEMENTÁČNÝ PORIADOK

```
FÁZA 0 (P0) — SECURITY FIRST
  └── M0.1 → M0.10 (10 míľnikov)
  └── Quality Gate: security audit pass

FÁZA 1 (P1) — ADMIN UX FOUNDATION
  └── M1.1 → M1.5 (5 míľnikov)
  └── Quality Gate: admin UX review

FÁZA 2 (P1) — BOOKING OS
  └── M2.1 → M2.5 (5 míľnikov)
  └── Quality Gate: booking workflow test

FÁZA 3 (P1) — CONTENT OS + SEO
  └── M3.1 → M3.6 (6 míľnikov)
  └── Quality Gate: SEO audit pass

FÁZA 4 (P1) — AI COPILOT + AGENTS
  └── M4.1 → M4.5 (5 míľnikov)
  └── Quality Gate: AI governance review

FÁZA 5 (P2) — MUSIC OS + LIVE OS
  └── M5.1 → M5.4 (4 míľniky)

FÁZA 6 (P2) — FAN OS + ANALYTICS
  └── M6.1 → M6.4 (4 míľniky)

FÁZA 7 (P3) — ADVANCED INTELLIGENCE
  └── M7.1 → M7.5 (5 míľnikov)
```

---

## GIT DISCIPLINE

Každý míľnik = samostatný commit s konvenčným formátom:
```
fix(security): hash admin passwords with bcrypt
refactor(db): add FK relations for orphan gigId fields
feat(admin): introduce sidebar command center layout
feat(booking): add 14-stage pipeline
feat(ai): add booking qualification agent with HITL
```

---

## ABSOLUTNÉ PRAVIDLÁ

1. **NEVER** implementovať bez inšpekcie existujúceho kódu
2. **NEVER** claim "implemented" bez runtime verifikácie
3. **NEVER** invent D.O.R.A. fakty, mená, dátumy
4. **NEVER** expose secrets
5. **NEVER** bypass authorization
6. **ALWAYS** inspect before modifying
7. **ALWAYS** test after modifying
8. **ALWAYS** verify runtime behavior
9. **ALWAYS** perform regression testing
10. **ALWAYS** document architectural decisions

---

*Roadmap je živý dokument — aktualizuje sa po každej fáze na základe reálnych zistení z implementácie.*
