ALTER TABLE "holidays"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "holidays_legacyKey_key" ON "holidays"("legacyKey");
CREATE INDEX "holidays_sourceDatabase_idx" ON "holidays"("sourceDatabase");
CREATE INDEX "holidays_legacyId_idx" ON "holidays"("legacyId");
CREATE INDEX "holidays_legacyTable_idx" ON "holidays"("legacyTable");
