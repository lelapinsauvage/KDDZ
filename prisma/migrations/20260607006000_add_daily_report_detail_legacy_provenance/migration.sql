ALTER TABLE "daily_report_fevers"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyReportId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "daily_report_fevers_legacyKey_key" ON "daily_report_fevers"("legacyKey");
CREATE INDEX "daily_report_fevers_sourceDatabase_idx" ON "daily_report_fevers"("sourceDatabase");
CREATE INDEX "daily_report_fevers_legacyId_idx" ON "daily_report_fevers"("legacyId");
CREATE INDEX "daily_report_fevers_legacyTable_idx" ON "daily_report_fevers"("legacyTable");
CREATE INDEX "daily_report_fevers_legacyReportId_idx" ON "daily_report_fevers"("legacyReportId");

ALTER TABLE "daily_report_milks"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyReportId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "daily_report_milks_legacyKey_key" ON "daily_report_milks"("legacyKey");
CREATE INDEX "daily_report_milks_sourceDatabase_idx" ON "daily_report_milks"("sourceDatabase");
CREATE INDEX "daily_report_milks_legacyId_idx" ON "daily_report_milks"("legacyId");
CREATE INDEX "daily_report_milks_legacyTable_idx" ON "daily_report_milks"("legacyTable");
CREATE INDEX "daily_report_milks_legacyReportId_idx" ON "daily_report_milks"("legacyReportId");
