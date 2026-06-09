ALTER TABLE "child_history"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER;

CREATE UNIQUE INDEX "child_history_legacyKey_key" ON "child_history"("legacyKey");
CREATE INDEX "child_history_sourceDatabase_idx" ON "child_history"("sourceDatabase");
CREATE INDEX "child_history_legacyTable_idx" ON "child_history"("legacyTable");
CREATE INDEX "child_history_legacyChildId_idx" ON "child_history"("legacyChildId");
