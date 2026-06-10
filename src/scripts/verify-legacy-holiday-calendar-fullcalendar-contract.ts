import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const client = read("src/app/(app)/settings/holidays/holidays-client.tsx");
const page = read("src/app/(app)/settings/holidays/page.tsx");
const parityMatrix = read("docs/page-parity-matrix.md");

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
  "function parseView",
  "function parseFocusedDate",
  "initialViewMode={initialViewMode}",
  "initialFocusedDate={initialFocusedDate}",
]) {
  assert.ok(
    page.includes(expected),
    `holiday calendar page should preserve shareable view/date state: ${expected}`,
  );
}

for (const expected of [
  "AddEditHolidays",
  "Notifications",
  "Repeated",
  "notificationDaysBefore",
]) {
  assert.ok(
    parityMatrix.includes(expected),
    `holiday calendar parity row should keep restored modal/action contract: ${expected}`,
  );
}

console.log("legacy holiday calendar FullCalendar-style contract assertions passed");
