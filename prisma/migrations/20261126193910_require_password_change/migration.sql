ALTER TABLE "AdminUser"
ADD COLUMN "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Customer"
ADD COLUMN "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT true;
