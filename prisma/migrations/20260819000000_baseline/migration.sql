-- D.O.R.A. Band OS — Baseline Migration
-- Dátum: 2026-08-19
-- Popis: Initial schema snapshot pre databázu (25 modelov)
--
-- Tento súbor slúži ako referenčný baseline pre future migrations.
-- Pre aplikáciu na existujúcu databázu použi:
--   prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
--
-- Pre nové nasadenie:
--   prisma migrate deploy (aplikuje všetky migrácie v prisma/migrations/)
--
-- POZNÁMKA: Tento baseline je dokumentačný. Aktuálna schéma sa synchronizuje
-- cez `prisma db push` (dev) alebo `prisma migrate dev` (produkcia).

-- =====================================================
-- MODELY (25)
-- =====================================================

-- BookingInquiry: verejné booking dopyty z webu
CREATE TABLE IF NOT EXISTS "BookingInquiry" (
    "id" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "eventLocation" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookingInquiry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BookingInquiry_status_idx" ON "BookingInquiry"("status");
CREATE INDEX IF NOT EXISTS "BookingInquiry_createdAt_idx" ON "BookingInquiry"("createdAt");

-- Gig: koncerty
CREATE TABLE IF NOT EXISTS "Gig" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'SK',
    "ticketUrl" TEXT,
    "ticketPrice" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "notes" TEXT,
    "venueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Gig_date_idx" ON "Gig"("date");
CREATE INDEX IF NOT EXISTS "Gig_status_idx" ON "Gig"("status");
CREATE INDEX IF NOT EXISTS "Gig_venueId_idx" ON "Gig"("venueId");

-- A.7: Setlist FK relation
CREATE TABLE IF NOT EXISTS "Setlist" (
    "id" TEXT NOT NULL,
    "gigId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Setlist',
    "items" TEXT NOT NULL DEFAULT '[]',
    "totalDuration" TEXT,
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setlist_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Setlist_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Setlist_gigId_idx" ON "Setlist"("gigId");
CREATE INDEX IF NOT EXISTS "Setlist_status_idx" ON "Setlist"("status");

-- A.7: MerchOrder FK relation to Gig
CREATE TABLE IF NOT EXISTS "MerchOrder" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'event',
    "gigId" TEXT,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "buyerName" TEXT,
    "buyerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "paymentMethod" TEXT DEFAULT 'cash',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MerchOrder_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MerchOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MerchProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MerchOrder_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "MerchOrder_gigId_idx" ON "MerchOrder"("gigId");
CREATE INDEX IF NOT EXISTS "MerchOrder_productId_idx" ON "MerchOrder"("productId");
CREATE INDEX IF NOT EXISTS "MerchOrder_status_idx" ON "MerchOrder"("status");
CREATE INDEX IF NOT EXISTS "MerchOrder_type_idx" ON "MerchOrder"("type");
CREATE INDEX IF NOT EXISTS "MerchOrder_createdAt_idx" ON "MerchOrder"("createdAt");

-- Poznámka: Tento baseline je ilustračný. Plná schéma (všetkých 25 modelov)
-- je generovaná cez `prisma migrate diff --from-empty --to-schema-datamodel
-- prisma/schema.prisma --script > prisma/migrations/20260819000000_baseline/migration.sql`
