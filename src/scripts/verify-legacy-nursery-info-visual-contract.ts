import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(isAbsolute(path) ? path : join(root, path), "utf8");
}

const text = {
  legacyPhp: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/nurseryinfo.php"),
  legacyJs: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/nurseryinfo.js"),
  page: read("src/app/(app)/settings/nursery/page.tsx"),
  client: read("src/app/(app)/settings/nursery/nursery-client.tsx"),
  bridge: read("src/app/(app)/nurseryinfo.php/page.tsx"),
  complianceForm: read("src/components/branches/branch-compliance-form.tsx"),
  validation: read("src/lib/validations/branch.ts"),
  actionPermissions: read("src/lib/legacy-nursery-action-permissions.ts"),
  actions: read("src/lib/actions/branch-compliance.ts"),
  settingsActions: read("src/lib/actions/settings.ts"),
  presign: read("src/app/api/uploads/presign/route.ts"),
  localUpload: read("src/app/api/uploads/local/route.ts"),
  attachments: read("src/components/branches/compliance/ministry-attachments-section.tsx"),
  staffCompliance: read("src/components/branches/compliance/staff-compliance-section.tsx"),
  matrixMd: read("docs/page-parity-matrix.md"),
  matrixJson: read("docs/page-parity-matrix.json"),
  topGaps: read("docs/top-20-restoration-gaps.md"),
};

assert.match(text.legacyPhp, /<title>Nursery Info<\/title>/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('nurseryinfo\.php'\)/);
assert.match(text.legacyPhp, /\$db->getgarderieprogress\(\$branch_id\)/);
assert.match(text.legacyPhp, /id="branch_id"/);
assert.match(text.legacyPhp, /الجمهورية اللبنانية/);
assert.match(text.legacyPhp, /وزارة الصحة العامة/);
assert.match(text.legacyPhp, /مديرية الوقاية الطبية/);
assert.match(text.legacyJs, /getteachersContract/);
assert.match(text.legacyJs, /type: 'contract'/);
assert.match(text.legacyJs, /type: 'medical'/);
assert.match(text.legacyJs, /branch_id : \$\("#branch_id"\)\.val\(\)/);

assert.match(text.bridge, /resolveLegacyBranchId\(legacyBranchId\)/);
assert.match(text.bridge, /redirect\("\/settings\/nursery"\)/);
assert.match(text.bridge, /\/settings\/nursery\?branch=\$\{encodeURIComponent\(branchId\)\}/);

for (const expected of [
  /Government Compliance/,
  /Operational Settings/,
  /BranchComplianceForm/,
  /NurseryClient/,
  /getCompliance\(branchId\)/,
  /getDocuments\(branchId\)/,
  /getStaffForCompliance\(branchId\)/,
  /getLegacyNurseryActionPermissions/,
  /canUpdateNurseryInfo=\{nurseryPermissions\.canUpdateNurseryInfo\}/,
]) {
  assert.match(text.page, expected);
}

for (const expected of [
  /الجمهورية اللبنانية/,
  /وزارة الصحة العامة/,
  /مديرية الوقاية الطبية/,
  /calculateCompletionPercentage/,
  /calculateSectionCompletion/,
  /LegalEntitySection/,
  /OwnerInfoSection/,
  /NurseryNameSection/,
  /NurseryAddressSection/,
  /PropertyLeaseSection/,
  /ManagementSection/,
  /CapacitySection/,
  /InsuranceSection/,
  /StaffComplianceSection/,
  /MinistryAttachmentsSection/,
  /حفظ البيانات/,
]) {
  assert.match(text.complianceForm, expected);
}

for (const expected of [
  /معلومات عن صاحب العلاقة/,
  /اسم الحضانة/,
  /عنوان الحضانة/,
  /الملكية أو سند الإيجار المصدق/,
  /الإدارة/,
  /السعة/,
  /الضمان/,
  /مستندات الموظفين/,
  /المستندات المطلوبة/,
  /ownerFirstName/,
  /governorate/,
  /directorFirstName/,
  /totalChildren/,
  /insuranceCompany/,
]) {
  assert.match(text.validation, expected);
}

assert.match(text.attachments, /REQUIRED_DOCS/);
assert.match(text.attachments, /المستندات المطلوبة من وزارة الصحة/);
assert.match(text.attachments, /صورة شمسية لصاحب الطلب/);
assert.match(text.attachments, /خريطة للبناء/);
assert.match(text.attachments, /النظام الداخلي لدار الحضانة/);
assert.match(text.attachments, /صورة عن رخصة الطبيب المسؤول/);
assert.match(text.attachments, /scope: "compliance-document"/);
assert.match(text.attachments, /upsertDocument\(branchId/);
assert.match(text.attachments, /if \(!canUpdate\)/);
assert.match(text.staffCompliance, /عقود العمل لموظفي الحضانة/);
assert.match(text.staffCompliance, /شهادة صحية لموظفي الحضانة/);
assert.match(text.staffCompliance, /إفادات الإسعاف الأولي/);

assert.match(text.actionPermissions, /LEGACY_NURSERY_ACTION_NAMES = \["Upnurseryinfo"\]/);
assert.match(text.actions, /requireLegacyActionAllowed\(res\.ctx, "Upnurseryinfo"\)/);
assert.match(text.settingsActions, /requireLegacyActionAllowed\(ctx, "Upnurseryinfo"\)/);
assert.match(text.presign, /scope === "compliance-document"/);
assert.match(text.presign, /requireLegacyActionAllowed\(auth\.ctx, "Upnurseryinfo"\)/);
assert.match(text.localUpload, /uploadScopeFromKey\(key\) === "compliance-document"/);
assert.match(text.localUpload, /requireLegacyActionAllowed\(auth\.ctx, "Upnurseryinfo"\)/);

assert.match(text.client, /General Information/);
assert.match(text.client, /Government Registration/);
assert.match(text.client, /Owner Information/);
assert.match(text.client, /Nursery Identity/);
assert.match(text.client, /Location/);
assert.match(text.client, /Working Hours/);
assert.match(text.client, /Notifications/);
assert.match(text.client, /Save Settings/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrixJson) as MatrixRow[];
const row = matrix.find((entry) => entry.legacyPhp === "Front/templates/admin/nurseryinfo.php");
assert.ok(row, "nurseryinfo.php matrix row should exist");
assert.equal(
  row.status,
  "restored - government compliance workflow, legacy branch bridge, Upnurseryinfo guard, storage upload path, and visual smoke restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed/);
assert.match(row.verification ?? "", /Government Compliance/);
assert.match(row.verification ?? "", /Operational Settings/);
assert.match(row.verification ?? "", /storage-provider-backed upload route/);
assert.doesNotMatch(row.verification ?? "", /exact legacy visual\/finalization audit/);
assert.doesNotMatch(row.verification ?? "", /Remaining work is final production data\/provider acceptance/);

const mdRow = text.matrixMd
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/nurseryinfo.php |")) ?? "";
assert.match(
  mdRow,
  /restored - government compliance workflow, legacy branch bridge, Upnurseryinfo guard, storage upload path, and visual smoke restored/,
);
assert.match(mdRow, /verify-legacy-nursery-info-visual-contract\.ts/);
assert.doesNotMatch(mdRow, /exact legacy visual\/finalization audit/);
assert.doesNotMatch(mdRow, /Remaining work is final production data\/provider acceptance/);

assert.match(text.topGaps, /nurseryinfo\.php` \/ `nurseryinfo\.js` parity audit/);
assert.match(text.topGaps, /verify-legacy-nursery-info-visual-contract\.ts/);
assert.doesNotMatch(
  text.topGaps,
  /Remaining work is exact `nurseryinfo\.php` \/ `nurseryinfo\.js` visual audit/,
);

console.log("legacy nursery info visual contract assertions passed");
