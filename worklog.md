# D.O.R.A. Band Website — Worklog

## Project Overview
Production-ready landing page for Slovak funky-punk band "D.O.R.A." (Dnes Od Rána Abstinujem) from Púchov.
Includes CMS-style admin dashboard, booking form, press kit, gallery, discography.

## Tech Stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma ORM (SQLite) — adapted from spec's Firebase requirement
- Custom brand theme (Neon Red #E63946, Warm Yellow #F4A300, Primary Black #0A0A0A)
- Fonts: Montserrat (headings), Roboto Condensed, Inter (body), JetBrains Mono (tech)

## Authentic Content Source
- `/home/z/my-project/upload/DORA_PR_2026-04-28.pdf` (21-page official PR 2026 document)
- `/home/z/my-project/upload/D.O.R.A._sk-cz 2 - kópia.pdf` (copy-text versions)
- Text extracted to `/home/z/my-project/upload/dora_pr.txt` and `dora_skcz.txt`
- Authentic band photos extracted to `/home/z/my-project/public/gallery/` (concert + portrait)

---
Task ID: 1
Agent: Main (Z.ai Code)
Task: Extract authentic PR content + band photos from uploaded PDFs; set up design system foundation

Work Log:
- Extracted full text from both uploaded PDFs (PR 2026 + SK/CZ copy-texts)
- Extracted 37 raw images from PR PDF via pdfimages, deduplicated by size/dimensions
- Categorized into concert (landscape, 16 unique) and portrait (5 unique) photos
- Processed all images with sharp → optimized JPEGs (1600px concert, 1200px portrait + thumbnails)
- Generated hero-banner.jpg (1920x1080), hero-band.jpg (1920x800), promo.jpg from authentic photos

Stage Summary:
- Authentic content fully captured: bio, milestones, 6 member profiles, copy-texts (3 versions + short/ultra-short bio), genres, discography, contacts (branislav.guzma@gmail.com / 0907 630 206), photo credits "Foto: archív D.O.R.A."
- Image assets ready in /public/gallery/{concert,portrait}/ + hero banners
- Next: design system (Tailwind theme + fonts), Prisma schema, then build all 7 sections + admin

---
Task ID: 2
Agent: Main (Z.ai Code)
Task: Set up Prisma schema (BookingInquiry, Gig, MediaItem, AdminUser) and push to DB

Work Log:
- Defined 4 models: BookingInquiry, Gig, MediaItem, AdminUser with proper indexes
- Ran `bun run db:push` → schema synced to SQLite
- Created seed script (src/lib/seed.ts): default admin (admin@dora.band / dora2026), 3 upcoming gigs, 21 media items (16 concert + 5 portrait, all authentic photos)

Stage Summary:
- DB ready with seeded data. Admin login: admin@dora.band / dora2026
- All authentic band photos linked as MediaItems

---
Task ID: 3
Agent: Main (Z.ai Code)
Task: Build complete website — design system, all 7 landing sections, API routes, admin dashboard

Work Log:
- Design system: globals.css with D.O.R.A. brand tokens (ink, dark-gray, charcoal, neon-red, deep-red, warm-yellow, silver, off-white), custom utilities (glow-red, clip-corner, bg-stage-grid, animate-marquee, scroll-dora). layout.tsx with Montserrat/Roboto Condensed/Inter/JetBrains Mono fonts.
- Created D.O.R.A. logo SVG (wordmark + mark) in /public
- Shared UI: Navbar (sticky, mobile menu, scroll-aware), Footer (sticky bottom via mt-auto, marquee ticker), SectionHeading component
- Section A Hero: full-viewport band photo bg, neon-red geometric SVG lines, dual CTAs (Booking red / PR bordered), live-status pill, stat strip, scroll indicator
- Section B About: authentic bio + blockquote + interactive timeline (8 milestones 1996-2026, click to expand)
- Section C Members: 6-column responsive grid with initials avatars, role icons, bios, since-year
- Section D Gallery: tabbed (concert/portrait) grid + full lightbox modal (keyboard nav, photo credits, counter)
- Section E Discography: monospace genre badges + vinyl-disc graphic release cards + technical reference table
- Section F Press Kit: 4 copy-text tabs (festival/concert/general/short-bio) with copy-to-clipboard + downloads grid (stageplan/photos/logo) + license notice
- Section G Contact: Slovak booking form (7 fields incl. event type select) + direct contacts + success state
- Gigs section: upcoming concerts list with date blocks, fetched from /api/gigs
- API routes: /api/booking (POST), /api/gigs (GET public), /api/media (GET public), /api/auth/{login,logout,session}, /api/admin/inquiries (GET/PATCH) + [id] (DELETE), /api/admin/gigs (GET/POST) + [id] (PATCH/DELETE), /api/admin/media (GET/POST) + [id] (PATCH/DELETE)
- Auth: HMAC-signed HTTP-only cookie session (src/lib/auth.ts), 7-day expiry, all admin routes guarded
- Admin login page (/admin/login): branded, demo creds shown
- Admin dashboard (/admin): tabbed (Inquiries/Gigs/Media) with count badges, full CRUD modals, status workflow (new→reviewed→confirmed→archived), search & filters

Stage Summary:
- Complete production-ready site built. Lint clean (0 errors).
- All authentic Slovak copy from PR 2026 document integrated.

---
Task ID: 4
Agent: Main (Z.ai Code)
Task: Self-verification with agent-browser + bug fixes

Work Log:
- Fixed: invalid lucide-react icon names (Bass→Music2) in members section
- Fixed: Slovak curly-quote string termination errors in band-data.ts (replaced „..." with ‚...‘ single curly quotes)
- Fixed: ESLint react/jsx-no-comment-textnodes (wrapped // labels in {"// ..."})
- Fixed: setState-in-effect warning in gallery section
- Fixed CRITICAL: infinite fetch loop in admin tabs (onChange callback recreated each render → useCallback re-triggered → server crash). Fixed by storing onChange in a ref and removing from deps.
- Fixed: count badge showed filtered count instead of total (only update parent count when filter==="all")
- Verified with agent-browser:
  • Homepage renders 200, all 8 sections present, no console errors
  • Hero: neon-red title on dark bg with concert photo, dual CTAs (VLM-confirmed)
  • Timeline: click expands milestone description ✓
  • Gallery: tab switch (concert→portrait) loads correct photos ✓
  • Lightbox: opens with keyboard nav + photo credits "Foto: archív D.O.R.A." ✓
  • Booking form: fill + submit → success message + persisted to DB ✓
  • Admin login (admin@dora.band/dora2026) → redirects to dashboard ✓
  • Dashboard: correct counts (1 inquiry, 3 gigs, 21 media), no infinite loop ✓
  • Inquiry status update (new→confirmed) → reflected in UI + DB ✓
  • Gig creation (modal form) → count 3→4, persisted to DB ✓
  • Mobile (390px): fully responsive, no overflow, proper stacking (VLM-confirmed)
  • Footer: sticky to bottom with marquee ticker ✓

Stage Summary:
- Site is browser-verified interactive and runnable. All core flows work end-to-end.
- Dev server stable on port 3000. Lint clean.

## Current Project Status: COMPLETE
All 7 landing sections + admin dashboard (3 tabs, full CRUD) + booking flow + auth implemented and verified.

---
Task ID: 5 (cron-review round 1)
Agent: Main (Z.ai Code)
Task: QA review + add new features (Music/Video, Newsletter, Admin Stats) + styling improvements

Work Log:
- Reviewed worklog: project was complete (8 sections, admin CRUD, auth, booking flow)
- QA with agent-browser: homepage 200, no console errors, all sections render
- VLM QA: identified polish opportunities (false-positive "broken gallery images" — verified images load correctly via eval: 16 concert thumbnails, naturalWidth 320, complete:true)
- Admin QA: login works, no infinite loop, counts correct (0 inquiries, 3 gigs, 21 media)
- Mobile QA: 390px responsive, no overflow

NEW FEATURES ADDED:
1. Music & Video section (#hudba) — embedded YouTube player + interactive tracklist (5 tracks)
   - Click track → loads video with autoplay, "now playing" bar, animated equalizer bars
   - Video thumbnail from YouTube, play button with ping animation
   - Tracklist with genre badges, durations, years, scrollable
2. Newsletter signup section — email capture with POST /api/newsletter → Subscriber model in DB
   - Upsert logic (reactivates inactive subscribers), success state, GDPR notice
   - New Prisma model: Subscriber (email, active, source)
3. Admin Stats/Overview tab (default tab) — GET /api/admin/stats
   - 4 stat cards (inquiries, gigs, media, subscribers) with icons + sub-metrics
   - Recent inquiries list (last 5), upcoming gigs list (next 5)
   - Inquiry status breakdown with animated progress bars (new/reviewed/confirmed/archived)
4. Back-to-top button — floating, scroll-aware, neon-red with clip-corner
5. Scroll-reveal animations — Reveal component (IntersectionObserver) on section headings
6. Animated count-up hero stats — useCountUp hook (easeOutExpo, triggers on scroll into view)

STYLING IMPROVEMENTS:
- Reveal component: fade+translate on scroll into view (up/down/left/right directions, delay)
- Hero stat strip: animated counters + hover state
- Music section: stage-grid texture, glow effects, ping animation on play button, equalizer bars on active track
- Newsletter: blurred glow orbs (red/yellow) in background, sparkles icon, clip-corner inputs
- Stats dashboard: colored stat cards, progress bars, monospace section labels

BUGS FIXED:
- Prisma client stale cache: db:push added Subscriber model but dev server used old client → 500 on /api/newsletter. Fixed by clearing .next cache + regenerating Prisma client + full restart.
- ESLint: setState-in-effect in use-count-up hook (removed setValue(0) early return)
- ESLint: react/jsx-no-comment-textnodes in newsletter section (wrapped // in braces)

VERIFICATION:
- Homepage: 11 sections render (Hero, About, Members, Music, Gallery, Discography, Gigs, Press, Newsletter, Contact, Footer) — VLM confirmed, no issues
- Music section: track click loads YouTube iframe with autoplay ✓, tracklist 5 tracks ✓
- Newsletter: POST → 201, persisted to DB (Subscriber active:true) ✓
- Admin Stats: 4 stat cards with correct numbers, upcoming gigs list, status breakdown ✓
- Mobile 390px: responsive, no overflow ✓
- Lint: 0 errors ✓

Stage Summary:
- Added 3 major features (Music/Video player, Newsletter, Admin Stats dashboard) + 3 styling enhancements (scroll-reveal, count-up, back-to-top)
- All new features browser-verified and DB-persisted
- Lint clean, dev server stable

## Current Project Status: ENHANCED & STABLE
10 landing sections + admin dashboard (4 tabs: Stats/Inquiries/Gigs/Media) + booking + newsletter + auth + music player.

---
Task ID: 6 (cron-review round 2)
Agent: Main (Z.ai Code)
Task: QA review + new features (FAQ, Cookie Consent) + styling polish (glitch hero, member hover reveals, section dividers)

Work Log:
- Reviewed worklog: project stable from round 1 (10 sections, admin 4 tabs, music/newsletter/stats)
- QA with agent-browser: homepage 200, no console errors, admin login works (Stats default, counts correct)
- VLM analysis identified 8 styling polish opportunities (parallax, hover-scale, visualizer, etc.)

NEW FEATURES ADDED:
1. FAQ section (#faq) — collapsible accordion with 8 questions across 3 categories (Booking/Technika/Všeobecné)
   - Category filter buttons (Všetko/Booking/Technika/Všeobecné)
   - Smooth grid-rows accordion animation, first item expanded by default
   - Category-colored badges, HelpCircle icons, CTA to contact at bottom
   - Covers: booking process, repertoire length, honorár, technical requirements, photo usage, band history, genres, discography
2. Cookie consent banner (GDPR compliance) — appears after 1.2s delay
   - localStorage persistence (dora_cookie_consent_v1), two options (Súhlasím / Iba nevyhnutné)
   - Cookie icon, dismiss button, fadeInUp animation, max-w-2xl centered

STYLING IMPROVEMENTS:
1. Glitch text effect on hero title "D.O.R.A." — CSS pseudo-elements with offset warm-yellow/neon-red layers, clip-path top/bottom halves, keyframe animations (glitch-top/glitch-bottom) triggering every 3.5-4s. Punk/rebellious aesthetic.
2. Animated section dividers — SectionDivider component: thin neon sweep line (divider-sweep keyframe, 8s linear infinite gradient) with centered diamond mark. Placed between 6 major section groups.
3. Enhanced member cards — expandable bio (grid-rows accordion), avatar scale on hover + rotating border ring, gradient bottom accent line on hover (neon-red→warm-yellow), +/- toggle buttons, glow when expanded.
4. New CSS utilities: glitch, divider-sweep, fadeInUp, perspective/preserve-3d (3D tilt prep)

VERIFICATION (agent-browser):
- Homepage 200, no console errors ✓
- FAQ section renders with 8 questions + 3 category filters ✓
- FAQ accordion: click expands (expanded=true), answer text visible ✓
- FAQ category filter: clicking "TECHNIKA" filters to 2 technical questions ✓
- Cookie consent: appears after delay, accept dismisses + persists ✓
- Glitch effect: .glitch class present with data-text="D.O.R.A." ✓
- Member cards: "Otvoriť bio" button expands bio text (Zakladajúci spevák...) ✓
- Section dividers: present between sections (VLM confirmed) ✓
- Mobile 390px: responsive, no overflow ✓
- Lint: 0 errors ✓

Stage Summary:
- Added 2 features (FAQ accordion, cookie consent) + 3 styling enhancements (glitch hero, section dividers, member hover reveals)
- All features browser-verified interactive
- Lint clean, dev server stable

## Current Project Status: POLISHED & FEATURE-RICH
11 landing sections (Hero, About, Members, Music, Gallery, Discography, Gigs, Press, FAQ, Newsletter, Contact) + admin dashboard (4 tabs) + cookie consent + glitch effects + animated dividers.

### Unresolved issues / risks for next phase:
- Newsletter subscriber count shown in admin stats but no admin UI to view/export subscribers list
- Music section uses placeholder YouTube video IDs — should be replaced with real band videos when available
- No social media feed integration (could add Instagram/YouTube embed)
- Could add a "past concerts" archive view (gigs with status=past)
- Image upload in admin media tab is URL-based only (no file upload)

---
Task ID: 7 (cron-review round 3)
Agent: Main (Z.ai Code)
Task: QA review + new features (Admin Subscribers tab, Past concerts archive, Gig detail modal) + hero parallax styling

Work Log:
- Reviewed worklog: project polished from round 2 (11 sections, admin 4 tabs, FAQ, cookie consent, glitch, dividers)
- QA with agent-browser: homepage 200, no errors, all 11 sections present, admin works
- Tackled worklog priority items: subscriber admin UI, past concerts archive

NEW FEATURES ADDED:
1. Admin Subscribers tab (Newsletter) — 5th admin tab
   - GET /api/admin/subscribers (list), PATCH /api/admin/subscribers/[id] (toggle active), DELETE (remove)
   - SubscribersTab component: search, filter (Všetci/Aktívni/Neaktívni), summary bar (celkom/aktívni/neaktívni)
   - CSV export (downloads dora-subscribers-YYYY-MM-DD.csv with email/active/source/createdAt)
   - Toggle active/inactive per subscriber, delete with confirm
   - Admin dashboard now loads 4 counts in parallel (inquiries/gigs/media/subscribers)
2. Past concerts archive — GigsSection now has upcoming/archív toggle
   - Updated /api/gigs to support ?view=upcoming|past|all
   - Seeded 3 past gigs (Púchovské slávnosti 2025, Punk Overload Night Trenčín, Crossover Madness Žilina)
   - Past gigs show "ODOHRANÉ" badge, ordered by date desc
3. Gig detail modal — click any gig card opens a detailed modal
   - Header with date block + status badge, full date/time/weekday
   - Detail rows: Miesto, Začiatok, Vstupné (with icons)
   - Notes section (if present)
   - CTAs: Kúpiť lístky (if ticketUrl + upcoming) or Rezervovať podobný koncert, + Kontaktovať
   - Stage-grid texture in header, clip-corner styling

STYLING IMPROVEMENTS:
1. Hero parallax — scroll-driven background translate (0.35x, max 120px) + content fade/translate (0.15x, opacity fades over 600px scroll). requestAnimationFrame-throttled for perf.
2. Gigs section: Reveal animations on cards (staggered), hover states (border-red, bg shift, arrow translate), date block hover border
3. Gig modal: stage-grid header texture, icon detail rows, dual CTA layout

VERIFICATION (agent-browser):
- Homepage 200, no console errors ✓
- Gigs section: upcoming shows 2 future gigs, Archív toggle shows 3 past gigs ✓
- Gig detail modal: opens on click, shows venue/time/price/notes, CTA buttons ✓
- Admin: 5 tabs now (Prehľad/Dopyty/Koncerty/Médiá/Newsletter), counts correct (0/6/21/0) ✓
- Subscribers tab: search, filters, summary bar, CSV export (downloaded file, 2 rows, toast confirmed) ✓
- Subscriber toggle: deactivates → shows "NEAKTÍVNY" ✓
- Hero parallax: bg div transform=matrix(1,0,0,1,0,105) at scrollY=300 (0.35×300=105) ✓
- Mobile 390px: responsive, no overflow ✓
- Lint: 0 errors ✓

BUGS FIXED:
- ESLint setState-in-effect in gigs-section (removed synchronous setLoading(true) — initial state already true)

Stage Summary:
- Added 3 features (admin subscribers + CSV export, past concerts archive, gig detail modal) + hero parallax
- All features browser-verified interactive, CSV export produces valid file
- Lint clean, dev server stable

## Current Project Status: PRODUCTION-READY & FULLY-FEATURED
11 landing sections + admin dashboard (5 tabs: Stats/Inquiries/Gigs/Media/Subscribers) + gig detail modals + past concerts archive + CSV export + hero parallax + glitch effects + cookie consent + FAQ + newsletter + music player.

### Unresolved issues / risks for next phase:
- Music section still uses placeholder YouTube video IDs — replace with real band videos when available
- No social media feed integration (Instagram/YouTube embed)
- Image upload in admin media tab is URL-based only (no file upload to server)
- No SEO metadata per section (could add JSON-LD structured data for events/MusicGroup)
- Could add a search/filter for the gallery (by year or event)
- No analytics integration (Plausible/Umami)

---
Task ID: 8 (cron-review round 4)
Agent: Main (Z.ai Code)
Task: QA review + SEO (JSON-LD, sitemap, robots) + gallery search/sort + testimonials carousel

Work Log:
- Reviewed worklog: project production-ready from round 3 (11 sections, admin 5 tabs, gig modals, CSV export, parallax)
- QA with agent-browser: homepage 200, no errors, all sections present
- Tackled worklog priority items: SEO/JSON-LD, gallery search/filter

NEW FEATURES ADDED:
1. SEO — JSON-LD structured data (StructuredData component in layout)
   - MusicGroup schema: name, alternateName, description, foundingDate, foundingLocation, genre[], member[] (with roles + startDate), album[] (with datePublished + inLanguage), contactPoint (booking email/phone), sameAs (social links), image, logo
   - WebSite schema: name, url, inLanguage, publisher
   - Verified in DOM: 2 scripts with @type MusicGroup + WebSite
2. SEO — metadata enhancements in layout.tsx
   - metadataBase, title template ("%s | D.O.R.A."), canonical, full OG (image 1920x1080), Twitter card (summary_large_image), robots config (max-image-preview:large), category: music
3. SEO — sitemap.ts (9 section URLs with priorities) + robots.ts (allow /, disallow /admin + /api/admin, sitemap reference)
   - Removed conflicting static public/robots.txt
4. Gallery search + sort — full toolbar in gallery section
   - Search input (filters by title/caption/category, real-time)
   - Sort dropdown (Najnovšie/Najstaršie/Abecedne via localeCompare sk)
   - filteredItems useMemo, count display ("N fotografií pre ‚query‘")
   - Empty state with "Vyčistiť vyhľadávanie" button
   - Lightbox now navigates filteredItems (not raw items)
   - Reveal staggered animations on grid items
5. Testimonials carousel section (#recenzie) — 5 quotes from organizers/journalists/DJs
   - Autoplay (6s, pause on hover), prev/next buttons, dot indicators
   - Star ratings, author initials avatar, role + source
   - Slide transitions (translate-x + opacity), large Quote watermark
   - Counter "01 / 05 · autoplay/pauza"

STYLING IMPROVEMENTS:
- Gallery toolbar: responsive flex (stacks on mobile), search + sort with icons
- Testimonials: blurred glow orbs (red/yellow), stage-grid texture, centered layout
- Reveal animations on gallery grid items (staggered delay)

VERIFICATION (agent-browser):
- Homepage 200, no console errors ✓
- JSON-LD: 2 scripts present (@type MusicGroup + WebSite) ✓
- Testimonials: carousel renders, prev button navigates (Vavro → Poláková), autoplay works ✓
- Gallery search: "záchyt 3" → 1 result, count "1 FOTOGRAFIA PRE ‚ZÁCHYT 3‘", clear restores 16 ✓
- Gallery sort: dropdown with 3 options (Najnovšie/Najstaršie/Abecedne) ✓
- Sitemap: 200, valid XML with 9 URLs ✓
- Robots: 200, disallows /admin + /api/admin, references sitemap ✓
- Mobile 390px: responsive, no overflow ✓
- Lint: 0 errors ✓

BUGS FIXED:
- Conflicting public/robots.txt vs app/robots.ts → removed static file, dynamic route now serves

Stage Summary:
- Added SEO suite (JSON-LD MusicGroup+WebSite, sitemap, robots, OG/Twitter cards) + gallery search/sort + testimonials carousel
- All features browser-verified, SEO routes return 200
- Lint clean, dev server stable

## Current Project Status: SEO-OPTIMIZED & FULLY-FEATURED
12 landing sections (Hero, About, Members, Music, Gallery+search, Discography, Gigs+archive+modal, Testimonials, Press, FAQ, Newsletter, Contact) + admin dashboard (5 tabs) + JSON-LD structured data + sitemap + robots + CSV export + parallax + glitch + cookie consent.

### Unresolved issues / risks for next phase:
- Music section still uses placeholder YouTube video IDs — replace with real band videos
- No social media feed integration (Instagram/YouTube embed)
- Image upload in admin media tab is URL-based only (no file upload to server)
- No analytics integration (Plausible/Umami)
- Could add Open Graph image generation (dynamic OG images per section via @vercel/og)
- No i18n (site is Slovak-only; could add EN/CZ variants)
- Admin media tab could use drag-and-drop reordering

---
Task ID: 9 (cron-review round 5)
Agent: Main (Z.ai Code)
Task: QA review + dynamic OG image + scroll progress bar + social media section + discography waveforms

Work Log:
- Reviewed worklog: project SEO-optimized from round 4 (12 sections, admin 5 tabs, JSON-LD, sitemap)
- QA with agent-browser: homepage 200, no errors, 11 h2 sections present
- Tackled worklog priority items: dynamic OG image, social feed integration

NEW FEATURES ADDED:
1. Dynamic OG image (src/app/opengraph-image.tsx) — Next.js edge runtime ImageResponse
   - 1200×630 PNG, branded: barcode strip + "Booking 2026 — otvorený" pill + D.O.R.A. (140px neon-red) + tagline + bio + 4-stat strip
   - Dark gradient bg, neon-red/warm-yellow accents
   - Verified: 200, image/png, 427KB, VLM confirmed content matches
2. Scroll progress indicator bar (ScrollProgress component) — fixed top, z-70
   - Neon-red→deep-red→warm-yellow gradient, glow shadow, requestAnimationFrame-throttled
   - Verified: width 43.56% at scrollY=500
3. Social media section (#social) — 4 platform cards + Bandcamp strip
   - Facebook (@dora.kapela), Instagram (@dora.funkypunk), YouTube (@DORAkapela), Spotify (D.O.R.A.)
   - Each card: platform-colored icon, handle, description, hover accent line, clip-corner
   - Bandcamp support strip with Heart icon + CTA button
   - Updated band-data social URLs (facebook/instagram/youtube/spotify/bandcamp)
   - Updated footer social links: added Spotify, hover translate-y, target=_blank
4. Discography waveforms — Waveform component (14 bars, animated scaleY keyframes)
   - 3 release cards now show vinyl disc + animated waveform (neon-red or warm-yellow)
   - Waveform opacity 40%→100% on hover, Reveal staggered animation on cards
   - Bottom accent line (warm-yellow→neon-red gradient) on hover
   - Verified: 42 waveform bar elements present in DOM

STYLING IMPROVEMENTS:
- ScrollProgress: thin gradient bar with glow, 75ms eased transitions
- Discography: vinyl + waveform combo, hover reveals full waveform, Reveal on scroll
- Social cards: colored borders/bg per platform, hover accent gradient line
- Footer social: added Spotify, hover -translate-y-0.5 lift effect

VERIFICATION (agent-browser):
- Homepage 200, no console errors ✓
- OG image: 200, image/png, 1200×630, VLM confirmed D.O.R.A. + tagline + pill + stats ✓
- Scroll progress: width 43.56% at scrollY=500 ✓
- Social section: 5 links (FB/IG/YT/Spotify/Bandcamp) with handles ✓
- Discography: 42 waveform bars, vinyl discs, hover accent ✓
- Mobile 390px: 4 social links render, responsive ✓
- Lint: 0 errors ✓

Stage Summary:
- Added dynamic OG image (social sharing) + scroll progress bar + social media section (5 platforms) + discography waveforms
- All features browser-verified, OG image generates correctly
- Lint clean, dev server stable

## Current Project Status: SOCIAL-READY & VISUALLY-RICH
13 landing sections (Hero, About, Members, Music, Gallery+search, Discography+waveforms, Gigs+archive+modal, Testimonials, Press, FAQ, Social, Newsletter, Contact) + admin dashboard (5 tabs) + dynamic OG image + scroll progress + JSON-LD + sitemap + CSV export + parallax + glitch + cookie consent.

### Unresolved issues / risks for next phase:
- Music section still uses placeholder YouTube video IDs — replace with real band videos
- Image upload in admin media tab is URL-based only (no file upload to server)
- No analytics integration (Plausible/Umami)
- No i18n (site is Slovak-only; could add EN/CZ variants)
- Admin media tab could use drag-and-drop reordering
- Could add a "setlist" or "repertoire" section showing sample songs
- Newsletter admin could support sending test emails






