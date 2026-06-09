ALTER TABLE "employee_events"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyTeacherId" INTEGER,
ADD COLUMN "legacyCreatedById" INTEGER,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "employee_events_legacyKey_key" ON "employee_events"("legacyKey");
CREATE INDEX "employee_events_sourceDatabase_idx" ON "employee_events"("sourceDatabase");
CREATE INDEX "employee_events_legacyId_idx" ON "employee_events"("legacyId");
CREATE INDEX "employee_events_legacyTable_idx" ON "employee_events"("legacyTable");
CREATE INDEX "employee_events_legacyTeacherId_idx" ON "employee_events"("legacyTeacherId");
CREATE INDEX "employee_events_legacyCreatedById_idx" ON "employee_events"("legacyCreatedById");
