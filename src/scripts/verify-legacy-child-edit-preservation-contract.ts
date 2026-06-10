import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/Child_Details.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/Child_Details.js",
  bridge: "src/app/(app)/Child_Details.php/page.tsx",
  detailPage: "src/app/(app)/children/[id]/page.tsx",
  editPage: "src/app/(app)/children/[id]/edit/page.tsx",
  form: "src/components/children/child-form.tsx",
  validation: "src/lib/validations/child.ts",
  actions: "src/lib/actions/children.ts",
  matrix: "docs/page-parity-matrix.json",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('children\.php'\)/);
assert.match(text.legacyPhp, /id="IdImageUpload" src="\.\/images\/EmpPhoto\/default\.jpg"/);
assert.match(text.legacyPhp, /class="btn btn-success btn-circle btn-fill btn-wd btnUpdate">Create Child<\/button>/);
assert.match(text.legacyPhp, /class="btn btn-warning btn-circle btn-fill btn-wd btndraft">Save as Draft<\/button>/);
assert.match(text.legacyPhp, /id="attachment_form"/);
assert.match(text.legacyPhp, /id="map_modal"/);
assert.match(text.legacyPhp, /id="map_canvas"/);

assert.match(text.legacyJs, /function CreateDraft\(\)/);
assert.match(text.legacyJs, /var is_draft = 1/);
assert.match(text.legacyJs, /function Create\(\)/);
assert.match(text.legacyJs, /var is_draft = 0/);
assert.match(text.legacyJs, /formData\.append\('is_draft', is_draft\)/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/addChild'/);
assert.match(text.legacyJs, /getAddressValuesDraft\(\)/);
assert.match(text.legacyJs, /getAddressValues\(\)/);
assert.match(text.legacyJs, /getRelativeValuesDraft\(\)/);
assert.match(text.legacyJs, /getRelativeValues\(\)/);
assert.match(text.legacyJs, /getAccountingValuesDraft\(\)/);
assert.match(text.legacyJs, /getAccountingValues\(\)/);
assert.match(text.legacyJs, /getAttValues\(\)/);
assert.match(text.legacyJs, /latitude/);
assert.match(text.legacyJs, /longitude/);
assert.match(text.legacyJs, /SelectFromMap/);
assert.match(text.legacyJs, /PreviewMap/);
assert.match(text.legacyJs, /sel_generateattachment/);

assert.match(text.bridge, /resolveLegacyChildId\(id\)/);
assert.match(text.bridge, /import ChildDetailPage from "\.\.\/children\/\[id\]\/page"/);
assert.match(text.bridge, /<ChildDetailPage params=\{Promise\.resolve\(\{ id: childId \}\)\} \/>/);
assert.match(text.detailPage, /Form Filled Completely/);
assert.match(text.detailPage, /Form Not Filled Completely/);
assert.match(text.detailPage, /Mandatory Filled Completely/);
assert.match(text.detailPage, /DossierSection title="Child Info"/);
assert.match(text.detailPage, /DossierSection title="Address"/);
assert.match(text.detailPage, /DossierSection title="Parents"/);
assert.match(text.detailPage, /DossierSection title="Brothers And Sisters"/);
assert.match(text.detailPage, /DossierSection title="Authorized Person"/);
assert.match(text.detailPage, /DossierSection title="Previous Garderie"/);
assert.match(text.detailPage, /DossierSection title="Accounting"/);
assert.match(text.detailPage, /DossierSection title="Attachments"/);
assert.doesNotMatch(
  text.detailPage,
  /from "@\/components\/children\/children-columns"/,
);
assert.match(text.detailPage, /legacyString\(address\.legacyData, "Latitude", "latitude"\)/);
assert.match(text.detailPage, /legacyString\(address\.legacyData, "Longitude", "longitude"\)/);
assert.match(text.detailPage, /Preview Location/);

assert.match(text.validation, /const addressSchema = z\.object\(\{[\s\S]*recordId: z\.string\(\)\.uuid\(\)\.optional\(\)/);
assert.match(text.validation, /latitude: z\.string\(\)\.default\(""\)/);
assert.match(text.validation, /longitude: z\.string\(\)\.default\(""\)/);
assert.match(text.validation, /const siblingSchema = z\.object\(\{[\s\S]*recordId: z\.string\(\)\.uuid\(\)\.optional\(\)/);
assert.match(text.validation, /const relativeSchema = z\.object\(\{[\s\S]*recordId: z\.string\(\)\.uuid\(\)\.optional\(\)/);
assert.match(text.validation, /const accountingEntrySchema = z\.object\(\{[\s\S]*recordId: z\.string\(\)\.uuid\(\)\.optional\(\)/);

assert.match(text.editPage, /addresses: \(child\.addresses \?\? \[\]\)\.map\(\(a\) => \(\{[\s\S]*recordId: a\.id/);
assert.match(text.editPage, /latitude: legacyString\(a\.legacyData, "Latitude", "latitude"\)/);
assert.match(text.editPage, /longitude: legacyString\(a\.legacyData, "Longitude", "longitude"\)/);
assert.match(text.editPage, /siblings: \(child\.siblings \?\? \[\]\)\.map\(\(s\) => \(\{[\s\S]*recordId: s\.id/);
assert.match(text.editPage, /relatives: \(child\.relatives \?\? \[\]\)\.map\(\(r\) => \(\{[\s\S]*recordId: r\.id/);
assert.match(text.editPage, /accountingEntries: \(child\.accountingEntries \?\? \[\]\)\.map\(\(entry\) => \(\{[\s\S]*recordId: entry\.id/);

assert.match(text.actions, /addresses: \{ select: \{ id: true, legacyData: true \} \}/);
assert.match(text.actions, /siblings: \{ select: \{ id: true \} \}/);
assert.match(text.actions, /relatives: \{ select: \{ id: true \} \}/);
assert.match(text.actions, /accountingEntries: \{ select: \{ id: true \} \}/);
assert.match(text.actions, /function addressLegacyData\(/);
assert.match(text.actions, /Latitude: latitude/);
assert.match(text.actions, /Longitude: longitude/);
assert.match(text.actions, /const existingAddressIds = new Set/);
assert.match(text.actions, /const existingAddressLegacyData = new Map/);
assert.match(text.actions, /const submittedAddressIds = data\.addresses/);
assert.match(text.actions, /await db\.childAddress\.update\(/);
assert.match(text.actions, /await db\.childAddress\.create\(/);
assert.match(text.actions, /const submittedSiblingIds = data\.siblings/);
assert.match(text.actions, /await db\.childSibling\.update\(/);
assert.match(text.actions, /const submittedRelativeIds = data\.relatives/);
assert.match(text.actions, /await db\.relative\.update\(/);
assert.match(text.actions, /const submittedAccountingEntryIds = data\.accountingEntries/);
assert.match(text.actions, /await db\.accountingEntry\.update\(/);
assert.doesNotMatch(
  text.actions,
  /await db\.childAddress\.deleteMany\(\{\s*where: \{\s*childId: id\s*\}\s*\}\)/,
);
assert.doesNotMatch(
  text.actions,
  /await db\.relative\.deleteMany\(\{\s*where: \{\s*childId: id\s*\}\s*\}\)/,
);
assert.match(text.form, /DRAFT_STORAGE_KEY/);
assert.match(text.form, /Save as Draft/);
assert.match(text.form, /Update Child/);
assert.match(text.form, /Submit Enrollment/);
assert.match(text.form, /register\(`addresses\.\$\{index\}\.recordId`\)/);
assert.match(text.form, /register\(`addresses\.\$\{index\}\.latitude`\)/);
assert.match(text.form, /register\(`addresses\.\$\{index\}\.longitude`\)/);
assert.match(text.form, /Select From Map/);
assert.match(text.form, /Preview Location/);
assert.match(text.form, /register\(`siblings\.\$\{index\}\.recordId`\)/);
assert.match(text.form, /register\(`relatives\.\$\{index\}\.recordId`\)/);
assert.match(text.form, /register\(`accountingEntries\.\$\{index\}\.recordId`\)/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/Child_Details.php, /children/[id]",
);

assert.ok(row);
assert.match(row.status ?? "", /nested edit provenance/);
assert.match(row.status ?? "", /address coordinates restored/);
assert.match(row.verification ?? "", /verify-legacy-child-edit-preservation-contract\.ts/);
assert.match(row.verification ?? "", /preserves existing nested child rows in place/);
assert.match(row.verification ?? "", /map picker/);

console.log("legacy child edit preservation assertions passed");
