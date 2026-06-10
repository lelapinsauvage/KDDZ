CREATE TABLE "legacy_medical_form_definitions" (
  "id" UUID NOT NULL,
  "sourceDatabase" TEXT NOT NULL,
  "legacyKey" TEXT NOT NULL,
  "legacyId" INTEGER NOT NULL,
  "formName" TEXT NOT NULL,
  "ref" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "legacyData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "legacy_medical_form_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_medical_form_definitions_legacyKey_key" ON "legacy_medical_form_definitions"("legacyKey");
CREATE INDEX "legacy_medical_form_definitions_sourceDatabase_idx" ON "legacy_medical_form_definitions"("sourceDatabase");
CREATE INDEX "legacy_medical_form_definitions_legacyId_idx" ON "legacy_medical_form_definitions"("legacyId");
CREATE INDEX "legacy_medical_form_definitions_formName_idx" ON "legacy_medical_form_definitions"("formName");
CREATE INDEX "legacy_medical_form_definitions_ref_idx" ON "legacy_medical_form_definitions"("ref");
CREATE INDEX "legacy_medical_form_definitions_isActive_idx" ON "legacy_medical_form_definitions"("isActive");
