ALTER TABLE "users"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "users_legacyKey_key" ON "users"("legacyKey");
CREATE INDEX "users_sourceDatabase_idx" ON "users"("sourceDatabase");
CREATE INDEX "users_legacyId_idx" ON "users"("legacyId");
CREATE INDEX "users_legacyTable_idx" ON "users"("legacyTable");
