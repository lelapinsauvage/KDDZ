ALTER TABLE "food_calendars" ADD COLUMN "sourceDatabase" TEXT;
ALTER TABLE "food_calendars" ADD COLUMN "legacyKey" TEXT;
ALTER TABLE "food_calendars" ADD COLUMN "legacyId" INTEGER;
ALTER TABLE "food_calendars" ADD COLUMN "legacyBranchId" INTEGER;
ALTER TABLE "food_calendars" ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "food_calendars_legacyKey_key" ON "food_calendars"("legacyKey");
CREATE INDEX "food_calendars_sourceDatabase_idx" ON "food_calendars"("sourceDatabase");
CREATE INDEX "food_calendars_legacyId_idx" ON "food_calendars"("legacyId");
CREATE INDEX "food_calendars_legacyBranchId_idx" ON "food_calendars"("legacyBranchId");
