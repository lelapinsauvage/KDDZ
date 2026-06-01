-- Preserve legacy login timestamp/audit rows from admin, manager, and parent auth tables.

CREATE TABLE "legacy_login_timestamps" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT NOT NULL,
    "legacyTable" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "legacyUserId" INTEGER NOT NULL,
    "userId" UUID,
    "parentUserId" UUID,
    "principalType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "occurredAt" TIMESTAMP(3),
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legacy_login_timestamps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_login_timestamps_sourceDatabase_legacyTable_legacyId_key"
    ON "legacy_login_timestamps"("sourceDatabase", "legacyTable", "legacyId");

CREATE INDEX "legacy_login_timestamps_legacyTable_idx"
    ON "legacy_login_timestamps"("legacyTable");

CREATE INDEX "legacy_login_timestamps_legacyUserId_idx"
    ON "legacy_login_timestamps"("legacyUserId");

CREATE INDEX "legacy_login_timestamps_userId_idx"
    ON "legacy_login_timestamps"("userId");

CREATE INDEX "legacy_login_timestamps_parentUserId_idx"
    ON "legacy_login_timestamps"("parentUserId");

CREATE INDEX "legacy_login_timestamps_principalType_idx"
    ON "legacy_login_timestamps"("principalType");

CREATE INDEX "legacy_login_timestamps_occurredAt_idx"
    ON "legacy_login_timestamps"("occurredAt");
