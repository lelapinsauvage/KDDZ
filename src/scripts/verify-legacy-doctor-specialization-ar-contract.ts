import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";
const legacyPhp = readFileSync(
  `${legacyRoot}/Front/templates/admin/Doctor_Details.php`,
  "utf8",
);
const legacyJs = readFileSync(
  `${legacyRoot}/Front/templates/admin/js/Doctor_Details.js`,
  "utf8",
);

const modern = {
  schema: readFileSync("prisma/schema.prisma", "utf8"),
  migration: readFileSync(
    "prisma/migrations/20260610002000_restore_doctor_arabic_studied_domain/migration.sql",
    "utf8",
  ),
  validation: readFileSync("src/lib/validations/employee.ts", "utf8"),
  action: readFileSync("src/lib/actions/employees.ts", "utf8"),
  mapper: readFileSync("src/components/employees/map-employee-to-form.ts", "utf8"),
  form: readFileSync("src/components/employees/employee-form-client.tsx", "utf8"),
  detail: readFileSync(
    "src/app/(app)/employees/doctors/[id]/doctor-detail-client.tsx",
    "utf8",
  ),
  snapshot: readFileSync("src/components/employees/legacy-staff-snapshot.tsx", "utf8"),
  importer: readFileSync("src/scripts/migration/migrate-garderie-misc.ts", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
};

assert.match(legacyPhp, /id="uni_degree_ar"/);
assert.match(legacyPhp, /placeholder="الاختصاص"/);
assert.match(legacyJs, /var uni_degree_ar = \$\("#uni_degree_ar"\)\.val\(\)/);
assert.match(legacyJs, /formData\.append\('uni_degree_ar', uni_degree_ar\)/);
assert.match(legacyJs, /\$\(("#uni_degree_ar"|'\#uni_degree_ar')\)\.val\(mydata\['emp_det'\]\['uni_degree_ar'\]\)/);

const doctorModel = /model Doctor \{[\s\S]*?@@map\("doctors"\)/.exec(
  modern.schema,
)?.[0] ?? "";
assert.match(doctorModel, /specializationAr\s+String\?/);
assert.match(modern.migration, /"specializationAr"\s+TEXT/);

assert.match(modern.validation, /specializationAr:\s*z\.string\(\)/);
assert.match(modern.mapper, /specializationAr:\s*emp\.specializationAr\s*\?\?\s*""/);
assert.match(
  modern.form,
  /\(type === "doctor" \|\| type === "manager"\)[\s\S]*htmlFor="specializationAr"/,
);
assert.match(modern.form, /\{\.\.\.register\("specializationAr"\)\}/);

assert.match(
  modern.action,
  /if\s*\(type\s*===\s*"doctor"\)\s*\{[\s\S]*createData\.specializationAr/,
);
assert.match(
  modern.action,
  /if\s*\(type\s*===\s*"doctor"\)\s*\{[\s\S]*updateData\.specializationAr/,
);

assert.match(modern.importer, /uni_degree_ar:\s*string/);
assert.match(modern.importer, /specializationAr:\s*cleanString\(row\.uni_degree_ar\)/);
assert.match(modern.detail, /doctor\.specializationAr/);
assert.match(modern.snapshot, /specializationAr\?:\s*string\s*\|\s*null/);
assert.match(modern.snapshot, /Arabic Studied Domain/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(modern.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/Doctor_Details.php, /employees/doctors/[id]",
);
assert.ok(row, "Missing doctor matrix row");
assert.match(row.status ?? "", /Arabic studied-domain field restored/);
assert.match(row.verification ?? "", /`uni_degree_ar`/);
assert.match(row.verification ?? "", /Arabic studied domain/);
assert.match(row.verification ?? "", /verify-legacy-doctor-specialization-ar-contract\.ts/);

console.log("legacy doctor Arabic studied-domain assertions passed");
