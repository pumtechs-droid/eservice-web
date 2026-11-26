ALTER TABLE "AdminUser"
ADD COLUMN "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Customer"
ADD COLUMN "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT true;

UPDATE "AdminUser"
SET "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Customer"
SET "updatedAt" = CURRENT_TIMESTAMP;
