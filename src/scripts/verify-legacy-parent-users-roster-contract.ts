import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const legacy = {
  php: readFileSync(
    `${legacyRoot}/Front/templates/admin/parent_users.php`,
    "utf8",
  ),
  js: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/parent_users.js`,
    "utf8",
  ),
};

const modern = {
  page: readFileSync(
    "src/app/(app)/settings/parent-users/page.tsx",
    "utf8",
  ),
  client: readFileSync(
    "src/app/(app)/settings/parent-users/parent-users-client.tsx",
    "utf8",
  ),
  actions: readFileSync("src/lib/actions/parent-users.ts", "utf8"),
  legacyBridge: readFileSync(
    "src/app/(app)/parent_users.php/page.tsx",
    "utf8",
  ),
  dataTable: readFileSync("src/components/shared/data-table.tsx", "utf8"),
  exportButton: readFileSync("src/components/shared/export-button.tsx", "utf8"),
  guards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  pageMatrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  pageMatrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

function assertTokens(source: string, tokens: string[], label: string) {
  for (const token of tokens) {
    assert.match(source, new RegExp(token), `${label}: ${token}`);
  }
}

assert.match(legacy.php, /Check::protectPageOrFunction\('parent_users\.php'\)/);
assert.match(legacy.php, /protect\("\*"\)/);
assert.match(legacy.php, /<title>Parents Control<\/title>/);
assert.match(legacy.php, /id="emp_id"/);
assert.match(legacy.php, /Parent System Users Control/);
assert.match(legacy.php, /Children With Parent User/);
assert.match(legacy.php, /id="datatablereg"/);
assert.match(legacy.php, /Children without Parent Users/);
assert.match(legacy.php, /id="datatableab"/);
assert.match(legacy.php, /<th\s*>\s*#\s*<\/th>/);
assert.match(legacy.php, /<th\s*>\s*Name\s*<\/th>/);
assert.match(legacy.php, /<th\s*>\s*Username\s*<\/th>/);
assert.match(legacy.php, /<th\s*>\s*Status\s*<\/th>/);
assert.match(legacy.php, /<th\s*>\s*Branch\s*<\/th>/);
assert.match(legacy.php, /<th\s*>\s*Class\s*<\/th>/);
assert.match(legacy.php, /<th>\s*Action\s*<\/th>/);

assert.match(legacy.js, /src: \$\("#datatablereg"\)/);
assert.match(legacy.js, /getParentsWUserHashed/);
assert.match(legacy.js, /src: \$\("#datatableab"\)/);
assert.match(legacy.js, /getParentsWOUserHashed/);
assert.match(legacy.js, /\[10, 20, 50, 100, 150, -1\]/);
assert.match(legacy.js, /\[10, 20, 50, 100, 150, "All"\]/);
assert.match(legacy.js, /"pageLength": 10/);
assert.match(legacy.js, /"type": "POST"/);
assert.match(legacy.js, /"dataSrc": "aaData"/);
assert.match(legacy.js, /"copy"/);
assert.match(legacy.js, /"print"/);
assert.match(legacy.js, /'sExtends': 'pdf'/);
assert.match(legacy.js, /'sExtends': 'xls'/);
assert.match(legacy.js, /conn\.subscribe\("new_parent_user"\+cat_master/);

assert.match(modern.legacyBridge, /redirect\("\/settings\/parent-users"\)/);
assert.match(modern.guards, /legacyPage: "parent_users\.php"/);
assert.match(
  modern.guards,
  /exact: \["\/settings\/parent-users", "\/parent_users\.php", "\/parent_user\.php"\]/,
);

assert.match(modern.page, /getParentUsers\(\)/);
assert.match(modern.page, /parentUsers: \{ none: \{\} \}/);
assert.match(modern.page, /initialCreateChildId/);
assert.match(modern.page, /childNumber: \(u\.child\?\.childNumber \?\? u\.child\?\.legacyId/);
assert.match(modern.page, /status: \(u\.isActive \? "Active" : "Inactive"\)/);
assert.match(modern.page, /ParentUsersClient/);

assertTokens(
  modern.client,
  [
    "Parent System Users Control",
    "Children With Parent User",
    "Children without Parent Users",
    "withAccountExportColumns",
    "withoutAccountExportColumns",
    "childNumber",
    "childName",
    "username",
    "status",
    "branchName",
    "className",
    "Search #, name, username, status, branch, or class",
    "Search #, name, branch, or class",
    "pageSizeOptions=\\{\\[10, 20, 50, 100, 150, \"all\"\\]\\}",
    "filename=\"children-with-parent-users\"",
    "sheetName=\"Children With Parent User\"",
    "filename=\"children-without-parent-users\"",
    "sheetName=\"Children without Parent Users\"",
    "window\\.print\\(\\)",
    "Create User",
    "Create Parent Account",
    "Username",
    "Password",
    "Status",
    "InActive",
    "toggleParentUserStatus",
    "resetParentPassword",
    "sendParentUserCredentials",
    "Reset \\+ SMS",
    "Reset \\+ WhatsApp",
  ],
  "modern parent-users client",
);

assert.match(modern.actions, /export async function getParentUsers/);
assert.match(modern.actions, /pageSize = 20/);
assert.match(modern.actions, /pageSize !== "all"/);
assert.match(modern.actions, /db\.parentUser\.findMany/);
assert.match(modern.actions, /orderBy: \{ username: "asc" \}/);
assert.match(modern.actions, /export async function createParentUser/);
assert.match(modern.actions, /verifyChildAccess\(data\.childId, orgId\)/);
assert.match(modern.actions, /Username already exists/);
assert.match(modern.actions, /export async function resetParentPassword/);
assert.match(modern.actions, /export async function toggleParentUserStatus/);
assert.match(modern.actions, /export async function sendParentUserCredentials/);
assert.match(modern.actions, /Dear Parent, you can now login to your KiddzOnline account/);
assert.match(modern.actions, /PARENT_CREDENTIALS/);
assert.match(modern.actions, /credentialDelivery/);
assert.match(modern.actions, /channelDeliveryAuditData/);

assert.match(modern.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(modern.exportButton, /Copy table/);
assert.match(modern.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(modern.exportButton, /Export as CSV \(\.csv\)/);
assert.match(modern.exportButton, /Export as PDF \(\.pdf\)/);
assert.match(modern.exportButton, /@react-pdf\/renderer/);
assert.match(modern.dataTable, /pageSizeOptions = \[10, 20, 30, 50, 100\]/);
assert.match(modern.dataTable, /option === "all" \? "All" : option/);
assert.match(modern.dataTable, /Rows:/);

const pageMatrix = JSON.parse(modern.pageMatrix) as Array<{
  legacyPhp: string;
  status: string;
  verification: string;
}>;
const row = pageMatrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/parent_users.php",
);
assert.ok(row, "page parity row for parent_users.php");
assert.match(row.status, /^restored - legacy parent-users roster/);
assert.doesNotMatch(row.verification, /Remaining work/);
assert.match(row.verification, /Browser smoke confirmed/);
assert.match(row.verification, /src\/scripts\/verify-legacy-parent-users-roster-contract\.ts/);
assert.match(modern.pageMatrixMd, /Front\/templates\/admin\/parent_users\.php/);
assert.match(
  modern.pageMatrixMd,
  /restored - legacy parent-users roster, exports, bridge, and roster actions restored/,
);

console.log("Legacy parent-users roster contract verified.");
