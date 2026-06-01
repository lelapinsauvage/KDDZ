-- Preserve legacy PHP auth metadata that is not part of active Auth.js users.

CREATE TABLE "legacy_auth_records" (
  "id" UUID NOT NULL,
  "sourceDatabase" TEXT NOT NULL,
  "legacyTable" TEXT NOT NULL,
  "legacyKey" TEXT NOT NULL,
  "legacyId" INTEGER NOT NULL,
  "recordType" TEXT NOT NULL,
  "userId" UUID,
  "parentUserId" UUID,
  "legacyUserId" INTEGER,
  "username" TEXT,
  "email" TEXT,
  "recordKey" TEXT,
  "recordValue" TEXT,
  "isDisabled" BOOLEAN,
  "redirect" TEXT,
  "welcomeEmail" BOOLEAN,
  "legacyData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "legacy_auth_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_auth_records_legacyKey_key" ON "legacy_auth_records"("legacyKey");
CREATE INDEX "legacy_auth_records_sourceDatabase_idx" ON "legacy_auth_records"("sourceDatabase");
CREATE INDEX "legacy_auth_records_legacyTable_idx" ON "legacy_auth_records"("legacyTable");
CREATE INDEX "legacy_auth_records_legacyId_idx" ON "legacy_auth_records"("legacyId");
CREATE INDEX "legacy_auth_records_recordType_idx" ON "legacy_auth_records"("recordType");
CREATE INDEX "legacy_auth_records_userId_idx" ON "legacy_auth_records"("userId");
CREATE INDEX "legacy_auth_records_parentUserId_idx" ON "legacy_auth_records"("parentUserId");
CREATE INDEX "legacy_auth_records_legacyUserId_idx" ON "legacy_auth_records"("legacyUserId");
CREATE INDEX "legacy_auth_records_email_idx" ON "legacy_auth_records"("email");
