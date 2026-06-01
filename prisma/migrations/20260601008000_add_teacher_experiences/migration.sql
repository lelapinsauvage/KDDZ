-- Restore the TeacherExperience table currently present in Prisma schema and
-- preserve legacy t_teacher_info rows with source metadata. This migration is
-- defensive because some local databases may already have the schema-only
-- TeacherExperience table from prisma db push.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExperienceType') THEN
        CREATE TYPE "ExperienceType" AS ENUM ('WORK', 'STAGE', 'WORKSHOP');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "teacher_experiences" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT,
    "legacyKey" TEXT,
    "legacyId" INTEGER,
    "legacyTeacherId" INTEGER,
    "teacherId" UUID NOT NULL,
    "type" "ExperienceType" NOT NULL,
    "company" TEXT,
    "position" TEXT,
    "fromDate" DATE,
    "toDate" DATE,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_experiences_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "teacher_experiences"
    ADD COLUMN IF NOT EXISTS "sourceDatabase" TEXT,
    ADD COLUMN IF NOT EXISTS "legacyKey" TEXT,
    ADD COLUMN IF NOT EXISTS "legacyId" INTEGER,
    ADD COLUMN IF NOT EXISTS "legacyTeacherId" INTEGER,
    ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "legacyData" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "teacher_experiences_legacyKey_key"
    ON "teacher_experiences"("legacyKey");

CREATE INDEX IF NOT EXISTS "teacher_experiences_sourceDatabase_idx"
    ON "teacher_experiences"("sourceDatabase");

CREATE INDEX IF NOT EXISTS "teacher_experiences_legacyId_idx"
    ON "teacher_experiences"("legacyId");

CREATE INDEX IF NOT EXISTS "teacher_experiences_legacyTeacherId_idx"
    ON "teacher_experiences"("legacyTeacherId");

CREATE INDEX IF NOT EXISTS "teacher_experiences_teacherId_idx"
    ON "teacher_experiences"("teacherId");

CREATE INDEX IF NOT EXISTS "teacher_experiences_type_idx"
    ON "teacher_experiences"("type");

CREATE INDEX IF NOT EXISTS "teacher_experiences_isActive_idx"
    ON "teacher_experiences"("isActive");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'teacher_experiences_teacherId_fkey'
    ) THEN
        ALTER TABLE "teacher_experiences"
            ADD CONSTRAINT "teacher_experiences_teacherId_fkey"
            FOREIGN KEY ("teacherId") REFERENCES "teachers"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
