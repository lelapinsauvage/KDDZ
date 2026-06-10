import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const files = {
  legacyPhp: `${legacyRoot}/Front/templates/admin/Branch_Dashboard.php`,
  legacyJs: `${legacyRoot}/Front/templates/admin/js/Branch_Dashboard.js`,
  bridge: "src/app/(app)/Branch_Dashboard.php/page.tsx",
  page: "src/app/(app)/branches/[id]/dashboard/page.tsx",
  client: "src/components/branches/branch-dashboard-client.tsx",
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

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('Branch_Dashboard\.php'\)/);
assert.match(text.legacyPhp, /id="db_curr"/);
assert.match(text.legacyPhp, /id="branch_id"/);
assert.match(text.legacyPhp, /id="dashboard-report-range"/);
assert.match(text.legacyPhp, /id="year_sel"/);

for (const id of [
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
assert.match(text.legacyPhp, /id="invoice_History"/);
assert.match(text.legacyPhp, /<script src="js\/Branch_Dashboard\.js" type="text\/javascript"><\/script>/);

assert.match(text.legacyJs, /getNbEntrance\(starttt, enddd\)/);
assert.match(text.legacyJs, /#year_sel/);
assert.match(text.legacyJs, /#dashboard-report-range/);
assert.match(text.legacyJs, /Today[\s\S]*Yesterday[\s\S]*Last 7 Days[\s\S]*Last 30 Days[\s\S]*This year[\s\S]*Last year/);
assert.match(text.legacyJs, /\/\/ var conn = new ab\.Session/);
assert.match(text.legacyJs, /\/\/ conn\.subscribe\("new_change"\+cat_master/);
assert.match(text.legacyJs, /\/\/ console\.warn\('WebSocket connection closed'\)/);
assert.match(text.legacyJs, /function getModal\(type\)/);
assert.match(text.legacyJs, /url": "\.\.\/\.\.\/\.\.\/ajax\/v1\/getModalBranchHashed"/);
assert.match(text.legacyJs, /"lengthMenu":\s*\[\s*\[\s*10,\s*20,\s*50,\s*100,\s*150,\s*-1\]/);
assert.match(text.legacyJs, /\[10,\s*20,\s*50,\s*100,\s*150,\s*"All"\]/);
assert.match(text.legacyJs, /"pageLength":\s*10/);
assert.match(text.legacyJs, /function showmod\(\)/);
assert.match(text.legacyJs, /header = \["Date","Child #", "Name", "Last Name","Amount \(\$\)","For","Payment","From","To__","Remakrs","View & Actions","Attachment"\]/);
assert.match(text.legacyJs, /url": "\.\.\/\.\.\/\.\.\/ajax\/v1\/getModal2_pHashed"/);
assert.match(text.legacyJs, /branch: branch_id/);

assert.match(text.bridge, /resolveLegacyBranchId\(id\)/);
assert.match(text.bridge, /redirect\(`\/branches\/\$\{encodeURIComponent\(branchId\)\}\/dashboard`\)/);

assert.match(text.page, /parseDateParam\(params\.from\)/);
assert.match(text.page, /parseDateParam\(params\.to\)/);
assert.match(text.page, /selectedYearId=\{selection\.schoolYearId\}/);
assert.match(text.page, /branchId: id/);
assert.match(text.page, /getDailyComplianceStats\(id, dashboardFilters\)/);
assert.match(text.page, /getActionCenterMetrics\(id, dashboardFilters\)/);

for (const label of [
  "Total Classes",
  "Total Active Children",
  "Total Attendance",
  "Total Absence",
  "Missing Daily Reports",
  "Missing Absent Reports",
  "Total Payments",
  "Accident Reports",
  "Incoming/Outgoing Calls",
  "Total Medical Reports",
  "Missing Medical Reports",
  "Total Drafts",
  "Total Assessments",
  "Missing Assessments",
]) {
  assert.match(text.client, new RegExp(escapeRegExp(label)));
}

assert.match(text.client, /DashboardHeader selectedRange=\{selectedRange\} selectedYearId=\{selectedYearId\}/);
assert.match(text.client, /withDashboardFilters\(`\/branches\/\$\{branchId\}\/classes`\)/);
assert.match(text.client, /withDashboardFilters\(`\/calls\?branch=\$\{branchId\}`\)/);
assert.match(text.client, /drilldownKind="payments"/);
assert.match(text.client, /emptyBranchDashboardDrilldowns/);

assert.match(text.drilldownCard, /function buildExportColumns/);
assert.match(text.drilldownCard, /\.filter\(\(column\) => column !== "action"\)/);
assert.match(text.drilldownCard, /column === "attachment" \? "attachmentLabel" : column/);
assert.match(text.drilldownCard, /dashboardExportFilename\(currentDrilldown\.title\)/);
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
assert.match(text.dashboardActions, /requestedBranchId/);
assert.match(text.dashboardActions, /verifyBranchAccess\(requestedBranchId, orgId\)/);
assert.match(text.dashboardActions, /return getPaymentDrilldown\(orgId, branchId, range\)/);
assert.match(text.dashboardActions, /href: `\/accounting\/invoice\/\$\{payment\.id\}`/);
assert.match(text.dashboardActions, /columns: \[[\s\S]*"date"[\s\S]*"number"[\s\S]*"name"[\s\S]*"lastName"[\s\S]*"amount"[\s\S]*"for"[\s\S]*"type"[\s\S]*"from"[\s\S]*"to"[\s\S]*"remarks"[\s\S]*"action"[\s\S]*"attachment"/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/Branch_Dashboard.php, /branches/[id]/dashboard",
);

assert.ok(row);
assert.match(row.status ?? "", /restored - legacy branch dashboard bridge/);
assert.match(row.status ?? "", /drilldown export\/print/);
assert.match(row.verification ?? "", /Legacy `Branch_Dashboard\.js` WebSocket refresh was commented out/);
assert.match(row.verification ?? "", /Copy\/PDF\/Excel\/CSV export and Print controls/);
assert.match(row.verification ?? "", /Browser smoke/);
assert.match(row.verification ?? "", /verify-legacy-branch-dashboard-contract\.ts/);

const matrixMdRow = text.matrixMd
  .split("\n")
  .find((line) =>
    line.startsWith(
      "| Front/templates/admin/Branch_Dashboard.php | Front/templates/admin/js/Branch_Dashboard.js | /Branch_Dashboard.php, /branches/[id]/dashboard |",
    ),
  );

assert.ok(matrixMdRow);
assert.match(matrixMdRow, /restored - legacy branch dashboard bridge/);
assert.match(matrixMdRow, /Copy\/PDF\/Excel\/CSV export and Print controls/);
assert.doesNotMatch(matrixMdRow, /Remaining work is exact DataTables export\/visual polish/);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("legacy branch dashboard contract assertions passed");
