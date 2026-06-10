import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";
const legacyPhp = readFileSync(
  `${legacyRoot}/Front/templates/admin/Manager_Details.php`,
  "utf8",
);
const legacyJs = readFileSync(
  `${legacyRoot}/Front/templates/admin/js/Manager_Details.js`,
  "utf8",
);

const modern = {
  schema: readFileSync("prisma/schema.prisma", "utf8"),
  migration: readFileSync(
    "prisma/migrations/20260610001000_restore_manager_legacy_fields/migration.sql",
    "utf8",
  ),
  validation: readFileSync("src/lib/validations/employee.ts", "utf8"),
  action: readFileSync("src/lib/actions/employees.ts", "utf8"),
  mapper: readFileSync("src/components/employees/map-employee-to-form.ts", "utf8"),
  form: readFileSync("src/components/employees/employee-form-client.tsx", "utf8"),
  detail: readFileSync(
    "src/app/(app)/employees/managers/[id]/manager-detail-client.tsx",
    "utf8",
  ),
  snapshot: readFileSync("src/components/employees/legacy-staff-snapshot.tsx", "utf8"),
  importer: readFileSync("src/scripts/migration/migrate-employees.ts", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
};

for (const id of [
  "username",
  "f_name",
  "f_name_ar",
  "m_name",
  "m_name_ar",
  "l_name",
  "l_name_ar",
  "pob",
  "sel_gender",
  "uni_degree",
  "uni_degree_ar",
]) {
  assert.match(legacyPhp, new RegExp(`id="${id}"`));
}

for (const field of [
  "f_name_ar",
  "m_name",
  "m_name_ar",
  "l_name_ar",
  "pob",
  "sel_gender",
  "uni_degree",
  "uni_degree_ar",
]) {
  assert.match(legacyJs, new RegExp(`var ${field} = \\$\\("#${field}"\\)\\.val\\(\\)`));
  assert.match(legacyJs, new RegExp(`formData\\.append\\('${field}', ${field}\\)`));
}
assert.match(legacyJs, /url: '..\/..\/..\/ajax\/v1\/addManager'/);
assert.match(legacyJs, /url: '..\/..\/..\/ajax\/v1\/updateManager'/);

const managerModel = /model Manager \{[\s\S]*?@@map\("managers"\)/.exec(
  modern.schema,
)?.[0] ?? "";
for (const field of [
  "username",
  "firstNameAr",
  "middleName",
  "middleNameAr",
  "lastNameAr",
  "placeOfBirth",
  "gender",
  "specializationAr",
]) {
  assert.match(managerModel, new RegExp(`${field}\\s+`));
  assert.match(modern.migration, new RegExp(`"${field}"`));
}
assert.match(managerModel, /gender\s+Gender\?/);

for (const field of [
  "firstNameAr",
  "middleName",
  "middleNameAr",
  "lastNameAr",
  "placeOfBirth",
  "specializationAr",
]) {
  assert.match(modern.validation, new RegExp(`${field}:\\s*z\\.string\\(\\)`));
  assert.match(modern.mapper, new RegExp(`${field}:\\s*emp\\.${field}\\s*\\?\\?\\s*""`));
  assert.match(modern.form, new RegExp(`htmlFor="${field}"`));
  assert.match(modern.form, new RegExp(`\\{\\.\\.\\.register\\("${field}"\\)\\}`));
}
assert.match(modern.form, /supportsMiddleName\s*=\s*true/);
assert.match(
  modern.form,
  /supportsArabicName\s*=\s*type\s*===\s*"doctor"\s*\|\|\s*type\s*===\s*"manager"/,
);
assert.match(modern.form, /type === "manager"[\s\S]*htmlFor="specializationAr"/);
assert.match(modern.form, /type === "doctor" \|\| type === "manager" \? "Studied Domain"/);

assert.match(modern.action, /specializationAr\?:\s*string\s*\|\s*null/);
assert.match(modern.action, /if\s*\(type\s*===\s*"manager"\)\s*\{[\s\S]*createData\.firstNameAr/);
assert.match(modern.action, /if\s*\(type\s*===\s*"manager"\)\s*\{[\s\S]*createData\.specializationAr/);
assert.match(modern.action, /if\s*\(type\s*===\s*"manager"\)\s*\{[\s\S]*updateData\.firstNameAr/);
assert.match(modern.action, /if\s*\(type\s*===\s*"manager"\)\s*\{[\s\S]*updateData\.specializationAr/);

assert.match(modern.importer, /f_name_ar:\s*string/);
assert.match(modern.importer, /uni_degree_ar:\s*string/);
assert.match(modern.importer, /firstNameAr:\s*cleanString\(row\.f_name_ar\)/);
assert.match(modern.importer, /middleName:\s*cleanString\(row\.m_name\)/);
assert.match(modern.importer, /lastNameAr:\s*cleanString\(row\.l_name_ar\)/);
assert.match(modern.importer, /placeOfBirth:\s*cleanString\(row\.pob\)/);
assert.match(modern.importer, /gender:\s*mapGender\(row\.sel_gender\)/);
assert.match(modern.importer, /specialization:\s*cleanString\(row\.uni_degree\)/);
assert.match(modern.importer, /specializationAr:\s*cleanString\(row\.uni_degree_ar\)/);

assert.match(modern.detail, /manager\.placeOfBirth/);
assert.match(modern.detail, /manager\.gender/);
assert.match(modern.detail, /manager\.specializationAr/);
assert.match(modern.snapshot, /specializationAr\?:\s*string\s*\|\s*null/);
assert.match(modern.snapshot, /Arabic Studied Domain/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(modern.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/Manager_Details.php, /employees/managers/[id]",
);
assert.ok(row, "Missing manager matrix row");
assert.match(row.status ?? "", /legacy manager field parity restored/);
assert.doesNotMatch(row.verification ?? "", /manager-only legacy fields not yet represented/);
assert.match(row.verification ?? "", /Arabic names/);
assert.match(row.verification ?? "", /Arabic studied domain/);
assert.match(row.verification ?? "", /verify-legacy-manager-fields-contract\.ts/);

console.log("legacy manager field assertions passed");
