import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const files = {
  legacy: readFileSync(
    `${legacyRoot}/Front/templates/admin/printFoodCal.php`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/printFoodCal.php/page.tsx", "utf8"),
  page: readFileSync("src/app/(app)/food/calendar/print/page.tsx", "utf8"),
  client: readFileSync(
    "src/app/(app)/food/calendar/print/print-client.tsx",
    "utf8",
  ),
  matrixJson: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
  topGaps: readFileSync("docs/top-20-restoration-gaps.md", "utf8"),
};

for (const expected of [
  "getFoodPrintCalGroupByDate($brid)",
  "defaultDate: <?php echo '\"'.$year.'-'.$month.'-01\"' ?>",
  "Breakfast: <?php echo $breakf; ?>",
  "Lunch: <?php echo $lunch; ?>",
  "Dessert: <?php echo $value['dessert']; ?>",
  "ED: <?php echo $dinner; ?>",
  "window.print();",
  "window.close();",
]) {
  assert.ok(files.legacy.includes(expected), `legacy print source: ${expected}`);
}

for (const expected of [
  "resolveLegacyBranchId(params.brid)",
  'new URLSearchParams({ branch: branchId, autoprint: "1" })',
  'target.set("month", params.month.trim())',
  'target.set("year", params.year.trim())',
  "redirect(`/food/calendar/print?${target.toString()}`)",
]) {
  assert.ok(files.bridge.includes(expected), `legacy bridge: ${expected}`);
}

for (const expected of [
  "autoprint?: string",
  "branch?: string",
  "month?: string",
  "year?: string",
  "parseMonth",
  "parseYear",
  "getBranches()",
  "getFoodCalendarMonth",
  "autoPrint={params.autoprint === \"1\"}",
]) {
  assert.ok(files.page.includes(expected), `print page: ${expected}`);
}

for (const expected of [
  '{ type: "BREAKFAST", label: "B" }',
  '{ type: "LUNCH", label: "L" }',
  '{ type: "DESSERT", label: "D" }',
  '{ type: "SNACK", label: "ED" }',
  "window.history.replaceState(null, \"\", buildPrintPath(branch, year, month))",
  "window.setTimeout(() => window.print(), 250)",
  "Print Food Calendar",
  "Monthly Food Calendar",
  "B = Breakfast",
  "L = Lunch",
  "D = Dessert",
  "ED = Early Dinner",
  "size: landscape",
]) {
  assert.ok(files.client.includes(expected), `print client: ${expected}`);
}

const matrix = JSON.parse(files.matrixJson) as Array<{
  legacyPhp: string;
  modernRoute: string;
  status: string;
  verification: string;
}>;
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/printFoodCal.php",
);
assert.ok(row, "printFoodCal.php matrix row should exist");
assert.equal(row.modernRoute, "/printFoodCal.php, /food/calendar/print");
assert.equal(
  row.status,
  "restored - legacy print food calendar bridge, print state, Early Dinner legend, and browser visual audit restored",
);
for (const expected of [
  "/printFoodCal.php?brid=",
  "raw UUID branch id",
  "Hamra",
  "October 2018",
  "Monthly Food Calendar",
  "B/L/D/ED meal prefixes",
  "ED = Early Dinner",
  "Print Food Calendar",
  "no unexpected browser errors",
  "verify-legacy-print-food-calendar-contract.ts",
]) {
  assert.ok(row.verification.includes(expected), `matrix verification: ${expected}`);
}

const markdownRow =
  files.matrixMd
    .split("\n")
    .find((line) =>
      line.includes("| Front/templates/admin/printFoodCal.php |"),
    ) ?? "";
assert.match(markdownRow, /browser visual audit restored/);
assert.doesNotMatch(markdownRow, /visual audit remains/);

assert.match(files.topGaps, /food calendar surfaces/);
assert.match(files.topGaps, /printFoodCal\.php/);
assert.match(files.topGaps, /Monthly Food Calendar/);

console.log("legacy print food calendar contract verified");
