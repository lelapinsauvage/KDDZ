import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/classes.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/classes.js",
  legacyAsset:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/images/ClassPhoto/default.jpg",
  publicAsset: "public/images/ClassPhoto/default.jpg",
  bridge: "src/app/(app)/classes.php/page.tsx",
  page: "src/app/(app)/classes/page.tsx",
  client: "src/components/classes/classes-client.tsx",
  actions: "src/lib/actions/classes.ts",
  actionPermissions: "src/lib/legacy-class-action-permissions.ts",
  guardMap: "src/lib/legacy-page-guards.ts",
  fileRules: "src/scripts/migration/legacy-file-rules.ts",
  migration: "src/scripts/migration/migrate-classes.ts",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path)]),
) as Record<keyof typeof files, Buffer>;

const text = Object.fromEntries(
  Object.entries(contents).map(([key, value]) => [key, value.toString("utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('classes\.php'\)/);
assert.match(text.legacyPhp, /<title>Classes Management<\/title>/);
assert.match(text.legacyPhp, /\$branch = \$db->getBranches\(\)/);
assert.match(text.legacyPhp, /\$forms = \$db->getForms\(\)/);
assert.match(text.legacyPhp, /dataTables\.tableTools\.min\.css/);
assert.match(text.legacyPhp, /Classes Management/);
assert.match(text.legacyPhp, /Classes Listing/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('addClass','ACTION'\)/);
assert.match(text.legacyPhp, /onclick="CreateEmployee\(\)"/);
assert.match(text.legacyPhp, /New Class/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /Image[\s\S]*Class[\s\S]*Language[\s\S]*Max Students[\s\S]*Branch[\s\S]*Date[\s\S]*Action/);
assert.match(text.legacyPhp, /id="chkSelectAllInPage"/);
assert.match(text.legacyPhp, /name="ids"/);
assert.match(text.legacyPhp, /name="name"/);
assert.match(text.legacyPhp, /name="lname"/);
assert.match(text.legacyPhp, /name="dob"/);
assert.match(text.legacyPhp, /id="content"/);
assert.match(text.legacyPhp, /data-text="<\?= \$value\['brname'\] \?>"/);
assert.match(text.legacyPhp, /id="mind1"/);
assert.match(text.legacyPhp, /id="maxd1"/);
assert.match(text.legacyPhp, /id="ClearInputs"/);

assert.match(text.legacyJs, /function CreateEmployee\(\)[\s\S]*window\.open\("class\.php", '_blank'\)/);
assert.match(text.legacyJs, /getBranches\(\)/);
assert.match(text.legacyJs, /\.date-picker'\)\.datepicker/);
assert.match(text.legacyJs, /var ArrayColumns = \[/);
assert.match(text.legacyJs, /\{"data": "id"\}/);
assert.match(text.legacyJs, /\{"data": "clid"\}/);
assert.match(text.legacyJs, /\{"data": "image"\}/);
assert.match(text.legacyJs, /\{"data": "classname"\}/);
assert.match(text.legacyJs, /\{"data": "language"\}/);
assert.match(text.legacyJs, /\{"data": "max_students"\}/);
assert.match(text.legacyJs, /\{"data": "brname"\}/);
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
assert.match(text.legacyJs, /getclassestableHashed/);
assert.match(text.legacyJs, /d\.search\.value = 'DATE_RANGE'/);
assert.match(text.legacyJs, /d\.columns\[7\]\.Min_Range = \$\('#mind1'\)\.val\(\)/);
assert.match(text.legacyJs, /d\.columns\[7\]\.Max_Range = strdate1/);
assert.match(text.legacyJs, /"order":\s*\[\s*\[\s*1,\s*"desc"\s*\]/);
assert.match(text.legacyJs, /name=ids[\s\S]*\.column\(1\)/);
assert.match(text.legacyJs, /name=name[\s\S]*\.column\(3\)/);
assert.match(text.legacyJs, /name=lname[\s\S]*\.column\(4\)/);
assert.match(text.legacyJs, /name=dob[\s\S]*\.column\(5\)/);
assert.match(text.legacyJs, /#content'[\s\S]*table\.column\(6\)/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/deleteClass'/);

assert.deepEqual(contents.publicAsset, contents.legacyAsset);
assert.ok(statSync(files.publicAsset).size > 0);

assert.match(text.bridge, /redirect\("\/classes"\)/);

assert.match(text.page, /requireOrg\(\)/);
assert.match(text.page, /getLegacyClassActionPermissions\(ctx\)/);
assert.match(text.page, /params\.new === "1" && !actionPermissions\.canAddClass/);
assert.match(text.page, /params\.edit && !actionPermissions\.canUpdateClass/);
assert.match(text.page, /getClasses\(\)/);
assert.match(text.page, /getBranches\(\)/);
assert.match(text.page, /legacyId: cls\.legacyId \?\? null/);
assert.match(text.page, /branchName: cls\.branch\?\.name \?\? "Unknown"/);
assert.match(text.page, /language: cls\.language \?\? null/);
assert.match(text.page, /cameraNumber: cls\.cameraNumber \?\? null/);
assert.match(text.page, /imageUrl: cls\.imageUrl \?\? null/);
assert.match(text.page, /initialEditClassId=\{params\.edit\}/);
assert.match(text.page, /initialAddOpen=\{params\.new === "1"\}/);

assert.match(text.client, /const PAGE_SIZES = \["10", "20", "50", "100", "150", "ALL"\] as const/);
assert.match(text.client, /const DEFAULT_CLASS_PHOTO = "\/images\/ClassPhoto\/default\.jpg"/);
assert.match(text.client, /function classPhotoSrc\(imageUrl: string \| null\)/);
assert.match(text.client, /if \(!imageUrl \|\| imageUrl === "default\.jpg"\) return DEFAULT_CLASS_PHOTO/);
assert.match(text.client, /return `\/images\/ClassPhoto\/\$\{imageUrl\}`/);
assert.match(text.client, /onError=\{\(\) => \{[\s\S]*setSrc\(DEFAULT_CLASS_PHOTO\)/);
assert.match(text.client, /const \[viewMode, setViewMode\] = useState<"table" \| "cards">\("table"\)/);
assert.match(text.client, /const \[branchFilter, setBranchFilter\] = useState\(branchId \?\? "ALL"\)/);
assert.match(text.client, /const \[statusFilter, setStatusFilter\] = useState<"ACTIVE" \| "INACTIVE" \| "ALL">\("ACTIVE"\)/);
assert.match(text.client, /classNumber: initialLegacyFilters\?\.classNumber \?\? ""/);
assert.match(text.client, /name: initialLegacyFilters\?\.name \?\? ""/);
assert.match(text.client, /language: initialLegacyFilters\?\.language \?\? ""/);
assert.match(text.client, /maxStudents: initialLegacyFilters\?\.maxStudents \?\? ""/);
assert.match(text.client, /createdFrom: initialLegacyFilters\?\.createdFrom \?\? ""/);
assert.match(text.client, /createdTo: initialLegacyFilters\?\.createdTo \?\? ""/);
assert.match(text.client, /<ExportButton[\s\S]*sheetName="Classes"[\s\S]*columns=\{classExportColumns\}[\s\S]*data=\{filteredClasses as unknown as Record<string, unknown>\[\]\}/);
assert.match(text.client, /window\.print\(\)/);
assert.match(text.client, /New Class/);
assert.match(text.client, /canAddClass/);
assert.match(text.client, /canUpdateClass/);
assert.match(text.client, /canDeleteClass/);
assert.match(text.client, /deleteClass\(deleteTarget\.id\)/);
assert.match(text.client, /S\.N\.[\s\S]*Image[\s\S]*Class[\s\S]*Language[\s\S]*Max Students[\s\S]*Branch[\s\S]*Date[\s\S]*Action/);
assert.match(text.client, /placeholder="S\.N\."/);
assert.match(text.client, /placeholder="Class"/);
assert.match(text.client, /placeholder="Language"/);
assert.match(text.client, /placeholder="Max Students"/);
assert.match(text.client, /aria-label="Created from"/);
assert.match(text.client, /aria-label="Created to"/);
assert.match(text.client, /<SelectItem value="ALL">All Branches<\/SelectItem>/);
assert.match(text.client, /PAGE_SIZES\.map\(\(size\) =>/);
assert.match(text.client, /size === "ALL" \? "All" : size/);

assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "addClass"\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "updateClass"\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "deleteClass"\)/);
assert.match(text.actions, /data: \{ isActive: false \}/);
assert.match(text.actionPermissions, /"addClass"/);
assert.match(text.actionPermissions, /"updateClass"/);
assert.match(text.actionPermissions, /"deleteClass"/);

assert.match(text.guardMap, /legacyPage: "classes\.php"[\s\S]*"\/classes"[\s\S]*"\/classes\.php"[\s\S]*"\/class\.php"/);
assert.match(text.guardMap, /"\/childrenperbranch\.php"/);
assert.match(text.guardMap, /"\/classesperbranch\.php"/);

assert.match(text.fileRules, /id: "class-photo"/);
assert.match(text.fileRules, /legacyTable: "t_class"/);
assert.match(text.fileRules, /legacyDirectory: "ClassPhoto"/);
assert.match(text.fileRules, /modernDestination: "Class\.imageUrl"/);
assert.match(text.migration, /Migration: t_class/);
assert.match(text.migration, /legacyTable: "t_class"/);
assert.match(text.migration, /legacyId: row\.clid/);
assert.match(text.migration, /branchId/);
assert.match(text.migration, /language: row\.class_language \|\| null/);
assert.match(text.migration, /ageFrom/);
assert.match(text.migration, /ageTo/);
assert.match(text.migration, /cameraNumber: toInt\(row\.camera_number, 0\)/);
assert.match(text.migration, /maxStudents/);
assert.match(text.migration, /capacity: maxStudents/);
assert.match(text.migration, /const imageUrl = cleanLegacyFileName\(row\.image\)/);
assert.match(text.migration, /imageUrl,/);
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
const matrixRow = matrix.find((row) => row.modernRoute === "/classes.php, /classes");
assert.ok(matrixRow);
assert.equal(
  matrixRow.status,
  "restored - legacy class roster, filters, TableTools export, print, soft delete, ACL, bridge, and default image fallback restored",
);
assert.match(
  matrixRow.verification ?? "",
  /verify-legacy-classes-tabletools-contract\.ts/,
);
assert.match(
  matrixRow.verification ?? "",
  /Browser smoke confirmed `\/classes\.php` redirects to `\/classes`/,
);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/classes.php |"));
assert.match(
  markdownRow ?? "",
  /restored - legacy class roster, filters, TableTools export, print, soft delete, ACL, bridge, and default image fallback restored/,
);
assert.match(markdownRow ?? "", /public\/images\/ClassPhoto\/default\.jpg/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/classes\.php` redirects to `\/classes`/);
assert.match(markdownRow ?? "", /verify-legacy-classes-tabletools-contract\.ts/);
assert.doesNotMatch(markdownRow ?? "", /visual audit remains/);

console.log("legacy classes TableTools contract assertions passed");
