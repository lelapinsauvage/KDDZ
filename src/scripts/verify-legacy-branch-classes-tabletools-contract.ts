import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/classesperbranch.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/classesperbranch.js",
  legacyAsset:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/images/ClassPhoto/default.jpg",
  publicAsset: "public/images/ClassPhoto/default.jpg",
  redirect: "src/app/(app)/classesperbranch.php/page.tsx",
  page: "src/app/(app)/branches/[id]/classes/page.tsx",
  client: "src/components/classes/classes-client.tsx",
  actions: "src/lib/actions/classes.ts",
  actionPermissions: "src/lib/legacy-class-action-permissions.ts",
  guardMap: "src/lib/legacy-page-guards.ts",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path)]),
) as Record<keyof typeof files, Buffer>;

const text = Object.fromEntries(
  Object.entries(contents).map(([key, value]) => [key, value.toString("utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('classes\.php'\)/);
assert.match(text.legacyPhp, /\$_GET\['brid'\]/);
assert.match(text.legacyPhp, /encrypt_decrypt\('decrypt', \$encrid\)/);
assert.match(text.legacyPhp, /window\.location = 'classes\.php'/);
assert.match(text.legacyPhp, /getClassesPerBranch\(\$brid\)/);
assert.match(text.legacyPhp, /<title>Classes For <\?php echo \$classesperbranch\[0\]\['branch_name'\]; \?><\/title>/);
assert.match(text.legacyPhp, /assets\/css\/lightbox\.css/);
assert.match(text.legacyPhp, /Classes Management For Branch: <\?php echo \$classesperbranch\[0\]\['branch_name'\]; \?>/);
assert.match(text.legacyPhp, /<\?php echo \$classesperbranch\[0\]\['branch_name'\]; \?> Branch Classes Listing/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('addClass','ACTION'\)/);
assert.match(text.legacyPhp, /onclick="CreateEmployee\(\)"/);
assert.match(text.legacyPhp, /id="classesperbranch"/);
assert.match(text.legacyPhp, /Image[\s\S]*Class[\s\S]*Language[\s\S]*Max Students[\s\S]*Branch[\s\S]*Date[\s\S]*Action/);
assert.match(text.legacyPhp, /id="chkSelectAllInPage"/);
assert.match(text.legacyPhp, /name="ids"/);
assert.match(text.legacyPhp, /name="name"/);
assert.match(text.legacyPhp, /name="lname"/);
assert.match(text.legacyPhp, /name="dob"/);
assert.match(text.legacyPhp, /<select <\?php if\(isset\(\$brid\)\)\{ echo "disabled"; \} \?> name="content"/);
assert.match(text.legacyPhp, /id="mind1"/);
assert.match(text.legacyPhp, /id="maxd1"/);
assert.match(text.legacyPhp, /id="ClearInputs"/);
assert.match(text.legacyPhp, /images\/ClassPhoto\/<\?php echo \$classb\['image'\]; \?>/);
assert.match(text.legacyPhp, /data-lightbox="image-1"/);
assert.match(text.legacyPhp, /class\.php\?id=<\?php echo \$db->encrypt_decrypt\('encrypt', \$classb\['clid'\]\); \?>/);
assert.match(text.legacyPhp, /delemp\(<\?php echo \$classb\['clid'\]; \?>\)/);

assert.match(text.legacyJs, /function CreateEmployee\(\)[\s\S]*window\.open\("class\.php", '_blank'\)/);
assert.match(text.legacyJs, /\$\('#classesperbranch'\)\.DataTable/);
assert.match(text.legacyJs, /"bSort"\s*:\s*true/);
assert.match(text.legacyJs, /"bSortCellsTop":\s*true/);
assert.match(text.legacyJs, /afnFiltering\.push/);
assert.match(text.legacyJs, /document\.getElementById\('mind1'\)\.value/);
assert.match(text.legacyJs, /document\.getElementById\('maxd1'\)\.value/);
assert.match(text.legacyJs, /var iStartDateCol = 6/);
assert.match(text.legacyJs, /var iEndDateCol = 7/);
assert.match(text.legacyJs, /table\.columns\(\)\.eq\(0\)\.each/);
assert.match(text.legacyJs, /\.form-filter[\s\S]*table\s*\n\s*\.column\(colIdx\)/);
assert.match(text.legacyJs, /#chkSelectAllInPage/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/deleteClass'/);
assert.match(text.legacyJs, /\$\('\.date-picker'\)\.datepicker\(\)/);
assert.match(text.legacyJs, /#ClearInputs/);
assert.match(text.legacyJs, /fnFilter\(''\)/);

assert.deepEqual(contents.publicAsset, contents.legacyAsset);
assert.ok(statSync(files.publicAsset).size > 0);

assert.match(text.redirect, /brid\?: string \| string\[\]/);
assert.match(text.redirect, /redirect\("\/classes"\)/);
assert.match(text.redirect, /resolveLegacyBranchId\(brid\)/);
assert.match(text.redirect, /appendLegacyFilters\(target, params\)/);
assert.match(text.redirect, /"ids"/);
assert.match(text.redirect, /"lname"/);
assert.match(text.redirect, /"dob"/);
assert.match(text.redirect, /"order_date_from"/);
assert.match(text.redirect, /redirect\(`\/branches\/\$\{encodeURIComponent\(branchId\)\}\/classes/);

assert.match(text.page, /getClasses\(\{ branchId: id \}\)/);
assert.match(text.page, /getBranches\(\)/);
assert.match(text.page, /getLegacyClassActionPermissions\(ctx\)/);
assert.match(text.page, /branchId=\{id\}/);
assert.match(text.page, /branchName=\{branchName\}/);
assert.match(text.page, /showBranchColumn/);
assert.match(text.page, /initialSearchQuery=\{firstParam\(query\.q\)\?\.trim\(\) \?\? ""\}/);
assert.match(text.page, /classNumber: firstParam\(query\.ids\)\?\.trim\(\) \?\? ""/);
assert.match(text.page, /language: firstParam\(query\.language\)\?\.trim\(\) \?\? firstParam\(query\.lname\)\?\.trim\(\) \?\? ""/);
assert.match(text.page, /maxStudents: firstParam\(query\.maxStudents\)\?\.trim\(\) \?\? firstParam\(query\.dob\)\?\.trim\(\) \?\? ""/);
assert.match(text.page, /firstParam\(query\.order_date_from\)/);
assert.match(text.page, /firstParam\(query\.order_date_to\)/);

assert.match(text.client, /branchId \? `Classes Management For Branch: \$\{branchLabel\}` : "Classes Listing"/);
assert.match(text.client, /\$\{branchLabel\} Branch Classes Listing/);
assert.match(text.client, /hideBranch=\{!!branchId\}/);
assert.match(text.client, /const branchColumnVisible = showBranchColumn \?\? !branchId/);
assert.match(text.client, /if \(branchId && cls\.branchId !== branchId\) return false/);
assert.match(text.client, /filename=\{branchId \? `classes_\$\{branchLabel\}` : "classes"\}/);
assert.match(text.client, /value=\{branchLabel\}[\s\S]*readOnly[\s\S]*aria-label="Branch"/);
assert.match(text.client, /S\.N\.[\s\S]*Image[\s\S]*Class[\s\S]*Language[\s\S]*Max Students[\s\S]*Branch[\s\S]*Date[\s\S]*Action/);
assert.match(text.client, /const DEFAULT_CLASS_PHOTO = "\/images\/ClassPhoto\/default\.jpg"/);
assert.match(text.client, /return `\/images\/ClassPhoto\/\$\{imageUrl\}`/);
assert.match(text.client, /aria-label=\{`Preview \$\{cls\.name\} image`\}/);
assert.match(text.client, /<Dialog open=\{previewOpen\} onOpenChange=\{setPreviewOpen\}>/);
assert.match(text.client, /<DialogTitle>\{cls\.name\}<\/DialogTitle>/);
assert.match(text.client, /<ExportButton/);
assert.match(text.client, /window\.print\(\)/);
assert.match(text.client, /PAGE_SIZES\.map\(\(size\) =>/);
assert.match(text.client, /size === "ALL" \? "All" : size/);

assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "addClass"\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "updateClass"\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "deleteClass"\)/);
assert.match(text.actions, /verifyBranchAccess\(data\.branchId, ctx\.organizationId\)/);
assert.match(text.actions, /data: \{ isActive: false \}/);
assert.match(text.actionPermissions, /"addClass"/);
assert.match(text.actionPermissions, /"updateClass"/);
assert.match(text.actionPermissions, /"deleteClass"/);

assert.match(text.guardMap, /legacyPage: "classes\.php"[\s\S]*"\/classesperbranch\.php"/);

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
const matrixRow = matrix.find(
  (row) => row.modernRoute === "/classesperbranch.php, /branches/[id]/classes",
);
assert.ok(matrixRow);
assert.equal(
  matrixRow.status,
  "restored - branch-scoped class listing, filters, TableTools export, print, lightbox preview, ACL, bridge, and locked branch table restored",
);
assert.match(
  matrixRow.verification ?? "",
  /verify-legacy-branch-classes-tabletools-contract\.ts/,
);
assert.match(
  matrixRow.verification ?? "",
  /Browser smoke confirmed `\/classesperbranch\.php\?brid=`/,
);

assert.match(
  text.matrixMd,
  /classesperbranch\.php \| Front\/templates\/admin\/js\/classesperbranch\.js \| \/classesperbranch\.php, \/branches\/\[id\]\/classes \| restored - branch-scoped class listing, filters, TableTools export, print, lightbox preview, ACL, bridge, and locked branch table restored/,
);
assert.match(
  text.matrixMd,
  /classesperbranch\.php[\s\S]*Copy\/PDF\/Excel\/CSV export, print, legacy image fallback, clickable image preview\/lightbox/,
);
assert.match(
  text.matrixMd,
  /classesperbranch\.php[\s\S]*Browser smoke confirmed `\/classesperbranch\.php\?brid=`/,
);
assert.match(
  text.matrixMd,
  /classesperbranch\.php[\s\S]*verify-legacy-branch-classes-tabletools-contract\.ts/,
);
assert.doesNotMatch(
  text.matrixMd,
  /classesperbranch\.php[^\n]*visual audit remains/,
);

console.log("legacy branch-scoped classes TableTools contract assertions passed");
