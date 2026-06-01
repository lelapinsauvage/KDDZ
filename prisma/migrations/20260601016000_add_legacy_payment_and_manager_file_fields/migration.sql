-- Preserve legacy file destinations for manager photos and payment receipts.

ALTER TABLE "managers"
ADD COLUMN "imageUrl" TEXT;

ALTER TABLE "payments"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyChildId" INTEGER,
ADD COLUMN "legacyImageFilename" TEXT,
ADD COLUMN "receiptFilename" TEXT,
ADD COLUMN "receiptFileUrl" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "payments_legacyKey_key" ON "payments"("legacyKey");
CREATE INDEX "payments_sourceDatabase_idx" ON "payments"("sourceDatabase");
CREATE INDEX "payments_legacyId_idx" ON "payments"("legacyId");
CREATE INDEX "payments_legacyChildId_idx" ON "payments"("legacyChildId");
