ALTER TABLE "assessments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyClassId" INTEGER,
ADD COLUMN "legacyTeacherId" INTEGER,
ADD COLUMN "legacyCreatedById" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "assessments_legacyKey_key" ON "assessments"("legacyKey");
CREATE INDEX "assessments_sourceDatabase_idx" ON "assessments"("sourceDatabase");
CREATE INDEX "assessments_legacyId_idx" ON "assessments"("legacyId");
CREATE INDEX "assessments_legacyTable_idx" ON "assessments"("legacyTable");
CREATE INDEX "assessments_legacyChildId_idx" ON "assessments"("legacyChildId");
CREATE INDEX "assessments_legacyClassId_idx" ON "assessments"("legacyClassId");
CREATE INDEX "assessments_legacyTeacherId_idx" ON "assessments"("legacyTeacherId");
CREATE INDEX "assessments_legacyCreatedById_idx" ON "assessments"("legacyCreatedById");
