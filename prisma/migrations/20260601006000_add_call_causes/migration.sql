-- Restore legacy callcauses lookup rows used by call reason dropdowns.

CREATE TABLE "call_causes" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT,
    "legacyKey" TEXT,
    "legacyId" INTEGER,
    "parentLabel" TEXT,
    "childLabel" TEXT,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_causes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "call_causes_legacyKey_key"
    ON "call_causes"("legacyKey");

CREATE INDEX "call_causes_sourceDatabase_idx"
    ON "call_causes"("sourceDatabase");

CREATE INDEX "call_causes_legacyId_idx"
    ON "call_causes"("legacyId");

CREATE INDEX "call_causes_parentLabel_idx"
    ON "call_causes"("parentLabel");
