ALTER TABLE "assessment_schedule_rules"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyTable" TEXT;

CREATE UNIQUE INDEX "assessment_schedule_rules_legacyKey_key" ON "assessment_schedule_rules"("legacyKey");
CREATE INDEX "assessment_schedule_rules_sourceDatabase_idx" ON "assessment_schedule_rules"("sourceDatabase");
CREATE INDEX "assessment_schedule_rules_legacyTable_idx" ON "assessment_schedule_rules"("legacyTable");
