-- Preserve legacy assessment eligibility thresholds.
-- Legacy `t_assessment_dates.assessment_date` stores child age in days, not
-- calendar dates, so it maps to this schedule-rule table instead of
-- `assessment_dates.scheduledDate`.

CREATE TABLE "assessment_schedule_rules" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assessmentType" INTEGER NOT NULL,
    "minimumAgeDays" DECIMAL(8,2),
    "maximumAgeDays" DECIMAL(8,2),
    "legacyMinimumId" INTEGER,
    "legacyMaximumId" INTEGER,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_schedule_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assessment_schedule_rules_organizationId_assessmentType_key"
    ON "assessment_schedule_rules"("organizationId", "assessmentType");

CREATE INDEX "assessment_schedule_rules_assessmentType_idx"
    ON "assessment_schedule_rules"("assessmentType");

ALTER TABLE "assessment_schedule_rules"
    ADD CONSTRAINT "assessment_schedule_rules_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
