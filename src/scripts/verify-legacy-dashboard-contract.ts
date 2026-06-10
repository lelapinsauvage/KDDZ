import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const files = {
  legacyPhp: `${legacyRoot}/Front/templates/admin/index.php`,
  legacyJs: `${legacyRoot}/Front/templates/admin/js/index.js`,
  bridge: "src/app/(app)/index.php/page.tsx",
  dashboardPage: "src/app/(app)/dashboard/page.tsx",
  dashboardHeader: "src/components/dashboard/dashboard-header.tsx",
  dateRangePicker: "src/components/dashboard/date-range-picker.tsx",
  drilldownCard: "src/components/dashboard/dashboard-drilldown-card.tsx",
  dataTable: "src/components/shared/data-table.tsx",
  exportButton: "src/components/shared/export-button.tsx",
  dashboardActions: "src/lib/actions/dashboard.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('index\.php'\)/);
assert.match(text.legacyPhp, /id="db_curr"/);
assert.match(text.legacyPhp, /id="dashboard-report-range"/);
assert.match(text.legacyPhp, /id="new_modal"/);
assert.match(text.legacyPhp, /id="new_modal_p"/);
assert.match(text.legacyPhp, /id="invoice_History"/);
assert.match(text.legacyPhp, /id="year_sel"/);

for (const id of [
  "Tbranches",
  "Tclasses",
  "Tchildren",
  "Tattendance",
  "Tabsence",
  "Tnoreport",
  "Tnoabsencereport",
  "Taccounting",
  "Taccident",
  "Tcalls",
  "MEDREP",
  "MEDREPM",
  "MEDREPD",
  "ASSESS",
  "ASSESSM",
  "ASSESSD",
]) {
  assert.match(text.legacyPhp, new RegExp(`id="${id}"`));
}

assert.match(text.legacyPhp, /onclick="showmod\(\)"/);
assert.match(text.legacyPhp, /onclick="getModal\(1\)"/);
assert.match(text.legacyPhp, /onclick="getModal\(8\)"/);
assert.match(text.legacyPhp, /<script src="js\/index\.js" type="text\/javascript"><\/script>/);

assert.match(text.legacyJs, /getNbEntrance\(starttt, enddd\)/);
assert.match(text.legacyJs, /#year_sel/);
assert.match(text.legacyJs, /#dashboard-report-range/);
assert.match(text.legacyJs, /Today[\s\S]*Yesterday[\s\S]*Last 7 Days[\s\S]*Last 30 Days[\s\S]*This year[\s\S]*Last year/);
assert.match(text.legacyJs, /\/\/ var conn = new ab\.Session/);
assert.match(text.legacyJs, /\/\/ conn\.subscribe\("new_change"\+cat_master/);
assert.match(text.legacyJs, /\/\/ console\.warn\('WebSocket connection closed'\)/);
assert.match(text.legacyJs, /function getModal\(type\)/);
assert.match(text.legacyJs, /url": "\.\.\/\.\.\/\.\.\/ajax\/v1\/getModalHashed"/);
assert.match(text.legacyJs, /type: type/);
assert.match(text.legacyJs, /db_curr : db_curr/);
assert.match(text.legacyJs, /"lengthMenu":\s*\[\s*\[\s*10,\s*20,\s*50,\s*100,\s*150,\s*-1\]/);
assert.match(text.legacyJs, /\[10,\s*20,\s*50,\s*100,\s*150,\s*"All"\]/);
assert.match(text.legacyJs, /"pageLength":\s*10/);

assert.match(text.bridge, /redirect\("\/dashboard"\)/);
assert.match(text.dashboardPage, /parseDateParam\(params\.from\)/);
assert.match(text.dashboardPage, /parseDateParam\(params\.to\)/);
assert.match(text.dashboardPage, /selectedYearId=\{selection\.schoolYearId\}/);
assert.match(text.dashboardPage, /getDashboardDemographics\(branchId, \{ schoolYearId: selection\.schoolYearId \}\)/);
assert.match(text.dashboardPage, /getDailyComplianceStats\(branchId, dashboardFilters\)/);
assert.match(text.dashboardPage, /getActionCenterMetrics\(branchId, dashboardFilters\)/);
assert.match(text.dashboardPage, /const withDashboardFilters = \(href: string\) =>/);
assert.match(text.dashboardPage, /href=\{withDashboardFilters\("\/branches"\)\}/);
assert.match(text.dashboardPage, /href=\{withDashboardFilters\("\/classes"\)\}/);
assert.match(text.dashboardPage, /href=\{withDashboardFilters\("\/children"\)\}/);
assert.match(text.dashboardPage, /drilldownKind="payments"/);
assert.match(text.dashboardPage, /drilldownKind="missingDailyReports"/);
assert.match(text.dashboardPage, /drilldownKind="missingAbsentReports"/);
assert.match(text.dashboardPage, /drilldownKind="medicalReports"/);
assert.match(text.dashboardPage, /drilldownKind="missingMedicalReports"/);
assert.match(text.dashboardPage, /drilldownKind="medicalDrafts"/);
assert.match(text.dashboardPage, /drilldownKind="assessmentReports"/);
assert.match(text.dashboardPage, /drilldownKind="missingAssessments"/);
assert.match(text.dashboardPage, /drilldownKind="assessmentDrafts"/);

for (const label of [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "Last Month",
  "This Month",
  "This year",
  "Last year",
]) {
  assert.match(text.dateRangePicker, new RegExp(escapeRegExp(label)));
}

assert.match(text.dashboardHeader, /selectedYearId/);
assert.match(text.dashboardHeader, /usePathname/);
assert.match(text.dashboardHeader, /router\.replace\(query \? `\$\{pathname\}\?\$\{query\}` : pathname/);
assert.match(text.drilldownCard, /function buildExportColumns/);
assert.match(text.drilldownCard, /\.filter\(\(column\) => column !== "action"\)/);
assert.match(text.drilldownCard, /column === "attachment" \? "attachmentLabel" : column/);
assert.match(text.drilldownCard, /exportOptions=\{\{/);
assert.match(text.drilldownCard, /sheetName: currentDrilldown\.title/);
assert.match(text.drilldownCard, /printOptions=\{\{ label: "Print" \}\}/);
assert.match(text.dataTable, /<ExportButton/);
assert.match(text.dataTable, /onClick=\{handlePrint\}/);
assert.match(text.dataTable, /pageSizeOptions/);
assert.match(text.exportButton, /Copy table/);
assert.match(text.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(text.exportButton, /Export as CSV \(\.csv\)/);
assert.match(text.exportButton, /Export as PDF \(\.pdf\)/);

assert.match(text.dashboardActions, /export async function getDashboardDrilldown/);
assert.match(text.dashboardActions, /return getPaymentDrilldown\(orgId, branchId, range\)/);
assert.match(text.dashboardActions, /kind === "missingDailyReports" \|\| kind === "missingAbsentReports"/);
assert.match(text.dashboardActions, /if \(kind === "assessmentReports"\) return drilldowns\.reports/);
assert.match(text.dashboardActions, /if \(kind === "missingAssessments"\) return drilldowns\.missing/);
assert.match(text.dashboardActions, /return drilldowns\.drafts/);
assert.match(text.dashboardActions, /href: `\/accounting\/invoice\/\$\{payment\.id\}`/);
assert.match(text.dashboardActions, /attachmentLabel/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/index.php, /dashboard",
);

assert.ok(row);
assert.match(row.status ?? "", /restored - legacy dashboard bridge/);
assert.match(row.status ?? "", /drilldown export\/print/);
assert.match(row.verification ?? "", /Legacy `index\.js` WebSocket refresh was commented out/);
assert.match(row.verification ?? "", /Copy\/PDF\/Excel\/CSV export and Print controls/);
assert.match(row.verification ?? "", /Browser smoke/);
assert.match(row.verification ?? "", /verify-legacy-dashboard-contract\.ts/);

const matrixMdRow = text.matrixMd
  .split("\n")
  .find((line) =>
    line.startsWith(
      "| Front/templates/admin/index.php | Front/templates/admin/js/index.js | /index.php, /dashboard |",
    ),
  );

assert.ok(matrixMdRow);
assert.match(matrixMdRow, /restored - legacy dashboard bridge/);
assert.match(matrixMdRow, /Copy\/PDF\/Excel\/CSV export and Print controls/);
assert.doesNotMatch(matrixMdRow, /Remaining work is exact DataTables export\/visual polish/);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("legacy dashboard contract assertions passed");
