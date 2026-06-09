ALTER TABLE "messages"
ADD COLUMN "legacyTable" TEXT;

CREATE INDEX "messages_legacyTable_idx" ON "messages"("legacyTable");
