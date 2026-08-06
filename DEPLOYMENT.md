# D.O.R.A. Band Website — Deployment Guide

Kompletný návod na nasadenie na Vercel.

## Prerekvizity

1. **GitHub účet** — kód musí byť v Git repozitári
2. **Vercel účet** — https://vercel.com (free tier stačí)
3. **Neon Postgres** — free tier na https://neon.tech (databáza)
4. **Vercel Blob** — pre file uploads (voliteľné, bez toho funguje lokálny fallback)

## Krok 1: Priprav databázu (Neon Postgres)

1. Choď na https://neon.tech a vytvor nový projekt
2. Skopíruj connection string (pooled recommended)
   - Formát: `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/dbname?sslmode=require`
3. Tento string budeš potrebovať ako `DATABASE_URL` v Vercel

## Krok 2: Nasaď na Vercel

1. Choď na https://vercel.com/new
2. Importuj GitHub repozitár
3. Vercel automaticky deteguje Next.js
4. **Framework Preset**: Next.js
5. **Build Command**: `next build` (už nastavené)
6. **Install Command**: `bun install` (už nastavené)

## Krok 3: Nastav Environment Variables

V Vercel Dashboard → Project → Settings → Environment Variables pridaj:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` (z Neon) | Production + Preview |
| `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` | Production |
| `BLOB_READ_WRITE_TOKEN` | (z Vercel Blob) | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Production |
| `ADMIN_EMAIL` | `admin@dora.band` | Production |
| `ADMIN_PASSWORD` | (zmeň pred nasadením!) | Production |

## Krok 4: Vytvor Vercel Blob Storage (pre file uploads)

1. V Vercel Dashboard → Storage → Create → Blob
2. Skopíruj `BLOB_READ_WRITE_TOKEN`
3. Pridaj ho do Environment Variables ( vyššie)

## Krok 5: Nainicializuj databázu

Po prvom nasadení spusti (lokálne alebo cez Vercel CLI):

```bash
# Nastav DATABASE_URL na Neon Postgres
export DATABASE_URL="postgresql://..."

# Push schema do databázy
bun run db:push

# Seed initial data (admin user, gigs, media)
bun run seed
```

Alebo cez Vercel CLI:
```bash
vercel env pull .env
bun run db:push
bun run seed
```

## Krok 6: Over nasadenie

- Otvor `https://your-project.vercel.app` — mala by sa zobraziť homepage
- Otvor `https://your-project.vercel.app/admin/login` — admin login
- Prihlás sa ako `admin@dora.band` / `dora2026` (zmeň po prvom prihlásení!)

## Lokálny vývoj

```bash
# 1. Nainštaluj závislosti
bun install

# 2. Push SQLite schema (pre lokálny dev)
bun run db:push:dev

# 3. Seed initial data
bun run seed

# 4. Spusti dev server
bun run dev
```

## Štruktúra projektu

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Homepage (14 sekcií)
│   ├── admin/              # Admin dashboard (8 tabov)
│   ├── archiv/             # Archív koncertov
│   ├── opengraph-image.tsx # Dynamický OG image
│   ├── sitemap.ts          # Dynamický sitemap
│   ├── robots.ts           # Dynamický robots.txt
│   ├── not-found.tsx       # 404 stránka
│   ├── error.tsx           # Error boundary
│   ├── loading.tsx         # Loading skeleton
│   └── api/                # API routes
│       ├── admin/          # Admin API (content, seo, ai, media, gigs, ...)
│       ├── auth/           # Auth (login, logout, session)
│       ├── booking/         # Booking form
│       ├── gigs/            # Public gigs
│       ├── media/           # Public media
│       ├── newsletter/     # Newsletter signup
│       └── hero-background/ # Hero slideshow images
├── components/
│   ├── admin/              # Admin tab komponenty
│   ├── sections/           # Landing page sekcie
│   └── site/               # Zdieľané UI (navbar, footer, slideshow, ...)
├── lib/
│   ├── auth.ts             # Session auth (HMAC cookie)
│   ├── band-data.ts        # Statické dáta o kapele
│   ├── content.ts          # CMS content layer
│   └── db.ts               # Prisma client
└── hooks/                  # React hooks
```

## Features

- **14 landing sekcií**: Hero (slideshow), About+Timeline, Members, Music+Video, Gallery+Search, Discography+Waveforms, Gigs+Modal, Setlist, Testimonials, Press Kit, FAQ, Social, Newsletter, Contact
- **Admin dashboard (13 tabov)**: Prehľad, Dopyty, Koncerty, CRM, Pipeline, Úlohy, AI Agenti, Médiá, Newsletter, Obsah (CMS), SEO, AI nástroje, Nastavenia
- **Site Settings**: Maintenance mode (s admin bypass), Live announcement banner (5 typov, dismissible), Section visibility toggles (14 sekcií)
- **AI nástroje**: Generovanie obsahu, Alt-text auto-gen (VLM), SEO audit, Keyword research
- **CMS**: 60+ editovateľných content kľúčov (vrátane settings.*), per-path SEO meta
- **Media management**: Sharp optimalizácia, drag-and-drop reordering, bulk actions, hero background slideshow
- **SEO**: JSON-LD structured data, dynamic sitemap/robots, OG image, meta tags
- **Accessibility**: Skip-to-content, focus-visible, reduced-motion, alt-text management
- **Error handling**: 404 page, error boundary, loading skeleton

## Local Development (SQLite)

Pre lokálny dev môžeš použiť SQLite namiesto PostgreSQL:

1. Nastav v `.env`:
   ```
   DATABASE_URL="file:/home/z/my-project/db/custom.db"
   ```

2. Push schému + vygeneruj klienta (používa `prisma/schema.sqlite.prisma`):
   ```bash
   bun run db:push:dev      # = prisma db push --schema=prisma/schema.sqlite.prisma
   bun run db:generate:dev  # = prisma generate --schema=prisma/schema.sqlite.prisma
   ```

3. Seed admin usera:
   ```bash
   bun run seed
   ```

**Dôležité:** Pred nasadením na Vercel sa uisti, že:
- `DATABASE_URL` na Verceli je `postgresql://...` (Neon)
- Štandardný `bun run db:push` (bez `:dev`) používa `schema.prisma` (PostgreSQL)

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM (PostgreSQL on Vercel, SQLite for local dev)
- Vercel AI SDK + Groq (LLM + VLM)
- @dnd-kit (drag-and-drop)
- sharp (image processing)
- @vercel/blob (file storage)
