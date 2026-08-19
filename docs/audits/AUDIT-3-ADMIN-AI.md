# D.O.R.A. — AUDIT-3: ADMIN UX & AI INFRASTRUCTURE

**Audit ID:** AUDIT-3
**Dátum:** 2026-08-17
**Scope:** Admin Shell, AI infraštruktúra, AI Copilot, AI Agenti, Knowledge Base, Command Center, Analytics, Booking OS, Content OS, Merch OS, Music OS
**Metóda:** Read-only code audit — žiadne kódové zmeny
**Repo:** `/home/z/my-project/` (Next.js 16 + Prisma 6 + Vercel AI SDK 7)

---

## 0. EXECUTIVE SUMMARY

D.O.R.A. admin bol od Task 32 (2026-08-09) transformovaný z „kopy tabov v flex-wrap" na plnohodnotný **Band Operating System** s 22 tabmi v 9 navigačných groupách, sidebarom, command paletou (⌘K), AI Copilotom, 29 Prisma modelmi a 22 admin API endpointmi. Implementovalo sa 26 míľnikov (M0.x–M7.5) vrátane AI Cost Trackingu, Concert Mode, Merchandise OS a Predictive Analytics.

**Kritické problémy nájdené v tomto audite:**

| # | Problém | Závažnosť |
|---|---------|-----------|
| 1 | AI Tool System (M4.2) je **mŕtvy kód** — `tools.ts` neimportuje žiadny agent/orchestrator/API | 🔴 Kritické |
| 2 | Human-in-the-Loop (M0.8) je **polovičatý** — iba `inquiryAgent` používa pending review; `taskAgent` stále auto-vytvára Task záznamy v DB | 🔴 Kritické |
| 3 | ApprovalQueue model/UI **neexistuje** — admin nemá surface na schvaľovanie inquiry analýz | 🔴 Kritické |
| 4 | Structured Content (M3.1) — model + API existujú, ale **žiadny admin tab** nie je zapojený | ⚠️ Vysoké |
| 5 | Concert Mode merch counter je **hardcoded** (4 fixné produkty) — nijako neprepojený s Merch OS | ⚠️ Vysoké |
| 6 | `userEmail` prop do AdminShell je **vždy null** (page.tsx nikdy nesetne state) | ⚠️ Vysoké |
| 7 | `AIChat.tsx`, `hooks/useChat.ts` a ďalšie sú **dead code** | 🟡 Stredné |
| 8 | 11 z 22 admin tabov stále nepoužíva `EmptyState`/`ErrorState` komponent | 🟡 Stredné |
| 9 | RBAC pre agentov neexistuje — `AdminUser.role` sa nikde nekontroluje | 🔴 Kritické |

**Verdikt:** Admin UX **7.5/10** (boli 6.5/10) — obrovský pokrok, ale s krvácajúcimi AI slotmi. AI infraštruktúra **6/10** — foundations sú postavené, ale nie všetky sú zapojené.

---

## 1. ADMIN SHELL — `src/components/admin/admin-shell.tsx`

### 1.1 Štruktúra
- **Sidebar:** Fixed, 240px (`w-64`), `lg:translate-x-0`, mobile (`-translate-x-full`) s hamburgerom + backdropom.
- **9 navigačných groupov** s **22 tabmi**:
  1. **Command Center** — Prehľad, Analytika, Predikcie (3)
  2. **Live** — Dopyty, Koncerty, Pipeline (3)
  3. **CRM** — Kontakty, Newsletter (2)
  4. **Práca** — Úlohy (1)
  5. **Obsah** — CMS, Médiá, SEO, Kampane (4)
  6. **AI** — AI nástroje, AI Agenti, AI Náklady, Knowledge (4)
  7. **Hudba** — Skladby, Skúšky, Setlisty, Concert Mode (4)
  8. **Biznis** — Merch (1)
  9. **Systém** — Nastavenia (1)

- **Sticky footer** v sidebare: „Zobraziť web" link, user email, logout button (lines 260-281).
- **Mobile top bar** s hamburgerom (line 287-301).
- **Count badges** na Dopyty, Koncerty, Médiá, Newsletter (4 badge — nie na všetkých relevantných taboch).
- **Login/session check** + redirect na `/admin/login` ak neautorizovaný.

### 1.2 Command Palette (⌘K) — `src/components/admin/command-palette.tsx`
- **Library:** `cmdk@1.1.1` (✅ nainštalovaný).
- **26 akcií** rozdelených do 2 groupov:
  - **Navigácia** (24): všetkých 22 admin tabov + Analytics + Predictions.
  - **Akcie** (2): Otvoriť verejný web, Odhlásiť sa.
- **Otvorenie:** Cmd+K / Ctrl+K / sidebar ⌘K hint button.
- **Zatvorenie:** ESC alebo backdrop click.
- **Searchable** s keywords (`booking, gigs, contacts, ...`).
- **Footer:** „Prihlásený: {userEmail}" — ⚠️ ale pozri §1.4.

### 1.3 Mobile Responsive (Drawer)
- ✅ Sidebar sa na mobile (`lg:hidden`) stáva drawerom s backdropom (`bg-ink/80 backdrop-blur-sm`).
- ✅ Mobile top bar sticky, hamburger otvorí drawer.
- ✅ Drawer sa zatvorí po kliku na položku.
- ⚠️ Concert Mode tab má svoj vlastný sticky header (`top-0 z-20`) — môže sa prekrývať s admin top barom na mobile.

### 1.4 Sticky Footer v Sidebare
- ✅ Existuje (lines 260-281): „Zobraziť web", `{userEmail}`, logout.
- 🔴 **BUG:** `userEmail` je `useState<string | null>(null)` v `app/admin/page.tsx` (line 31) a **nikdy nie je setnutý**. AdminShell dostáva null aj keď AdminShell sám fetchuje `/api/auth/session` a má vlastný `email` state. Footer teda nikdy nezobrazí email.
- 🟡 **Smell:** AdminShell simuluje ⌘K klávesnicu cez `window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ... }))` (line 200). Funguje, ale je to kruhobjat — lepšie by bol priamy state lift.

### 1.5 Empty/Error States — `src/components/admin/empty-state.tsx`
- ✅ `EmptyState({ icon, title, description, action })` — konzistentný, action button optional.
- ✅ `ErrorState({ message, onRetry })` — s retry buttonom.
- 🟡 **Adopcia:** Iba **11 z 22 admin tabov** používa tieto komponenty (booking, songs, rehearsals, setlists, knowledge, ai-usage, campaigns, analytics, predictions, merch, concert-mode, stats-aspoň ErrorState). Ostatné **11 tabov** používa legacy inline text (`<p>Žiadne kontakty.</p>`):
  - `crm-tab.tsx` — bez EmptyState/ErrorState
  - `inquiries-tab.tsx` — bez EmptyState/ErrorState
  - `tasks-tab.tsx` — bez EmptyState/ErrorState
  - `gigs-tab.tsx` — bez EmptyState/ErrorState
  - `media-tab.tsx` — bez EmptyState/ErrorState
  - `subscribers-tab.tsx` — bez EmptyState/ErrorState
  - `seo-tab.tsx` — bez EmptyState/ErrorState
  - `automations-tab.tsx` — bez EmptyState/ErrorState (iba inline `<AlertCircle>`)
  - `ai-tab.tsx` — bez EmptyState/ErrorState
  - `content-tab.tsx` — bez EmptyState/ErrorState
  - `settings-tab.tsx` — bez EmptyState/ErrorState

### 1.6 Activity Feed / Notifications
- ❌ **Chýba.** GAP analysis §3.4 P2 item „Activity feed sidebar" neimplementovaný. Jediný povrch pre nedávnu aktivitu je Stats tab „Posledné AI automatizácie" (5 záznamov) a Automations tab (ktorý je trigger UI, nie log viewer).

### 1.7 Admin User Management
- ❌ **Žiadny admin UI.** Model `AdminUser` existuje (email, passwordHash, name, role), ale:
  - Žiadny endpoint na list/create/delete adminov (iba `seed.ts` vytvára prvého).
  - Žiadny admin tab na správu adminov.
  - `role` pole sa nikde v kóde neriadi (žiaden RBAC).
- GAP analysis §3.4 P2: „CRUD admin users + roles" — **stále chýba**.

---

## 2. AI INFRAŠTRUKTÚRA — `src/lib/ai/`

### 2.1 Provider Adapter — `src/lib/ai/provider.ts` (M0.7) ✅
- **3 providery:** `groq` (default), `openai`, `none`.
- **Interface:** `AIProvider { name, getModel(task), getModelName(task), isConfigured() }`.
- **Task-based model routing:** `writing | analysis | fast` — každý task má vlastný env override (`AI_MODEL_WRITING`, `AI_MODEL_ANALYSIS`, `AI_MODEL_FAST`).
- **Groq defaults:** `llama-3.3-70b-versatile` (writing/analysis), `llama-3.1-8b-instant` (fast).
- **OpenAI defaults:** `gpt-4o-mini` (všetky tasky).
- **Singleton:** `getProvider()` — jeden provider per server instance (✅ efektívne).
- **`isConfigured()` check:** ✅ checkuje env API key.
- **Backward compat:** `src/lib/ai.ts` re-exportuje `getModel(task)`, `getModelName()`, `isAIConfigured()` ako fasádu.

### 2.2 AI Tools — `src/lib/ai/tools.ts` (M4.2) 🔴 DEAD CODE
- **7 tools definovaných:**
  1. `search_crm` (READ, crm)
  2. `get_upcoming_gigs` (READ, booking)
  3. `get_urgent_tasks` (READ, task)
  4. `get_new_inquiries` (READ, booking)
  5. `get_knowledge` (READ, search)
  6. `get_analytics_summary` (READ, analytics)
  7. `create_task` (CREATE, task)
- **Permission model:** `READ | WRITE | CREATE | DELETE | SEND` (typ union).
- **Helper:** `getTool(name)`, `getToolsForPermissions(perms)`, `TOOL_NAMES`.
- 🔴 **KRITICKÉ:** **Nič tento súbor neimportuje.** `grep "from '@/lib/ai/tools'"` → 0 matches. Tools sú definované, ale:
  - Orchestrator nepoužíva `generateText` s `tools` parametrom (AI SDK v7 podporuje).
  - Copilot route volá `streamText` bez tools.
  - Automations tab volá `/api/admin/ai` s `type: "custom"` a hardcoded promptom.
  - Žiadny RBAC layer overuje `ToolPermission` proti `AdminUser.role`.
- **Verdikt:** M4.2 je „foundation", ale foundation, na ktorej **nikto nepostavil dom**. Tools sú dead code.

### 2.3 Usage Tracking — `src/lib/ai/usage.ts` (M4.5) ✅
- **Cenník:** Hard-coded podľa Groq/OpenAI cien (August 2024):
  - Groq: `llama-3.3-70b` ($0.59/$0.79 per 1M), `llama-3.1-8b` ($0.05/$0.08), `mixtral-8x7b`, `gemma2-9b`.
  - OpenAI: `gpt-4o` ($5/$15), `gpt-4o-mini` ($0.15/$0.60), `gpt-4-turbo`, `gpt-3.5-turbo`.
  - Fallback: $0.5/$1.0 per 1M.
- **3 helper funkcie:**
  1. `calculateCost(provider, model, promptTokens, completionTokens)` → USD, zaokrúhlené na 6 desatinných.
  2. `logAiUsage(input)` → async DB insert do `AiUsageLog`, fire-and-forget (nikdy nethrowne).
  3. `withUsageTracking(task, model, fn, opts?)` → wrapper pre `generateText` — zmeria latenciu, logne usage, ak fail tak logne s `success: false`.
  4. `trackStreamUsage(result, task, model, opts?)` → wrapper pre `streamText` — awaits `result.usage` alebo `result.totalUsage` Promise.
- **Integrácia:**
  - ✅ `copilot/route.ts` volá `trackStreamUsage` (line 168).
  - ✅ `market-report/route.ts` (z worklogu M4.5).
  - ❌ **Nepoužíva sa v:** `ai/route.ts` (hlavný content generation endpoint), `ai/variants/route.ts`, `ai/seo-score/route.ts`, `bookings/[id]/rescore/route.ts`, `orchestrator.ts` (všetci agenti).
- 🟡 **Smell:** `trackStreamUsage` signature je veľmi komplikovaná (union Promise<T> | T na usage a totalUsage), castuje sa na `never` v callerovi (`trackStreamUsage(result as never, ...)`).

### 2.4 AI Cost Tracking Admin Tab — `src/components/admin/ai-usage-tab.tsx` (M4.5) ✅
- **API:** `GET /api/admin/ai-usage?days=N&limit=N` → summary + byModel + byTask + byProvider + dailyTrend (14d) + recentCalls.
- **UI:**
  - 4 KPI cards: month cost, calls, tokens, avg latency (s today/mesiac subtitle).
  - Daily trend bar chart (14 dní, hover tooltip).
  - Top modely (s progress barmi, calls + tokens).
  - Top tasky (s TASK_LABELS slovníkom — 11 labelov).
  - Recent calls scroll-area (success/error icon, task badge, model, relative time, prompt preview, error message, tokens ↑↓, latency, cost).
  - Period filter: 7d / 30d / 90d.
  - Footer: provider badge + total since inception.
- ✅ Konzistentne používa `EmptyState`/`ErrorState`/`Skeleton`/`Progress`/`ScrollArea`/`Badge`/`Card`.
- ✅ VLM-verified v Task 44-VERIFY.

### 2.5 AI Suggestion Engine — `src/lib/ai.ts` ✅
- `generateSuggestions()` — rule-based (nie LLM):
  1. Nové dopyty bez odpovede (high).
  2. Nadchádzajúce koncerty bez úloh (high).
  3. Žiadni noví odberatelia za 7 dní (medium).
  4. Médiá bez alt-textu (medium).
  5. Kontakty s `aiScore < 30` (low).
  6. Žiadne SEO meta (high).
  7. Žiadne AI automatizácie za 24h (low).
- ✅ Povrchované v Stats tab „AI Návrhy — proaktívne odporúčania".

### 2.6 Prompt Types — `src/lib/ai.ts`
- **24 typov obsahu** v 4 skupinách: Hero & Landing (3), SEO (3), Content (6), Social Media (3), Advanced (9 — `press-release`, `newsletter-intro`, `sponsor-pitch`, `setlist-notes`, `merch-description`, `fan-message`, `concert-review`, `anniversary-post`, `custom`).
- `buildSystemPrompt(type)` — hardcoded prompts (GAP analysis P2 item „Editovateľné z admina" neimplementované).

---

## 3. AI COPILOT — `src/app/api/admin/copilot/route.ts` + `src/components/admin/ai-copilot.tsx` (M4.3) ✅

### 3.1 Backend — `copilot/route.ts`
- **Endpoint:** `POST /api/admin/copilot` (session-gated).
- **Context gathering z DB (8 zdrojov):**
  1. **Stats** — 13 countov (inquiries, newInquiries, gigs, upcomingGigs, tasks, activeTasks, contacts, bookings, activeBookings, subscribers, media, songs, automations za 7d).
  2. **Posledné dopyty** (max 5) s organizátorom, typom, dátumom, miestom, statusom, správou.
  3. **Nadchádzajúce koncerty** (max 5) s dátumom, venue, mestom, vstupným.
  4. **Urgentné úlohy** (max 5) s prioritou a termínom.
  5. **Aktívne bookingy** (max 5) s kontaktom, org, AI score, fee.
  6. **Overené fakty** (Knowledge Base, max 10) — iba `verified: true`.
- **System prompt:** Slovak, punk tón, „NIč si nevymýšľaj", „navrhuj akcie", „pri návrhu textu označ ako návrh na schválenie".
- **Streaming:** `streamText({ model: getModel("writing"), system, prompt: fullPrompt })` → `result.toTextStreamResponse()`.
- ✅ **Usage tracking:** `trackStreamUsage(result as never, "copilot", getModelName("writing"), { userId: "admin", promptPreview, startMs })` — fire-and-forget.
- 🟡 **Smell:** `userId: "admin"` je hardcoded — nemalo by byť skutočné admin ID z `getSession(req)`?

### 3.2 Frontend — `ai-copilot.tsx`
- **Floating button:** fixed bottom-right, z-50, animated ping ring, hover scale.
- **Open trigger:** Click button ALEBO `Ctrl+Shift+A` / `Cmd+Shift+A`.
- **Panel:** 400px wide, 500px tall (max 80vh), dark theme, glass blur.
- **Header:** D.O.R.A. AI logo, „Copilot · kontextový asistent", close button.
- **Empty state:** Welcome message + 4 quick prompts.
- **Messages:** User (right, neon-red) + Assistant (left, dark-gray) bubble design.
- **Loading:** Loader2 spinner v assistant bubline.
- **Input:** text input + Send button (disabled on empty/loading), Enter-to-send (Shift+Enter pre newline).
- **Footer:** „AI používa reálne dáta z DB · {messages.length} správ".
- 🟡 **Limitation:** Žiadny markdown rendering — iba `whitespace-pre-wrap`. Pre dlhé AI odpovede s odrážkami/JSON to bude nečitateľné.
- 🟡 **Limitation:** Žiadna história medzi sessionami — refresh vymaže messages.
- 🟡 **Limitation:** Žiadny copy-to-clipboard button na assistant správy.
- 🟡 **Limitation:** Quick prompts sú hardcoded 4 — nepripomínajú kontext (ak nejaký gig za 2 dni, prompt by mal povedať „Priprav setlist pre {gig}").

### 3.3 4 Quick Prompts
1. „Čo máme dnes spraviť?"
2. „Ktoré dopyty potrebujú odpoveď?"
3. „Aké koncerty máme naplánované?"
4. „Pomôž s návrhom follow-up emailu"

---

## 4. AI AGENTS — `src/lib/agents/orchestrator.ts`

### 4.1 Agenti
| Agent | Funkcia | DB Write? | HITL? | Status |
|-------|---------|-----------|-------|--------|
| `contentAgent(gig)` | Generuje 7 sekcií obsahu (blog, FB, IG, newsletter, SEO title/desc, press) | Iba AutomationLog | N/A | ⚠️ Output nikde nepovrchuje |
| `taskAgent(gig)` | Generuje JSON checklist úloh | 🔴 **AUTO-VYTVÁRA Task záznamy** | ❌ Žiadny | Porušuje M0.8 |
| `emailAgent(params)` | Generuje reply email | Iba AutomationLog | N/A | ⚠️ Nepoužíva z orchestratora |
| `bookingAgent(url)` | Analyzuje URL festivalu | Iba AutomationLog | N/A | ⚠️ Nepoužíva z orchestratora |
| `inquiryAgent(inquiry)` | Analyzuje booking dopyt | ✅ Stores pending review v AutomationLog | ✅ HITL | Jediný správny |
| `orchestrator(trigger, data)` | Router pre gig_created, inquiry_received | Logs start+end | N/A | ✅ |

### 4.2 Tool-calling Framework 🔴
- **Používaný:** ❌ **Žiadny.** Orchestrator používa iba single-shot `generateText({ model, system, prompt })` s hardcoded string promptom.
- **M4.2 AI Tool System** (`tools.ts`) je definovaný, ale **0 importov** v celom repozitári.
- **AI SDK v7** podporuje `tools` parameter v `generateText`/`streamText` — možné zapojenie, ale neurobilo sa.

### 4.3 Human-in-the-Loop (ApprovalQueue) 🔴
- **Model `ApprovalQueue`:** ❌ Neexistuje v Prisma schéme.
- **HITL implementácia:** Iba pre `inquiryAgent` — ukladá analýzu do `AutomationLog.output` JSON s `pendingAction: "review_and_create_contact_booking"`.
- **Admin UI pre schvaľovanie:** ❌ **Žiadny.** `inquiries-tab.tsx` neukazuje AI analýzu, iba status dopytu (new/reviewed/confirmed/archived). `automations-tab.tsx` je trigger UI, nie log viewer. Admin musí ručne listovať DB.
- **Konkrétna cesta schválenia:** ❌ Neexistuje — neexistuje endpoint na prevedenie „pending review" → Contact/Booking/Task/Communication. Admin musí záznamy vytvoriť ručne.
- **taskAgent:** 🔴 **Porušuje M0.8.** `await Promise.all(tasks.map(t => db.task.create({ ... })))` (line 85) — auto-vytvára Task záznamy bez schválenia. M0.8 v worklohu tvrdí „NO LONGER auto-creates", ale platí to iba pre inquiryAgent.

### 4.4 RBAC pre Agentov 🔴
- ❌ **Žiadny.** `AdminUser.role` sa v kóde nijako neoveruje. Každý prihlásený admin (session cookie) môže spustiť hociktorého agenta cez `/api/admin/ai` alebo orchestrator trigger z `gigs POST` / `booking POST`.
- ❌ `ToolPermission` model z `tools.ts` sa nikdy neporovnáva s rolou admina.
- ❌ `create_task` tool (CREATE permission) by mal byť restrictnutý na admin rolu „editor" alebo vyššiu — ale nepoužíva sa vôbec.

### 4.5 Prompt Injection Defense (M0.9) ✅
- `sanitizeForPrompt(input, maxLength=500)`:
  1. Slice na maxLength.
  2. Strip control chars (okrem `\n\t`).
  3. Neutralizuje „ignore previous instructions" → `[REDACTED]`.
  4. Neutralizuje „system:/assistant:/user:" → `[REDACTED]`.
  5. Neutralizuje „you are now / act as" → `[REDACTED]`.
  6. Code block ``` ``` → `[CODE BLOCK REMOVED]`.
- ✅ Aplikuje sa v `emailAgent` (recipient + context), `bookingAgent` (url), `inquiryAgent` (všetky polia inquiry).
- ❌ **NEaplikuje sa** v `contentAgent` (gig title/venue/city sú trusted admin input — OK) ani v `taskAgent` (gig title — OK), ale **aj copilot route** posiela `question` priamo do promptu bez sanitizácie (line 157): `OTÁZKA ADMINA:\n${userMessage}`. Admin je síce trusted, ale ak copilot raz dostane copy-paste od fanúšika, je to zraniteľné.

### 4.6 Automations Tab — `src/components/admin/automations-tab.tsx`
- **4 agenti v UI:** URL Analyzer, Email Assistant, Content Bundle, Task Generator.
- 🟡 Títo agenti v UI **nezavolajú** `orchestrator.ts` ani `emailAgent`/`bookingAgent`. Namiesto toho volajú `/api/admin/ai` s `type: "custom"` a hardcoded inštrukciou — **duplicitná logika**.
- ❌ Žiadny output viewer pre AutomationLog (záznamy z orchestratora).
- ❌ Žiadny approval workflow UI.

---

## 5. KNOWLEDGE BASE — `src/app/api/admin/knowledge/` + `knowledge-tab.tsx` (M4.1) ✅

### 5.1 Model `KnowledgeItem` ✅
- **Polia:** `category`, `key`, `value` (@db.Text), `source`, `verified` (Boolean), `verifiedAt` (DateTime?), `verifiedBy` (String?), `confidence` (Float 0-1).
- **Unique:** `@@unique([category, key])` — jeden fakt per kategória+key.
- **Indexes:** `[category]`, `[verified]`.
- **13 kategórií:** `band_identity`, `history`, `members`, `songs`, `releases`, `events`, `venues`, `booking_rules`, `technical_rider`, `pricing`, `brand_voice`, `faqs`, `all`.
- **5 source typov:** `band_archive` (zelená), `pr_document` (sky), `official_website` (cyan), `ai_inferred` (warm-yellow), `unverified` (neon-red).

### 5.2 Fakty vs Inferred vs Marketing Claims
- ✅ Source field rozlišuje overené fakty (`band_archive`, `pr_document`, `official_website`) od `ai_inferred` a `unverified`.
- ✅ `verified` boolean — admin môže manuálne overiť/neoveriť cez toggle button.
- ✅ `confidence` 0-1 — pre `ai_inferred` fakty možno prideliť AI confidence.
- ❌ **Chýba typ `marketing_claim`** — v audite sa spomínala separácia „fakty vs inferred vs marketing claims". Neexistuje `claim_type` enum ani `expiresAt` pre marketing tvrdenia s časovou platnosťou.
- ❌ **Brand guardian / fact check agent** — GAP analysis §3.5 P2 item „Fact check + brand voice validation" neimplementovaný. AI agenti nevalidujú output proti KnowledgeItem.

### 5.3 API
- `GET /api/admin/knowledge?category=xxx` — list (max 200, ordered by category+key).
- `POST /api/admin/knowledge` — create (validácia category/key/value required, source default `unverified`, confidence default 0).
- `PATCH /api/admin/knowledge/[id]` — update s **mass-assignment whitelist** (✅ M0.5 pattern): iba `category`, `key`, `value`, `source`, `verified`, `confidence` sú povolené.
- `DELETE /api/admin/knowledge/[id]`.
- ✅ `verifiedAt` a `verifiedBy` sa auto-setnu pri toggle na `true`.

### 5.4 Admin Tab — `knowledge-tab.tsx`
- **Header:** Brain icon, „Knowledge Base", countverified summary (X faktov · Y overených · Z neoverených).
- **Filters:** Search input (key/value/category) + 12 category chipov.
- **List:** Cards s kategóriou (warm-yellow), key (silver), value (off-white), source badge (s color), confidence %, verified toggle (ShieldCheck/Check), edit (Plus rotate-45), delete (Trash2).
- **Form modal:** category select, key input, value textarea, source select, verified checkbox.
- ✅ Konzistentne `EmptyState` s `action` buttonom „Pridať prvý fakt".
- ✅ `ErrorState` s retry.
- ✅ Toast notifikácie.
- 🟡 **Smell:** Edit button používa `Plus` ikonu rotate-45 ako „edit" — neintuitívne, mal by byť `Pencil` z lucide.

---

## 6. COMMAND CENTER DASHBOARD — `src/components/admin/stats-tab.tsx`

### 6.1 „Čo má D.O.R.A. urobiť teraz?" (M1.3) ✅
- **Pulzný indikátor** (animate-ping, neon-red).
- **4 povrchované položky:**
  1. ✅ **Nové dopyty** (count, „čakajú na odpoveď") — ak `newInquiries > 0`.
  2. ✅ **Urgentné úlohy** (count, „vyžadujú pozornosť") — ak urgentTasks > 0 (filter high/urgent z `recentTasks`).
  3. ✅ **Najbližší koncert** (T-X dni, „dni do {title}") — ak gig do 30 dní.
  4. ✅ **AI návrhy** (count, „čakajú na schválenie") — ak high-priority suggestions > 0.
- ✅ Bez `todayItems` sa sekcia nerenderuje.

### 6.2 Booking Follow-ups
- ✅ Indirect cez „Nové dopyty" (ak má nové bez odpovede).
- ❌ **Žiadny explicitný „follow-up" povrch.** Ak je dopyt starší 3 dni so statusom `reviewed` (bez odpovede), nie je osobitne indikovaný. Copilot quick prompt „Ktoré dopyty potrebujú odpoveď?" to rieši, ale nie je v dashboarde.

### 6.3 AI Suggestions
- ✅ Sekcia „AI Návrhy — proaktívne odporúčania" (lines 351-374).
- ✅ Priority dot color (high=neon-red, medium=warm-yellow, low=silver).
- ✅ Type badge (silver/40).
- ✅ Action label (warm-yellow uppercase).

### 6.4 Nadchádzajúce koncerty
- ✅ Sekcia „Nadchádzajúce koncerty" (lines 269-309) s dátumom (deň+mesiac), názvom, venue+mesto, ArrowRight indikátorom.

### 6.5 Status breakdown
- ✅ Bar chart pre 4 inquiry statusy (new/reviewed/confirmed/archived) s percentami.

### 6.6 Recent AI automations
- ✅ Zoznam posledných 5 automation logov (lines 376-398).

---

## 7. ANALYTICS — `src/components/admin/analytics-tab.tsx` + `predictions-tab.tsx`

### 7.1 Analytics Dashboard (M6.3) ✅
- **API:** `GET /api/admin/analytics` → 6 KPI kategórií.
- **KPI kategórie:**
  1. **LIVE** — totalGigs, upcomingGigs, pastGigs, confirmedBookings, cancelledBookings, conversionRate.
  2. **CRM** — totalContacts, activeContacts, totalBookings, activeBookings, totalInquiries, newInquiries, responseRate, contactTypes (Record).
  3. **FAN** — activeSubscribers, newThisWeek, growthRate, journeyStages, segments, topCities.
  4. **MUSIC** — totalSongs, releasedSongs, setlistSongs, rehearsals, plannedRehearsals, songStatuses.
  5. **BUSINESS** — pipelineValue, avgFee, avgMatchScore, pipelineCount.
  6. **CONTENT & AI** — totalMedia, mediaWithAlt, mediaAltCoverage, totalKnowledge, verifiedKnowledge, knowledgeVerificationRate, totalAutomations, automationsThisWeek.
- **UI:** 6 sekcií, každá s ikonou (Calendar/Users/Mail/Music/DollarSign/Sparkles), 2-3 KPI cards, voliteľné breakdown badge-y.
- **Market Report button (M6.4):** Volá `/api/admin/market-report` → AI report v `<pre>` formáte.

### 7.2 Predictive Analytics (M7.5) ✅
- **API:** `GET /api/admin/predictions` → 5 prediction categories + health score.
- **5 predikcií:**
  1. **Booking probability** — kontakty s AI score ≥ 70 bez bookingov.
  2. **Fan engagement trend** — subscriber growth rate, churn.
  3. **Revenue forecast** — confirmed gigs + merch extrapolation.
  4. **Low stock risk** — days-until-stockout based on velocity.
  5. **Gig readiness** — task completion %, critical gigs < 14d.
- **UI:**
  - Health Score card (big, color: výborný/dobrý/priemerný/kritický).
  - 2 trend cards (up/down counts).
  - 5 prediction cards (2-col grid) s type icon, trend badge, confidence progress bar, detail, recommendation callout, type-specific metadata.
  - Critical border highlight pre `trend === "down"` && `confidence > 0.6`.
- ✅ Konzistentne `EmptyState`/`ErrorState`/`Skeleton`.
- 🟡 **Rule-based, nie ML** — fallback ked zlyhajú AI predictions. V audite sa spomína „AI-driven", ale v skutočnosti sú pravidlá.

---

## 8. BOOKING OS — `src/components/admin/booking-tab.tsx` (M2.1 + M2.4)

### 8.1 Pipeline (M2.1)
- **8-stage Kanban** (auditoval 14, zoskupené pre praktickú použiteľnosť):
  - `lead` → `qualified` → `contacted` → `replied` → `negotiated` → `offer_sent` → `confirmed` → `cancelled`.
- ❌ **Chýba POST-EVENT štádium** (auditoval 14 statusov včítane `post_event`, `invoice_sent`, `paid` atď.).
- ✅ Horizontálny scroll, min-width 1200px, 8 stĺpcov.
- ✅ Summary bar: aktívnych count, potvrdených count, „Zrušené" toggle.
- ✅ Quick-move buttons per karta (context-aware nasledujúce fázy z `QUICK_MOVES`).
- ✅ Color-coded columns (border-top color per stage).
- ✅ Phase labels (objavenie/kontakt/vyjednávanie/potvrdenie/zrušené).

### 8.2 Booking Score v2 (M2.4) ✅
- **API:** `POST /api/admin/bookings/[id]/rescore`.
- **AI analýza s 5 faktormi:**
  1. `genreFit` — Žáner
  2. `locationFit` — Lokalita
  3. `commercialFit` — Komercia
  4. `contactQuality` — Kontakt
  5. `timing` — Termín
- **Returns:** score 0-100, factor breakdown, priority (high/medium/low), recommendation, reasoning.
- **UI v BookingDetail modal:**
  - Overall score badge (color: green ≥70, yellow ≥40, red <40).
  - 5 factor progress barov (color-coded).
  - Recommendation box.
  - Reasoning box.
  - Re-score button (s Loader2 spin).
- ✅ Auto-parses existujúci `aiAnalysis` JSON z DB.
- ✅ Logs to AutomationLog.

### 8.3 Contact 360° (M2.3) ✅
- ✅ ContactDetail fetches bookings + tasks pre contact (z worklogu).
- ✅ Bookings section, Tasks section, 360° summary footer.

### 8.4 Gig ako Project (M2.5) ✅
- ✅ GigProject modal v `gigs-tab.tsx` so summary, timeline, linked bookings/tasks.

---

## 9. CONTENT OS — `src/components/admin/content-tab.tsx`

### 9.1 ContentItem Workflow (M3.1) 🔴 ČIASTOČNÉ
- **Model `ContentItem`:** ✅ Existuje s plným workflow:
  - `idea → draft → ai_generated → ai_check → fact_check → human_review → approved → scheduled → published → analyzed`
  - Polia: title, slug, type (blog/news/event/page/press_release), status, language, author, body, excerpt, SEO fields, mediaIds, tags, aiGenerated, aiQualityScore, publishAt, publishedAt, version, approvedBy, approvedAt.
- **API:** ✅ `/api/admin/content-items` (GET, POST) + `[id]` (PATCH, DELETE) s auto-slug.
- 🔴 **Admin UI:** ❌ **NEEXISTUJE.** `AdminTab` union neobsahuje `"content-items"`. `page.tsx` nema case pre content-items. Sidebar nemá entry. Command palette nema akciu.
- **Súčasný content-tab:** Iba key/value editor pre `SiteContent` (6 kategórií: hero, band, contact, social, footer, seo). Toto je legacy CMS, nie M3.1 structured content.
- 🟡 Inline AI panel pre key/value polia (3 variants generation) — funguje ale je obmedzené.

### 9.2 AI Content Generation ✅
- `generateVariants({ type, context, instruction })` — generuje 3 varianty v jednom volaní, oddelené `===VARIANT===`.
- `scoreSEO({ title, description, keywords })` — AI vráti JSON score + suggestions.
- ✅ Inline AI panel v content-tab: pre každé CMS pole sa mapne na PromptType (12 mappings), volá `/api/admin/ai/variants`, zobrazí 3 varianty s „Použiť" buttonom.

### 9.3 ContentItem → Media prepojenie
- ✅ `mediaIds` JSON pole existuje v modeli.
- ❌ **Bez UI** na výber medií.

---

## 10. MERCH OS — `src/components/admin/merch-tab.tsx` (M7.4)

### 10.1 Produkty ✅
- **Model `MerchProduct`:** name, slug, description, category (t-shirt/vinyl/cd/poster/sticker/other), price, costPrice, stock, minStock, sizes (JSON), colors (JSON), imageUrl, active, bestSeller, releasedAt.
- **UI (Products sub-tab):** searchable grid s product cards, category emoji, best seller badge, low stock highlight (border-amber-500/40), margin %, sizes/colors badges, edit/delete buttons.
- **Product form dialog:** name, category select, price, costPrice, stock, minStock, sizes/colors (comma-separated), imageUrl, active toggle.

### 10.2 Objednávky ✅
- **Model `MerchOrder`:** type (event/online/wholesale), gigId, productId, quantity, unitPrice, size, color, buyerName, buyerEmail, status (pending/confirmed/shipped/delivered/cancelled/refunded), paymentMethod, notes.
- **UI (Orders sub-tab):** scroll-area zoznam s status badge, type icon, quantity × unitPrice, total, delete s auto-restock.
- **Order form:** product picker, quantity, type, dynamic size/color, buyer info, payment method.
- ✅ **Transaction:** create + decrement stock + auto-bestseller at 20+ sold.

### 10.3 Stock + Best Sellers ✅
- **Stats sub-tab:** 4 KPI cards (revenue celkom, predané kusy, aktívne produkty, low stock alert), low stock products list, top produkty (s progress barmi), best sellery, category stats (potenciálny revenue).

### 10.4 Merch counter integration s Concert Mode 🔴
- ❌ **NEPREPOJENÉ.** `concert-mode-tab.tsx` má hardcoded `DEFAULT_MERCH`:
  ```ts
  const DEFAULT_MERCH = [
    { name: "Tričká", price: 15, count: 0, emoji: "👕" },
    { name: "Vinyly / CD", price: 12, count: 0, emoji: "💿" },
    { name: "Plagáty", price: 5, count: 0, emoji: "🖼️" },
    { name: "Nálepky", price: 3, count: 0, emoji: "✨" },
  ];
  ```
- POST endpoint `concert-mode POST` iba updatne `GigFinance.notes` textom:
  ```
  [Post-event] Merch: 5 kusov, Cash: 75€. Rating: 5/5. Skvelý koncert.
  ```
- ❌ **Nevytvorí sa MerchOrder** pre každý predaný kus.
- ❌ **Nedekrementuje sa stock** v MerchProduct.
- ❌ **Ceny sú hardcoded** (€15/€12/€5/€3) aj keď v MerchProduct tab sa dajú nastaviť inak.

---

## 11. MUSIC OS

### 11.1 Songs (M5.1) ✅
- **Model `Song`:** title, altTitle, bpm, musicalKey, tuning, genre, status, duration, lyrics, notes, releaseYear, releaseName, videoId, inSetlist, isCover, originalArtist.
- **8-stage workflow:** `idea → demo → arrangement → rehearsal → recording → mix → master → released`.
- **UI:** grid s 8 status filtre, search, setlist toggle, cover flag, CRUD form s lyrics/notes/BPM/key/tuning.
- ✅ Status colors per stage.

### 11.2 Rehearsals (M5.2) ✅
- **Model `Rehearsal`:** date, attendees (JSON), songIds (JSON), newMaterial, notes, nextActions, recordings (JSON), durationMin, status (planned/done/cancelled).
- **UI:** list s status badges, attendees, song count, duration, new material/next actions, mark-as-done button, CRUD form.

### 11.3 Setlists (M5.4) ✅
- **Model `Setlist`:** gigId, name, items (JSON), totalDuration, trackCount, status (draft/confirmed/performed), notes.
- **UI:** list s setlist picker, song picker, auto-duration calc.
- ✅ Status badges.

### 11.4 Concert Mode / Live OS (M5.3) ✅ (s výhradami)
- **API:** `/api/admin/concert-mode` (GET + POST).
  - GET no gigId → 20 upcoming gigs picker.
  - GET ?gigId → gig + setlists (parsed items JSON) + songs + finance.
  - POST → post-event report (rating, summary, merchSold, cashCollected, notes) → mark gig as `completed`, update GigFinance, create AutomationLog.
- **UI (mobile-first):**
  - Sticky LIVE header s pulsing red dot.
  - Big player card: current song title, BPM, key, tuning, cover badge, **huge timer** (5xl/6xl font), progress bar.
  - 5 big round buttons: prev / reset / play-pause (rose 80x80) / timer / next (44px+ tap targets).
  - Quick stats row: odhad / zostáva / set celkom.
  - Setlist scroll-area s active highlight (rose), past (emerald checkmark), AKTUÁLNA badge.
  - Quick notes textarea + 5 preset chips (🔥 Pána, 💥 Energičná, 👎 Technický problém, 🎵 Nová skladba, 💬 Frontman rant).
  - Merch counter (4 produkty s +/- buttons, per-item revenue, total).
  - Tech rider section (ak venue má techInfo).
  - Post-event dialog: star rating (1-5), summary, notes, summary card (merch sold, revenue, set duration).
  - **localStorage persistence** (state survives reload, isPlaying reset on load).
- 🔴 **Merch counter neprepojený s Merch OS** — pozri §10.4.
- 🟡 Setlist picker sa zobrazí iba ak `setlists.length > 1` — pre jeden setlist nie je možné prepínať, čo je OK.
- 🟡 „Uložiť stav" button iba ukáže toast „Stav uložený" — state už je auto-persistovaný do localStorage, takže button je zbytočný.

### 11.5 Post-event workflow (M5.3) ✅
- ✅ Submit → POST `/api/admin/concert-mode` → gig status `completed`, GigFinance notes updated, AutomationLog vytvorený.
- 🟡 **Smell:** `otherCost: -(cashCollected || 0)` v POST (line 118) — záporný cost ako príjem je hack, malo by byť samostatné `merchRevenue` pole.
- ❌ Po ukončení koncertu sa nevygeneruje „post-event checklist" (recenzia, fotky upload, setlist archivácia, fanúšikovský email).

---

## 12. IMPLEMENTOVANÉ FEATURES (M0.x – M7.5)

| Míľnik | Popis | Status | Task |
|--------|-------|--------|------|
| **M0.1** | Password Hashing (bcrypt) | ✅ | 32 |
| **M0.2** | Session Secret + Cookie Security | ✅ | 32 |
| **M0.3** | Z.AI Token Rotation (deleted zai-config) | ✅ | 32 |
| **M0.4** | Seed Script Security (env-based) | ✅ | 32 |
| **M0.5** | Mass-Assignment Fix (4 PATCH routes) | ✅ | 32 |
| **M0.6** | Orphan FK Relations | ✅ | 32 |
| **M0.7** | AI Provider Adapter (Groq+OpenAI+none) | ✅ | 42 (lib/ai/provider.ts) |
| **M0.8** | AI RBAC + Human-in-the-Loop | 🔴 Polovičaté | 32 (iba inquiryAgent) |
| **M0.9** | Prompt Injection Defense | ✅ | 32 (sanitizeForPrompt) |
| **M0.10** | MusicEvent JSON-LD | ✅ | 32 |
| **M1.1** | Sidebar Layout (240px, 9 groups) | ✅ | 33 |
| **M1.2** | Command Palette ⌘K (26 actions) | ✅ | 33 |
| **M1.3** | Dashboard „Čo má D.O.R.A. urobiť teraz?" | ✅ | 33 |
| **M1.4** | Empty/Error States | 🟡 11/22 tabs | 33 |
| **M1.5** | Campaigns + Segments admin tab | ✅ | 38 |
| **M2.1** | Extended Booking Pipeline (8-stage) | ✅ | 34 |
| **M2.2** | Venue / Organization Entities | ✅ | 42 |
| **M2.3** | Contact 360° | ✅ | 34 |
| **M2.4** | Booking Score v2 (explainable, re-scoreable) | ✅ | 35 |
| **M2.5** | Gig ako Project Object | ✅ | 36 |
| **M3.1** | Structured Content Entity | 🔴 API+model, NO UI | 42 |
| **M3.3** | Dynamic Sitemap | ✅ | 35 |
| **M3.4** | hreflang | ✅ | 42 |
| **M3.5** | PWA Manifest | ✅ | 35 |
| **M3.6** | vercel.json Fix | ✅ | 35 |
| **M4.1** | Knowledge Base (13 categories, 5 sources) | ✅ | 36 |
| **M4.2** | AI Tool System (7 tools) | 🔴 DEAD CODE | 42 |
| **M4.3** | D.O.R.A. AI Copilot (streaming, context) | ✅ | 39 |
| **M4.5** | AI Cost Tracking (token/latency/cost) | ✅ | 44 |
| **M5.1** | Song Database (8-stage workflow) | ✅ | 37 |
| **M5.2** | Rehearsal Mode | ✅ | 40 |
| **M5.3** | Concert Mode / Live OS (mobile-first) | 🟡 Merch neprepojený | 44 |
| **M5.4** | Setlist model + Management UI | ✅ | 40 + 43 |
| **M6.1** | Fan 360° (extended Subscriber) | ✅ | 41 |
| **M6.3** | Analytics Dashboard (6 KPI categories) | ✅ | 41 |
| **M6.4** | Marketing Intelligence (Market Report) | ✅ | 43 |
| **M7.3** | Finance OS (GigFinance) | ✅ | 43 |
| **M7.4** | Merchandise OS (Products + Orders) | ✅ | 45 |
| **M7.5** | Predictive Analytics (5 predictions) | ✅ | 45 |

**Zhrnutie:** 35 míľnikov implementovaných, z toho **3 kritické nedokonalosti** (M0.8, M3.1 UI, M4.2 dead code) a **1 parciálne** (M5.3 merch integration).

---

## 13. CHÝBAJÚCE FEATURES Z AUDIT DOKUMENTU

Z `DORA-IMPLEMENTATION-GAP-ANALYSIS.md` sekcia 3.4 (Admin UX) a 3.5 (AI):

### 13.1 Admin UX (§3.4)
| Item | Status |
|------|--------|
| Sidebar + groupovanie | ✅ Done (M1.1) |
| Command palette ⌘K | ✅ Done (M1.2) |
| Global cross-entity search | ❌ Chýba — command palette vyhľadáva iba v názvoch akcií |
| Empty states (konzistentné) | 🟡 11/22 tabov done |
| Error states (retry + message) | 🟡 11/22 tabov done |
| Mobile drawer | ✅ Done (M1.1) |
| Dashboard „Čo urobiť teraz?" | ✅ Done (M1.3) |
| Admin user mgmt (CRUD + roles) | ❌ **Chýba** |
| Activity feed sidebar | ❌ **Chýba** |

### 13.2 AI (§3.5)
| Item | Status |
|------|--------|
| Provider abstraction | ✅ Done (M0.7) |
| RBAC pre agentov (Permission model) | 🔴 **Tools majú permissions, ale nič ich neoveruje** |
| Human-in-the-loop (Approval queue) | 🔴 **Iba inquiryAgent, bez UI** |
| Tool-calling | 🔴 **Dead code (M4.2)** |
| Prompt injection | ✅ Done (M0.9), okrem copilot route |
| Knowledge base (source/verified/confidence) | ✅ Done (M4.1) |
| Brand guardian (fact check + brand voice) | ❌ **Chýba** |
| AI cost tracking | ✅ Done (M4.5) |
| System prompts editovateľné z admina | ❌ **Hardcoded v ai.ts** |
| Agent memory (RAG) | ❌ **Chýba** |

### 13.3 Ďalšie z audit dokumentu
- **Booking pipeline 14 statusov** — aktuálne 8 (M2.1 explicitly zoskupené; chýba `post_event`, `invoice_sent`, `paid`).
- **Booking Score explainable** — ✅ M2.4 (5 faktors).
- **Campaign UI** — ✅ M1.5.
- **FanSegment UI** — ✅ M1.5 (campaigns-tab sub-tab).
- **Fan 360°** — ✅ M6.1 (extended Subscriber).
- **Finance** — ✅ M7.3 (GigFinance), ale chýba settlement/accounting (M7.4 v roadmape — Merch nahrádza).
- **Content calendar** — ❌ Chýba.
- **Versioning** — ✅ ContentItem má `version` pole (ale bez UI).
- **i18n** — ❌ Slovenčina hardcoded (okrem hreflang metadat).

---

## 14. UI/UX PROBLÉMY

### 14.1 Kritické
1. **`userEmail` vždy null** (`app/admin/page.tsx:31`) — sidebar footer nikdy nezobrazí email admina.
2. **ContentItem bez admin tabu** — M3.1 API + model sú ready, ale admin ich nevidí/používa.
3. **AI agent output nikde nepovrchuje** — `contentAgent` generuje blog/FB/IG/newsletter, ale output je iba v `AutomationLog.output` JSON. Admin musí listovať DB.
4. **Žiadny approval workflow UI** — inquiryAgent ukladá pending review, ale admin nemá surface na schvaľovanie.
5. **taskAgent auto-create** — porušuje M0.8, vytvára Task bez schválenia.

### 14.2 Vysoké
6. **Concert Mode merch hardcoded** — ceny a produkty niesú prepojené s MerchProduct tabom.
7. **11/22 tabov bez EmptyState/ErrorState** — crm, inquiries, tasks, gigs, media, subscribers, seo, automations, ai, content, settings.
8. **`useState(() => { ... })` anti-pattern** v `ai-tab.tsx:63` (AltTextTool) — používa `useState` lazy initializer ako side-effect runner. React Strict Mode ho môže zavolať dvakrát, a lint ho bude warnovať. Mal by byť `useEffect`.
9. **Inline AI panel v content-tab** — môže vygenerovať nekonečný loading ak AI zlyhá bez catch (len `setLoading(false)` v `finally`).
10. **Copilot bez markdown renderingu** — dlhé AI odpovede s odrážkami budú nečitateľné ako plain text.
11. **Copilot bez history persistence** — refresh vymaže konverzáciu.
12. **`userId: "admin"` hardcoded v copilot route** — nemeriame skutočnú admin identitu pre usage tracking.

### 14.3 Stredné
13. **Edit button v knowledge-tab používa `Plus` rotate-45** — neintuitívne, mal by byť `Pencil`.
14. **„Uložiť stav" button v Concert Mode** je zbytočný — state sa auto-persistuje.
15. **`otherCost: -(cashCollected)` hack** v concert-mode POST — merch príjem by mal byť samostatné pole.
16. **AdminShell simulácia ⌘K cez `window.dispatchEvent(KeyboardEvent)`** — lepšie by bol priamy callback.
17. **Concert Mode sticky header `top-0 z-20`** sa môže prekrývať s admin mobile top barom.
18. **Count badge chýba** na Urgentné úlohy, Aktívne bookingy, Active campaigns — je iba na 4 taboch (inquiries, gigs, media, subscribers).
19. **Concert Mode bez Pause pri ďalšej skladbe** — `nextSong()` nerestartne `isPlaying`, môže zviesť časovač.
20. **BookingTab nemá pagination** — všetky bookingy sa načítajú naraz (môže byť pomalé pri >100 bookingoch).

### 14.4 Nízke
21. **Toast na `confirm()`** — bookings-tab používa `confirm("Zmazať booking?")` namiesto `AlertDialog` komponentu.
22. **Keyboard shortcuts** — iba `useKeyboardShortcuts` hook v media-tab. Admin-wide shortcuts (g=dash, i=inquiries, b=booking) chýbajú.
23. **Predictive analytics rule-based** — nie skutočný ML model (GAP analysis §3.5 „AI-driven" — sklamlivé).
24. **`generateVariants` vracia 1+ variánt** — fallback `result.text` ak AI nepoužije `===VARIANT===` separator (lines 247-248).

---

## 15. AI SLOT VAROVANIA — DEAD CODE & NEZAČLENENÉ KOMPONENTY

### 15.1 Dead Code (nepoužívané súbory)

| Súbor | Dôvod | Akcia |
|-------|-------|-------|
| `src/lib/ai/tools.ts` | 0 importov v celom repozitári. 7 tools definovaných, žiadny agent/orchestrator/API ich nezavolá. | Buď pripojiť k orchestratoru cez AI SDK v7 `tools` param, alebo zmazať. |
| `src/components/AIChat.tsx` | 0 importov. Embeddable chat komponent pre @ai-sdk/react useChat. Nahradené AiCopilot.tsx. | Zmazať. |
| `src/hooks/useChat.ts` | Iba re-export `useChat` z `@ai-sdk/react`. Nikto neimportuje z `@/hooks/useChat`. | Zmazať. |

### 15.2 Nezačlenené komponenty

| Feature | Model | API | UI | Status |
|---------|-------|-----|----|----|
| Structured Content (M3.1) | ✅ ContentItem | ✅ /api/admin/content-items | ❌ Žiadny tab | Treba pridať tab do admin-shell + page.tsx + command palette |
| AI Tools (M4.2) | ✅ 7 tools v tools.ts | N/A | ❌ | Treba zapojiť do orchestratora + RBAC |
| ApprovalQueue (M0.8) | ❌ Neexistuje | ❌ | ❌ | Treba model + endpoint + UI tab |
| Admin User Management | ✅ AdminUser | ❌ Žiadny admin endpoint | ❌ Žiadny tab | GAP P2 item, stále chýba |
| AutomationLog viewer | ✅ AutomationLog | ✅ /api/admin/automations | 🟡 automations-tab je trigger UI, nie log viewer | Pridať log viewer sub-tab |
| Venue/Organization (M2.2) | ✅ Venue, Organization | ✅ /api/admin/venues, /api/admin/organizations | ❌ Žiadny samostatný tab | Povrchovať v crm-tab alebo gigs-tab |
| Email/Booking Agent | ✅ emailAgent, bookingAgent v orchestrator.ts | ✅ Volajú sa cez /api/admin/ai | 🟡 automations-tab používa custom inštrukcie, nie agenta | Zjednotiť |
| Agent memory / RAG | ❌ | ❌ | ❌ | GAP P3, nízk priorita |

### 15.3 Čiastočne zapojené
- **`isAIConfigured()`** — používa sa v `/api/admin/ai/suggestions/route.ts` (returns empty array ak nie je configured). ❌ Nepoužíva sa v `copilot/route.ts` (zlyhá 500 ak Groq API key chýba), ❌ nepoužíva sa v `market-report/route.ts` (zlyhá 500).
- **`trackStreamUsage` / `withUsageTracking`** — pozri §2.3, chýba v 4 AI endpointoch.
- **Copilot quick prompts** — hardcoded 4, nepripomínajú kontext (bližiaci sa gig, nové dopyty).

---

## 16. ZHRNUTIE & ODPORÚČANIA

### 16.1 Skóre
| Oblasť | Skóre | Poznámka |
|--------|-------|----------|
| Admin Shell | 8/10 | Solid, drobné bugy (userEmail, drawer overlap) |
| Command Palette | 9/10 | 26 akcií, keyboard shortcuts |
| Empty/Error States | 5/10 | Iba 50% adopcia |
| AI Provider Adapter | 9/10 | Clean interface, 3 providery |
| AI Tools Framework | 2/10 | Dead code |
| AI Usage Tracking | 8/10 | Dobré, ale 4 endpointy chýbajú |
| AI Copilot | 7/10 | Funkčný, bez markdown/history |
| AI Agents | 4/10 | Polovičatý HITL, žiadny RBAC |
| Knowledge Base | 8/10 | Dobrý model+UI, chýba brand guardian |
| Command Center Dashboard | 8/10 | Povrchuje urgent, AI návrhy, koncerty |
| Analytics | 8/10 | 6 KPI kategórií, market report |
| Predictive Analytics | 7/10 | Rule-based, nie ML |
| Booking OS | 8/10 | 8-stage kanban, explainable score |
| Content OS | 4/10 | M3.1 API bez UI, iba key/value |
| Merch OS | 8/10 | Plnohodnotné, bez Concert Mode integration |
| Music OS | 9/10 | Songs/Rehearsals/Setlists/Concert Mode |
| Concert Mode | 8/10 | Mobile-first, merch neprepojený |

**Celkové admin UX:** 7.5/10 (bol 6.5/10)
**Celková AI infraštruktúra:** 6/10 (bola 5/10)

### 16.2 TOP 5 ODPORÚČANÍ (priority order)

1. 🔴 **P0 — Zapojiť AI Tools do orchestratora.** Buď zavolať `getTool(name)` z `inquiryAgent` a `taskAgent`, alebo použiť AI SDK v7 `generateText({ tools, toolChoice })` pattern. Bez tohto je M4.2 dead code a RBAC nedá implementovať.

2. 🔴 **P0 — Dokončiť HITL pre taskAgent + vytvoriť ApprovalQueue.** `taskAgent` nesmie auto-create. Všetci agenti, čo zapisujú do DB, musia ukladať pending review. Pridať admin tab „Schválenia" s listom AutomationLog entries s `pendingAction` a akciami Approve/Reject + auto-create Contact/Booking/Task.

3. 🔴 **P0 — Pridať admin tab pre ContentItem (M3.1).** Prázdny slot v sidebare (pridať do `Obsah` groupu medzi CMS a Médiá), v `page.tsx` case, v command palette akciu. API + model už sú.

4. ⚠️ **P1 — Pripojiť Concert Mode merch counter k MerchProduct.** Namiesto `DEFAULT_MERCH` (4 fixné produkty) načítať aktívne MerchProducts z DB, pri „Ukončiť koncert" vytvoriť MerchOrder záznamy s `type: "event"` a decrement stock.

5. ⚠️ **P1 — Dokončiť EmptyState/ErrorState adopciu** vo zvyšných 11 taboch. Iba import + wrap existujúceho inline textu. ~30 minúť práce, ale obrovský UX gain.

### 16.3 Ďalšie P1
- Pripojiť `trackStreamUsage` do `ai/route.ts`, `ai/variants/route.ts`, `ai/seo-score/route.ts`, `bookings/[id]/rescore/route.ts`.
- Pridať `isAIConfigured()` guard do `copilot/route.ts` a `market-report/route.ts` — vrátiť user-friendly error namiesto 500.
- Fix `userEmail` bug v `app/admin/page.tsx` — buď lift email z AdminShell alebo používať AdminShell-own `email` state v sidebare.
- Sanitizovať `question` v copilot/route.ts (rovnako ako inquiryAgent).
- Pridať markdown rendering do AiCopilot (`react-markdown` už je v deps).

### 16.4 P2
- Admin User Management tab (CRUD adminov + roles).
- Activity feed sidebar (real-time AutomationLog stream).
- Brand Guardian agent — validuje AI output proti KnowledgeItem verified facts.
- Editovateľné system prompty z admina (GAP §3.5 P2).
- Concert Mode: pri „Ukončiť koncert" spustiť post-event checklist (recenzia, fotky upload, setlist archivácia, fanúšikovský email).
- Zmazať dead code: `AIChat.tsx`, `hooks/useChat.ts`, (eventually) `tools.ts` ak sa nezapojí.
- Cross-entity global search (vyhľadávanie v contacts + bookings + gigs + inquiries + songs naraz).
- BookingTab pagination + Urgentné úlohy badge.
- `confirm()` → `AlertDialog` v booking-tab.

---

## 17. ZÁVER

D.O.R.A. admin sa za posledných 14 dní (Tasks 32-45) transformoval z „collection of tabs" na **skutočný Band Operating System**. Pribudlo 16 nových Prisma modelov (z 13 na 29), 18 nových API endpointov (z 22 na ~40), 9 nových admin tabov (z 13 na 22), AI Copilot, Concert Mode, Merch OS, Predictive Analytics — to všetko s funkčným AI Cost Trackingom a (čiastočným) HITL.

Najväčšie riziká zostávajú v AI infraštruktúre: **M4.2 AI Tool System je dead code**, **M0.8 HITL je aplikovaný len na 1 z 5 agentov**, a **M3.1 ContentItem model+API neobsazuje admin UI**. Tieto tri sloty by mali byť vyriešené ako prvé — ostatné P1/P2 položky sú iteratívne vylepšenia.

**Auditor:** Explore sub-agent (read-only)
**Verdikt:** **Admin UX 7.5/10, AI infra 6/10** — pripravené na P1 fix iteration.

---

*Audit dokončený. Žiadne kódové zmeny neboli vykonané — audit bol read-only.*
