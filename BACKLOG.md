# D.O.R. BACKLOG

**Zdroj:** Ideas a features mimo aktuálny scope, zaznamenané pre budúce iterácie.
**Pravidlo:** Nespúšťať implementáciu bez schválenia a zaradenia do roadmapy.

---

## P1 — High Priority Ideas

### B-001: Real-time Collaboration na Setlists
- **Popis:** Viacerí členovia kapely môžu súčasne editovať setlist (WebSocket)
- **Technológia:** Socket.io mini-service (ako Concert Mode)
- **Dopyt:** Concert Mode → Setlist editácia v reálnom čase
- **Status:** Idea

### B-002: AI Voice Memo Transcription
- **Popis:** Nahrávka hlasového memo → AI transkripcia → Task/Note
- **Technológia:** ASR skill (z-ai-web-dev-sdk)
- **Dopyt:** Rýchle zachytenie nápadov po skúške
- **Status:** Idea

### B-003: Spotify Integration
- **Popis:** Prepojenie s Spotify API pre reálne stream counts, playlisty
- **Technológia:** Spotify Web API
- **Dopyt:** Analytics dashboard s reálnymi stream dátami
- **Status:** Idea — vyžaduje Spotify Developer Account

### B-004: Email Campaign Automation
- **Popis:** Plnohodnotný email marketing (segmentácia, A/B testing, scheduling)
- **Technológia:** Resend / SendGrid / AWS SES
- **Dopyt:** Newsletter kampane s open/click tracking
- **Status:** Idea — vyžaduje SMTP/Email API kľúč

---

## P2 — Medium Priority Ideas

### B-005: Calendar Integration (Google/Outlook)
- **Popis:** Export gigov do Google Calendar / iCal feed
- **Technológia:** Google Calendar API, iCal generation
- **Dopyt:** Členovia kapely vidia koncerty v osobnom kalendári
- **Status:** Idea

### B-006: Contract Generation
- **Popis:** PDF contract generácia z Booking entity
- **Technológia:** pdf skill (ReportLab)
- **Dopyt:** Automatické zmluvy pre promotérov
- **Status:** Idea

### B-007: Expense Tracking
- **Popis:** Rozšírenie GigFinance o receipts, faktúry, mileage
- **Technológia:** Vercel Blob upload + OCR
- **Dopyt:** Daňové účely, profitabilita analýza
- **Status:** Idea

### B-008: Social Media Auto-Posting
- **Popis:** Auto-post na Facebook/Instagram keď sa gig vytvorí/potvrdí
- **Technológia:** Facebook Graph API, Instagram Basic Display
- **Dopyt:** Marketing automatizácia
- **Status:** Idea — vyžaduje Social API tokeny

### B-009: Band Member Portal
- **Popis:** Samostatný login pre členov kapely (nie admin)
- **Technológia:** NextAuth.js s role-based routing
- **Dopyt:** Členovia vidia iba svoje koncerty, skladby, skúšky
- **Status:** Idea

### B-010: Merch Pre-order System
- **Popis:** Fanúšikovia môžu pre-order merch s platbou
- **Technológia:** Stripe / PayPal integration
- **Dopyt:** Online merch predaj (nielen event)
- **Status:** Idea — vyžaduje Payment processor

---

## P3 — Low Priority / Future

### B-011: Mobile App (React Native / Expo)
- **Popis:** Natívna mobilná appka pre Concert Mode
- **Dopyt:** Lepší live experience offline
- **Status:** Future — až sa Concert Mode osvedčí na webe

### B-012: AI Setlist Optimizer
- **Popis:** AI navrhne optimálny setlist na základe publika, času, energie
- **Technológia:** LLM s historickými dátami
- **Dopyt:** Concert Mode → "Navrhni setlist"
- **Status:** Idea

### B-013: Fan Engagement Scoring
- **Popis:** AI score pre fanúšikov na základe engagement ( koncerty, merch, social)
- **Technológia:** Custom scoring algorithm
- **Dopyt:** Identifikácia superfanúšikov pre VIP ponuky
- **Status:** Idea

### B-014: Venue Database Integration
- **Popis:** Prepojenie s externou venue DB (Songkick, Bandsintown)
- **Technológia:** Externé API
- **Dopyt:** Auto-fill venue info pri booking
- **Status:** Idea

### B-015: Multilingual Content (EN)
- **Popis:** Plná anglická verzia webu pre medzinárodné booking
- **Technológia:** next-intl (už nainštalovaný)
- **Dopyt:** Bookeri zo zahraničia
- **Status:** Idea — hreflang už pripravený (sk-SK + en)

---

## Technical Debt

### TD-001: Client → Server Components Migration
- **Popis:** 14 sections komponentov je "use client"
- **Dopyt:** Performance (LCP, hydration)
- **Status:** Known limitation (Fáza C-7)

### TD-002: Prisma Migrations Setup
- **Popis:** Iba db push, žiadne verziované migrácie
- **Dopyt:** Produkčné nasadenie bez straty dát
- **Status:** Baseline vytvorený (Fáza A-6), plná migrácia TODO

### TD-003: 11 starších admin tabov bez EmptyState/ErrorState
- **Popis:** crm, inquiries, tasks, gigs, media, subscribers, seo, automations, ai, content, settings
- **Dopyt:** Konzistentný UX
- **Status:** Known limitation (Fáza B-7)

### TD-004: 35 string-encoded enums bez DB validácie
- **Popis:** Status, type polia ako String bez enum constraint
- **Dopyt:** Data integrity
- **Status:** Known limitation (AUDIT-2)

### TD-005: Stateless Session — nemožno zneplatniť server-side
- **Popis:** HMAC cookie, žiadny Session model v DB
- **Dopyt:** Security (únik session)
- **Status:** Known limitation (AUDIT-1)

---

## Záverečné poznámky

- Každá idea musí byť schválená pred implementáciou
- Priority sa môžu meniť podľa business potrieb
- Technical debt by mal byt riešený pred novými features
- Backlog je živý dokument — pridávajte ideas kedykoľvek
