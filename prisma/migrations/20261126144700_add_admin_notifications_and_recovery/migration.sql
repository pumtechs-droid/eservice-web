CREATE TYPE "SystemNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT');

ALTER TABLE "AdminUser"
ADD COLUMN "passwordResetTokenHash" TEXT,
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN "passwordResetRequestedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "AdminUser_passwordResetTokenHash_key"
ON "AdminUser"("passwordResetTokenHash");

CREATE TABLE "SystemNotification" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "dedupeKey" TEXT,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "status" "SystemNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemNotification_dedupeKey_key"
ON "SystemNotification"("dedupeKey");
CREATE INDEX "SystemNotification_status_availableAt_idx"
ON "SystemNotification"("status", "availableAt");
CREATE INDEX "SystemNotification_createdAt_idx"
ON "SystemNotification"("createdAt");
