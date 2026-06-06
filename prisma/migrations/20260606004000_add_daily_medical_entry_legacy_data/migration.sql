ALTER TABLE "daily_reports" ADD COLUMN "legacyData" JSONB;

ALTER TABLE "medical_form_entries" ADD COLUMN "legacyData" JSONB;

CREATE INDEX "medical_form_entries_legacyData_idx" ON "medical_form_entries" USING GIN ("legacyData");
