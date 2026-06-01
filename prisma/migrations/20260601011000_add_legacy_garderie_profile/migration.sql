-- Preserve legacy nursery compliance/profile provenance and child previous-garderie history.

ALTER TABLE "branch_compliance"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyBranchId" INTEGER,
ADD COLUMN "legacyUserId" INTEGER,
ADD COLUMN "specialFor" TEXT,
ADD COLUMN "specialNumber" TEXT,
ADD COLUMN "specialDate" DATE,
ADD COLUMN "applicationOwnerName" TEXT,
ADD COLUMN "applicationNumber" TEXT,
ADD COLUMN "applicationRegion" TEXT,
ADD COLUMN "applicationGovernorate" TEXT,
ADD COLUMN "applicationDistrict" TEXT,
ADD COLUMN "leaseOwnerName" TEXT,
ADD COLUMN "leaseDate" DATE,
ADD COLUMN "leaseVerified" TEXT,
ADD COLUMN "legacyLatitude" TEXT,
ADD COLUMN "legacyLongitude" TEXT,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "branch_compliance_legacyKey_key" ON "branch_compliance"("legacyKey");
CREATE INDEX "branch_compliance_sourceDatabase_idx" ON "branch_compliance"("sourceDatabase");
CREATE INDEX "branch_compliance_legacyId_idx" ON "branch_compliance"("legacyId");
CREATE INDEX "branch_compliance_legacyBranchId_idx" ON "branch_compliance"("legacyBranchId");

ALTER TABLE "branch_documents"
ADD COLUMN "sourceDatabase" TEXT,
ADD COLUMN "legacyKey" TEXT,
ADD COLUMN "legacyId" INTEGER,
ADD COLUMN "legacyBranchId" INTEGER,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "legacyData" JSONB;

CREATE UNIQUE INDEX "branch_documents_legacyKey_key" ON "branch_documents"("legacyKey");
CREATE INDEX "branch_documents_sourceDatabase_idx" ON "branch_documents"("sourceDatabase");
CREATE INDEX "branch_documents_legacyId_idx" ON "branch_documents"("legacyId");
CREATE INDEX "branch_documents_legacyBranchId_idx" ON "branch_documents"("legacyBranchId");
CREATE INDEX "branch_documents_isActive_idx" ON "branch_documents"("isActive");

CREATE TABLE "child_previous_garderies" (
  "id" UUID NOT NULL,
  "sourceDatabase" TEXT NOT NULL,
  "legacyKey" TEXT NOT NULL,
  "legacyId" INTEGER NOT NULL,
  "childId" UUID,
  "legacyChildId" INTEGER,
  "name" TEXT,
  "year" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "legacyData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "child_previous_garderies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "child_previous_garderies_legacyKey_key" ON "child_previous_garderies"("legacyKey");
CREATE INDEX "child_previous_garderies_sourceDatabase_idx" ON "child_previous_garderies"("sourceDatabase");
CREATE INDEX "child_previous_garderies_legacyId_idx" ON "child_previous_garderies"("legacyId");
CREATE INDEX "child_previous_garderies_childId_idx" ON "child_previous_garderies"("childId");
CREATE INDEX "child_previous_garderies_legacyChildId_idx" ON "child_previous_garderies"("legacyChildId");
CREATE INDEX "child_previous_garderies_isActive_idx" ON "child_previous_garderies"("isActive");

ALTER TABLE "child_previous_garderies"
ADD CONSTRAINT "child_previous_garderies_childId_fkey"
FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;
