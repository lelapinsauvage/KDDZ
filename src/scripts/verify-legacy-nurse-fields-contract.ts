import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";
const legacyPhp = readFileSync(
  `${legacyRoot}/Front/templates/admin/Nurse_Details.php`,
  "utf8",
);
const legacyJs = readFileSync(
  `${legacyRoot}/Front/templates/admin/js/Nurse_Details.js`,
  "utf8",
);

const modern = {
  schema: readFileSync("prisma/schema.prisma", "utf8"),
  migration: readFileSync(
    "prisma/migrations/20260610003000_restore_nurse_legacy_identity_fields/migration.sql",
    "utf8",
  ),
  validation: readFileSync("src/lib/validations/employee.ts", "utf8"),
  action: readFileSync("src/lib/actions/employees.ts", "utf8"),
  mapper: readFileSync("src/components/employees/map-employee-to-form.ts", "utf8"),
  form: readFileSync("src/components/employees/employee-form-client.tsx", "utf8"),
  detail: readFileSync(
    "src/app/(app)/employees/nurses/[id]/nurse-detail-client.tsx",
    "utf8",
  ),
  snapshot: readFileSync("src/components/employees/legacy-staff-snapshot.tsx", "utf8"),
  importer: readFileSync("src/scripts/migration/migrate-employees.ts", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
};

for (const id of [
  "f_name_ar",
  "m_name_ar",
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
assert.match(legacyJs, /url: '..\/..\/..\/ajax\/v1\/addNurse'/);
assert.match(legacyJs, /url: '..\/..\/..\/ajax\/v1\/updateNurse'/);

const nurseModel = /model Nurse \{[\s\S]*?@@map\("nurses"\)/.exec(
  modern.schema,
)?.[0] ?? "";
for (const field of [
  "firstNameAr",
  "middleNameAr",
  "lastNameAr",
  "specializationAr",
]) {
  assert.match(nurseModel, new RegExp(`${field}\\s+String\\?`));
  assert.match(modern.migration, new RegExp(`"${field}"`));
}
assert.match(nurseModel, /middleName\s+String\?/);
assert.match(nurseModel, /placeOfBirth\s+String\?/);
assert.match(nurseModel, /gender\s+Gender\?/);
assert.match(nurseModel, /universityDegree\s+String\?/);
assert.match(nurseModel, /specialization\s+String\?/);

for (const field of [
  "firstNameAr",
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
assert.match(modern.validation, /gender:\s*z\.string\(\)/);
assert.match(modern.form, /supportsArabicName\s*=\s*type\s*===\s*"nurse"\s*\|\|\s*type\s*===\s*"doctor"\s*\|\|\s*type\s*===\s*"manager"/);
assert.match(modern.form, /type === "nurse" \|\| type === "doctor" \|\| type === "manager" \? "Studied Domain"/);
assert.match(
  modern.form,
  /\(type === "nurse" \|\| type === "doctor" \|\| type === "manager"\)[\s\S]*htmlFor="specializationAr"/,
);

assert.match(modern.action, /if\s*\(type\s*===\s*"nurse"\)\s*\{[\s\S]*createData\.firstNameAr/);
assert.match(modern.action, /if\s*\(type\s*===\s*"nurse"\)\s*\{[\s\S]*createData\.specializationAr/);
assert.match(modern.action, /if\s*\(type\s*===\s*"nurse"\)\s*\{[\s\S]*updateData\.firstNameAr/);
assert.match(modern.action, /if\s*\(type\s*===\s*"nurse"\)\s*\{[\s\S]*updateData\.specializationAr/);

for (const field of ["f_name_ar", "m_name_ar", "l_name_ar", "uni_degree_ar"]) {
  assert.match(modern.importer, new RegExp(`${field}:\\s*string`));
}
assert.match(modern.importer, /firstNameAr:\s*cleanString\(row\.f_name_ar\)/);
assert.match(modern.importer, /middleName:\s*cleanString\(row\.m_name\)/);
assert.match(modern.importer, /middleNameAr:\s*cleanString\(row\.m_name_ar\)/);
assert.match(modern.importer, /lastNameAr:\s*cleanString\(row\.l_name_ar\)/);
assert.match(modern.importer, /placeOfBirth:\s*cleanString\(row\.pob\)/);
assert.match(modern.importer, /gender:\s*mapGender\(row\.sel_gender\)/);
assert.match(modern.importer, /universityDegree:\s*cleanString\(row\.uni_degree\)/);
assert.match(modern.importer, /specialization:\s*cleanString\(row\.uni_degree\)/);
assert.match(modern.importer, /specializationAr:\s*cleanString\(row\.uni_degree_ar\)/);

assert.match(modern.detail, /nurse\.placeOfBirth/);
assert.match(modern.detail, /nurse\.gender/);
assert.match(modern.detail, /nurse\.specializationAr/);
assert.match(modern.snapshot, /fullArabicName/);
assert.match(modern.snapshot, /Arabic Studied Domain/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(modern.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/Nurse_Details.php, /employees/nurses/[id]",
);
assert.ok(row, "Missing nurse matrix row");
assert.match(row.status ?? "", /legacy nurse field parity restored/);
assert.match(row.verification ?? "", /Arabic identity/);
assert.match(row.verification ?? "", /Arabic studied domain/);
assert.match(row.verification ?? "", /verify-legacy-nurse-fields-contract\.ts/);

console.log("legacy nurse field assertions passed");
