-- Customer portal accounts
ALTER TABLE "Customer"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- Payment provider records
ALTER TABLE "Payment"
ADD COLUMN "providerReference" TEXT,
ADD COLUMN "providerPayload" JSONB;

-- CMS content
CREATE TYPE "CmsStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "CmsContent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsContent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsContent_slug_key" ON "CmsContent"("slug");
CREATE INDEX "CmsContent_status_publishedAt_idx" ON "CmsContent"("status", "publishedAt");
CREATE INDEX "CmsContent_authorId_idx" ON "CmsContent"("authorId");
