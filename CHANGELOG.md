# Changelog

Všetky významné zmeny v projekte D.O.R.A. Band OS budú dokumentované v tomto súbore.

Formát založený na [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
verzia [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Fáza D — Testing & Polish (Vitest, Playwright, Performance audit)

---

## [0.5.0] — 2026-08-19

### Fáza C — P2 Database & UX Fix (10 úloh)

#### Added
- C.3: Booking.inquiryId FK na BookingInquiry (prepojenie dopyt ↔ booking)
- C.4: 6 composite indexes pre optimalizáciu query (Gig, MerchOrder, AiUsageLog, Task, Contact, Subscriber)
- C.5: AiUsageLog.user FK na AdminUser (back-relation aiUsageLogs)
- C.8: Cookie consent "Viac informácií" link → /privacy#cookies
- C.9: VideoObject JSON-LD schema pre skladby s YouTube videoId

#### Changed
- C.1: MerchOrder.product onDelete: Cascade → Restrict (história sa nezmaže)
- C.2: Stock sufficiency check v merch orders API (pre-check + in-transaction atomic check)

#### Removed
- C.10: Dead code — AIChat.tsx, useChat.ts, schema.postgres.prisma

#### Known Limitations
- C.7: 14 sections ostáva "use client" (refaktor na server components TODO)
- C.6: Focus trap v modaloch — Radix default (no custom implementation needed)

---

## [0.4.0] — 2026-08-19

### Fáza B — P1 AI/Admin Fix (10 úloh)

#### Added
- B.1: AI Tool System aktivácia — Copilot s tool-calling (7 tools, maxSteps: 3)
- B.2: ApprovalQueue model + UI — HITL pre AI agentov (taskAgent refaktor)
- B.3: Structured Content admin tab — workflow Idea → Published (10 statusov)
- B.4: RBAC pre agentov — admin/editor/viewer permissions
- B.5: Concert Mode ↔ Merch integration — dynamic fetch z MerchProduct API
- B.8: Functional bug fix — getSession(req) v venues/organizations routes

#### Changed
- B.6: Admin email fix — fallback na lokálny email state
- B.9: Prompt injection defense na copilot — sanitizeForPrompt(rawMessage, 2000)
- B.10: Spotify empty href fix — filter empty social links

#### Known Limitations
- B.7: 11 starších admin tabov bez EmptyState/ErrorState (useAdminFetch hook TODO)

---

## [0.3.0] — 2026-08-19

### Fáza A — P0 Security & Legal Fix (8 úloh)

#### Added
- A.1: Rate limiting library — chatRateLimiter, loginRateLimiter, bookingRateLimiter, newsletterRateLimiter
- A.2: Security middleware — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS
- A.3: CSRF protection — Origin/Sec-Fetch-Site validation v middleware
- A.4: GDPR compliance — /privacy route (Privacy Policy, Cookie Policy, Impressum)
- A.4: Booking form — GDPR consent checkbox + honeypot field
- A.4: Footer — legal links (Ochrana údajov, Cookies, Impressum)
- A.6: Database migrations setup — baseline.sql + 4 nové npm scripty
- A.7: Orphan FK fix — Setlist.gigId + MerchOrder.gigId @relation

#### Changed
- A.1: /api/chat — rate limiting (10/hod) + sanitizeForPrompt na user messages
- A.1: /api/auth/login — rate limiting (5/15min) + reset po úspešnom prihlásení
- A.1: /api/booking — rate limiting (3/hod) + honeypot + GDPR consent validation
- A.1: /api/newsletter — rate limiting (3/hod)
- A.5: MusicEvent JSON-LD bug fix — combined offers (url + price) namiesto prepisovania
- A.8: .env.example — ADMIN_PASSWORD placeholder (nie "dora2026")

#### Security
- Všetky P0 security zraniteľnosti z auditu vyriešené

---

## [0.2.0] — 2026-08-17

### M7.4 + M7.5 — Merchandise OS + Predictive Analytics

#### Added
- M7.4: MerchProduct + MerchOrder Prisma models
- M7.4: Merch admin tab (Štatistiky, Produkty, Objednávky)
- M7.4: Merch API (products CRUD, orders CRUD s stock decrement, stats)
- M7.5: Predictive Analytics API (5 predikcií: booking, fan, revenue, stock, gig)
- M7.5: Predictions admin tab s health score

---

## [0.1.0] — 2026-08-15

### M1-M6 — Foundation Build

#### Added
- M0: P0 Security fixes (bcrypt, env-only secret, AI provider adapter, HITL)
- M1: Admin UX (sidebar, command palette, dashboard, empty/error states)
- M2: Booking OS (pipeline, venue/org entities, booking score)
- M3: SEO (sitemap, robots, hreflang, OpenGraph, JSON-LD)
- M4: AI (knowledge base, copilot, AI cost tracking, tool system)
- M5: Music OS (songs, rehearsals, setlists, concert mode)
- M6: Fan/Analytics (fan 360°, analytics dashboard, marketing intelligence)
- M7.3: Finance OS (GigFinance model)

---

## Typy zmien

- **Added** — nové features
- **Changed** — zmeny v existujúcej funkcionalite
- **Deprecated** — čo bude čoskoro odstránené
- **Removed** — čo bolo odstránené v tejto verzii
- **Fixed** — bug fixy
- **Security** — bezpečnostné fixy
- **Known Limitations** — známe obmedzenia
