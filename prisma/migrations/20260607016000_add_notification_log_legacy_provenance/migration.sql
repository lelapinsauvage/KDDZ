ALTER TABLE "legacy_notification_logs"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyTable" TEXT;

CREATE UNIQUE INDEX "legacy_notification_logs_legacyKey_key" ON "legacy_notification_logs"("legacyKey");
CREATE INDEX "legacy_notification_logs_sourceDatabase_idx" ON "legacy_notification_logs"("sourceDatabase");
CREATE INDEX "legacy_notification_logs_legacyTable_idx" ON "legacy_notification_logs"("legacyTable");
