ALTER TABLE "parents"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "parents_legacyKey_key" ON "parents"("legacyKey");
CREATE INDEX "parents_sourceDatabase_idx" ON "parents"("sourceDatabase");
CREATE INDEX "parents_legacyId_idx" ON "parents"("legacyId");
CREATE INDEX "parents_legacyTable_idx" ON "parents"("legacyTable");
CREATE INDEX "parents_legacyChildId_idx" ON "parents"("legacyChildId");
