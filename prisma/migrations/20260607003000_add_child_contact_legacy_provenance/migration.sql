ALTER TABLE "child_addresses"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "child_addresses_legacyKey_key" ON "child_addresses"("legacyKey");
CREATE INDEX "child_addresses_sourceDatabase_idx" ON "child_addresses"("sourceDatabase");
CREATE INDEX "child_addresses_legacyId_idx" ON "child_addresses"("legacyId");
CREATE INDEX "child_addresses_legacyTable_idx" ON "child_addresses"("legacyTable");
CREATE INDEX "child_addresses_legacyChildId_idx" ON "child_addresses"("legacyChildId");

ALTER TABLE "relatives"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "relatives_legacyKey_key" ON "relatives"("legacyKey");
CREATE INDEX "relatives_sourceDatabase_idx" ON "relatives"("sourceDatabase");
CREATE INDEX "relatives_legacyId_idx" ON "relatives"("legacyId");
CREATE INDEX "relatives_legacyTable_idx" ON "relatives"("legacyTable");
CREATE INDEX "relatives_legacyChildId_idx" ON "relatives"("legacyChildId");
