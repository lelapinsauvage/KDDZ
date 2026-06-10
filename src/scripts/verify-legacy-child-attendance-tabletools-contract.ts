import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/child_attend_det.js",
  client: "src/app/(app)/children/[id]/attendance/attendance-client.tsx",
  page: "src/app/(app)/children/[id]/attendance/page.tsx",
  action: "src/lib/actions/attendance.ts",
  fragmentRoute: "src/app/child_attend_det_data.php/route.ts",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyJs, /"sDom":\s*'Tlfrtpi'/);
assert.match(contents.legacyJs, /"oTableTools"/);
assert.match(contents.legacyJs, /"copy"/);
assert.match(contents.legacyJs, /"print"/);
assert.match(contents.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(contents.legacyJs, /'sExtends':\s*'xls'/);
assert.match(contents.legacyJs, /data:\s*\{\s*id:\s*child_id\s*\}/);

assert.match(contents.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(contents.exportButton, /Copy table/);
assert.match(contents.exportButton, /Export as PDF/);

assert.match(contents.client, /const dayColumns = Array\.from\(\{ length: 31 \}/);
assert.match(contents.client, /<ExportButton/);
assert.match(contents.client, /columns=\{exportColumns\}/);
assert.match(contents.client, /data=\{exportData\}/);
assert.match(contents.client, /window\.print\(\)/);
assert.match(contents.client, /P\/A = present \/ absent/);
assert.match(contents.client, /cell\.href/);

assert.match(contents.page, /getChildAttendanceMatrix\(id\)/);
assert.match(contents.action, /Legacy child_attend_det\.php renders one row per month/);
assert.match(contents.action, /child\.schoolYear\?\.startDate\s*\?\?\s*fallback\.startDate/);
assert.match(contents.action, /child\.schoolYear\?\.endDate\s*\?\?\s*fallback\.endDate/);
assert.match(
  contents.action,
  /href:\s*string\s*\|\s*null\s*=\s*`\/daily-reports\/new\?childId=\$\{childId\}&date=\$\{key\}`/,
);
assert.match(contents.action, /href = `\/daily-reports\/\$\{report\.id\}`/);
assert.match(contents.action, /href = `\/absent-reports\/\$\{absence\.id\}`/);

assert.match(contents.fragmentRoute, /readField\(request,\s*"id"\)/);
assert.match(contents.fragmentRoute, /resolveLegacyChildId\(legacyChildId\)/);
assert.match(contents.fragmentRoute, /id="datatable_ajax"/);
assert.match(contents.fragmentRoute, /legacyBadgeHref/);
assert.match(contents.fragmentRoute, /\/dailyreport\.php\?id=/);
assert.match(contents.fragmentRoute, /\/absentreport\.php\?id=/);

assert.match(
  contents.matrix,
  /child_attend_det\.php[\s\S]*Copy\/PDF\/Excel\/CSV export, print action/,
);
assert.match(
  contents.matrix,
  /child_attend_det\.php[\s\S]*verify-legacy-child-attendance-tabletools-contract\.ts/,
);

const markdownRow = contents.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/child_attend_det.php |"));
assert.match(
  markdownRow ?? "",
  /restored - legacy attendance matrix, TableTools export, print, and deep-link bridge restored/,
);
assert.match(markdownRow ?? "", /Copy\/PDF\/Excel\/CSV export, and print action/);
assert.match(markdownRow ?? "", /\/child_attend_det_data\.php/);
assert.match(markdownRow ?? "", /verify-legacy-child-attendance-tabletools-contract\.ts/);
assert.doesNotMatch(markdownRow ?? "", /visual export audit remains/);

console.log("legacy child attendance TableTools contract assertions passed");
