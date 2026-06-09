ALTER TABLE "accounting_entries"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyField" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "accounting_entries_legacyKey_key" ON "accounting_entries"("legacyKey");
CREATE INDEX "accounting_entries_sourceDatabase_idx" ON "accounting_entries"("sourceDatabase");
CREATE INDEX "accounting_entries_legacyId_idx" ON "accounting_entries"("legacyId");
CREATE INDEX "accounting_entries_legacyTable_idx" ON "accounting_entries"("legacyTable");
CREATE INDEX "accounting_entries_legacyChildId_idx" ON "accounting_entries"("legacyChildId");
CREATE INDEX "accounting_entries_legacyField_idx" ON "accounting_entries"("legacyField");
