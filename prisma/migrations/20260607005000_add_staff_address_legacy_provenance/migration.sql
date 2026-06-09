ALTER TABLE "teacher_addresses"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyTeacherId" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "teacher_addresses_legacyKey_key" ON "teacher_addresses"("legacyKey");
CREATE INDEX "teacher_addresses_sourceDatabase_idx" ON "teacher_addresses"("sourceDatabase");
CREATE INDEX "teacher_addresses_legacyId_idx" ON "teacher_addresses"("legacyId");
CREATE INDEX "teacher_addresses_legacyTable_idx" ON "teacher_addresses"("legacyTable");
CREATE INDEX "teacher_addresses_legacyTeacherId_idx" ON "teacher_addresses"("legacyTeacherId");

ALTER TABLE "manager_addresses"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyManagerId" INTEGER,
ADD COLUMN "governorate" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "building" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "manager_addresses_legacyKey_key" ON "manager_addresses"("legacyKey");
CREATE INDEX "manager_addresses_sourceDatabase_idx" ON "manager_addresses"("sourceDatabase");
CREATE INDEX "manager_addresses_legacyId_idx" ON "manager_addresses"("legacyId");
CREATE INDEX "manager_addresses_legacyTable_idx" ON "manager_addresses"("legacyTable");
CREATE INDEX "manager_addresses_legacyManagerId_idx" ON "manager_addresses"("legacyManagerId");
