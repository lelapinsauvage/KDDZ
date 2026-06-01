-- Add legacy source provenance for file/photo targets that previously stored
-- only the legacy filename. These fields let storage URL rewrites target rows
-- by source database/table/id instead of unsafe filename matching.

ALTER TABLE "branches"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT;

CREATE UNIQUE INDEX "branches_legacyKey_key" ON "branches"("legacyKey");
CREATE INDEX "branches_sourceDatabase_idx" ON "branches"("sourceDatabase");
CREATE INDEX "branches_legacyId_idx" ON "branches"("legacyId");
CREATE INDEX "branches_legacyTable_idx" ON "branches"("legacyTable");

ALTER TABLE "classes"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT;

CREATE UNIQUE INDEX "classes_legacyKey_key" ON "classes"("legacyKey");
CREATE INDEX "classes_sourceDatabase_idx" ON "classes"("sourceDatabase");
CREATE INDEX "classes_legacyId_idx" ON "classes"("legacyId");
CREATE INDEX "classes_legacyTable_idx" ON "classes"("legacyTable");

ALTER TABLE "children"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT;

CREATE UNIQUE INDEX "children_legacyKey_key" ON "children"("legacyKey");
CREATE INDEX "children_sourceDatabase_idx" ON "children"("sourceDatabase");
CREATE INDEX "children_legacyId_idx" ON "children"("legacyId");
CREATE INDEX "children_legacyTable_idx" ON "children"("legacyTable");

ALTER TABLE "teachers"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT;

CREATE UNIQUE INDEX "teachers_legacyKey_key" ON "teachers"("legacyKey");
CREATE INDEX "teachers_sourceDatabase_idx" ON "teachers"("sourceDatabase");
CREATE INDEX "teachers_legacyId_idx" ON "teachers"("legacyId");
CREATE INDEX "teachers_legacyTable_idx" ON "teachers"("legacyTable");

ALTER TABLE "teacher_attachments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyTeacherId" INTEGER;

CREATE UNIQUE INDEX "teacher_attachments_legacyKey_key" ON "teacher_attachments"("legacyKey");
CREATE INDEX "teacher_attachments_sourceDatabase_idx" ON "teacher_attachments"("sourceDatabase");
CREATE INDEX "teacher_attachments_legacyId_idx" ON "teacher_attachments"("legacyId");
CREATE INDEX "teacher_attachments_legacyTable_idx" ON "teacher_attachments"("legacyTable");
CREATE INDEX "teacher_attachments_legacyTeacherId_idx" ON "teacher_attachments"("legacyTeacherId");

ALTER TABLE "nurses"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT;

CREATE UNIQUE INDEX "nurses_legacyKey_key" ON "nurses"("legacyKey");
CREATE INDEX "nurses_sourceDatabase_idx" ON "nurses"("sourceDatabase");
CREATE INDEX "nurses_legacyId_idx" ON "nurses"("legacyId");
CREATE INDEX "nurses_legacyTable_idx" ON "nurses"("legacyTable");

ALTER TABLE "nurse_attachments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyNurseId" INTEGER;

CREATE UNIQUE INDEX "nurse_attachments_legacyKey_key" ON "nurse_attachments"("legacyKey");
CREATE INDEX "nurse_attachments_sourceDatabase_idx" ON "nurse_attachments"("sourceDatabase");
CREATE INDEX "nurse_attachments_legacyId_idx" ON "nurse_attachments"("legacyId");
CREATE INDEX "nurse_attachments_legacyTable_idx" ON "nurse_attachments"("legacyTable");
CREATE INDEX "nurse_attachments_legacyNurseId_idx" ON "nurse_attachments"("legacyNurseId");

ALTER TABLE "managers"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT;

CREATE UNIQUE INDEX "managers_legacyKey_key" ON "managers"("legacyKey");
CREATE INDEX "managers_sourceDatabase_idx" ON "managers"("sourceDatabase");
CREATE INDEX "managers_legacyId_idx" ON "managers"("legacyId");
CREATE INDEX "managers_legacyTable_idx" ON "managers"("legacyTable");

ALTER TABLE "daily_report_attachments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyDailyReportId" INTEGER;

CREATE UNIQUE INDEX "daily_report_attachments_legacyKey_key" ON "daily_report_attachments"("legacyKey");
CREATE INDEX "daily_report_attachments_sourceDatabase_idx" ON "daily_report_attachments"("sourceDatabase");
CREATE INDEX "daily_report_attachments_legacyId_idx" ON "daily_report_attachments"("legacyId");
CREATE INDEX "daily_report_attachments_legacyTable_idx" ON "daily_report_attachments"("legacyTable");
CREATE INDEX "daily_report_attachments_legacyDailyReportId_idx" ON "daily_report_attachments"("legacyDailyReportId");

ALTER TABLE "absence_attachments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyAbsenceReportId" INTEGER;

CREATE UNIQUE INDEX "absence_attachments_legacyKey_key" ON "absence_attachments"("legacyKey");
CREATE INDEX "absence_attachments_sourceDatabase_idx" ON "absence_attachments"("sourceDatabase");
CREATE INDEX "absence_attachments_legacyId_idx" ON "absence_attachments"("legacyId");
CREATE INDEX "absence_attachments_legacyTable_idx" ON "absence_attachments"("legacyTable");
CREATE INDEX "absence_attachments_legacyAbsenceReportId_idx" ON "absence_attachments"("legacyAbsenceReportId");
