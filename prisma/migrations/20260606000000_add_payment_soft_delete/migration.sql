ALTER TABLE "payments"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "payments_deletedAt_idx" ON "payments"("deletedAt");
