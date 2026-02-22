-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INCOMING', 'OUTGOING', 'MISSED');

-- CreateTable
CREATE TABLE "call_logs" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "direction" "CallDirection" NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME(6),
    "contact" TEXT,
    "phone" TEXT,
    "subject" TEXT,
    "reason" TEXT,
    "remarks" TEXT,
    "staffId" UUID,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "call_logs_childId_idx" ON "call_logs"("childId");

-- CreateIndex
CREATE INDEX "call_logs_date_idx" ON "call_logs"("date");

-- CreateIndex
CREATE INDEX "call_logs_direction_idx" ON "call_logs"("direction");

-- CreateIndex
CREATE INDEX "call_logs_createdById_idx" ON "call_logs"("createdById");

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
