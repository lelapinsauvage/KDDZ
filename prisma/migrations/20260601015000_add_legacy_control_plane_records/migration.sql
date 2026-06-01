-- Preserve legacy master/users control-plane metadata without enforcing it yet.

CREATE TABLE "legacy_access_control_records" (
  "id" UUID NOT NULL,
  "sourceDatabase" TEXT NOT NULL,
  "legacyTable" TEXT NOT NULL,
  "legacyKey" TEXT NOT NULL,
  "legacyId" INTEGER,
  "recordType" TEXT NOT NULL,
  "legacyLevelId" INTEGER,
  "legacyUserId" INTEGER,
  "userId" UUID,
  "legacyActionId" INTEGER,
  "actionGroupId" INTEGER,
  "actionName" TEXT,
  "actionType" TEXT,
  "description" TEXT,
  "isActive" BOOLEAN,
  "legacyData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "legacy_access_control_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_access_control_records_legacyKey_key" ON "legacy_access_control_records"("legacyKey");
CREATE INDEX "legacy_access_control_records_sourceDatabase_idx" ON "legacy_access_control_records"("sourceDatabase");
CREATE INDEX "legacy_access_control_records_legacyTable_idx" ON "legacy_access_control_records"("legacyTable");
CREATE INDEX "legacy_access_control_records_legacyId_idx" ON "legacy_access_control_records"("legacyId");
CREATE INDEX "legacy_access_control_records_recordType_idx" ON "legacy_access_control_records"("recordType");
CREATE INDEX "legacy_access_control_records_legacyLevelId_idx" ON "legacy_access_control_records"("legacyLevelId");
CREATE INDEX "legacy_access_control_records_legacyUserId_idx" ON "legacy_access_control_records"("legacyUserId");
CREATE INDEX "legacy_access_control_records_userId_idx" ON "legacy_access_control_records"("userId");
CREATE INDEX "legacy_access_control_records_legacyActionId_idx" ON "legacy_access_control_records"("legacyActionId");
CREATE INDEX "legacy_access_control_records_actionName_idx" ON "legacy_access_control_records"("actionName");
CREATE INDEX "legacy_access_control_records_isActive_idx" ON "legacy_access_control_records"("isActive");

CREATE TABLE "legacy_garderie_registry" (
  "id" UUID NOT NULL,
  "sourceDatabase" TEXT NOT NULL,
  "legacyKey" TEXT NOT NULL,
  "legacyId" INTEGER NOT NULL,
  "name" TEXT,
  "alias" TEXT,
  "userManageDatabase" TEXT,
  "currentDatabase" TEXT,
  "path" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "legacyData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "legacy_garderie_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_garderie_registry_legacyKey_key" ON "legacy_garderie_registry"("legacyKey");
CREATE INDEX "legacy_garderie_registry_sourceDatabase_idx" ON "legacy_garderie_registry"("sourceDatabase");
CREATE INDEX "legacy_garderie_registry_legacyId_idx" ON "legacy_garderie_registry"("legacyId");
CREATE INDEX "legacy_garderie_registry_name_idx" ON "legacy_garderie_registry"("name");
CREATE INDEX "legacy_garderie_registry_alias_idx" ON "legacy_garderie_registry"("alias");
CREATE INDEX "legacy_garderie_registry_currentDatabase_idx" ON "legacy_garderie_registry"("currentDatabase");
CREATE INDEX "legacy_garderie_registry_isActive_idx" ON "legacy_garderie_registry"("isActive");

CREATE TABLE "legacy_year_databases" (
  "id" UUID NOT NULL,
  "sourceDatabase" TEXT NOT NULL,
  "legacyTable" TEXT NOT NULL,
  "legacyKey" TEXT NOT NULL,
  "legacyId" INTEGER NOT NULL,
  "legacyYearId" INTEGER,
  "selectedYear" TEXT,
  "databaseName" TEXT,
  "isSelected" BOOLEAN,
  "sourceCreatedAt" TIMESTAMP(3),
  "legacyData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "legacy_year_databases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_year_databases_legacyKey_key" ON "legacy_year_databases"("legacyKey");
CREATE INDEX "legacy_year_databases_sourceDatabase_idx" ON "legacy_year_databases"("sourceDatabase");
CREATE INDEX "legacy_year_databases_legacyTable_idx" ON "legacy_year_databases"("legacyTable");
CREATE INDEX "legacy_year_databases_legacyId_idx" ON "legacy_year_databases"("legacyId");
CREATE INDEX "legacy_year_databases_legacyYearId_idx" ON "legacy_year_databases"("legacyYearId");
CREATE INDEX "legacy_year_databases_selectedYear_idx" ON "legacy_year_databases"("selectedYear");
CREATE INDEX "legacy_year_databases_databaseName_idx" ON "legacy_year_databases"("databaseName");
CREATE INDEX "legacy_year_databases_isSelected_idx" ON "legacy_year_databases"("isSelected");
