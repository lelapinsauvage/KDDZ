import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(isAbsolute(path) ? path : join(root, path), "utf8");
}

const text = {
  legacyPhp: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/class_dashboard.php"),
  legacyJs: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/class_dashboard.js"),
  page: read("src/app/(app)/classes/[id]/page.tsx"),
  bridge: read("src/app/(app)/class_dashboard.php/page.tsx"),
  actions: read("src/lib/actions/classes.ts"),
  matrixMd: read("docs/page-parity-matrix.md"),
  gaps: read("docs/top-20-restoration-gaps.md"),
};

for (const expected of [
  /MED6REP/,
  /MED6REPD/,
  /WREP/,
  /INCOMP/,
  /DREP/,
  /db_curr/,
]) {
  assert.match(text.legacyPhp + text.legacyJs, expected);
}

for (const expected of [
  /Daily Reports/,
  /Medical Reports/,
  /Assessments/,
  /Reports Summary/,
  /Absent Reports/,
  /Medical And Calls Breakdown/,
  /Assessment Summary/,
  /Message Portal/,
]) {
  assert.match(text.page, expected);
}

for (const expected of [
  /getClassDashboard/,
  /dailyReports\.birthdays/,
  /dailyReports\.withoutReport/,
  /medical\.published/,
  /medical\.missing/,
  /assessments\.completed/,
  /assessments\.missing/,
  /row\.assessmentId \? "Open Assessment" : "Create Assessment"/,
]) {
  assert.match(text.page, expected);
}

for (const expected of [
  /resolveLegacyClassId/,
  /redirect\(`\/classes\/\$\{encodeURIComponent\(classId\)\}`\)/,
]) {
  assert.match(text.bridge, expected);
}

for (const expected of [
  /legacyDailyProgress/,
  /legacyNumber/,
  /matchesLegacyMedicalVisitYear/,
  /legacyMedicalVisitDbIds/,
  /legacyYearDatabase/,
]) {
  assert.match(text.actions, expected);
}

const row = text.matrixMd
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/class_dashboard.php |"));

assert.ok(row, "class_dashboard.php parity row should exist");
assert.match(row, /Browser smoke confirmed/);
assert.match(row, /verify-legacy-class-dashboard-visual-smoke-contract\.ts/);
assert.doesNotMatch(
  row,
  /final logged-in visual smoke/,
  "class_dashboard.php parity row should no longer be blocked on local browser smoke",
);

assert.doesNotMatch(
  text.gaps,
  /Class dashboard depth[\s\S]*?Remaining work is re-running\/backfilling legacy imports that happened before `db_id` was preserved and final logged-in visual smoke/,
  "top-gap class dashboard item should no longer list local visual smoke as remaining work",
);
assert.match(text.gaps, /Browser smoke confirmed `\/class_dashboard\.php\?id=` redirects/);

console.log("legacy class dashboard visual smoke contract assertions passed");
