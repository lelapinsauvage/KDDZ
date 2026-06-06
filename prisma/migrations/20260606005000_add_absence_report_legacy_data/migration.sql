ALTER TABLE "absence_reports" ADD COLUMN "sourceDatabase" TEXT;
ALTER TABLE "absence_reports" ADD COLUMN "legacyKey" TEXT;
ALTER TABLE "absence_reports" ADD COLUMN "legacyId" INTEGER;
ALTER TABLE "absence_reports" ADD COLUMN "legacyChildId" INTEGER;
ALTER TABLE "absence_reports" ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "absence_reports_legacyKey_key" ON "absence_reports"("legacyKey");
CREATE INDEX "absence_reports_sourceDatabase_idx" ON "absence_reports"("sourceDatabase");
CREATE INDEX "absence_reports_legacyId_idx" ON "absence_reports"("legacyId");
CREATE INDEX "absence_reports_legacyChildId_idx" ON "absence_reports"("legacyChildId");
