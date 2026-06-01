-- Restore legacy t_food_apply rows used to prefill class daily-report meals.

CREATE TABLE "food_applications" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT,
    "legacyKey" TEXT,
    "legacyId" INTEGER,
    "classId" UUID,
    "childId" UUID,
    "breakfastFoodId" UUID,
    "lunchFoodId" UUID,
    "breakfastTime" TIME(6),
    "lunchTime" TIME(6),
    "date" DATE,
    "dessert" TEXT,
    "dessertTime" TIME(6),
    "createdById" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "food_applications_legacyKey_key"
    ON "food_applications"("legacyKey");

CREATE INDEX "food_applications_sourceDatabase_idx"
    ON "food_applications"("sourceDatabase");

CREATE INDEX "food_applications_legacyId_idx"
    ON "food_applications"("legacyId");

CREATE INDEX "food_applications_classId_idx"
    ON "food_applications"("classId");

CREATE INDEX "food_applications_childId_idx"
    ON "food_applications"("childId");

CREATE INDEX "food_applications_date_idx"
    ON "food_applications"("date");

CREATE INDEX "food_applications_breakfastFoodId_idx"
    ON "food_applications"("breakfastFoodId");

CREATE INDEX "food_applications_lunchFoodId_idx"
    ON "food_applications"("lunchFoodId");

CREATE INDEX "food_applications_createdById_idx"
    ON "food_applications"("createdById");

CREATE INDEX "food_applications_isActive_idx"
    ON "food_applications"("isActive");

ALTER TABLE "food_applications"
    ADD CONSTRAINT "food_applications_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "classes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "food_applications"
    ADD CONSTRAINT "food_applications_childId_fkey"
    FOREIGN KEY ("childId") REFERENCES "children"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "food_applications"
    ADD CONSTRAINT "food_applications_breakfastFoodId_fkey"
    FOREIGN KEY ("breakfastFoodId") REFERENCES "foods"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "food_applications"
    ADD CONSTRAINT "food_applications_lunchFoodId_fkey"
    FOREIGN KEY ("lunchFoodId") REFERENCES "foods"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "food_applications"
    ADD CONSTRAINT "food_applications_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
