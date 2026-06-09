ALTER TABLE "provinces"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "provinces_legacyKey_key" ON "provinces"("legacyKey");
CREATE INDEX "provinces_sourceDatabase_idx" ON "provinces"("sourceDatabase");
CREATE INDEX "provinces_legacyId_idx" ON "provinces"("legacyId");
CREATE INDEX "provinces_legacyTable_idx" ON "provinces"("legacyTable");

ALTER TABLE "districts"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyProvinceId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "districts_legacyKey_key" ON "districts"("legacyKey");
CREATE INDEX "districts_sourceDatabase_idx" ON "districts"("sourceDatabase");
CREATE INDEX "districts_legacyId_idx" ON "districts"("legacyId");
CREATE INDEX "districts_legacyTable_idx" ON "districts"("legacyTable");
CREATE INDEX "districts_legacyProvinceId_idx" ON "districts"("legacyProvinceId");

ALTER TABLE "regions"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyDistrictId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "regions_legacyKey_key" ON "regions"("legacyKey");
CREATE INDEX "regions_sourceDatabase_idx" ON "regions"("sourceDatabase");
CREATE INDEX "regions_legacyId_idx" ON "regions"("legacyId");
CREATE INDEX "regions_legacyTable_idx" ON "regions"("legacyTable");
CREATE INDEX "regions_legacyDistrictId_idx" ON "regions"("legacyDistrictId");
