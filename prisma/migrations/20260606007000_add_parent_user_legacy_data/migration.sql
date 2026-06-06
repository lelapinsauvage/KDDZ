ALTER TABLE "parent_users" ADD COLUMN "sourceDatabase" TEXT;
ALTER TABLE "parent_users" ADD COLUMN "legacyKey" TEXT;
ALTER TABLE "parent_users" ADD COLUMN "legacyId" INTEGER;
ALTER TABLE "parent_users" ADD COLUMN "legacyChildId" INTEGER;
ALTER TABLE "parent_users" ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "parent_users_legacyKey_key" ON "parent_users"("legacyKey");
CREATE INDEX "parent_users_sourceDatabase_idx" ON "parent_users"("sourceDatabase");
CREATE INDEX "parent_users_legacyId_idx" ON "parent_users"("legacyId");
CREATE INDEX "parent_users_legacyChildId_idx" ON "parent_users"("legacyChildId");
