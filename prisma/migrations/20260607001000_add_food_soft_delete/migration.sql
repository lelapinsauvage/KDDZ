ALTER TABLE "foods"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "foods_deletedAt_idx" ON "foods"("deletedAt");
