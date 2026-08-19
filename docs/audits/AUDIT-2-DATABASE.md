# AUDIT-2 — HLBOKÝ DATABASE AUDIT (D.O.R.A.)

**Task ID:** AUDIT-2
**Dátum:** 2026-08-19
**Scope:** `prisma/schema.prisma`, `prisma/schema.sqlite.prisma`, `prisma/schema.postgres.prisma`, `prisma/migrations/`, `src/app/api/admin/merch/*`, `src/app/api/admin/ai-usage/*`, `src/lib/ai/usage.ts`, `src/lib/db.ts`
**Metóda:** Read-only audit — žiadne kódové zmeny
**Auditor:** Sub-agent (Explore)

---

## TL;DR — VERDIKT

| Oblasť | Skóre | Status |
|---|---|---|
| Schema coverage (25 modelov) | 10/10 | ✅ Plný coverage |
| FK integrita (orphan FK) | 6/10 | ⚠️ 2 nové orphan FK náleziská |
| Migrácie | 0/10 | 🔴 Žiadne — `db push` v produkcii |
| Cascade pravidlá | 7/10 | ⚠️ MerchOrder.productId = Cascade (deštruktívne) |
| Indexy | 8/10 | 🟡 Chýba ~8 composite indexov |
| Enums | 4/10 | 🔴 35 string-encoded enums (audit hovoril 18) |
| Postgres ↔ SQLite sync | 9/10 | ✅ Identické modely, len @db.Text diff |
| AiUsageLog | 9/10 | ✅ Správne indexovaný, agregácie fungujú |
| Merch stock decrement | 7/10 | ⚠️ Atomic, ale bez stock-sufficiency check |
| **Celkovo Database** | **7/10** | Funkčná, ale s novými nálezmi |

**Zhrnutie:** Pôvodný audit (DORA-IMPLEMENTATION-GAP-ANALYSIS.md §3.2) označil databázu za 7/10. Tento hlbší audit potvrdzuje rovnaké skóre, ale nachádza **2 nové orphan FK**, ktoré pôvodný audit prehliadol (`Setlist.gigId`, `MerchOrder.gigId`), a **kritický cascade bug** v `MerchOrder.productId` (Cascade = zmazanie produktu vymaže celú históriu objednávok). P0-6 fix z auditu (orphan FK na Booking/Task/Campaign) bol **korektne implementovaný**.

---

## 1. PRISMA SCHEMA — `prisma/schema.prisma`

### 1.1 Zoznam modelov (25 / 25 ✅)

Audit očakával ~25 modelov — **nájdených presne 25**:

| # | Model | Účel | Indexy | Unique |
|---|---|---|---|---|
| 1 | `BookingInquiry` | Public booking formulár | 2 | — |
| 2 | `Gig` | Koncerty | 3 | — |
| 3 | `MediaItem` | Galéria / media | 3 | — |
| 4 | `AdminUser` | Admin login | — | email |
| 5 | `Subscriber` | Fan 360° / newsletter | 4 | email |
| 6 | `SiteContent` | CMS key/value + settings | 1 | key |
| 7 | `SeoMeta` | Per-path SEO | — | path |
| 8 | `Contact` | CRM entity | 4 | — |
| 9 | `Venue` | Miesta (kluby, festivaly) | 2 | — |
| 10 | `Organization` | Promotéri, agentúry | 2 | — |
| 11 | `Communication` | Log komunikácie | 2 | — |
| 12 | `Booking` | Booking pipeline | 3 | — |
| 13 | `Task` | AI/manuálne úlohy | 4 | — |
| 14 | `AutomationLog` | AI agent log | 2 | — |
| 15 | `FanSegment` | Fan segmentácia | — | — |
| 16 | `Campaign` | Marketing kampane | 3 | — |
| 17 | `KnowledgeItem` | KB fakty pre AI | 2 | [category,key] |
| 18 | `Song` | Song database | 3 | — |
| 19 | `Rehearsal` | Skúšky | 2 | — |
| 20 | `Setlist` | Setlist per gig | 2 | — |
| 21 | `ContentItem` | Structured CMS content | 4 | slug |
| 22 | `GigFinance` | Finance per gig | 1 | gigId |
| 23 | `AiUsageLog` | AI cost tracking | 5 | — |
| 24 | `MerchProduct` | Merch produkty | 3 | slug |
| 25 | `MerchOrder` | Merch objednávky | 5 | — |

**Celkový počet indexov:** 56 `@@index` deklarácií
**Celkový počet unique constraints:** 8 (`@unique` + `@@unique`)
**Celkový počet @relation:** 8 explicitných vzťahov

### 1.2 FK vzťahy & @relation — Detailná tabuľka

| Child model | Field | Parent model | onDelete | Status |
|---|---|---|---|---|
| `Gig` | `venueId` | `Venue` | `SetNull` | ✅ M2.2 |
| `Contact` | `organizationId` | `Organization` | `SetNull` | ✅ M2.2 |
| `Communication` | `contactId` | `Contact` | `Cascade` | ✅ |
| `Booking` | `contactId` | `Contact` | `SetNull` | ✅ |
| `Booking` | `gigId` | `Gig` | `SetNull` | ✅ P0-6 FIXED |
| `Task` | `gigId` | `Gig` | `SetNull` | ✅ P0-6 FIXED |
| `Campaign` | `segmentId` | `FanSegment` | `SetNull` | ✅ P0-6 FIXED |
| `MerchOrder` | `productId` | `MerchProduct` | `Cascade` | 🔴 **P1 — deštruktívne** |

### 1.3 Orphan FK polia (String ID bez @relation)

Audit pôvodne hlásil **3 orphan FK** — všetky 3 boli opravené (P0-6 FIXED). Avšak tento hlbší audit nachádza **2 NOVÉ orphan FK**, ktoré pôvodný audit nepokryl:

| # | Model | Field | Mali byť | Priority |
|---|---|---|---|---|
| 1 | `Setlist` | `gigId String?` (line 438) | `Gig? @relation(fields: [gigId], references: [id], onDelete: SetNull)` | 🔴 **P0** |
| 2 | `MerchOrder` | `gigId String?` (line 609) | `Gig? @relation(fields: [gigId], references: [id], onDelete: SetNull)` | 🔴 **P0** |
| 3 | `AiUsageLog` | `userId String?` (line 550) | `AdminUser? @relation(...)` (prípadne úmyselne neviazané pre audit log) | 🟡 P2 |

**Príslušné modely chýbajú aj back-relation v `Gig`** — `Gig` má len `bookings` a `tasks`, chýba `setlists Setlist[]` a `merchOrders MerchOrder[]`.

### 1.4 String-encoded enums (35, nie 18 ako v audite)

Pôvodný audit hovoril 18 — reálne je to **35 string-encoded enum polí** bez DB-level validácie. Zoznam:

| Model | Field | Default | Hodnoty (z komentárov) |
|---|---|---|---|
| BookingInquiry | status | "new" | new, contacted, won, lost |
| Gig | status | "upcoming" | upcoming, past, cancelled |
| AdminUser | role | "admin" | admin, editor, viewer (nevyužité) |
| Subscriber | source | "website" | website, social, event, referral, import |
| Subscriber | journeyStage | "subscriber" | visitor→listener→follower→subscriber→attendee→repeat→superfan |
| Subscriber | segment | — | LOCAL, CORE_FANS, CASUAL, LIVE_FANS, SUPERFANS, PRESS, INDUSTRY, BOOKERS |
| Subscriber | country | "SK" | ISO kódy |
| SiteContent | category | "general" | — |
| Contact | type | "fan" | fan, promoter, venue, festival, media, sponsor |
| Contact | status | "active" | active, cold, blacklist |
| Contact | country | "SK" | ISO |
| Venue | type | "club" | club, festival, cultural_center, outdoor, private |
| Venue | country | "SK" | ISO |
| Organization | type | "promoter" | promoter, festival, agency, media, sponsor |
| Organization | country | "SK" | ISO |
| Communication | type | "email" | email, phone, meeting, note |
| Communication | direction | "outbound" | inbound, outbound |
| Booking | status | "lead" | lead, contacted, negotiated, confirmed, cancelled |
| Task | priority | "medium" | low, medium, high, urgent |
| Task | status | "todo" | todo, in-progress, done, cancelled |
| AutomationLog | agentType | — | content, booking, email, task, social, analytics, orchestrator |
| AutomationLog | trigger | — | gig_created, inquiry_received, manual, scheduled |
| AutomationLog | status | "success" | success, error |
| Campaign | type | "newsletter" | newsletter, social, email |
| Campaign | status | "draft" | draft, scheduled, sent |
| KnowledgeItem | category | — | 17 hodnôt (band_identity, history, ...) |
| KnowledgeItem | source | "unverified" | band_archive, pr_document, official_website, ai_inferred, unverified |
| Song | status | "idea" | idea→demo→arrangement→rehearsal→recording→mix→master→released |
| Song | genre | "Funky-Punk" | — |
| Rehearsal | status | "planned" | planned, done, cancelled |
| Setlist | status | "draft" | draft, confirmed, performed |
| ContentItem | type | "blog" | blog, news, event, page, press_release |
| ContentItem | status | "draft" | idea→draft→ai_generated→ai_check→fact_check→human_review→approved→scheduled→published→analyzed |
| ContentItem | language | "sk" | ISO 639-1 |
| MerchProduct | category | "other" | t-shirt, vinyl, cd, poster, sticker, other |
| MerchOrder | type | "event" | event, online, wholesale |
| MerchOrder | status | "confirmed" | pending, confirmed, shipped, delivered, cancelled, refunded |
| MerchOrder | paymentMethod | "cash" | cash, card, online, transfer |

**Dôsledok:** Žiadne DB-level obmedzenie — query môže zapísať `status: "blabla"` a DB to prijme. Treba:
- Prisma `enum` typy pre PostgreSQL (pre SQLite fallback na String + Zod validáciu v API)
- Zod schémy v každom POST/PATCH handleri

### 1.5 Nullable polia ktoré by nemali byť nullable

| Model | Field | Current | Mali by byť | Dôvod |
|---|---|---|---|---|
| `Booking` | `contactId` | `String?` | `String` (required) | Booking bez kontaktu nedáva zmysel — nemá koho bookovať |
| `Booking` | `gigId` | `String?` | `String?` (OK) | Vydá sa — booking môže existovať pred priradením gig-u |
| `Campaign` | `segmentId` | `String?` | OK |broadcast campaign bez segmentu je legitímna |
| `MerchOrder` | `unitPrice` | `Float` (required) | ✅ OK | |
| `MerchOrder` | `quantity` | `Int` (required) | ✅ OK | |
| `MerchProduct` | `price` | `Float` (required) | ✅ OK | |

### 1.6 `@db.Text` usage (PostgreSQL vs SQLite konzistencia)

**PostgreSQL schema (`schema.prisma`):** 30 polí s `@db.Text` — správne pre long-form text / JSON polia.

**SQLite schema (`schema.sqlite.prisma`):** 0 `@db.Text` anotácií — správne, SQLite nemá `@db.Text` (všetko je TEXT).

**Inconsistency:** Nasledujúce polia v PostgreSQL schema CHÝBA `@db.Text` hoci obsahujú dlhý text:

| Model | Field | Current | Issue |
|---|---|---|---|
| `Contact` | `notes` | `String?` | Dlhé poznámky by mali byť `@db.Text` pre konzistenciu s inými "notes" poliami |
| `Subscriber` | `interests` | `String @default("[]")` | JSON array — mal by byť `@db.Text` (pri veľkých array narazí na limit) |
| `Booking` | `proposedFee` / `actualFee` | `String?` | OK — krátke hodnoty |
| `Setlist` | `totalDuration` | `String?` | OK — MM:SS formát |
| `MerchOrder` | `paymentMethod` | `String?` | OK — enum |

> **Poznámka:** V PostgreSQL sa `String` bez `@db.Text` mapuje na `text` typ (nie `varchar(255)`), takže technicky nie je problém s limitom. Avšak **konzistencia** trpí — niektoré "notes" polia majú `@db.Text`, iné nie.

---

## 2. MIGRÁCIE — `prisma/migrations/`

### 🔴 P0 — KRITICKÝ NÁLEZ: ŽIADNE MIGRÁCIE

```
$ ls prisma/
schema.prisma
schema.sqlite.prisma
schema.postgres.prisma
```

**Neexistuje `prisma/migrations/` priečinok.** Projekt výlučne používa `prisma db push` (deklarované v `package.json`):

```json
"db:push": "prisma db push",
"db:push:dev": "prisma db push --schema=prisma/schema.sqlite.prisma",
"db:push:pg": "prisma db push",
"db:migrate": "prisma migrate dev",  // ❌ nikdy nepoužité
```

Worklog potvrdzuje (`worklog.md:1217`): *„bun run db:push → Neon Postgres synced successfully (7.21s)"*.

### Prečo je to problém pre produkciu?

| Aspekt | `db push` | `migrate dev` / `migrate deploy` |
|---|---|---|
| Schema history | ❌ Žiadna | ✅ Verzovaná historia |
| Rollback | ❌ Nemožný | ✅ `migrate resolve --rolled-back` |
| CI/CD safety | ❌ Rezy z DB pri changes | ✅ Iba nové migrácie |
| Team collaboration | ❌ Konflikty pri súbežných zmenách | ✅ Replikovateľné |
| Production drift detection | ❌ Žiadny `migrate status` | ✅ `prisma migrate status` |
| Column renames | ❌ Drop + Create (DATA LOSS) | ✅ Pomenované migrácie |
| Audit trail | ❌ Žiadny | ✅ Git-tracked SQL |

**Worklog znedáležitosť:** `worklog.md:1244` *„Local dev still works via db:push:dev (SQLite schema)"* — potvrdzuje, že tím nikdy neprešiel na migrácie.

### Odporúčanie (P0 — pred akýmikoľvek ďalšími zmenami)

1. **Baseline migrácia:** `prisma migrate dev --name init --create-only` — vygeneruje SQL pre všetkých 25 modelov ako prvú migráciu.
2. **Mark ako applied:** `prisma migrate resolve --applied <timestamp>_init` (ak už je DB v sync cez db push).
3. **Prepnúť CI:** `db:push` → `migrate deploy` vo Vercel build step.
4. **Pridať `prisma/migrations/` do gitu** (v `.gitignore` ak je ignorovaný — verify).

---

## 3. DATA INTEGRITY — Detailné pravidlá

### 3.1 OnDelete pravidlá — Audit

| Relation | onDelete | Hodnotenie | Issue |
|---|---|---|---|
| `Communication → Contact` | `Cascade` | ✅ OK | Zmazanie kontaktu → zmazanie jeho komunikácie (logické) |
| `Booking → Contact` | `SetNull` | ✅ OK | Zmazanie kontaktu zachová booking pre históriu |
| `Booking → Gig` | `SetNull` | ✅ OK | Zmazanie gig-u zachová booking |
| `Task → Gig` | `SetNull` | ✅ OK | |
| `Campaign → FanSegment` | `SetNull` | ✅ OK | |
| `Gig → Venue` | `SetNull` | ✅ OK | |
| `Contact → Organization` | `SetNull` | ✅ OK | |
| **`MerchOrder → MerchProduct`** | **`Cascade`** | 🔴 **P1 — DEŠTRUKTÍVNE** | **Zmazanie produktu vymaže všetky historické objednávky!** Mali by byť `Restrict` alebo `SetNull` (s `productId String?`). |

**`MerchOrder.productId onDelete: Cascade` je najvážnejší nález tohto auditu.** Ak admin pri očistení katalógu zmaze starý produkt (napr. discontinuitné tričko), stratí sa celá predajná história tohto produktu — nemožno spätne vypočítať revenue z predaja.

### 3.2 Unikátne constraint-y

Existujúce (8):
- `AdminUser.email` (@unique)
- `Subscriber.email` (@unique)
- `SiteContent.key` (@unique)
- `SeoMeta.path` (@unique)
- `ContentItem.slug` (@unique)
- `KnowledgeItem.@@unique([category, key])` ✅ composite
- `GigFinance.gigId` (@unique) — 1:1 vzťah
- `MerchProduct.slug` (@unique)

**Chýbajúce (P2):**
- `FanSegment.name` — dva segmenty môžu mať rovnaké meno → konflikt v UI
- `Contact.@@unique([email, type])` — ten istý email môže byť `fan` aj `promoter` (legítimne), ale duplikáty v rovnakom type sú bug
- `Venue.@@unique([name, city])` — dva kluby s rovnakým menom v rovnakom meste

### 3.3 Composite indexes — chýbajúce pre časté query patterns

| Query pattern | Current | Odporúčaný composite index | Priority |
|---|---|---|---|
| „Aktívne gigs chronologicky" | `@@index([status])` + `@@index([date])` samostatne | `@@index([status, date])` | 🟡 P2 |
| „Moje otvorené tasky podľa termínu" | `@@index([status])` + `@@index([dueDate])` | `@@index([status, dueDate])` | 🟡 P2 |
| „Confirmed merch orders podľa dátumu" | `@@index([status])` + `@@index([createdAt])` | `@@index([status, createdAt])` | 🟡 P2 |
| „Hero slideshow položky v poradí" | `@@index([heroBackground])` + `@@index([order])` | `@@index([heroBackground, order])` | 🟡 P2 |
| „AI usage monthly report" | `@@index([createdAt])` + `@@index([provider])` | `@@index([createdAt, provider])` | 🟢 P3 |
| „Published content chronologicky" | `@@index([status])` + `@@index([publishedAt])` | `@@index([status, publishedAt])` | 🟡 P2 |

> Single-column indexes fungujú aj pre kombinované dotazy, ale composite je efektívnejší (menej I/O, menšie index sizes). Pre malú databázu (<10k záznamov) je to P3 — pre produkčný mierak je P2.

### 3.4 JSON-in-String anti-pattern (P2)

Polia, ktoré by mali byť `Json` typ (PostgreSQL) alebo samostatné M:N tabuľky:

| Model | Field | Current | Issue |
|---|---|---|---|
| `Contact` | `tags` | `String @default("[]") @db.Text` | JSON-encoded — nemožno indexovať, nemožno dotazovať |
| `Subscriber` | `interests` | `String @default("[]")` | JSON-encoded |
| `FanSegment` | `subscriberIds` | `String @default("[]") @db.Text` | JSON-encoded M:N vzťah Subscriber↔FanSegment |
| `Rehearsal` | `attendees` | `String @default("[]")` | JSON array mien (Member entita neexistuje) |
| `Rehearsal` | `songIds` | `String @default("[]")` | M:N vzťah Rehearsal↔Song |
| `Setlist` | `items` | `String @default("[]") @db.Text` | JSON array of `{songId, order, note}` — mal by byť M:N junction `SetlistItem` |
| `ContentItem` | `mediaIds` | `String @default("[]") @db.Text` | M:N ContentItem↔MediaItem |
| `ContentItem` | `tags` | `String @default("[]") @db.Text` | JSON tag array |
| `MerchProduct` | `sizes` | `String @default("[]") @db.Text` | OK — malý array |
| `MerchProduct` | `colors` | `String @default("[]") @db.Text` | OK — malý array |

**Najvážnejšie:** `Setlist.items` — query „všetky setlisty, ktoré obsahujú song X" vyžaduje full-table scan + JSON.parse v JS. Mali by existovať `SetlistItem` junction model.

---

## 4. POSTGRES ↔ SQLITE SYNCHRONIZÁCIA

### 4.1 Súhrn

| Schema súbor | Provider | Počet modelov | Status |
|---|---|---|---|
| `schema.prisma` | postgresql | 25 | ✅ DEFAULT (používa sa v produkcii aj Vercel builde) |
| `schema.sqlite.prisma` | sqlite | 25 | ✅ Identické modely/fieldy ako postgres — @db.Text stripped |
| `schema.postgres.prisma` | postgresql | 7 | 🟢 P3 — ZASTARANÝ (legacy), mal by sa zmazať |

### 4.2 Porovnanie `schema.prisma` vs `schema.sqlite.prisma`

| Aspekt | Postgres | SQLite | Sync status |
|---|---|---|---|
| Počet modelov | 25 | 25 | ✅ Identické |
| Fieldy per model | zhoda | zhoda | ✅ Identické |
| `@db.Text` anotácie | 30 použití | 0 použití | ✅ Správne (SQLite nepodporuje) |
| `@unique` / `@@unique` | 8 | 8 | ✅ Identické |
| `@@index` | 56 | 56 | ✅ Identické |
| `@relation` / `onDelete` | 8 | 8 | ✅ Identické |
| `generator output` | (default `node_modules/.prisma/client`) | `../node_modules/.prisma/client` (explicit) | ⚠️ Drobný rozdiel — oba generujú na rovnaké miesto |
| `datasource provider` | `postgresql` | `sqlite` | ✅ Správne |

**Verdikt:** Synchronizácia medzi postgres a sqlite je **excelentná**. Žiadne drift medzi modelmi. Jediný rozdiel je `@db.Text` stripping a datasource provider — obe úmyselné.

### 4.3 `schema.postgres.prisma` — ZASTARANÝ (P3)

Tento súbor obsahuje len 7 modelov (BookingInquiry, Gig, MediaItem, AdminUser, Subscriber, SiteContent, SeoMeta) — pôvodná Phase 1 verzia. Taktiež obsahuje:
- `AdminUser.password String` — **PLAINTTEXT** (už opravené v hlavnej schema ako `passwordHash String`)
- `Subscriber` bez Fan 360° polí (žiadne journeyStage, segment, eventsAttended...)
- Žiadne Phase 2-4 modely (Contact, Booking, Task, AiUsageLog, MerchProduct, ...)

**Najväčšie riziko:** Ak by vývojár omylom spustil `prisma db push --schema=prisma/schema.postgres.prisma`, **DB by sa zrazilá na 7 modelov a stratilo by sa 18 modelov dát**.

### Odporúčanie (P3):
```bash
rm prisma/schema.postgres.prisma
```

---

## 5. AI COST TRACKING — `AiUsageLog`

### 5.1 Model & indexovanie

```prisma
model AiUsageLog {
  id               String   @id @default(cuid())
  provider         String
  model            String
  task             String
  promptTokens     Int      @default(0)
  completionTokens Int      @default(0)
  totalTokens      Int      @default(0)
  latencyMs        Int      @default(0)
  costUsd          Float    @default(0)
  success          Boolean  @default(true)
  errorMessage     String?  @db.Text
  userId           String?  // ⚠️ Orphan FK (P2)
  promptPreview    String?  @db.Text
  createdAt        DateTime @default(now())

  @@index([provider])    // ✅
  @@index([model])       // ✅
  @@index([task])        // ✅
  @@index([createdAt])   // ✅
  @@index([success])     // ✅
}
```

**Hodnotenie:** 5/5 indexov ✅ — excelentne pokryté všetky query patterns z `/api/admin/ai-usage/route.ts`.

### 5.2 Agregácie — fungujú správne

V `src/app/api/admin/ai-usage/route.ts` (182 lines) sa používajú:

```typescript
db.aiUsageLog.count({ where: { createdAt: { gte: since } } })          // ✅
db.aiUsageLog.aggregate({                                                // ✅
  where: { createdAt: { gte: monthStart } },
  _sum: { costUsd: true, totalTokens: true, promptTokens: true, completionTokens: true },
  _avg: { latencyMs: true },
  _count: true,
})
db.aiUsageLog.groupBy({                                                  // ✅
  by: ["model"],
  where: { createdAt: { gte: since } },
  _sum: { costUsd: true, totalTokens: true },
  _count: true,
  orderBy: { _sum: { costUsd: "desc" } },
})
db.aiUsageLog.findMany({ orderBy: { createdAt: "desc" }, take: limit })  // ✅
```

**Funguje korektne** vďaka:
- `@@index([createdAt])` → rýchly time-range filter
- `@@index([provider])`, `@@index([model])`, `@@index([task])` → rýchle groupBy
- `@@index([success])` → rýchly count failed calls

### 5.3 Issues v AiUsageLog

| Issue | Popis | Priority |
|---|---|---|
| `userId` orphan FK | Bez `@relation` na `AdminUser` — nemožno include-relate pri query | 🟡 P2 |
| Denná agregácia v JS | `byDay` query (line 108-112) vytiahne všetky záznamy za 14 dní a agreguje v JS — malo by byť `groupBy({ by: [date_trunc] })`, ale Prisma nepodporuje | 🟢 P3 (low impact do 10k záznamov) |
| Chýba `taskId` / `agentType` | AiUsageLog nevie ktorý agent volanie spustil — `task` je voľný string | 🟡 P2 |
| Chýba index na `[userId]` | Ak by sme pridali query „AI usage per admin" | 🟢 P3 |

### 5.4 Logging v `src/lib/ai/usage.ts`

**Implementácia je kvalitná:**
- `logAiUsage()` — fire-and-forget, chyby len loguje (neovplyvní volanie)
- `withUsageTracking()` wrapper pre non-streaming
- `trackStreamUsage()` pre streaming (await na `result.totalUsage` Promise)
- Cenník hard-coded (Groq + OpenAI) s `FALLBACK_PRICING`
- `promptPreview` orezaný na 200 znakov (dobrá prax)

---

## 6. MERCH MODELS — `MerchProduct`, `MerchOrder`

### 6.1 FK vzťah

```prisma
model MerchProduct {
  // ...
  orders      MerchOrder[]
}

model MerchOrder {
  // ...
  productId   String
  // ...
  product     MerchProduct @relation(fields: [productId], references: [id], onDelete: Cascade)
  //                                                                          ^^^^^^^^^^^^^^^^^^^^^^^^
  //                                                                          🔴 P1 — DEŠTRUKTÍVNE
}
```

**`Cascade` je nesprávne** — zmazanie produktu vymaže všetky objednávky. Mali by byť:
- `onDelete: Restrict` (zabráni zmazaniu produktu ak má objednávky) — najbezpečnejšie
- `onDelete: SetNull` (s `productId String?`) — zachová objednávky ako historical orphan

### 6.2 Stock decrement logika — `src/app/api/admin/merch/orders/route.ts`

```typescript
// POST /api/admin/merch/orders (line 50-84)
const order = await db.$transaction(async (tx) => {
  const newOrder = await tx.merchOrder.create({ ... });
  
  // Decrement stock (only for confirmed orders)
  if (newOrder.status === "confirmed" && !b.skipStockUpdate) {
    const updated = await tx.merchProduct.update({
      where: { id: b.productId },
      data: { stock: { decrement: quantity } },  // ✅ Atomic
    });
    // Auto-mark as bestseller if sold > 20 units total
    const totalSold = await tx.merchOrder.aggregate({
      where: { productId: b.productId, status: "confirmed" },
      _sum: { quantity: true },
    });
    if ((totalSold._sum.quantity || 0) >= 20 && !updated.bestSeller) {
      await tx.merchProduct.update({ where: { id: b.productId }, data: { bestSeller: true } });
    }
  }
  return newOrder;
});
```

**Hodnotenie:**

| Aspekt | Status | Poznámka |
|---|---|---|
| Atomicita (transakcia) | ✅ | `$transaction` s callbackom |
| Decrement je DB-level atomic | ✅ | `{ decrement: quantity }` SQL `UPDATE ... SET stock = stock - ?` |
| Auto-bestSeller pri >20 predajoch | ✅ | Funguje, ale N+1 aggregate query pri každej objednávke (P3) |
| Re-stock pri zmazaní objednávky | ✅ | `DELETE` route incrementuje stock naspäť |
| **Stock-sufficiency check** | 🔴 **CHÝBA** | **Môže ísť do negatívnych čísel** — `stock: -5` je možný |
| **Race condition medzi POST a DELETE** | 🟡 | Ak sa súbežne vytvorí a zmaže objednávka, stock by mohol byť inkonzistentný (Prisma transakcie používajú snapshot, nie row-lock) |
| **PATCH stock re-compute** | 🟡 | Ak admin cez `PATCH /api/admin/merch/orders/[id]` zmení `quantity`, stock sa automaticky neupraví — musí manuálne upraviť produkt |
| Bestseller threshold hardcoded | 🟢 | `>= 20` by mal byť config v `SiteContent` |

### 6.3 Stock decrement — odporúčaný fix (P1)

```typescript
// Pridať pred `tx.merchOrder.create`:
const product = await tx.merchProduct.findUniqueOrThrow({ 
  where: { id: b.productId }, 
  select: { stock: true } 
});
if (newOrder.status === "confirmed" && !b.skipStockUpdate && product.stock < quantity) {
  throw new Error(`Nedostatok na sklade: máme ${product.stock}, potrebujem ${quantity}`);
}
```

Lepší variant: použiť conditional update s `where: { id, stock: { gte: quantity } }` a skontrolovať `updated.count === 1`.

### 6.4 Ďalšie merch issues

| Model | Field | Issue | Priority |
|---|---|---|---|
| `MerchOrder` | `gigId` | Orphan FK (bez `@relation` na `Gig`) — P0 | 🔴 P0 |
| `MerchOrder` | `productId` | `onDelete: Cascade` je deštruktívne | 🔴 P1 |
| `MerchProduct` | `bestSeller` | Vypočítané z predaja, ale field je uložený — môže byť inconsistent | 🟢 P3 |
| `MerchOrder` | `unitPrice` | Snapshot v čase predaja ✅ — dobrá prax (produkty sa nemenia po objednávke) | ✅ OK |

---

## 7. ZHRNUTIE PROBLÉMOV (P0/P1/P2/P3)

### 🔴 P0 — Kritické (fix pred akýmikoľvek nasadením do produkcie)

1. **Žiadne migrácie** — projekt používa `prisma db push` v produkcii. Akékoľvek budúce zmeny schema môžu stratiť dáta. **Fix:** vytvoriť baseline migráciu, prepnúť na `migrate deploy`.
2. **`Setlist.gigId` — orphan FK bez `@relation`** (audit pôvodne nepokryl). **Fix:** Pridať `gig Gig? @relation(fields: [gigId], references: [id], onDelete: SetNull)` + `setlists Setlist[]` v modeli `Gig`.
3. **`MerchOrder.gigId` — orphan FK bez `@relation`** (audit pôvodne nepokryl). **Fix:** Pridať `gig Gig? @relation(fields: [gigId], references: [id], onDelete: SetNull)` + `merchOrders MerchOrder[]` v modeli `Gig`.

### 🔴 P1 — Vysoké (fix v ďalšej iterácii)

4. **`MerchOrder.productId onDelete: Cascade` — deštruktívne.** Zmazanie produktu vymaže históriu objednávok. **Fix:** Zmeniť na `Restrict` alebo `SetNull` (s `productId String?`).
5. **Stock decrement bez sufficiency checku.** Stock môže ísť do negatívnych hodnôt. **Fix:** Pridať kontrolu `stock >= quantity` v transakcii pred decrement.
6. **`BookingInquiry ↔ Booking` stále neprepojené.** Audit P1 z marca 2026 — stále neimplementované. **Fix:** Pridať `bookingInquiryId String?` na `Booking` + `@relation`.
7. **35 string-encoded enums bez DB-level validácie** (pôvodný audit hovoril 18). **Fix:** Konvertovať na Prisma `enum` typy (PostgreSQL podporuje), pre SQLite fallback na String + Zod validáciu v API.

### 🟡 P2 — Stredné (postupne vylepšovať)

8. **`AiUsageLog.userId` — orphan FK bez `@relation` na `AdminUser`.**
9. **`Contact.notes` chýba `@db.Text`** (inconsistency s inými "notes" poliami).
10. **`Subscriber.interests` chýba `@db.Text`** (riziko limitu pri veľkých array).
11. **JSON-in-String anti-pattern** v 10 poliach (`Contact.tags`, `FanSegment.subscriberIds`, `Setlist.items`, `Rehearsal.songIds`, `Rehearsal.attendees`, `ContentItem.mediaIds`, `ContentItem.tags`, ...). Najmä `Setlist.items` by mal byť samostatný `SetlistItem` junction.
12. **Chýbajúce unique constraints:** `FanSegment.name`, `Contact.@@unique([email, type])`, `Venue.@@unique([name, city])`.
13. **Chýbajúce composite indexes** pre kombinované query patterns (6 návrhov v sekcii 3.3).
14. **`Booking.contactId` je nullable** — booking bez kontaktu nedáva zmysel.
15. **`AiUsageLog` chýba `agentType` / `taskId`** — nevie sa ktorý agent volanie spustil.

### 🟢 P3 — Nízke (dlhodobé vylepšenia)

16. **`schema.postgres.prisma` — zastaraný súbor (7 modelov, plaintext password).** Zmazať.
17. **Bestseller threshold hardcoded na `>= 20`** — mal by byť config v `SiteContent`.
18. **Low-stock query hardcoded `stock: { lte: 5 }`** — má používať `minStock` field per-product.
19. **Denná AiUsageLog agregácia v JS** — pre >10k záznamov by mal byť DB-level.
20. **`log: ['query']` v `src/lib/db.ts`** — zapnuté vždy, malo by byť iba dev (audit P2 — stále neopravené).

---

## 8. ČO UŽ JE IMPLEMENTOVANÉ SPRÁVNE ✅

1. **P0-6 fix z auditu** — všetky 3 pôvodné orphan FK (`Booking.gigId`, `Task.gigId`, `Campaign.segmentId`) majú `@relation` s `onDelete: SetNull`. Viditeľné v schema.prisma komentároch: `// P0-6: Added FK relations (were orphan String fields)` (line 49).
2. **P0-1 password hash** — `AdminUser.passwordHash String` + bcrypt (v `src/lib/password.ts` + `seed.ts:11-19`).
3. **25 modelov** — plný coverage očakávaného počtu.
4. **Postgres ↔ SQLite sync** — identické 25 modelov, správne @db.Text stripping.
5. **AiUsageLog indexovanie** — 5 správnych indexov, agregácie a groupBy fungujú efektívne.
6. **Merch stock decrement** — atomic cez `$transaction`, re-stock pri DELETE objednávky.
7. **KnowledgeItem `@@unique([category, key])`** — composite unique constraint pre fact duplikáciu.
8. **GigFinance `gigId @unique`** — 1:1 vzťah (jeden finance záznam per gig).
9. **MerchProduct.slug @unique** + auto-slugify v POST route.
10. **`SiteContent` ukladá aj `settings.*` keys** — unifikovaný key/value + settings store.
11. **Cascading rules** v 7 z 8 vzťahov sú správne (`SetNull` pre historické entity, `Cascade` pre Communication → Contact).
12. **Subscriber Fan 360° polia** — `journeyStage`, `segment`, `engagementScore`, `eventsAttended`, `interests` (M6.1 implementované).

---

## 9. ČO CHÝBA Z AUDIT DOKUMENTU (Phase 2 — Database Integrity)

Audit `DORA-IMPLEMENTATION-GAP-ANALYSIS.md` sekcia 3.2 definoval 8 bodov. Stav implementácie:

| # | Audit bod | Cieľ | Status | Komentár |
|---|---|---|---|---|
| 1 | Orphan FK (3): Booking.gigId, Task.gigId, Campaign.segmentId | Explicit @relation | ✅ **DONE** | P0-6 implementované, viditeľné v schema.prisma:266-267, 287, 338 |
| 2 | Enums (18 string-encoded) | Prisma Pg enums + Zod | ❌ **NOT DONE** | Stále 35 string-encoded enums (audit podpočítaval) |
| 3 | JSON-in-String: Contact.tags, FanSegment.subscriberIds | Json typ alebo M:N tabuľka | ❌ **NOT DONE** | 10 JSON-in-String polí, nič nekonvertované |
| 4 | Missing indexes (10+) | Pridať @@index | 🟡 **PARTIAL** | Pridané indexy pre nové modely, ale chýba ~6 composite indexov |
| 5 | Missing unique: FanSegment.name, Contact(email,type) | Pridať @@unique | ❌ **NOT DONE** | Stále chýba |
| 6 | schema.postgres.prisma zastaraný | Zmazať | ❌ **NOT DONE** | Súbor stále existuje (7 modelov, plaintext password) |
| 7 | BookingInquiry ↔ Booking duplicita | bookingInquiryId na Booking | ❌ **NOT DONE** | Stále neprepojené |
| 8 | Unsafe cascades (orphan FK bez onDelete) | SetNull na všetky | 🟡 **PARTIAL** | Pôvodné 3 orphan FK opravené, ale 2 nové orphan FK bez onDelete pridané (Setlist.gigId, MerchOrder.gigId) |

**Nové body, ktoré audit nepokryl ale tento hlbší audit našiel:**

| # | Nález | Priority |
|---|---|---|
| A | `Setlist.gigId` — orphan FK bez @relation (audit prehliadol) | 🔴 P0 |
| B | `MerchOrder.gigId` — orphan FK bez @relation (audit prehliadol) | 🔴 P0 |
| C | `MerchOrder.productId onDelete: Cascade` — deštruktívne (audit nepokryl merch modely) | 🔴 P1 |
| D | Stock decrement bez sufficiency checku (môže ísť do záporu) | 🔴 P1 |
| E | `AiUsageLog.userId` — orphan FK bez @relation | 🟡 P2 |
| F | Žiadne migrácie (audit sa spomenul db push vo verzii section 1, ale nepožadoval migrácie) | 🔴 P0 |
| G | `Booking.contactId` nullable — booking bez kontaktu nedáva zmysel | 🟡 P2 |
| H | `Contact.notes` a `Subscriber.interests` chýba `@db.Text` pre konzistenciu | 🟡 P2 |
| I | 6 chýbajúcich composite indexov | 🟡 P2 |
| J | `log: ['query']` v db.ts — production query log (audit spomenul P2, stále neopravené) | 🟢 P3 |

---

## 10. PRIORITIZOVANÝ AKČNÝ PLÁN

### Fáza 2A — P0 blokátory (pred akýmikoľvek ďalšími zmenami)
1. Vytvoriť baseline migráciu (`prisma migrate dev --name init --create-only` + `--resolve --applied`).
2. Pridať `@relation` na `Setlist.gigId` + `MerchOrder.gigId` + back-relations v `Gig`.
3. Prepnúť `package.json` skripty z `db:push` na `migrate deploy` v CI/CD.

### Fáza 2B — P1 kritické
4. Zmeniť `MerchOrder.productId onDelete: Cascade` → `Restrict` alebo `SetNull`.
5. Pridať stock-sufficiency check v merch POST route.
6. Pridať `bookingInquiryId` na `Booking` + `@relation`.
7. Začať konverziu 35 string enums na Prisma Pg enums (postupne, aby sa nezlomil backward compat).

### Fáza 2C — P2 stredné
8. Pridať chýbajúce `@@unique` (FanSegment.name, Contact.[email,type], Venue.[name,city]).
9. Pridať 6 composite indexov.
10. Pridať `@db.Text` na `Contact.notes` + `Subscriber.interests`.
11. Pridať `@relation` na `AiUsageLog.userId` → `AdminUser`.
12. Zmazať `schema.postgres.prisma`.
13. Opraviť `Booking.contactId` na required `String` (po dátovej migrácii).

### Fáza 2D — P3 dlhodobé
14. Konvertovať `Setlist.items` JSON na `SetlistItem` junction model.
15. Konvertovať `FanSegment.subscriberIds` na M:N junction `FanSegmentSubscriber`.
16. Vytvoriť `Member` entitu (pre `Rehearsal.attendees` JSON mien).
17. Presunúť `bestSeller` threshold do `SiteContent`.
18. Vypnúť `log: ['query']` v produkcii.

---

## 11. ZÁVER

Database layer D.O.R.A. je **funkčný a robustne indexovaný** (AiUsageLog je príklad), ale obsahuje **kritický deficit v migráciach** (P0) a **dva nové orphan FK**, ktoré pôvodný audit prehliadol (P0). Navyše `MerchOrder.productId` cascade je **deštruktívny bug**, ktorý môže spôsobiť stratu histórie predaja pri cleanup-e katalógu (P1).

Pôvodný audit označil Database za 7/10 — tento hlbší audit **potvrdzuje 7/10**, ale nachádza ďalšie 6 konkrétnych nedostatkov, ktoré audit nepokryl. Po implementácii Fázy 2A + 2B by skóre malo stúpnuť na 9/10.

**Najdôležitejšia akcia:** Vytvoriť baseline migráciu ešte dnes, kým sa nepridá ďalší model alebo field — každá ďalšia zmena cez `db push` znižuje audit trail a zvyšuje riziko production drift.

---

*Audit dokončený. Žiadne kódové zmeny neboli vykonané — audit bol read-only.*
