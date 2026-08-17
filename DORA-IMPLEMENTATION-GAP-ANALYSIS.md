# D.O.R.A. — IMPLEMENTATION GAP ANALYSIS

**Auditovaný repozitár:** `github.com/brunovoxmusic/dora-band`
**Verejný web:** `dora-band.vercel.app`
**Dátum auditu:** 2026-08-17
**Auditors:** 4 paralelné forenzné agenty (security, database/API, admin/AI/CMS/CRM, web/SEO/deployment)

---

## 1. CURRENT SYSTEM MAP

### Frontend
- **Framework:** Next.js 16.1.1 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **State:** Zustand (client) + React Query (server) + MusicPlayerContext
- **Animation:** Framer Motion + CSS keyframes + IntersectionObserver scroll-reveal
- **Fonts:** Montserrat (display), Roboto Condensed, Inter (body), JetBrains Mono
- **Icons:** Lucide React (80+ icons, no tree-shaking)

### Backend
- **ORM:** Prisma 6.11 (PostgreSQL prod / SQLite dev)
- **API:** 37 route handlers v 28 súboroch (žiadne server actions)
- **Auth:** Vlastná HMAC-signed cookie implementácia (nie NextAuth aj napriek závislosti)
- **AI:** Vercel AI SDK + Groq (llama-3.3-70b-versatile + llama-3.1-8b-instant)
- **File uploads:** @vercel/blob (prod) / filesystem (dev) + Sharp optimization
- **Validation:** Manuálna (Zod nainštalovaný ale nepoužívaný)

### Database
- **Provider:** PostgreSQL (Neon, eu-central-1)
- **14 modelov:** BookingInquiry, Gig, MediaItem, AdminUser, Subscriber, SiteContent, SeoMeta, Contact, Communication, Booking, Task, AutomationLog, FanSegment, Campaign
- **3 orphan FK:** Booking.gigId, Task.gigId, Campaign.segmentId
- **18 string-encoded enums** bez validácie

### Authentication
- **Mechanism:** HMAC-SHA256 signed cookie (stateless)
- **Password storage:** ❌ Plaintext (`user.password !== password`)
- **Session secret:** ❌ Fallback v zdrojovom kóde
- **Cookie:** httpOnly + sameSite=lax, ❌ chýba `secure` flag
- **RBAC:** AdminUser.role existuje ale nepoužíva sa

### AI
- **Provider:** Groq (hardcoded, žiadny adapter)
- **Agenti:** 5 (content, task, email, booking, inquiry) + orchestrator
- **Tools:** ❌ Žiadne (single-shot prompty, žiadny tool-calling)
- **Audit log:** ✅ AutomationLog pre všetky operácie
- **RBAC:** ❌ Žiadny
- **Human-in-the-loop:** ❌ Žiadny (inquiryAgent auto-vytvára záznamy)

### Deployment
- **Hosting:** Vercel (serverless)
- **DB:** Neon Postgres (eu-central-1)
- **Storage:** Vercel Blob
- **Package manager:** Bun
- **vercel.json:** Functions cesty ukazujú na neexistujúce súbory, crons prázdne

---

## 2. TARGET SYSTEM (podľa audit dokumentu)

**D.O.R.A. BAND OPERATING SYSTEM** — jednotné digitálne prostredie:

```
PUBLIC EXPERIENCE          PRIVATE OS
├── Music                  ├── CRM (Contact 360°)
├── Live                   ├── CMS (structured content)
├── Media                  ├── Booking OS (full pipeline)
├── Press                  ├── Tasks/Projects
├── Booking                ├── Music OS (songs, rehearsals)
├── Fans                   ├── Live OS (concert mode)
└── Connect                ├── Fan OS (360°)
                           ├── AI Copilot
                           ├── AI Agents (tool-calling)
                           ├── AI Orchestrator
                           ├── Knowledge Base
                           ├── Automation Engine
                           └── Analytics
```

---

## 3. GAP ANALYSIS — CURRENT vs TARGET

### 3.1 SECURITY

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| Password storage | Plaintext | bcrypt/argon2 hash | 🔴 Kritické | P0 |
| Session secret | Fallback v kóde | Env-only, throw ak chýba | 🔴 Kritické | P0 |
| Z.AI JWT token | Hardcoded v zdrojáku | Env var, token rotovaný | 🔴 Kritické | P0 |
| Default admin creds | admin@dora.band / dora2026 | Generované, env-based | 🔴 Kritické | P0 |
| Cookie secure flag | Chýba | secure: true v produkcii | ⚠️ Vysoké | P1 |
| CSRF protection | Žiadna | Origin/Sec-Fetch-Site validation | ⚠️ Vysoké | P1 |
| Rate limiting | Žiadne | @upstash/ratelimit na login/chat/booking | ⚠️ Vysoké | P1 |
| AI proxy auth | /api/chat verejný | Session-gate alebo CAPTCHA | ⚠️ Vysoké | P1 |
| Security headers | Žiadne | CSP, X-Frame, X-Content-Type, HSTS | 🟡 Stredné | P2 |
| Mass-assignment | 4 PATCH routes zraniteľné | Zod .strict() whitelist | 🔴 Kritické | P0 |
| Timing-safe compare | `===` na stringoch | crypto.timingSafeEqual | 🟡 Stredné | P2 |
| Session revocation | Stateless, nemožné | Session model v DB | 🟡 Stredné | P2 |
| SQL query logging | Zapnuté v produkcii | Iba dev | 🟡 Stredné | P2 |

**Verdikt:** Security je **4/10** — NEBEZPEČNÉ NA PRODUKCIU.

---

### 3.2 DATABASE INTEGRITY

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| Orphan FK | 3 (Booking.gigId, Task.gigId, Campaign.segmentId) | Explicit @relation | 🔴 Kritické | P0 |
| Enums | 18 String-encoded bez validácie | Prisma Pg enums + Zod | ⚠️ Vysoké | P1 |
| JSON-in-String | Contact.tags, FanSegment.subscriberIds | Json typ alebo M:N tabuľka | 🟡 Stredné | P2 |
| Missing indexes | 10+ chýba | Pridať @@index | 🟡 Stredné | P2 |
| Missing unique | FanSegment.name, Contact(email,type) | Pridať @@unique | 🟡 Stredné | P2 |
| schema.postgres.prisma | Zastaraný (7 modelov) | Zmazať | 🟢 Nízke | P3 |
| BookingInquiry ↔ Booking | Duplicita, bez prepojenia | bookingInquiryId na Booking | ⚠️ Vysoké | P1 |
| Unsafe cascades | Orphan FK bez onDelete | SetNull na všetky | ⚠️ Vysoké | P1 |

**Verdikt:** Database je **7/10** — funkčná ale s orphan FK a bez enums.

---

### 3.3 API

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| Input validation | Manuálna, 10/37 handlerov | Zod schémy všade | ⚠️ Vysoké | P1 |
| Pagination | Žiadna (hardcoded take:50-500) | Cursor-based + total/hasMore | ⚠️ Vysoké | P1 |
| Error handling | 15/37 bez try/catch | Jednotný error envelope | ⚠️ Vysoké | P1 |
| Response format | Nekonzistentný | apiOk/apiError helper | 🟡 Stredné | P2 |
| Rate limiting | Žiadne | Per-endpoint limity | ⚠️ Vysoké | P1 |
| Auth pattern | Inline (29 admin routes) | guard() wrapper | 🟢 Nízke | P3 |
| API contracts | Žiadne OpenAPI | TypeBox/OpenAPI schémy | 🟢 Nízke | P3 |

**Verdikt:** API je **6/10** — auth OK, ale žiadny Zod, mass-assignment, žiadna pagination.

---

### 3.4 ADMIN UX

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| Navigácia | 13 tabov v flex-wrap | Sidebar + groupovanie | ⚠️ Vysoké | P1 |
| Command palette | Žiadny | ⌘K s cmdk | ⚠️ Vysoké | P1 |
| Global search | Žiadny | Cross-entity search | ⚠️ Vysoké | P1 |
| Empty states | Nedôsledné (1/13 grafický) | Konzistentné všade | 🟡 Stredné | P2 |
| Error states | Tiché (catch { setLoading }) | Retry + error message | 🟡 Stredné | P2 |
| Mobile drawer | Žiadny | Sidebar drawer pre mobil | ⚠️ Vysoké | P1 |
| Dashboard | Štatistiky | "Čo má D.O.R.A. urobiť teraz?" | ⚠️ Vysoké | P1 |
| Admin user mgmt | Žiadny UI | CRUD admin users + roles | 🟡 Stredné | P2 |
| Notifications | Toasts len momentálne | Activity feed sidebar | 🟡 Stredné | P2 |

**Verdikt:** Admin UX je **6.5/10** — funkčný ale nezvládne rast.

---

### 3.5 AI

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| Provider abstraction | Groq hardcoded | AIProvider interface + adapter | 🔴 Kritické | P0 |
| RBAC pre agentov | Žiadny | Permission model (READ/WRITE/PUBLISH) | 🔴 Kritické | P0 |
| Human-in-the-loop | Žiadny | Approval queue pre kritické akcie | 🔴 Kritické | P0 |
| Tool-calling | Žiadny (single-shot) | Tool systém (search_crm, create_lead, etc.) | ⚠️ Vysoké | P1 |
| Prompt injection | inquiry.message v prompte | Sanitizácia + system prompt isolation | 🔴 Kritické | P0 |
| Knowledge base | Žiadna | Band facts s source/verified/confidence | ⚠️ Vysoké | P1 |
| Brand guardian | Žiadny | Fact check + brand voice validation | 🟡 Stredné | P2 |
| AI cost tracking | Žiadne | Token/latency/cost logging | 🟡 Stredné | P2 |
| System prompts | Hardcoded v ai.ts | Editovateľné z admina | 🟡 Stredné | P2 |
| Agent memory | Žiadna | Conversation context + RAG | 🟢 Nízke | P3 |

**Verdikt:** AI je **5/10** — dobré základy ale bez governance, HITL, adapter pattern.

---

### 3.6 CMS

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| Content model | Key/value (SiteContent) | Structured Content entity | ⚠️ Vysoké | P1 |
| Draft/publish | Žiadny (okamžite live) | Workflow: IDEA→DRAFT→APPROVED→PUBLISHED | ⚠️ Vysoké | P1 |
| Versioning | Žiadne | Content history + rollback | 🟡 Stredné | P2 |
| i18n | Slovenčina hardcoded | Multi-language support | 🟢 Nízke | P3 |
| Content types | Iba key/value | Blog, News, Event, Page entities | ⚠️ Vysoké | P1 |
| Media integration | Samostatný tab | Content ↔ Media prepojenie | 🟡 Stredné | P2 |
| Content calendar | Žiadny | Centrálny kalendár obsahu | 🟢 Nízke | P3 |

**Verdikt:** CMS je **3/10** — iba key/value, bez structured content.

---

### 3.7 CRM / BOOKING

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| Contact 360° | Communications + bookings (nezobrazujú sa) | Agregácia všetkých entít | ⚠️ Vysoké | P1 |
| Venue/Org/Event | String polia | Samostatné entity | ⚠️ Vysoké | P1 |
| Booking pipeline | 5 statusov (lead→cancelled) | 14 statusov (discovered→post-event) | ⚠️ Vysoké | P1 |
| Booking score | aiMatchScore (nie re-scoreable) | Explainable score s faktormi | ⚠️ Vysoké | P1 |
| Campaign UI | Model+API existuje, UI chýba | Admin tab | 🟡 Stredné | P2 |
| FanSegment UI | Model+API existuje, UI chýba | Admin tab | 🟡 Stredné | P2 |
| Contract model | Žiadny | Document entity | 🟢 Nízke | P3 |
| Finance | Žiadny | Gig revenue + costs + net value | 🟢 Nízke | P3 |
| Fan 360° | Subscriber len email | Fan profile + engagement + segments | 🟡 Stredné | P2 |

**Verdikt:** CRM/Booking je **6/10** — solidný model ale UI zaostáva.

---

### 3.8 SEO / GEO

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| MusicEvent schema | Chýba | JSON-LD pre všetky koncerty | 🔴 Kritické | P0 |
| MusicRecording | Chýba | JSON-LD pre všetky skladby | ⚠️ Vysoké | P1 |
| VideoObject | Chýba | JSON-LD pre YouTube embedy | ⚠️ Vysoké | P1 |
| FAQPage | Chýba | JSON-LD pre FAQ | ⚠️ Vysoké | P1 |
| Sitemap | Statický 9 hash URL | Dynamický (gigs, media, /archiv) | ⚠️ Vysoké | P1 |
| hreflang | Žiadny | Self-referencujúci sk-SK | ⚠️ Vysoké | P1 |
| Canonical | Hardcoded "/" | Z DB (SeoMeta) | 🟡 Stredné | P2 |
| PWA manifest | Žiadny | manifest.json + theme-color | ⚠️ Vysoké | P1 |
| Favicon set | Iba SVG | ICO + apple-touch + android-chrome | 🟡 Stredné | P2 |
| Security headers | Žiadne | CSP + X-Frame + X-Content-Type | 🟡 Stredné | P2 |
| llms.txt | Žiadny | Experimentálny machine-readable layer | 🟢 Nízke | P3 |

**Verdikt:** SEO je **6/10** — základ OK ale chýba 5 JSON-LD schemas.

---

### 3.9 DEPLOYMENT

| Oblasť | CURRENT | TARGET | GAP | Priority |
|--------|---------|--------|-----|----------|
| vercel.json functions | Cesty na neexistujúce súbory | Opraviť alebo zmazať | ⚠️ Vysoké | P1 |
| Crons | Prázdne | Campaign scheduler cron | ⚠️ Vysoké | P1 |
| Security headers | Žiadne | next.config.ts headers() | 🟡 Stredné | P2 |
| Regions | Nešpecifikované | eu-central-1 (blízko Neon) | 🟡 Stredné | P2 |
| Build optimization | Žiadna | optimizePackageImports pre lucide | 🟡 Stredné | P2 |
| Backups | Žiadne | Neon automated backups + export | 🟡 Stredné | P2 |

**Verdikt:** Deployment je **7/10** — funkčný ale s mŕtvymi referenciami.

---

## 4. PRIORITY MATRIX — SÚHRN

| Oblasť | Súčasný stav | Cieľ | Najvyššia priorita |
|--------|-------------|------|-------------------|
| **Security** | 4/10 | 10/10 | P0 — plaintext heslá, fallback secret, Z.AI token, mass-assignment |
| **Database** | 7/10 | 9.5/10 | P0 — 3 orphan FK |
| **API** | 6/10 | 9/10 | P1 — Zod validácia, pagination, rate limiting |
| **Admin UX** | 6.5/10 | 9.5/10 | P1 — sidebar, command palette, mobile drawer |
| **AI** | 5/10 | 10/10 | P0 — RBAC, HITL, adapter pattern, prompt injection |
| **CMS** | 3/10 | 9.5/10 | P1 — structured Content entity |
| **CRM/Booking** | 6/10 | 10/10 | P1 — Contact 360°, Venue/Org entity, booking pipeline |
| **SEO** | 6/10 | 9.5/10 | P0 — MusicEvent schema; P1 — ďalšie schemas |
| **Deployment** | 7/10 | 9.5/10 | P1 — vercel.json fix, crons |
| **Music OS** | 0/10 | 9/10 | P2 — Song model neexistuje |
| **Live OS** | 0/10 | 9.5/10 | P2 — Concert mode neexistuje |
| **Fan OS** | 2/10 | 9/10 | P2 — Iba Subscriber email |
| **Finance** | 0/10 | 8/10 | P3 — Žiadny |

---

## 5. P0 BLOKÁTORY (fix pred akýmikoľvek ďalšími zmenami)

1. **Plaintext password storage** (`auth.ts:63`) — bcrypt/argon2
2. **Hardcoded fallback session secret** (`auth.ts:7`) — env-only, throw ak chýba
3. **Hardcoded Z.AI JWT token** (`zai-config.ts:17-23`) — rotovať, presunúť do env
4. **Default admin credentials** (`seed.ts:8,13`) — generované z env, hashované
5. **Mass-assignment** v 4 PATCH routes (`contacts/[id]`, `tasks/[id]`, `bookings/[id]`, `campaigns/[id]`) — Zod .strict() whitelist
6. **3 orphan FK** (`Booking.gigId`, `Task.gigId`, `Campaign.segmentId`) — pridať @relation
7. **AI provider hardcoded** (`ai.ts:11`) — adapter pattern
8. **AI RBAC + HITL** — inquiryAgent auto-vytvára záznamy bez schválenia
9. **Prompt injection** (`orchestrator.ts:103`) — sanitizácia inquiry.message
10. **MusicEvent JSON-LD** — chýba, Google neindexuje koncerty

---

*Audit dokončený. Žiadne kódové zmeny neboli vykonané — audit bol read-only.*
