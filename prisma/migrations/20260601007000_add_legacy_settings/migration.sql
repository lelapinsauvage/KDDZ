-- Preserve legacy auth, nursery, and notification settings without activating
-- them as modern branch runtime configuration.

CREATE TABLE "legacy_settings" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT NOT NULL,
    "legacyTable" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "scope" TEXT,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT,
    "description" TEXT,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_settings_sourceDatabase_legacyTable_legacyId_key"
    ON "legacy_settings"("sourceDatabase", "legacyTable", "legacyId");

CREATE INDEX "legacy_settings_legacyTable_idx"
    ON "legacy_settings"("legacyTable");

CREATE INDEX "legacy_settings_scope_idx"
    ON "legacy_settings"("scope");

CREATE INDEX "legacy_settings_settingKey_idx"
    ON "legacy_settings"("settingKey");
