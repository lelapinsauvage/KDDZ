ALTER TABLE "events"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "organizationId" UUID,
ADD COLUMN "customSubject" TEXT,
ADD COLUMN "customBody" TEXT,
ADD COLUMN "notificationBranchIds" JSONB,
ADD COLUMN "notificationDaysBefore" JSONB,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "events_legacyKey_key" ON "events"("legacyKey");
CREATE INDEX "events_sourceDatabase_idx" ON "events"("sourceDatabase");
CREATE INDEX "events_legacyId_idx" ON "events"("legacyId");
CREATE INDEX "events_organizationId_idx" ON "events"("organizationId");

ALTER TABLE "events"
ADD CONSTRAINT "events_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
