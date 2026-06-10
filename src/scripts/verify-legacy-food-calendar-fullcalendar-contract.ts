import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const client = read("src/app/(app)/food/calendar/food-calendar-client.tsx");
const page = read("src/app/(app)/food/calendar/page.tsx");
const parityRows = JSON.parse(read("docs/page-parity-matrix.json")) as Array<{
  legacyPhp?: string;
  status?: string;
}>;
const parityMatrix = read("docs/page-parity-matrix.md");
const topGaps = read("docs/top-20-restoration-gaps.md");

for (const expected of [
  'type CalendarViewMode = "month" | "week" | "day"',
  'const VIEW_MODES: { value: CalendarViewMode; label: string }[]',
  '{ value: "month", label: "Month" }',
  '{ value: "week", label: "Week" }',
  '{ value: "day", label: "Day" }',
  'data-testid="food-calendar-view-controls"',
  'data-testid="food-calendar-month-view"',
  'data-testid={`food-calendar-${viewMode}-view`}',
  "replaceCalendarUrl(branch, nextYear, nextMonth, viewMode, nextFocusedDate)",
  'params.set("view", viewMode)',
  'params.set("date", focusedDate)',
  "{meal.label}:",
  'title={`${meal.label}: ${entry.foodName}`}',
  'Add meals',
]) {
  assert.ok(
    client.includes(expected),
    `food calendar client should preserve legacy FullCalendar behavior: ${expected}`
  );
}

for (const expected of [
  "view?: string",
  "date?: string",
  'type CalendarViewMode = "month" | "week" | "day"',
  "function parseDateParam",
  "function parseView",
  "function parseFocusedDate",
  "const parsedDate = parseDateParam(params.date)",
  "parseYear(params.year) ?? parsedDate?.year ?? now.getFullYear()",
  "parseMonth(params.month) ?? parsedDate?.month ?? now.getMonth() + 1",
  "initialViewMode={viewMode}",
  "initialFocusedDate={focusedDate}",
]) {
  assert.ok(
    page.includes(expected),
    `food calendar page should preserve shareable view/date state: ${expected}`
  );
}

const foodCalendarRow = parityRows.find(
  (row) => row.legacyPhp === "Front/templates/admin/food_calendar.php",
);
assert.ok(foodCalendarRow);
assert.match(foodCalendarRow.status ?? "", /^restored - /);

for (const expected of [
  "FoodAllBranches",
  "AddFoodToCalendar",
  "EditFoodCalendar",
  "Early Dinner",
  "Browser smoke confirmed `/food/calendar?branch=...&view=month&date=2018-10-01`",
  "date-derived month/year behavior",
]) {
  assert.ok(
    parityMatrix.includes(expected),
    `food calendar parity row should keep restored data/action contract: ${expected}`
  );
}

for (const expected of [
  "/food/calendar?branch=...&view=month&date=2018-10-01",
  "migrated Breakfast/Lunch rows",
]) {
  assert.ok(
    topGaps.includes(expected),
    `top restoration gaps should record food calendar browser evidence: ${expected}`,
  );
}

console.log("legacy food calendar FullCalendar-style contract assertions passed");
