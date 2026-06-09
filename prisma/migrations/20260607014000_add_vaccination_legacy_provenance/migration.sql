ALTER TABLE "vaccinations"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyDateField" TEXT,
ADD COLUMN "legacyStatusField" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "vaccinations_legacyKey_key" ON "vaccinations"("legacyKey");
CREATE INDEX "vaccinations_sourceDatabase_idx" ON "vaccinations"("sourceDatabase");
CREATE INDEX "vaccinations_legacyId_idx" ON "vaccinations"("legacyId");
CREATE INDEX "vaccinations_legacyTable_idx" ON "vaccinations"("legacyTable");
CREATE INDEX "vaccinations_legacyChildId_idx" ON "vaccinations"("legacyChildId");
CREATE INDEX "vaccinations_legacyDateField_idx" ON "vaccinations"("legacyDateField");
CREATE INDEX "vaccinations_legacyStatusField_idx" ON "vaccinations"("legacyStatusField");
CREATE INDEX "vaccinations_legacyData_idx" ON "vaccinations" USING GIN ("legacyData");
