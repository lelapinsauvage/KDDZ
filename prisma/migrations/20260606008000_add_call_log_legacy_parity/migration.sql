ALTER TABLE "call_logs"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyBranchId" INTEGER,
ADD COLUMN "legacyClassId" INTEGER,
ADD COLUMN "legacyTeacherId" INTEGER,
ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "call_logs_legacyKey_key" ON "call_logs"("legacyKey");
CREATE INDEX "call_logs_sourceDatabase_idx" ON "call_logs"("sourceDatabase");
CREATE INDEX "call_logs_legacyId_idx" ON "call_logs"("legacyId");
CREATE INDEX "call_logs_legacyChildId_idx" ON "call_logs"("legacyChildId");
CREATE INDEX "call_logs_legacyBranchId_idx" ON "call_logs"("legacyBranchId");
CREATE INDEX "call_logs_legacyClassId_idx" ON "call_logs"("legacyClassId");
CREATE INDEX "call_logs_legacyTeacherId_idx" ON "call_logs"("legacyTeacherId");
CREATE INDEX "call_logs_isDraft_idx" ON "call_logs"("isDraft");
