ALTER TABLE "holidays" ADD COLUMN "notificationDaysBefore" JSONB;

UPDATE "holidays"
SET "notificationDaysBefore" = CASE
  WHEN "daysBefore" > 0 THEN jsonb_build_array("daysBefore")
  ELSE '[]'::jsonb
END
WHERE "notificationDaysBefore" IS NULL;
