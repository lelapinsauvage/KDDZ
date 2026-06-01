-- Preserve legacy notification delivery/read state and send logs.

ALTER TABLE "alarms"
    ADD COLUMN "legacyData" JSONB;

ALTER TABLE "push_tokens"
    ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "legacyData" JSONB;

CREATE TABLE "notification_receipts" (
    "id" UUID NOT NULL,
    "sourceTable" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "legacyNotificationId" INTEGER NOT NULL,
    "legacyRecipientId" INTEGER NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" UUID,
    "alarmId" UUID,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legacy_notification_logs" (
    "id" UUID NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "childId" UUID,
    "legacyChildId" INTEGER,
    "name" TEXT,
    "status" INTEGER,
    "expiryDate" TEXT,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legacy_notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_receipts_sourceTable_legacyNotificationId_legacyRecipientId_recipientType_key"
    ON "notification_receipts"("sourceTable", "legacyNotificationId", "legacyRecipientId", "recipientType");

CREATE INDEX "notification_receipts_alarmId_idx"
    ON "notification_receipts"("alarmId");

CREATE INDEX "notification_receipts_recipientId_recipientType_idx"
    ON "notification_receipts"("recipientId", "recipientType");

CREATE INDEX "notification_receipts_category_idx"
    ON "notification_receipts"("category");

CREATE INDEX "notification_receipts_isRead_idx"
    ON "notification_receipts"("isRead");

CREATE UNIQUE INDEX "legacy_notification_logs_legacyId_key"
    ON "legacy_notification_logs"("legacyId");

CREATE INDEX "legacy_notification_logs_childId_idx"
    ON "legacy_notification_logs"("childId");

CREATE INDEX "legacy_notification_logs_status_idx"
    ON "legacy_notification_logs"("status");

CREATE INDEX "legacy_notification_logs_createdAt_idx"
    ON "legacy_notification_logs"("createdAt");

CREATE INDEX "push_tokens_isActive_idx"
    ON "push_tokens"("isActive");

ALTER TABLE "notification_receipts"
    ADD CONSTRAINT "notification_receipts_alarmId_fkey"
    FOREIGN KEY ("alarmId") REFERENCES "alarms"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
