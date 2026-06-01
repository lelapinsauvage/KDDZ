-- Restore legacy t_forms_attachments rows for medical forms and call logs.

CREATE TABLE "form_attachments" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT,
    "legacyKey" TEXT,
    "legacyId" INTEGER,
    "formType" TEXT NOT NULL,
    "legacyFormId" INTEGER,
    "childId" UUID,
    "medicalFormId" UUID,
    "callLogId" UUID,
    "legacyChildId" INTEGER,
    "legacyClassId" INTEGER,
    "legacyBranchId" INTEGER,
    "title" TEXT,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "form_attachments_legacyKey_key"
    ON "form_attachments"("legacyKey");

CREATE INDEX "form_attachments_sourceDatabase_idx"
    ON "form_attachments"("sourceDatabase");

CREATE INDEX "form_attachments_legacyId_idx"
    ON "form_attachments"("legacyId");

CREATE INDEX "form_attachments_formType_idx"
    ON "form_attachments"("formType");

CREATE INDEX "form_attachments_legacyFormId_idx"
    ON "form_attachments"("legacyFormId");

CREATE INDEX "form_attachments_childId_idx"
    ON "form_attachments"("childId");

CREATE INDEX "form_attachments_medicalFormId_idx"
    ON "form_attachments"("medicalFormId");

CREATE INDEX "form_attachments_callLogId_idx"
    ON "form_attachments"("callLogId");

CREATE INDEX "form_attachments_isActive_idx"
    ON "form_attachments"("isActive");

ALTER TABLE "form_attachments"
    ADD CONSTRAINT "form_attachments_childId_fkey"
    FOREIGN KEY ("childId") REFERENCES "children"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "form_attachments"
    ADD CONSTRAINT "form_attachments_medicalFormId_fkey"
    FOREIGN KEY ("medicalFormId") REFERENCES "medical_forms"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "form_attachments"
    ADD CONSTRAINT "form_attachments_callLogId_fkey"
    FOREIGN KEY ("callLogId") REFERENCES "call_logs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
