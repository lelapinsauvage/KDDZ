-- AlterTable
ALTER TABLE "children" ADD COLUMN     "firstNameAr" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "lastNameAr" TEXT,
ADD COLUMN     "lunchIncluded" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "milkScoop" INTEGER,
ADD COLUMN     "milkTime1" TIME(6),
ADD COLUMN     "milkTime2" TIME(6),
ADD COLUMN     "milkTime3" TIME(6),
ADD COLUMN     "previousGarderie" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "previousGarderieName" TEXT,
ADD COLUMN     "religion" TEXT;

-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "canPickUp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "divorceSituation" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "medicalCase" TEXT,
ADD COLUMN     "profession" TEXT;
