-- Preserve provenance for remaining active garderie-db legacy rows.

ALTER TABLE "child_attachments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "child_attachments_legacyKey_key" ON "child_attachments"("legacyKey");
CREATE INDEX "child_attachments_sourceDatabase_idx" ON "child_attachments"("sourceDatabase");
CREATE INDEX "child_attachments_legacyId_idx" ON "child_attachments"("legacyId");
CREATE INDEX "child_attachments_legacyChildId_idx" ON "child_attachments"("legacyChildId");
CREATE INDEX "child_attachments_isActive_idx" ON "child_attachments"("isActive");

ALTER TABLE "doctors"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyUserId" INTEGER,
ADD COLUMN "firstNameAr" TEXT,
ADD COLUMN "middleNameAr" TEXT,
ADD COLUMN "lastNameAr" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "doctors_legacyKey_key" ON "doctors"("legacyKey");
CREATE INDEX "doctors_sourceDatabase_idx" ON "doctors"("sourceDatabase");
CREATE INDEX "doctors_legacyId_idx" ON "doctors"("legacyId");
CREATE INDEX "doctors_legacyTable_idx" ON "doctors"("legacyTable");

ALTER TABLE "doctor_attachments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyDoctorId" INTEGER,
ADD COLUMN "title" TEXT,
ADD COLUMN "expiryDate" DATE,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "doctor_attachments_legacyKey_key" ON "doctor_attachments"("legacyKey");
CREATE INDEX "doctor_attachments_sourceDatabase_idx" ON "doctor_attachments"("sourceDatabase");
CREATE INDEX "doctor_attachments_legacyId_idx" ON "doctor_attachments"("legacyId");
CREATE INDEX "doctor_attachments_legacyDoctorId_idx" ON "doctor_attachments"("legacyDoctorId");
CREATE INDEX "doctor_attachments_isActive_idx" ON "doctor_attachments"("isActive");

ALTER TABLE "manager_attachments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyManagerId" INTEGER,
ADD COLUMN "title" TEXT,
ADD COLUMN "expiryDate" DATE,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "manager_attachments_legacyKey_key" ON "manager_attachments"("legacyKey");
CREATE INDEX "manager_attachments_sourceDatabase_idx" ON "manager_attachments"("sourceDatabase");
CREATE INDEX "manager_attachments_legacyId_idx" ON "manager_attachments"("legacyId");
CREATE INDEX "manager_attachments_legacyManagerId_idx" ON "manager_attachments"("legacyManagerId");
CREATE INDEX "manager_attachments_isActive_idx" ON "manager_attachments"("isActive");

ALTER TABLE "event_types"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "defaultSubject" TEXT,
ADD COLUMN "defaultMessage" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "event_types_legacyKey_key" ON "event_types"("legacyKey");
CREATE INDEX "event_types_sourceDatabase_idx" ON "event_types"("sourceDatabase");
CREATE INDEX "event_types_legacyId_idx" ON "event_types"("legacyId");
