ALTER TABLE "messages"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyThreadId" INTEGER,
ADD COLUMN "legacySenderId" INTEGER,
ADD COLUMN "legacySenderType" INTEGER,
ADD COLUMN "legacyRecipientId" INTEGER,
ADD COLUMN "legacyRecipientType" INTEGER,
ADD COLUMN "legacyDeliveryUserId" INTEGER,
ADD COLUMN "legacyDeliveryUserType" INTEGER,
ADD COLUMN "legacyNature" TEXT,
ADD COLUMN "legacyHref" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "messages_legacyKey_key" ON "messages"("legacyKey");
CREATE INDEX "messages_sourceDatabase_idx" ON "messages"("sourceDatabase");
CREATE INDEX "messages_legacyId_idx" ON "messages"("legacyId");
CREATE INDEX "messages_legacyThreadId_idx" ON "messages"("legacyThreadId");
CREATE INDEX "messages_legacyDeliveryUserId_legacyDeliveryUserType_idx"
ON "messages"("legacyDeliveryUserId", "legacyDeliveryUserType");
