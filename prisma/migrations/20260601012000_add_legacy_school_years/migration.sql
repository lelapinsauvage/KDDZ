-- Preserve source identity for legacy t_school_year rows.

ALTER TABLE "school_years"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacySid" INTEGER,
ADD COLUMN "legacyDate" DATE,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "school_years_legacyKey_key" ON "school_years"("legacyKey");
CREATE INDEX "school_years_sourceDatabase_idx" ON "school_years"("sourceDatabase");
CREATE INDEX "school_years_legacyId_idx" ON "school_years"("legacyId");
CREATE INDEX "school_years_legacySid_idx" ON "school_years"("legacySid");
