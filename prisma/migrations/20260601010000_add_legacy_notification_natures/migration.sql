-- Preserve legacy notifications_nature rows that describe notification
-- category source/delivery tables and column mappings.

CREATE TABLE "legacy_notification_natures" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT NOT NULL,
    "legacyKey" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contentTable" TEXT,
    "deliveryTable" TEXT,
    "parentDeliveryTable" TEXT,
    "contentIdColumn" TEXT,
    "deliveryIdColumn" TEXT,
    "recipientColumn" TEXT,
    "subjectColumn" TEXT,
    "bodyColumn" TEXT,
    "displayOrder" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_notification_natures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_notification_natures_legacyKey_key"
    ON "legacy_notification_natures"("legacyKey");

CREATE INDEX "legacy_notification_natures_sourceDatabase_idx"
    ON "legacy_notification_natures"("sourceDatabase");

CREATE INDEX "legacy_notification_natures_legacyId_idx"
    ON "legacy_notification_natures"("legacyId");

CREATE INDEX "legacy_notification_natures_name_idx"
    ON "legacy_notification_natures"("name");

CREATE INDEX "legacy_notification_natures_isActive_idx"
    ON "legacy_notification_natures"("isActive");
