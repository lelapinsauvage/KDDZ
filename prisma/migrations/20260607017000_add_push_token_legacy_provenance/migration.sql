ALTER TABLE "push_tokens"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyTable" TEXT,
ADD COLUMN "legacyChildId" INTEGER;

CREATE UNIQUE INDEX "push_tokens_legacyKey_key" ON "push_tokens"("legacyKey");
CREATE INDEX "push_tokens_sourceDatabase_idx" ON "push_tokens"("sourceDatabase");
CREATE INDEX "push_tokens_legacyId_idx" ON "push_tokens"("legacyId");
CREATE INDEX "push_tokens_legacyTable_idx" ON "push_tokens"("legacyTable");
CREATE INDEX "push_tokens_legacyChildId_idx" ON "push_tokens"("legacyChildId");
