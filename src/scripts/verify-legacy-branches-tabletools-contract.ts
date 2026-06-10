import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/branches.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/branches.js",
  legacyAsset:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/images/BranchPhoto/default.jpg",
  publicAsset: "public/images/BranchPhoto/default.jpg",
  bridge: "src/app/(app)/branches.php/page.tsx",
  page: "src/app/(app)/branches/page.tsx",
  client: "src/components/branches/branches-client.tsx",
  form: "src/components/branches/branch-form.tsx",
  actions: "src/lib/actions/branches.ts",
  actionPermissions: "src/lib/legacy-branch-action-permissions.ts",
  guardMap: "src/lib/legacy-page-guards.ts",
  fileRules: "src/scripts/migration/legacy-file-rules.ts",
  migration: "src/scripts/migration/migrate-branches.ts",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path)]),
) as Record<keyof typeof files, Buffer>;

const text = Object.fromEntries(
  Object.entries(contents).map(([key, value]) => [key, value.toString("utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('branches\.php'\)/);
assert.match(text.legacyPhp, /<title>Branches Management<\/title>/);
assert.match(text.legacyPhp, /\$branch = \$db->getBranches\(\)/);
assert.match(text.legacyPhp, /dataTables\.tableTools\.min\.css/);
assert.match(text.legacyPhp, /Branches Management/);
assert.match(text.legacyPhp, /Branches Listing/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('addBranch','ACTION'\)/);
assert.match(text.legacyPhp, /onclick="CreateEmployee\(\)"/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /Image[\s\S]*Branch[\s\S]*Location[\s\S]*Mobile[\s\S]*Info[\s\S]*Date[\s\S]*Action/);
assert.match(text.legacyPhp, /id="chkSelectAllInPage"/);
assert.match(text.legacyPhp, /name="ids"/);
assert.match(text.legacyPhp, /name="name"/);
assert.match(text.legacyPhp, /name="lname"/);
assert.match(text.legacyPhp, /name="dob"/);
assert.match(text.legacyPhp, /id="mind1"/);
assert.match(text.legacyPhp, /id="maxd1"/);
assert.match(text.legacyPhp, /id="ClearInputs"/);

assert.match(text.legacyJs, /function CreateEmployee\(\)[\s\S]*window\.open\("branch\.php", '_blank'\)/);
assert.match(text.legacyJs, /\.date-picker'\)\.datepicker/);
assert.match(text.legacyJs, /var ArrayColumns = \[/);
assert.match(text.legacyJs, /\{"data": "id"\}/);
assert.match(text.legacyJs, /\{"data": "brid"\}/);
assert.match(text.legacyJs, /\{"data": "image"\}/);
assert.match(text.legacyJs, /\{"data": "brname"\}/);
assert.match(text.legacyJs, /\{"data": "brlocation"\}/);
assert.match(text.legacyJs, /\{"data": "mobile"\}/);
assert.match(text.legacyJs, /\{"data": "tel"\}/);
assert.match(text.legacyJs, /\{"data": "datetime"\}/);
assert.match(text.legacyJs, /\{"data": "active"\}/);
assert.match(text.legacyJs, /"lengthMenu":\s*\[\s*\[\s*10,\s*20,\s*50,\s*100,\s*150,\s*-1\]/);
assert.match(text.legacyJs, /\[10,\s*20,\s*50,\s*100,\s*150,\s*"All"\]/);
assert.match(text.legacyJs, /"pageLength":\s*10/);
assert.match(text.legacyJs, /"oTableTools"/);
assert.match(text.legacyJs, /"copy"/);
assert.match(text.legacyJs, /"print"/);
assert.match(text.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(text.legacyJs, /'sExtends':\s*'xls'/);
assert.match(text.legacyJs, /"processing":\s*true/);
assert.match(text.legacyJs, /"serverSide":\s*true/);
assert.match(text.legacyJs, /getbranchestableHashed/);
assert.match(text.legacyJs, /d\.search\.value = 'DATE_RANGE'/);
assert.match(text.legacyJs, /d\.columns\[7\]\.Min_Range = \$\('#mind1'\)\.val\(\)/);
assert.match(text.legacyJs, /d\.columns\[7\]\.Max_Range = strdate1/);
assert.match(text.legacyJs, /"order":\s*\[\s*\[\s*1,\s*"desc"\s*\]/);
assert.match(text.legacyJs, /name=ids[\s\S]*\.column\(1\)/);
assert.match(text.legacyJs, /name=name[\s\S]*\.column\(3\)/);
assert.match(text.legacyJs, /name=lname[\s\S]*\.column\(4\)/);
assert.match(text.legacyJs, /name=dob[\s\S]*\.column\(5\)/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/deleteBranch'/);

assert.deepEqual(contents.publicAsset, contents.legacyAsset);
assert.ok(statSync(files.publicAsset).size > 0);

assert.match(text.bridge, /redirect\("\/branches"\)/);

assert.match(text.page, /requireRole\("ADMIN", "MANAGER"\)/);
assert.match(text.page, /getBranches\(\)/);
assert.match(text.page, /getLegacyBranchActionPermissions\(ctx\)/);
assert.match(text.page, /legacyId: b\.legacyId \?\? null/);
assert.match(text.page, /prefix: b\.prefix \?\? null/);
assert.match(text.page, /telephone: b\.telephone \?\? null/);
assert.match(text.page, /imageUrl: b\.imageUrl \?\? null/);

assert.match(text.client, /const PAGE_SIZES = \["10", "20", "50", "100", "150", "ALL"\] as const/);
assert.match(text.client, /const DEFAULT_BRANCH_PHOTO = "\/images\/BranchPhoto\/default\.jpg"/);
assert.match(text.client, /function branchPhotoSrc\(imageUrl: string \| null\)/);
assert.match(text.client, /if \(!imageUrl \|\| imageUrl === "default\.jpg"\) return DEFAULT_BRANCH_PHOTO/);
assert.match(text.client, /return `\/images\/BranchPhoto\/\$\{imageUrl\}`/);
assert.match(text.client, /onError=\{\(\) => \{[\s\S]*setSrc\(DEFAULT_BRANCH_PHOTO\)/);
assert.match(text.client, /const \[viewMode, setViewMode\] = useState<"table" \| "cards">\("table"\)/);
assert.match(text.client, /const \[statusFilter, setStatusFilter\] = useState<"ACTIVE" \| "INACTIVE" \| "ALL">\("ACTIVE"\)/);
assert.match(text.client, /branchNumber: ""/);
assert.match(text.client, /name: ""/);
assert.match(text.client, /location: ""/);
assert.match(text.client, /mobile: ""/);
assert.match(text.client, /createdFrom: ""/);
assert.match(text.client, /createdTo: ""/);
assert.match(text.client, /<ExportButton[\s\S]*filename="branches"[\s\S]*columns=\{branchExportColumns\}[\s\S]*data=\{filteredBranches as unknown as Record<string, unknown>\[\]\}/);
assert.match(text.client, /window\.print\(\)/);
assert.match(text.client, /<Link href="\/branches\/new">/);
assert.match(text.client, /canAddBranch/);
assert.match(text.client, /canUpdateBranch/);
assert.match(text.client, /canDeleteBranch/);
assert.match(text.client, /deleteBranch\(deleteTarget\.id\)/);
assert.match(text.client, /S\.N\.[\s\S]*Image[\s\S]*Branch[\s\S]*Location[\s\S]*Mobile[\s\S]*Info[\s\S]*Date[\s\S]*Action/);
assert.match(text.client, /placeholder="S\.N\."/);
assert.match(text.client, /placeholder="Branch"/);
assert.match(text.client, /placeholder="Location"/);
assert.match(text.client, /placeholder="Mobile"/);
assert.match(text.client, /aria-label="Created from"/);
assert.match(text.client, /aria-label="Created to"/);
assert.match(text.client, /PAGE_SIZES\.map\(\(size\) =>/);
assert.match(text.client, /size === "ALL" \? "All" : size/);

assert.match(text.form, /const DEFAULT_BRANCH_PHOTO = "\/images\/BranchPhoto\/default\.jpg"/);
assert.match(text.form, /return `\/images\/BranchPhoto\/\$\{imageUrl\}`/);

assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "addBranch"\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "updateBranch"\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "deleteBranch"\)/);
assert.match(text.actions, /data: \{ isActive: false \}/);
assert.match(text.actionPermissions, /"addBranch"/);
assert.match(text.actionPermissions, /"updateBranch"/);
assert.match(text.actionPermissions, /"deleteBranch"/);

assert.match(text.guardMap, /legacyPage: "branches\.php"[\s\S]*"\/branches"[\s\S]*"\/branches\.php"[\s\S]*"\/branch\.php"/);
assert.match(text.guardMap, /patterns: \[\/\^\\\/branches\\\/\[\^\/\]\+\$\/, \/\^\\\/branches\\\/\[\^\/\]\+\\\/edit\$\/\]/);

assert.match(text.fileRules, /legacyTable: "t_branch"/);
assert.match(text.fileRules, /legacyDirectory: "BranchPhoto"/);
assert.match(text.fileRules, /modernDestination: "Branch\.imageUrl"/);
assert.match(text.migration, /Migration: t_branch/);
assert.match(text.migration, /legacyTable: "t_branch"/);
assert.match(text.migration, /legacyId: row\.brid/);
assert.match(text.migration, /phone: row\.mobile \|\| null/);
assert.match(text.migration, /telephone: row\.tel \|\| null/);
assert.match(text.migration, /const imageUrl = cleanLegacyFileName\(row\.image\)/);
assert.match(text.migration, /imageUrl,/);
assert.match(text.migration, /prefix: row\.prefix \|\| null/);
assert.match(text.migration, /isActive: toBool\(row\.active\)/);

assert.match(text.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(text.exportButton, /Copy table/);
assert.match(text.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(text.exportButton, /Export as CSV \(\.csv\)/);
assert.match(text.exportButton, /Export as PDF \(\.pdf\)/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const matrixRow = matrix.find((row) => row.modernRoute === "/branches.php, /branches");
assert.ok(matrixRow);
assert.equal(
  matrixRow.status,
  "restored - legacy branch roster, filters, TableTools export, print, soft delete, ACL, bridge, and default image fallback restored",
);
assert.match(
  matrixRow.verification ?? "",
  /verify-legacy-branches-tabletools-contract\.ts/,
);
assert.match(
  matrixRow.verification ?? "",
  /Browser smoke confirmed `\/branches\.php` redirects to `\/branches`/,
);

console.log("legacy branches TableTools contract assertions passed");
