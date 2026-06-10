import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyUsers:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/users.php",
  legacyUserControl:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/user-control.php",
  legacyFunctions:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/functions.php",
  modernClient: "src/app/(app)/settings/legacy-users/legacy-users-client.tsx",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyUsers, /include_once\('classes\/edit_user\.class\.php'\)/);
assert.match(text.legacyUsers, /Update user/);
assert.doesNotMatch(text.legacyUsers, /TableTools|CSV|Excel|Export|dataTable/i);

assert.match(text.legacyUserControl, /<div id="user_list">/);
assert.match(text.legacyUserControl, /list_registered\(\)/);
assert.doesNotMatch(text.legacyUserControl, /TableTools|CSV|Excel|Export|dataTable/i);
assert.match(text.legacyFunctions, /function list_registered\(\)/);
assert.match(text.legacyFunctions, /<table class="table">/);
assert.match(text.legacyFunctions, /Username/);
assert.match(text.legacyFunctions, /Name/);
assert.match(text.legacyFunctions, /Email/);
assert.match(text.legacyFunctions, /Registered Date/);
assert.match(text.legacyFunctions, /Last Login/);
assert.doesNotMatch(text.legacyFunctions, /TableTools|CSV|Excel|Export|dataTable/i);

assert.match(text.modernClient, /const legacyUserExportColumns: ExportColumn\[\] = \[/);
for (const header of [
  "Legacy ID",
  "Username",
  "Name",
  "Email",
  "Levels",
  "Source",
  "Branches",
  "Classes",
  "Social Links",
  "Last Login",
  "Login Count",
  "Status",
  "Modern Account",
]) {
  assert.match(text.modernClient, new RegExp(`header: "${header}"`));
}
assert.match(text.modernClient, /const exportRows = useMemo/);
assert.match(text.modernClient, /filteredUsers\.map/);
assert.match(text.modernClient, /filename="legacy-users"/);
assert.match(text.modernClient, /sheetName="Legacy Users"/);
assert.match(text.modernClient, /columns=\{legacyUserExportColumns\}/);
assert.match(text.modernClient, /data=\{exportRows\}/);
assert.match(text.modernClient, /window\.print\(\)/);
assert.match(text.modernClient, /PAGE_SIZE_OPTIONS = \[10, 20, 50, 100, 150\]/);

assert.match(text.exportButton, /Copy table/);
assert.match(text.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(text.exportButton, /Export as CSV \(\.csv\)/);
assert.match(text.exportButton, /Export as PDF \(\.pdf\)/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
for (const legacyPhp of [
  "Front/templates/admin/users/admin/classes/edit_user.class.php",
  "Front/templates/admin/users/admin/users.php",
]) {
  const row = matrix.find((entry) => entry.legacyPhp === legacyPhp);
  assert.ok(row, `${legacyPhp} row exists`);
  assert.match(row.status ?? "", /export/);
  assert.match(row.verification ?? "", /Copy\/Excel\/CSV\/PDF/);
  assert.match(row.verification ?? "", /verify-legacy-admin-user-export-contract\.ts/);
  assert.doesNotMatch(row.verification ?? "", /export remain|export semantics remain/);
}

assert.match(text.markdownMatrix, /verify-legacy-admin-user-export-contract\.ts/);

console.log("legacy admin user export contract assertions passed");
