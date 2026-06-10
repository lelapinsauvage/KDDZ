import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const client = read("src/app/(app)/settings/holidays/holidays-client.tsx");
const page = read("src/app/(app)/settings/holidays/page.tsx");
const parityRows = JSON.parse(read("docs/page-parity-matrix.json")) as Array<{
  legacyPhp?: string;
  status?: string;
}>;
const parityMatrix = read("docs/page-parity-matrix.md");
const topGaps = read("docs/top-20-restoration-gaps.md");

for (const expected of [
  'type HolidayCalendarView = "month" | "week" | "day"',
  "const CALENDAR_VIEW_MODES",
  '{ value: "month", label: "Month" }',
  '{ value: "week", label: "Week" }',
  '{ value: "day", label: "Day" }',
  "buildHolidayCalendarPath",
  'params.set("view", viewMode)',
  'params.set("date", focusedDate)',
  'data-testid="holiday-calendar-view-controls"',
  'data-testid="holiday-calendar-month-view"',
  'data-testid={`holiday-calendar-${calendarView}-view`}',
  "renderHolidayEvent",
  '`${label}: ${holiday.name}`',
  "Create Holiday",
]) {
  assert.ok(
    client.includes(expected),
    `holiday calendar client should preserve legacy FullCalendar-style behavior: ${expected}`,
  );
}

for (const expected of [
  "view?: string",
  "date?: string",
  'type HolidayCalendarView = "month" | "week" | "day"',
  "function parseDateParam",
  "function parseView",
  "function parseFocusedDate",
  "const parsedDate = parseDateParam(params.date)",
  "parseYear(params.year) ?? parsedDate?.year ?? now.getFullYear()",
  "parseMonth(params.month) ?? parsedDate?.month ?? now.getMonth() + 1",
  "initialViewMode={initialViewMode}",
  "initialFocusedDate={initialFocusedDate}",
]) {
  assert.ok(
    page.includes(expected),
    `holiday calendar page should preserve shareable view/date state: ${expected}`,
  );
}

const holidayCalendarRow = parityRows.find(
  (row) => row.legacyPhp === "Front/templates/admin/holiday_calendar.php",
);
assert.ok(holidayCalendarRow);
assert.match(holidayCalendarRow.status ?? "", /^restored - /);

for (const expected of [
  "AddEditHolidays",
  "Notifications",
  "Repeated",
  "notificationDaysBefore",
  "Browser smoke confirmed `/settings/holidays?view=month&date=2018-11-20`",
  "date-derived month/year behavior",
]) {
  assert.ok(
    parityMatrix.includes(expected),
    `holiday calendar parity row should keep restored modal/action contract: ${expected}`,
  );
}

for (const expected of [
  "/settings/holidays?view=month&date=2018-11-20",
  "migrated `Holiday: Prophet Day`",
]) {
  assert.ok(
    topGaps.includes(expected),
    `top restoration gaps should record holiday calendar browser evidence: ${expected}`,
  );
}

console.log("legacy holiday calendar FullCalendar-style contract assertions passed");
