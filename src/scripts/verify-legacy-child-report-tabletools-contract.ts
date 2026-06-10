import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/child_report.js",
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/child_report.php",
  client: "src/app/(app)/children/[id]/report/report-client.tsx",
  headerContract: "src/lib/legacy-child-report-table-contract.ts",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyJs, /"sDom":\s*'Tlfrtip'/);
assert.match(contents.legacyJs, /"oTableTools"/);
assert.match(contents.legacyJs, /"copy"/);
assert.match(contents.legacyJs, /"print"/);
assert.match(contents.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(contents.legacyJs, /'sExtends':\s*'xls'/);
assert.match(contents.legacyPhp, /onclick="javascript:window\.print\(\);"/);
assert.match(contents.legacyPhp, /id="clickExcel"/);

assert.match(contents.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(contents.exportButton, /Copy table/);
assert.match(contents.exportButton, /Export as PDF/);

assert.match(contents.client, /legacyChildDailyReportHeaderGroups/);
assert.match(contents.client, /<ExportButton/);
assert.match(contents.client, /sheetName="Daily Reports"/);
assert.match(contents.client, /columns=\{exportColumns\}/);
assert.match(contents.client, /data=\{exportRows\(filteredReports\)\}/);
assert.match(contents.client, /window\.print\(\)/);
assert.match(contents.client, /href=\{`\/daily-reports\/\$\{row\.original\.id\}\/print`\}/);

assert.match(contents.headerContract, /BreakFast/);
assert.match(contents.headerContract, /Fever 1/);
assert.match(contents.headerContract, /Fever 2/);
assert.match(contents.headerContract, /T-Shirt/);

assert.match(
  contents.matrix,
  /child_report\.php[\s\S]*Copy\/PDF\/Excel\/CSV export, print action/,
);
assert.match(
  contents.matrix,
  /child_report\.php[\s\S]*verify-legacy-child-report-tabletools-contract\.ts/,
);
assert.match(
  contents.matrix,
  /child_report\.php[\s\S]*verify-child-report-legacy-food-production-audit\.ts/,
);
assert.doesNotMatch(
  contents.matrix,
  /child_report\.php[\s\S]*production-data audit for legacy food ids/,
);
assert.match(
  contents.matrixMd,
  /child_report\.php \| Front\/templates\/admin\/js\/child_report\.js \| \/child_report\.php, \/children\/\[id\]\/report \| restored - legacy daily report matrix, grouped header, legacy field fallbacks, TableTools export, deep-link bridge, and production food-id audit restored/,
);
assert.match(
  contents.matrixMd,
  /child_report\.php[\s\S]*Copy\/PDF\/Excel\/CSV export, print action/,
);
assert.match(
  contents.matrixMd,
  /child_report\.php[\s\S]*verify-legacy-child-report-tabletools-contract\.ts/,
);
assert.match(
  contents.matrixMd,
  /child_report\.php[\s\S]*verify-child-report-legacy-food-production-audit\.ts/,
);

console.log("legacy child report TableTools contract assertions passed");
