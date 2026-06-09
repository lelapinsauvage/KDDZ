ALTER TABLE "medical_forms"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyBranchId" INTEGER,
ADD COLUMN "legacyClassId" INTEGER,
ADD COLUMN "legacyCreatedById" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "medical_forms_legacyKey_key" ON "medical_forms"("legacyKey");
CREATE INDEX "medical_forms_sourceDatabase_idx" ON "medical_forms"("sourceDatabase");
CREATE INDEX "medical_forms_legacyId_idx" ON "medical_forms"("legacyId");
CREATE INDEX "medical_forms_legacyTable_idx" ON "medical_forms"("legacyTable");
CREATE INDEX "medical_forms_legacyChildId_idx" ON "medical_forms"("legacyChildId");
CREATE INDEX "medical_forms_legacyBranchId_idx" ON "medical_forms"("legacyBranchId");
CREATE INDEX "medical_forms_legacyClassId_idx" ON "medical_forms"("legacyClassId");
CREATE INDEX "medical_forms_legacyCreatedById_idx" ON "medical_forms"("legacyCreatedById");

ALTER TABLE "medical_form_entries"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyFormId" INTEGER,
ADD COLUMN "legacyChildId" INTEGER;

CREATE UNIQUE INDEX "medical_form_entries_legacyKey_key" ON "medical_form_entries"("legacyKey");
CREATE INDEX "medical_form_entries_sourceDatabase_idx" ON "medical_form_entries"("sourceDatabase");
CREATE INDEX "medical_form_entries_legacyId_idx" ON "medical_form_entries"("legacyId");
CREATE INDEX "medical_form_entries_legacyTable_idx" ON "medical_form_entries"("legacyTable");
CREATE INDEX "medical_form_entries_legacyFormId_idx" ON "medical_form_entries"("legacyFormId");
CREATE INDEX "medical_form_entries_legacyChildId_idx" ON "medical_form_entries"("legacyChildId");
