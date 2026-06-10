import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const client = read("src/app/(app)/food/calendar/food-calendar-client.tsx");
const page = read("src/app/(app)/food/calendar/page.tsx");
const parityMatrix = read("docs/page-parity-matrix.md");

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
  "function parseView",
  "function parseFocusedDate",
  "initialViewMode={viewMode}",
  "initialFocusedDate={focusedDate}",
]) {
  assert.ok(
    page.includes(expected),
    `food calendar page should preserve shareable view/date state: ${expected}`
  );
}

for (const expected of [
  "FoodAllBranches",
  "AddFoodToCalendar",
  "EditFoodCalendar",
  "Early Dinner",
]) {
  assert.ok(
    parityMatrix.includes(expected),
    `food calendar parity row should keep restored data/action contract: ${expected}`
  );
}

console.log("legacy food calendar FullCalendar-style contract assertions passed");
