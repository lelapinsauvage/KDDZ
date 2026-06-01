-- Restore legacy callparent rows and link callcauses to their parent category.

CREATE TABLE "call_cause_categories" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT,
    "legacyKey" TEXT,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_cause_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "call_cause_categories_legacyKey_key"
    ON "call_cause_categories"("legacyKey");

CREATE INDEX "call_cause_categories_sourceDatabase_idx"
    ON "call_cause_categories"("sourceDatabase");

CREATE INDEX "call_cause_categories_legacyId_idx"
    ON "call_cause_categories"("legacyId");

CREATE INDEX "call_cause_categories_name_idx"
    ON "call_cause_categories"("name");

ALTER TABLE "call_causes"
    ADD COLUMN "categoryId" UUID;

CREATE INDEX "call_causes_categoryId_idx"
    ON "call_causes"("categoryId");

ALTER TABLE "call_causes"
    ADD CONSTRAINT "call_causes_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "call_cause_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
