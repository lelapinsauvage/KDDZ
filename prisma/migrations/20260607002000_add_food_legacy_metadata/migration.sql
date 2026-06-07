ALTER TABLE "foods"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "foods_legacyKey_key" ON "foods"("legacyKey");
CREATE INDEX "foods_sourceDatabase_idx" ON "foods"("sourceDatabase");
CREATE INDEX "foods_legacyId_idx" ON "foods"("legacyId");
