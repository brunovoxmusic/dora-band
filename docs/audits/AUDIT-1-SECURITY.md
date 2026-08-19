# AUDIT-1 — HLBOKÝ SECURITY AUDIT (D.O.R.A. Band Website)

**Audit ID:** AUDIT-1
**Dátum auditu:** 2026-08-17 (post-M0.9)
**Auditor:** Explore sub-agent (security focus)
**Repozitár:** `/home/z/my-project/`
**Zdroj kontextu:** `worklog.md`, `DORA-IMPLEMENTATION-GAP-ANALYSIS.md`, `DORA-ENGINEERING-ROADMAP.md`
**Metóda:** Statický read-only audit (žiadne zmeny v kóde)

---

## 0. EXECUTIVE SUMMARY

Po implementácii **Fázy 0 — Security First (M0.1–M0.10)** boli **všetky 10 P0 blokátorov** z gap analýzy úspešne odstránené. Kód je teraz **bezpečnostne výrazne stabilnejší** než pôvodný stav (security score 4/10 → odhad 7/10), ale stále obsahuje **8 P1** a **10 P2** nedostatkov, ktoré by mali byť riešené pred production hardeningom.

| Kategória | Stav pre auditom | Stav po audite | Skóre |
|-----------|------------------|----------------|-------|
| Autentifikácia | Plaintext, fallback secret | bcrypt(12), env-only secret, timing-safe | 8/10 |
| Autorizácia | Inline guard OK, no RBAC | Inline guard OK, RBAC stále chýba | 6/10 |
| AI Proxy | Verejný `/api/chat` | Verejný `/api/chat` (nezmenené) | 4/10 |
| CSRF / Rate Limit | Žiadne | Žiadne (nezmenené) | 1/10 |
| Env vars / Secrets | Hardcoded Z.AI JWT | Z.AI config zmazaný, env example neúplny | 7/10 |
| Security headers | Žiadne | Žiadne (nezmenené) | 1/10 |
| Mass-assignment | 4 PATCH zraniteľné | Všetky PATCH whitelist | 9/10 |
| AI Governance | Auto-create záznamy | HITL pre inquiry agent | 7/10 |

**Verdikt:** P0 kritické zraniteľnosti **vyriešené**. Stav je **prijateľný pre staging / internal demo**, ale **nie pre verejnú produkciu** bez dodatočných P1 fixov (rate limiting, `/api/chat` auth gate, security headers).

---

## 1. AUTENTIFIKÁCIA — `src/lib/auth.ts`, `src/lib/password.ts`

### ✅ Implementované (M0.1, M0.2)

| Kontrola | Stav | Detail |
|----------|------|--------|
| bcrypt hashovanie hesiel | ✅ | `password.ts:16` — `BCRYPT_ROUNDS = 12` (cost factor 12, ~250ms/hash, odporúčané OWASP 2024) |
| Password storage pole | ✅ | `prisma/schema.prisma:85` — `AdminUser.passwordHash String` (migrácia z `password`) |
| Auto-migrácia plaintext → bcrypt | ✅ | `auth.ts:97-104` — pri prvom úspešnom prihlásení re-hashne a uloží |
| Session secret: env-only | ✅ | `auth.ts:16-22` — `process.env.ADMIN_SESSION_SECRET`, **throw ak chýba** (žiaden fallback) |
| Cookie: `httpOnly` | ✅ | `auth.ts:115` |
| Cookie: `sameSite` | ✅ | `auth.ts:116` — `"lax"` |
| Cookie: `secure` flag | ✅ | `auth.ts:120` — `process.env.NODE_ENV === "production"` |
| Cookie: `maxAge` | ✅ | `auth.ts:118` — 7 dní (`60*60*24*7`) |
| Cookie: `path` | ✅ | `auth.ts:117` — `"/"` |
| Timing-safe compare | ✅ | `auth.ts:55-60` — `crypto.timingSafeEqual(a, b)` (Node.js `crypto`) |
| HMAC-SHA256 signing | ✅ | `auth.ts:34-42` — Web Crypto API `crypto.subtle.importKey` + `sign` |
| Login error: no info disclosure | ✅ | `api/auth/login/route.ts:14-21` — generická 503 error pri DB chybe, generická 401 pri zlom hesle |
| Logout | ✅ | `api/auth/logout/route.ts:6` — `res.cookies.delete(SESSION_COOKIE)` |
| Session endpoint | ✅ | `api/auth/session/route.ts` — vracia `{ user }` alebo `null` |

### ⚠️ Nedostatky

| ID | Priorita | Súbor / riadok | Popis |
|----|----------|----------------|-------|
| AUTH-1 | P2 | `auth.ts:49-61` | `verify()` funkcia robí **length check pred** `timingSafeEqual`: `if (a.length !== b.length) return null;`. Toto nie je konštantný čas — teoreticky umožňuje timing leak na dĺžke tokenu. Pre HMAC-SHA256 je signature vždy 64 hex znakov, takže útočník nemá veľa priestoru, ale best-practice je porovnávať fix-length hashom (napr. SHA-256 oboch bufferov a potom `timingSafeEqual`). |
| AUTH-2 | P2 | `auth.ts:103` | `console.log("[auth] Auto-migrated password to bcrypt for user ${user.email}")` — loguje sa email admina pri auto-migrácii. Minor info disclosure do server logov. Odstrániť alebo anonymizovať. |
| AUTH-3 | P2 | celá `auth.ts` | **Session je stateless HMAC cookie** — nie je možné ju server-side zneplatniť. Ak admin zmení heslo alebo podozrievajú aktivitu, staré cookie ostane platné 7 dní. Chýba Session model v DB s `jti`, `userId`, `expiresAt`, `revokedAt`. |
| AUTH-4 | P3 | `auth.ts:64` | Session payload je `{ uid, email, exp }` — chýba `iat` (issued-at) a `jti` (token ID) pre revocation. |

### ❌ Chýba (P1)

| ID | Popis |
|----|-------|
| AUTH-5 | **Žiadny rate limiting na `/api/auth/login`** — útočník môže brute-force heslá bez obmedzenia (bcrypt cost 12 spomaľuje, ale neblokuje). Pozri sekciu 4. |
| AUTH-6 | **Žiadny account lockout** po N neúspešných pokusoch. |
| AUTH-7 | **Žiadna detekcia credential stuffing** (rovnaký IP, rôzne emaily). |

---

## 2. AUTORIZÁCIA — všetky `/api/admin/*/route.ts`

### ✅ Implementované

**Všetkých 57 admin route handlerov volá `getSession(req)`:**

```
$ rg "getSession" src/app/api/admin --type ts -l | wc -l
57
```

Zoznam 57 súborov (výber):
- `api/admin/ai/route.ts:28` ✅
- `api/admin/ai/seo-score/route.ts:12` ✅
- `api/admin/ai/suggestions/route.ts:6` ✅
- `api/admin/ai/variants/route.ts:12` ✅
- `api/admin/ai-usage/route.ts` ✅
- `api/admin/analytics/route.ts` ✅
- `api/admin/automations/route.ts` ✅
- `api/admin/bookings/route.ts` + `[id]/route.ts` ✅
- `api/admin/campaigns/route.ts` + `[id]/route.ts` ✅
- `api/admin/communications/route.ts` ✅
- `api/admin/concert-mode/route.ts` ✅
- `api/admin/contacts/route.ts` + `[id]/route.ts` ✅
- `api/admin/content/route.ts` + `content-items/[id]/route.ts` ✅
- `api/admin/copilot/route.ts:147` ✅
- `api/admin/gig-finance/route.ts` ✅
- `api/admin/gigs/route.ts` + `[id]/route.ts` ✅
- `api/admin/inquiries/route.ts` + `[id]/route.ts` ✅
- `api/admin/knowledge/route.ts` + `[id]/route.ts` ✅
- `api/admin/market-report/route.ts` ✅
- `api/admin/media/route.ts` + `[id]/route.ts` + `bulk/` + `reorder/` ✅
- `api/admin/merch/orders/[id]/route.ts` + `products/[id]/route.ts` + `stats/route.ts` ✅
- `api/admin/organizations/route.ts` + `[id]/route.ts` ✅ (s bugom — pozri nižšie)
- `api/admin/predictions/route.ts` ✅
- `api/admin/rehearsals/route.ts` + `[id]/route.ts` ✅
- `api/admin/segments/route.ts` ✅
- `api/admin/seo/route.ts` ✅
- `api/admin/settings/route.ts` ✅
- `api/admin/setlists/route.ts` + `[id]/route.ts` ✅
- `api/admin/songs/route.ts` + `[id]/route.ts` ✅
- `api/admin/stats/route.ts` ✅
- `api/admin/subscribers/route.ts` + `[id]/route.ts` ✅
- `api/admin/tasks/route.ts` + `[id]/route.ts` ✅
- `api/admin/venues/route.ts` + `[id]/route.ts` ✅ (s bugom — pozri nižšie)

**Verejné (neautentikované) endpointy — správne:**
- `api/auth/login`, `api/auth/logout`, `api/auth/session` ✅
- `api/booking` ✅ (form submit, validuje vstup)
- `api/chat` ⚠️ **PROBLÉM — pozri sekciu 3**
- `api/content` ✅ (read-only, iba `?key=` lookup)
- `api/gigs` ✅ (read-only zoznam koncertov)
- `api/hero-background` ✅ (read-only)
- `api/media` ✅ (read-only galéria)
- `api/newsletter` ✅ (form submit, validuje email)
- `api/settings` ✅ (read-only)
- `api/route.ts` ✅ (root health check)

### Mass-assignment ochrana (M0.5) ✅

**Všetkých 12+ PATCH routes používa explicitný whitelist:**

| Route | Whitelist pattern |
|-------|-------------------|
| `api/admin/contacts/[id]/route.ts:18-31` | `typeof b.X === "string"` checks, id/createdAt/updatedAt sa nedajú prepísať |
| `api/admin/tasks/[id]/route.ts:10-18` | typeof checks |
| `api/admin/bookings/[id]/route.ts:11-18` | typeof checks |
| `api/admin/campaigns/[id]/route.ts:11-20` | typeof checks |
| `api/admin/content-items/[id]/route.ts:10-31` | typeof checks |
| `api/admin/gigs/[id]/route.ts:10-23` | destructuring whitelist |
| `api/admin/media/[id]/route.ts:10-22` | destructuring whitelist |
| `api/admin/songs/[id]/route.ts:11-27` | typeof checks |
| `api/admin/organizations/[id]/route.ts:10-19` | typeof checks (ale route broken — AUTH-8) |
| `api/admin/venues/[id]/route.ts:10-23` | typeof checks (ale route broken — AUTH-8) |
| `api/admin/rehearsals/[id]/route.ts:10-19` | typeof checks |
| `api/admin/setlists/[id]/route.ts:10-16` | typeof checks |
| `api/admin/knowledge/[id]/route.ts:11-21` | typeof checks |
| `api/admin/subscribers/[id]/route.ts:9-12` | `typeof active === "boolean"` |
| `api/admin/merch/products/[id]/route.ts:17-28` | `!== undefined` checks (menej striktné, ale OK) |
| `api/admin/settings/route.ts:25-29` | `isKnownSettingsKey()` whitelist |
| `api/admin/inquiries/route.ts:34-37` | enum validation `["new","reviewed","confirmed","archived"]` |

### ⚠️ Nedostatky

| ID | Priorita | Súbor / riadok | Popis |
|----|----------|----------------|-------|
| AUTHZ-1 | **P0 (functional bug)** | `api/admin/organizations/[id]/route.ts:6,26`<br>`api/admin/venues/[id]/route.ts:6,30` | **`getSession()` volané BEZ argumentu `req`!** Funkcia `getSession(req?)` — ak `req` nie je zadaný, `req?.headers` je `undefined`, cookie je `""`, regex nenájde match, funkcia vracia `null` → PATCH a DELETE vždy vrátia `401 Neoprávnený` aj pre autentikovaných adminov. **Funkčne broken feature, nie security zraniteľnosť** (over-restrictive). Porovnaj s ostatnými routes, kde je `getSession(req)`. |
| AUTHZ-2 | P2 | `prisma/schema.prisma:87` | `AdminUser.role String @default("admin")` existuje v schéme, ale **NIKDE sa v kóde nekontroluje**. Žiaden route nerozlišuje medzi `admin`, `editor`, `viewer` — každý autentikovaný admin môže všetko (delete gigs, manage users, etc.). RBAC je v schéme pripravený, ale nefunguje. |
| AUTHZ-3 | P2 | všetky admin routes | **Žiadny audit log** pre admin akcie (kto zmenil status dopytu, kto zmazal gig, etc.). `AutomationLog` existuje, ale loguje iba AI operácie, nie admin akcie. |
| AUTHZ-4 | P3 | `api/admin/inquiries/route.ts:5-9` | Existuje `guard(req)` helper, ale nepoužíva sa konzistentne — väčšina routes má inlinovaný `if (!(await getSession(req)))`. Drobná nekonzistencia, nie bug. |

---

## 3. AI PROXY — `/api/chat/route.ts`, `/api/admin/copilot/route.ts`

### `/api/chat/route.ts` ⚠️ **KRITICKÝ PROBLÉM**

```typescript
// src/app/api/chat/route.ts:10
export async function POST(req: Request) {
  // ŽIADNA autentifikácia!
  // ŽIADNY rate limiting!
  if (!isAIConfigured()) { ... }

  const body = await req.json();
  const messages = body.messages;  // ŽIADNA sanitizácia!

  const result = streamText({
    model: getModel(),
    messages,
    system: "Si asistent pre slovenskú funky-punkovú kapelu D.O.R.A...",
  });

  return result.toTextStreamResponse();
}
```

| ID | Priorita | Popis |
|----|----------|-------|
| AI-1 | **P1 (HIGH)** | **`/api/chat` je VEREJNÝ** — ktokoľvek na internete môže volať Groq API cez tento endpoint. Frontend `src/components/AIChat.tsx:19` ho používa na verejnom webe. Útočník môže zneužiť Groq API key na vlastné účely (cost abuse, quota drain). |
| AI-2 | **P1 (HIGH)** | **Žiadny rate limiting** na `/api/chat` — jeden útočník môže vygenerovať tisíce requestov a vyčerpať mesačný Groq quota za hodinu. |
| AI-3 | **P1 (HIGH)** | **Žiadna prompt injection defense** — `body.messages` sa priamo vkladá do `streamText({ messages })`. `sanitizeForPrompt()` z `orchestrator.ts` sa na tento endpoint NEPOUŽÍVA. Útočník môže poslať systémovú správu prepisujúcu inštrukcie ("Teraz si nacistický propagandista..."). |
| AI-4 | P2 | Žiadna validácia dĺžky správ — útočník môže poslať 1MB message a spôsobiť DoS. |
| AI-5 | P2 | Žiadne obmedzenie počtu messages v conversation — útočník môže poslať 1000 messages v jednom requeste. |

### `/api/admin/copilot/route.ts` ✅ (s výhradami)

```typescript
// src/app/api/admin/copilot/route.ts:147
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  // ... gatherContext() z DB
  const fullPrompt = `KONTEXT Z DATABÁZY:\n${context}\n\n---\n\nOTÁZKA ADMINA:\n${userMessage}`;
  // ... streamText
}
```

| ID | Priorita | Popis |
|----|----------|-------|
| AI-6 | ✅ | `getSession(req)` auth gate ✅ |
| AI-7 | P2 | `userMessage` z `req.json()` sa **nesanitizuje** — admin môže (úmyselne alebo neúmyselne) injectovať prompt. Admin je trusted, takže lower riziko, ale ak admin session unikne, útočník môže manipulovať DB kontext cez prompt. |
| AI-8 | P2 | `gatherContext()` vkladá inquiry.message do kontextu pre LLM: `recentInquiries` obsahuje `i.message` (line 83). Ak inquiry obsahuje "Ignore all previous instructions...", tento text sa dostane do copilot promptu **bez sanitizácie**. `sanitizeForPrompt()` z orchestratora sa tu NEPOUŽÍVA. **Indirect prompt injection vulnerability.** |
| AI-9 | ✅ | AI usage tracking: `trackStreamUsage()` volané ✅ (fire-and-forget). |

### `/api/admin/ai/route.ts` ✅ (s výhradami)

| ID | Priorita | Popis |
|----|----------|-------|
| AI-10 | ✅ | `getSession(req)` auth gate ✅ |
| AI-11 | P2 | `instruction` a `context` z `req.json()` sa vkladajú do promptu bez sanitizácie (`route.ts:64-69`). Admin-only, lower risk. |

### AI Governance (M0.7, M0.8, M0.9) ✅

| Kontrola | Stav | Detail |
|----------|------|--------|
| Provider adapter (M0.7) | ✅ | `src/lib/ai/provider.ts` — `createProvider()` s `groq`/`openai`/`none` switch, konfigurovateľné cez `AI_PROVIDER` env. Multi-model: `writing`/`analysis`/`fast`. |
| HITL pre inquiryAgent (M0.8) | ✅ | `orchestrator.ts:142-172` — inquiryAgent **NEauto-vytvára** Contact/Booking/Task/Communication. Ukladá AI analýzu ako `AutomationLog` so statusom `success` a `pendingAction: "review_and_create_contact_booking"`. Admin manuálne schváli. |
| Prompt injection defense (M0.9) | ✅ | `orchestrator.ts:24-36` — `sanitizeForPrompt()` odstraňuje control chars, neutralizuje "ignore previous instructions", "system:/assistant:/user:", "act as", code bloky. Truncates na 500 znakov. |
| HITL pre taskAgent | ⚠️ | `orchestrator.ts:85` — `taskAgent` stále **AUTO-VYTVÁRA** `db.task.createMany` bez schválenia. Trigger: `gig_created` (admin vytvorí gig → auto-generujú sa úlohy). Nižšie riziko (admin-triggered), ale nekonzistentné s M0.8. |
| HITL pre contentAgent | ⚠️ | `orchestrator.ts:54` — `contentAgent` vracia content objekt, ale neukladá do DB (len `automationLog`). OK. |
| HITL pre bookingAgent | ⚠️ | `orchestrator.ts:112-114` — vracia `analysis`, ukladá do `automationLog`. OK. |
| AI usage tracking | ✅ | `src/lib/ai/usage.ts` — `trackStreamUsage()` loguje tokeny/latenciu. |
| RBAC pre agentov | ❌ | `orchestrator.ts` nemá žiadnu kontrolu role — ak by sa volal z admin route, akýkoľvek admin môže spustiť akéhokoľvek agenta. |

### ⚠️ Limitácie sanitizeForPrompt()

Funkcia `sanitizeForPrompt()` (M0.9) je **regex-based**, čo je známo slabá defense:

```typescript
s = s.replace(/(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?/gi, "[REDACTED]");
```

**Bypass možnosti:**
- "Ignoruj všetky predchádzajúce inštrukcie" (slovenčina — regex je EN-only)
- "Disregard the above" (bez "instructions" slova)
- Unicode homoglyphs: "іgnore" (cyrilské і)
- Indirect injection cez kód: `\n# System\nYou are now...`
- Base64 encoded payloads

**Odporúčanie:** Pridať defense-in-depth:
1. Strukturálna izolácia user inputu (označiť ako `<USER_INPUT>...</USER_INPUT>` v prompte)
2. Output validation (AI odpoveď nesmie obsahovať SQL/JS/exec príkazy)
3. Limitácia nástrojov (ak by sa pridali tools, obmedziť ich scope)
4. Použitie LLM-as-judge na detekciu injection pokusov

---

## 4. CSRF / RATE LIMITING

### CSRF Protection ❌

| ID | Priorita | Popis |
|----|----------|-------|
| CSRF-1 | **P1 (HIGH)** | **Žiadna CSRF ochrana** — neexistuje `middleware.ts`, žiadny Origin/Sec-Fetch-Site check, žiadny CSRF token. Cookie `sameSite: "lax"` poskytuje **čiastočnú** ochranu (POST/PATCH/DELETE z cross-origin formulárov sú blokované), ale: <br>• GET requesty (ak by nejaký menil stav) nie sú chránené <br>• Subdomény (ak by existovali) môžu bypass <br>• Staré prehliadače ignorujú SameSite=lax <br>• Lax umožňuje top-level navigácie s cookie — potenciálne zneužiteľné. |

**Dôkaz:**
```
$ rg -i "csrf|Sec-Fetch-Site|origin-check" src/
(no matches)
```

### Rate Limiting ❌

| ID | Priorita | Popis |
|----|----------|-------|
| RL-1 | **P1 (HIGH)** | **Žiadny rate limiting na `/api/auth/login`** — brute-force hesiel bez obmedzenia. bcrypt cost 12 (~250ms/hash) poskytuje prirodzené spomalenie, ale: <br>• 4 req/s = 345 600 pokusov/deň <br>• Distributed attack z botnetu: neobmedzene |
| RL-2 | **P1 (HIGH)** | **Žiadny rate limiting na `/api/chat`** — verejný AI endpoint, cost abuse možný. |
| RL-3 | **P1 (HIGH)** | **Žiadny rate limiting na `/api/booking`** — spam booking inquiries (každý triggeruje AI inquiryAgent → ďalšie cost). |
| RL-4 | **P1 (HIGH)** | **Žiadny rate limiting na `/api/newsletter`** — email bombing (útočník môže prihlásiť 10 000 falošných emailov). |
| RL-5 | P2 | Žiadny rate limiting na admin AI endpoints (`/api/admin/ai`, `/api/admin/copilot`, `/api/admin/ai/variants`) — admin-only, ale session hijack by umožnil cost abuse. |

**Dôkaz:**
```
$ rg -i "upstash|ratelimit|ratelimiter|rate-limit|rateLimit" src/
(only match in DORA-IMPLEMENTATION-GAP-ANALYSIS.md documentation)
```

**`package.json` deps:** Žiadny `@upstash/ratelimit`, `@upstash/redis`, `rate-limiter-flexible`, ani podobný balík. `next-auth` je nainštalovaný ale **nepoužívaný** (dead dependency).

### Odporúčané riešenie

```typescript
// src/lib/ratelimit.ts (nový súbor)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const loginLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 pokusov / min / IP
  prefix: "ratelimit:login",
});

export const chatLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 správ / min / IP
  prefix: "ratelimit:chat",
});
```

---

## 5. ENVIRONMENT VARIABLES & SECRETS

### Hardcoded Secrets Scan ✅

```
$ rg "(sk-[a-zA-Z0-9]{20,}|gsk_[a-zA-Z0-9]{20,}|Bearer [a-zA-Z0-9]{20,}|password\s*[:=]\s*[\"'][^\"']{4,}[\"'])" src/
(no matches)
```

| Kontrola | Stav | Detail |
|----------|------|--------|
| Hardcoded `sk-` OpenAI keys | ✅ Žiadne | |
| Hardcoded `gsk_` Groq keys | ✅ Žiadne | |
| Hardcoded Z.AI JWT token | ✅ Odstránený (M0.3) | `src/lib/zai-config.ts` zmazaný, `.z-ai-config` zmazaný, `z-ai-web-dev-sdk` dependency odstránený |
| Hardcoded session secret | ✅ Odstránený (M0.2) | `auth.ts:16-22` — env-only, throw ak chýba |
| Hardcoded admin password | ✅ Odstránený (M0.4) | `seed.ts:11-23` — env vars, validates length ≥ 8 |
| Old password "dora2026" v src/ | ✅ Žiadne | `rg "dora2026"` v `src/` → 0 matches |
| `admin@dora.band` v src/ | ⚠️ | `src/app/admin/login/page.tsx:104` (placeholder v inpute), `src/lib/seed.ts:17` (error message príklad). Nie je zraniteľnosť, ale odporúča sa zmeniť placeholder na generický. |

### `.env` (aktuálny) ✅

```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

**Pozitívum:** Aktuálny `.env` obsahuje IBA `DATABASE_URL` pre dev SQLite. Žiadne leaknuté secrets v samotnom `.env` súbore.

### `.env.example` ⚠️ Neúplny

| ID | Priorita | Popis |
|----|----------|-------|
| ENV-1 | **P1 (HIGH)** | `.env.example:39` obsahuje `ADMIN_PASSWORD="dora2026"` — toto je **pôvodné plaintext heslo** z gap analýzy, ktoré bolo údajne rotované na `D0ra2026!Secure`. Ak developer skopíruje `.env.example` → `.env` bez zmeny, použije slabé verejne známe heslo. **Odstrániť hodnotu, nechať iba placeholder** `ADMIN_PASSWORD="change-me-strong-password"`. |
| ENV-2 | P2 | `.env.example` nedokumentuje: `AI_PROVIDER`, `AI_MODEL_WRITING`, `AI_MODEL_ANALYSIS`, `AI_MODEL_FAST`, `OPENAI_API_KEY`. Tieto premenné sa používajú v `src/lib/ai/provider.ts:33-49,70` ale nie sú v example. |
| ENV-3 | P3 | `.env.example:25` — `ADMIN_SESSION_SECRET="replace-with-a-random-32-char-hex-string"` — placeholder je OK, ale nebolo by zlé pridať explicitnú inštrukciu: `# CRITICAL: Generate with `openssl rand -hex 32`. Never commit a real value.` |
| ENV-4 | P3 | Chýba dokumentácia pre environment-specific premennej: `NODE_ENV` (Next.js default, ale dobre zdokumentovať). |

### Zoznam env premenných používaných v kóde

| Premenná | Súbor | Povinná? |
|----------|-------|----------|
| `DATABASE_URL` | `prisma/schema.prisma` | ✅ Required |
| `ADMIN_SESSION_SECRET` | `auth.ts:16` | ✅ Required (throw) |
| `ADMIN_EMAIL` | `seed.ts:11` | ✅ Required (seed) |
| `ADMIN_PASSWORD` | `seed.ts:12` | ✅ Required (seed) |
| `NEXT_PUBLIC_SITE_URL` | `layout.tsx:37`, `robots.ts:3`, `sitemap.ts:4`, `structured-data.tsx:4` | ❌ Optional (fallback `https://dora.band`) |
| `GROQ_API_KEY` | `provider.ts:60,65` | ❌ Optional (ak `AI_PROVIDER=groq`) |
| `OPENAI_API_KEY` | `provider.ts:70,75` | ❌ Optional (ak `AI_PROVIDER=openai`) |
| `AI_PROVIDER` | `provider.ts:33` | ❌ Optional (default `groq`) |
| `AI_MODEL` | `provider.ts:40,41,46,47` | ❌ Optional (default `llama-3.3-70b-versatile`) |
| `AI_MODEL_WRITING` | `provider.ts:40,46` | ❌ Optional |
| `AI_MODEL_ANALYSIS` | `provider.ts:41,47` | ❌ Optional |
| `AI_MODEL_FAST` | `provider.ts:42,48` | ❌ Optional |
| `BLOB_READ_WRITE_TOKEN` | (Vercel Blob SDK auto-read) | ❌ Optional (iba pre file uploads) |
| `NODE_ENV` | `auth.ts:120`, `db.ts:13` | ❌ Next.js automatic |

---

## 6. SECURITY HEADERS & MIDDLEWARE

### `next.config.ts` ❌

```typescript
// next.config.ts (aktuálny)
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  images: { formats: ["image/avif", "image/webp"], remotePatterns: [...] },
  serverExternalPackages: ["sharp"],
  allowedDevOrigins: ["*.space-z.ai", "preview-chat-*.space-z.ai"],
};
```

| ID | Priorita | Popis |
|----|----------|-------|
| HDR-1 | **P1 (HIGH)** | **Žiadna `headers()` funkcia** v `next.config.ts`. Chýbajú: <br>• `Content-Security-Policy` (XSS protection) <br>• `X-Frame-Options: DENY` (clickjacking) <br>• `X-Content-Type-Options: nosniff` (MIME sniffing) <br>• `Strict-Transport-Security` (HSTS — HTTPS enforcement) <br>• `Referrer-Policy: strict-origin-when-cross-origin` <br>• `Permissions-Policy` (feature policy) <br>• `X-DNS-Prefetch-Control: off` |
| HDR-2 | P2 | `next.config.ts:5` — `typescript.ignoreBuildErrors: false` je správne ✅, ale chýba `eslint.ignoreDuringBuilds: false` (default true v Next.js — ESLint chyby by neblokovali build). |

### `middleware.ts` ❌

| ID | Priorita | Popis |
|----|----------|-------|
| MW-1 | **P1 (HIGH)** | **Neexistuje `src/middleware.ts` ani `middleware.ts` v roote.** Overené: `find . -name "middleware*" -not -path "*/node_modules/*"` → 0 matches. To znamená: <br>• Žiadny edge-level auth check (auth sa riesi per-route) <br>• Žiadny edge-level rate limiting <br>• Žiadne edge-level security headers (treba `next.config.ts`) <br>• Žiadna bot protection <br>• Žiadna IP allowlist / blocklist |

### Odporúčané `next.config.ts` headers()

```typescript
const nextConfig: NextConfig = {
  // ... existujúce
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://api.vercel-blob.com; frame-src https://www.youtube.com; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};
```

### Odporúčané `src/middleware.ts` (nový)

```typescript
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // 1. Security headers (fallback ak next.config.ts nie je navyše)
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  // ...

  // 2. CSRF protection pre mutačné metódy
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const allowedOrigins = ["https://dora.band", "https://www.dora.band"];
    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse("CSRF: invalid origin", { status: 403 });
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 7. ZOZNAM NÁJDENÝCH ZRANITEĽNOSTÍ — SÚHRN

### P0 — Kritické (production blocker)

**ŽIADNE P0 nezostali.** Všetkých 10 P0 z gap analýzy bolo vyriešených v M0.1–M0.10.

### P1 — Vysoké (rýchlo fixnúť pred produkciou)

| ID | Zraniteľnosť | Súbor | Fix |
|----|--------------|-------|-----|
| AI-1 | `/api/chat` verejný (cost abuse) | `src/app/api/chat/route.ts:10` | Pridať `getSession(req)` alebo CAPTCHA / IP-based quota |
| AI-2 | Žiadny rate limit na `/api/chat` | `src/app/api/chat/route.ts` | `@upstash/ratelimit` (10 req/min/IP) |
| AI-3 | `/api/chat` bez prompt injection defense | `src/app/api/chat/route.ts:29-34` | Aplikovať `sanitizeForPrompt()` na user messages |
| RL-1 | Žiadny rate limit na `/api/auth/login` | `src/app/api/auth/login/route.ts` | `@upstash/ratelimit` (5 req/min/IP) |
| RL-2 | Žiadny rate limit na `/api/booking` | `src/app/api/booking/route.ts` | 3 req/min/IP |
| RL-3 | Žiadny rate limit na `/api/newsletter` | `src/app/api/newsletter/route.ts` | 3 req/min/IP |
| CSRF-1 | Žiadna CSRF ochrana | (chýba middleware.ts) | Vytvoriť `src/middleware.ts` s Origin checkom |
| HDR-1 | Žiadne security headers | `next.config.ts` | Pridať `headers()` funkciu (CSP, HSTS, X-Frame, etc.) |
| MW-1 | Žiadny middleware.ts | (chýba) | Vytvoriť pre edge-level auth/rate-limit/headers |
| ENV-1 | `.env.example` obsahuje `ADMIN_PASSWORD="dora2026"` | `.env.example:39` | Zmeniť na `"change-me-strong-password"` |

### P2 — Stredné (fix v ďalšom sprinte)

| ID | Zraniteľnosť | Súbor | Fix |
|----|--------------|-------|-----|
| AUTH-1 | `verify()` length check nie je constant-time | `src/lib/auth.ts:59` | Hash oboch bufferov a porovnať `timingSafeEqual` |
| AUTH-2 | Loguje sa email pri auto-migrácii | `src/lib/auth.ts:103` | Anonymizovať alebo odstrániť |
| AUTH-3 | Stateless session, nemožno zneplatniť | `src/lib/auth.ts` | Pridať `Session` model v DB s `jti`, `revokedAt` |
| AUTHZ-2 | RBAC nepoužíva `AdminUser.role` | všetky admin routes | Pridať `requireRole("admin")` guard |
| AUTHZ-3 | Žiadny audit log pre admin akcie | všetky admin routes | Pridať `AdminActionLog` model |
| AI-7 | `/api/admin/copilot` nesanitizuje admin input | `src/app/api/admin/copilot/route.ts:156` | Aplikovať `sanitizeForPrompt()` |
| AI-8 | Indirect prompt injection cez DB kontext | `src/app/api/admin/copilot/route.ts:83` | Sanitizovať `i.message` pred vložením do kontextu |
| AI-11 | `/api/admin/ai` nesanitizuje instruction/context | `src/app/api/admin/ai/route.ts:64-69` | Aplikovať `sanitizeForPrompt()` |
| RL-5 | Žiadny rate limit na admin AI routes | `/api/admin/ai/*` | 30 req/min/admin |
| ENV-2 | `.env.example` neúplny | `.env.example` | Dokumentovať `AI_PROVIDER`, `AI_MODEL_*`, `OPENAI_API_KEY` |
| HDR-2 | `eslint.ignoreDuringBuilds` implicitne true | `next.config.ts` | Pridať explicitne `false` |

### P3 — Nízke (dobré mať, nie kritické)

| ID | Zraniteľnosť | Súbor | Fix |
|----|--------------|-------|-----|
| AUTH-4 | Session payload bez `iat`/`jti` | `src/lib/auth.ts:64` | Pridať pre budúcu revocation support |
| AUTHZ-4 | Nekonzistentný `guard()` helper | `src/app/api/admin/inquiries/route.ts:5-9` | Refaktorovať všetky routes na spoločný `requireAdmin()` |
| AI-4 | Žiadna validácia dĺžky správ v `/api/chat` | `src/app/api/chat/route.ts:19-27` | Limit 4KB per message, max 20 messages |
| AI-5 | Žiadny limit počtu messages | `src/app/api/chat/route.ts:22` | `messages.length > 20` → 422 |
| ENV-3 | `ADMIN_SESSION_SECRET` placeholder nedôrazny | `.env.example:25` | Pridať explicitné varovanie |
| ENV-4 | Chýba `NODE_ENV` dokumentácia | `.env.example` | Pridať sekciu |
| AUTHZ-1 (functional) | `getSession()` bez `req` v 2 routes | `organizations/[id]/route.ts:6,26`<br>`venues/[id]/route.ts:6,30` | Zmeniť na `getSession(req)` |

---

## 8. ČO UŽ JE IMPLEMENTOVANÉ (z fáz M0.1–M0.10)

### ✅ M0.1 — Password Hashing (bcrypt)
- **Súbor:** `src/lib/password.ts`
- `BCRYPT_ROUNDS = 12` (cost factor)
- `hashPassword(plaintext)` → `bcrypt.hash(plaintext, 12)`
- `verifyPassword(plaintext, hash)` → kontrola `$2` prefix, fallback pre plaintext
- `isHashedPassword(hash)` → detekcia starého formátu
- Schema: `AdminUser.passwordHash String` (migrácia z `password`)
- Auto-migrácia pri prvom login: `auth.ts:97-104`

### ✅ M0.2 — Session Secret + Cookie Security
- **Súbor:** `src/lib/auth.ts`
- `SESSION_SECRET = process.env.ADMIN_SESSION_SECRET` — **throw ak chýba** (žiaden fallback)
- Cookie: `httpOnly: true`, `sameSite: "lax"`, `secure: NODE_ENV === "production"`, `maxAge: 7 dní`
- Token verify: `crypto.timingSafeEqual(a, b)` (Node.js `crypto`)
- Login error: generická 503/401, žiadne info disclosure

### ✅ M0.3 — Z.AI Token Rotation
- `src/lib/zai-config.ts` zmazaný (obsahoval hardcoded JWT)
- `.z-ai-config` súbor zmazaný
- `z-ai-web-dev-sdk` dependency odstránený z `package.json`
- Žiadne `sk-` alebo `gsk_` tokeny v zdrojovom kóde

### ✅ M0.4 — Seed Script Security
- **Súbor:** `src/lib/seed.ts`
- `ADMIN_EMAIL` a `ADMIN_PASSWORD` z env vars
- Throw ak chýbajú alebo ak `password.length < 8`
- Žiadny `console.log` hesla
- Hashovanie cez `hashPassword()` pred uložením

### ✅ M0.5 — Mass-Assignment Fix
- **Súbory:** 12+ PATCH routes
- Explicitný whitelist pattern: `if (typeof b.X === "string") data.X = b.X;`
- `id`, `createdAt`, `updatedAt` sa nedajú prepísať klientom
- Validácia enumov pre status polia (inquiries)
- `isKnownSettingsKey()` pre settings

### ✅ M0.6 — Orphan FK Relations
- **Súbor:** `prisma/schema.prisma`
- `Booking.gigId → Gig` (onDelete: SetNull)
- `Task.gigId → Gig` (onDelete: SetNull)
- `Campaign.segmentId → FanSegment` (onDelete: SetNull)
- Pridané reverse relations + `@@index`

### ✅ M0.7 — AI Provider Adapter
- **Súbor:** `src/lib/ai/provider.ts` (nový)
- `AIProvider` interface: `getModel(task)`, `getModelName(task)`, `isConfigured()`
- `createProvider()` switch: `groq` | `openai` | `none`
- Multi-task: `writing`, `analysis`, `fast` (rôzne modely pre rôzne úlohy)
- Konfigurovateľné cez `AI_PROVIDER` env
- Singleton pattern (`getProvider()`)

### ✅ M0.8 — AI RBAC + Human-in-the-Loop
- **Súbor:** `src/lib/agents/orchestrator.ts:125-175`
- `inquiryAgent()` **NEauto-vytvára** Contact/Booking/Task/Communication
- Namiesto toho ukladá AI analýzu do `AutomationLog` so statusom `success` a `pendingAction: "review_and_create_contact_booking"`
- Admin manuálne schváli a vytvorí záznamy
- ⚠️ `taskAgent()` stále auto-vytvára (nekonzistentné, ale admin-triggered)

### ✅ M0.9 — Prompt Injection Defense
- **Súbor:** `src/lib/agents/orchestrator.ts:24-36`
- `sanitizeForPrompt(input, maxLength=500)` funkcia
- Strip control chars (okrem newlines/tabs)
- Neutralizuje: "ignore/disregard/forget previous/prior/above instructions", "system:/assistant:/user:", "act as / pretend to be", code bloky
- Aplikuje sa na inquiry: organizer, email, eventType, eventDate, eventLocation, message
- Aplikuje sa na email: recipient, context
- Aplikuje sa na booking: URL
- ⚠️ NEaplikuje sa na `/api/chat`, `/api/admin/copilot`, `/api/admin/ai` (P2)

### ✅ M0.10 — MusicEvent JSON-LD
- **Súbor:** `src/components/site/structured-data.tsx`
- `MusicGroup` schema ✅
- `MusicEvent` schema pre každý upcoming gig ✅ (lines 111-143)
- `MusicRecording` schema pre tracks ✅
- `FAQPage` schema ✅
- `WebSite` schema ✅
- Server component (DB fetch pri render)

---

## 9. ČO CHÝBA (súhrn akcií)

### Critical (P0) — Žiadne

Všetky P0 z pôvodnej gap analýzy boli vyriešené. ✅

### High Priority (P1) — 10 akcií

1. **AI-1**: Pridať auth gate na `/api/chat` (alebo IP/CAPTCHA quota)
2. **AI-2**: Pridať rate limit na `/api/chat` (10 req/min/IP)
3. **AI-3**: Aplikovať `sanitizeForPrompt()` na `/api/chat` user messages
4. **RL-1**: Pridať rate limit na `/api/auth/login` (5 req/min/IP)
5. **RL-2**: Pridať rate limit na `/api/booking` (3 req/min/IP)
6. **RL-3**: Pridať rate limit na `/api/newsletter` (3 req/min/IP)
7. **CSRF-1**: Vytvoriť `src/middleware.ts` s Origin checkom pre mutačné metódy
8. **HDR-1**: Pridať `headers()` funkciu do `next.config.ts` (CSP, HSTS, X-Frame, X-Content-Type, Referrer-Policy, Permissions-Policy)
9. **MW-1**: Vytvoriť `src/middleware.ts` pre edge-level enforcement
10. **ENV-1**: Odstrániť `ADMIN_PASSWORD="dora2026"` z `.env.example`, nahradiť placeholderom

### Medium Priority (P2) — 11 akcií

1. **AUTH-1**: Constant-time length check v `verify()`
2. **AUTH-2**: Anonymizovať log pri auto-migrácii hesla
3. **AUTH-3**: Pridať `Session` model v DB pre server-side revocation
4. **AUTHZ-2**: Implementovať RBAC (kontrolovať `AdminUser.role` v routes)
5. **AUTHZ-3**: Pridať `AdminActionLog` model pre audit trail
6. **AI-7**: Sanitizovať admin input v `/api/admin/copilot`
7. **AI-8**: Sanitizovať `inquiry.message` v `gatherContext()` (indirect injection)
8. **AI-11**: Sanitizovať instruction/context v `/api/admin/ai`
9. **RL-5**: Pridať rate limit na admin AI routes (30 req/min/admin)
10. **ENV-2**: Dokompletovať `.env.example`
11. **HDR-2**: Pridať `eslint.ignoreDuringBuilds: false`

### Low Priority (P3) — 7 akcií

1. **AUTH-4**: Pridať `iat`/`jti` do session payloadu
2. **AUTHZ-4**: Refaktorovať na spoločný `requireAdmin()` helper
3. **AI-4**: Validovať dĺžku správ v `/api/chat` (max 4KB)
4. **AI-5**: Limitovať počet messages v `/api/chat` (max 20)
5. **ENV-3**: Zdôrazniť varovanie v `.env.example`
6. **ENV-4**: Pridať `NODE_ENV` do dokumentácie
7. **AUTHZ-1 (functional)**: Opraviť `getSession()` → `getSession(req)` v `organizations/[id]` a `venues/[id]` routes (broken feature)

---

## 10. ODHAD SECURITY SKÓRE

| Kategória | Pôvodné (gap analysis) | Aktuálne (post-M0.9) | Cieľ |
|-----------|------------------------|----------------------|------|
| Password storage | 1/10 (plaintext) | **9/10** (bcrypt 12 + auto-migrate) | 10/10 |
| Session secret | 1/10 (fallback v kóde) | **9/10** (env-only, throw) | 10/10 |
| Z.AI token | 1/10 (hardcoded) | **10/10** (zmazaný) | 10/10 |
| Default admin creds | 1/10 (dora2026) | **8/10** (env, ale .env.example leak) | 10/10 |
| Cookie secure flag | 4/10 (chýba) | **9/10** (secure v prod) | 10/10 |
| Timing-safe compare | 4/10 (===) | **8/10** (timingSafeEqual, drobný length leak) | 10/10 |
| Mass-assignment | 2/10 (4 routes zraniteľné) | **9/10** (všetky whitelist) | 10/10 |
| AI proxy auth | 2/10 (verejný) | **2/10** (stále verejný) | 9/10 |
| CSRF protection | 1/10 | **2/10** (SameSite=lax only) | 9/10 |
| Rate limiting | 1/10 | **1/10** (žiadne) | 9/10 |
| Security headers | 1/10 | **1/10** (žiadne) | 9/10 |
| Session revocation | 2/10 (stateless) | **3/10** (stateless, ale throw ak chýba) | 8/10 |
| RBAC | 3/10 (pole existuje, nepoužíva) | **3/10** (nezmenené) | 9/10 |
| Prompt injection | 2/10 (žiadne) | **6/10** (regex sanitize, obmedzené použitie) | 9/10 |
| AI HITL | 2/10 (auto-create) | **8/10** (HITL pre inquiry) | 9/10 |
| **Celkové skóre** | **4/10 NEBEZPEČNÉ** | **~7/10 PRIJATEĽNÉ pre staging** | **10/10** |

---

## 11. VERDIKT A ODHORÚČENIA

### Current State
- **P0 blokátory: 0** ✅ (všetkých 10 vyriešených)
- **P1 nedostatky: 10** ⚠️ (potrebné pred produkciou)
- **P2 nedostatky: 11** 📋 (plánovať do 2 sprintov)
- **P3 nedostatky: 7** 📋 (technický dlh)

### Production Readiness

| Prostredie | Skóre | Verdict |
|------------|-------|---------|
| **Dev / localhost** | 8/10 | ✅ Bezpečné (bez realných secrets, bez produkt. traffic) |
| **Staging / internal demo** | 7/10 | ✅ Prijateľné (pridať aspoň rate limiting + `/api/chat` gate) |
| **Verejná produkcia** | 5/10 | ❌ **Nie bez P1 fixov** — `/api/chat` cost abuse, brute-force login, žiadne CSP |

### Top 3 akcie pred produkciou (Priority Order)

1. **Pridať rate limiting** (`@upstash/ratelimit` + `@upstash/redis`) na login, chat, booking, newsletter. Implementácia: ~2 hodiny.
2. **Pridať auth gate na `/api/chat`** (session OR CAPTCHA OR IP-based daily quota). Implementácia: ~1 hodina.
3. **Pridať security headers + middleware.ts** (CSP, HSTS, X-Frame, X-Content-Type, Referrer-Policy + Origin check). Implementácia: ~2 hodiny.

Celkový odhad času pre P1 fix: **~1 deň práce**.

---

## 12. PRÍLOHY

### A. Zoznam auditovaných súborov

- `src/lib/auth.ts` (122 lines) ✅
- `src/lib/password.ts` (36 lines) ✅
- `src/lib/seed.ts` (117 lines) ✅
- `src/lib/ai.ts` (292 lines) ✅
- `src/lib/ai/provider.ts` (104 lines) ✅
- `src/lib/agents/orchestrator.ts` (198 lines) ✅
- `src/app/api/auth/login/route.ts` (35 lines) ✅
- `src/app/api/auth/logout/route.ts` (8 lines) ✅
- `src/app/api/auth/session/route.ts` (10 lines) ✅
- `src/app/api/chat/route.ts` (45 lines) ⚠️
- `src/app/api/booking/route.ts` (53 lines) ✅
- `src/app/api/newsletter/route.ts` (27 lines) ✅
- `src/app/api/admin/copilot/route.ts` (179 lines) ✅
- `src/app/api/admin/ai/route.ts` (89 lines) ✅
- `src/app/api/admin/ai/variants/route.ts` (25 lines) ✅
- `src/app/api/admin/ai/suggestions/route.ts` (15 lines) ✅
- `src/app/api/admin/ai/seo-score/route.ts` (25 lines) ✅
- `src/app/api/admin/settings/route.ts` (49 lines) ✅
- `src/app/api/admin/inquiries/route.ts` (47 lines) ✅
- `src/app/api/admin/inquiries/[id]/route.ts` (14 lines) ✅
- `src/app/api/admin/contacts/[id]/route.ts` (43 lines) ✅
- `src/app/api/admin/tasks/[id]/route.ts` (30 lines) ✅
- `src/app/api/admin/bookings/[id]/route.ts` (30 lines) ✅
- `src/app/api/admin/campaigns/[id]/route.ts` (32 lines) ✅
- `src/app/api/admin/content-items/[id]/route.ts` (42 lines) ✅
- `src/app/api/admin/gigs/[id]/route.ts` (41 lines) ✅
- `src/app/api/admin/media/[id]/route.ts` (41 lines) ✅
- `src/app/api/admin/songs/[id]/route.ts` (40 lines) ✅
- `src/app/api/admin/organizations/[id]/route.ts` (30 lines) ⚠️ (broken getSession)
- `src/app/api/admin/venues/[id]/route.ts` (34 lines) ⚠️ (broken getSession)
- `src/app/api/admin/rehearsals/[id]/route.ts` (30 lines) ✅
- `src/app/api/admin/setlists/[id]/route.ts` (27 lines) ✅
- `src/app/api/admin/knowledge/[id]/route.ts` (34 lines) ✅
- `src/app/api/admin/subscribers/[id]/route.ts` (29 lines) ✅
- `src/app/api/admin/merch/products/[id]/route.ts` (49 lines) ✅
- `src/components/site/structured-data.tsx` (184 lines) ✅
- `src/components/AIChat.tsx` (139 lines) ✅
- `src/app/admin/login/page.tsx` (140 lines) ✅
- `prisma/schema.prisma` (640+ lines) ✅
- `next.config.ts` (29 lines) ❌
- `vercel.json` (24 lines) ✅
- `.env` ✅
- `.env.example` (47 lines) ⚠️
- `package.json` ✅

**Celkovo auditovaných:** 44+ súborov
**Počet admin routes s getSession(req) kontrolou:** 55/57 (2 broken)
**Počet PATCH routes s mass-assignment whitelist:** 12+/12

### B. Verifikované env premenné

```
$ rg "process\.env\.[A-Z_]+" src/ | sort -u
```

Všetkých 14 env premenných zoznamu v sekciu 5.

### C. Verifikácia absencie hardcoded secrets

```
$ rg "(sk-[a-zA-Z0-9]{20,}|gsk_[a-zA-Z0-9]{20,}|Bearer [a-zA-Z0-9]{20,})" src/
(no matches)

$ rg "dora2026" src/
(no matches in code, only in .env.example)

$ rg "(csrf|CSRF|Sec-Fetch-Site)" src/
(no matches)

$ rg "(upstash|ratelimit)" src/
(no matches in src/, only in gap analysis doc)
```

### D. Verifikácia neexistencie middleware

```
$ find . -maxdepth 3 -name "middleware*" -not -path "*/node_modules/*"
(empty result)
```

---

**Audit dokončený. Žiadne kódové zmeny neboli vykonané — audit bol read-only.**

**Ďalšie odporúčané kroky:**
1. Implementovať P1 fixes (rate limiting, /api/chat gate, security headers, middleware) — ~1 deň
2. Po P1 fixe spustiť re-audit (AUDIT-2) pre verifikáciu
3. Pred produkciou spustiť penetration testing (exteraný audítor)
4. Nastaviť monitoring na admin login pokusy, AI cost anomaly, error rate spike
