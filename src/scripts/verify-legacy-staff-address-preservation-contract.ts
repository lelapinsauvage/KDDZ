import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin";

const roles = ["Teacher", "Nurse", "Doctor", "Manager"] as const;

const files = {
  validation: "src/lib/validations/employee.ts",
  action: "src/lib/actions/employees.ts",
  mapper: "src/components/employees/map-employee-to-form.ts",
  form: "src/components/employees/employee-form-client.tsx",
  schema: "prisma/schema.prisma",
  matrix: "docs/page-parity-matrix.json",
};

const modern = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

for (const role of roles) {
  const legacyPhp = readFileSync(`${legacyRoot}/${role}_Details.php`, "utf8");
  const legacyJs = readFileSync(`${legacyRoot}/js/${role}_Details.js`, "utf8");

  if (role === "Teacher") {
    assert.match(legacyPhp, /id="address_form"/);
  }
  assert.match(legacyJs, /function generateaddress\(\)/);
  assert.match(legacyJs, /function getAddressValues\(\)/);
  assert.match(legacyJs, /function sel_generateaddress\(\)/);
  assert.match(legacyJs, /address_values\.push/);
  assert.match(legacyJs, /Mouhafaza/);
  assert.match(legacyJs, /Quadaa/);
  assert.match(legacyJs, /Region/);
  assert.match(legacyJs, /City/);
  assert.match(legacyJs, /Street/);
  assert.match(legacyJs, /Building/);
}

assert.match(modern.schema, /model ManagerAddress[\s\S]*governorate\s+String\?/);
assert.match(modern.schema, /model ManagerAddress[\s\S]*district\s+String\?/);
assert.match(modern.schema, /model ManagerAddress[\s\S]*building\s+String\?/);
assert.match(modern.validation, /employeeAddressSchema = z\.object\(\{[\s\S]*id: z\.string\(\)\.optional\(\)/);
assert.match(modern.mapper, /address:\s*\{[\s\S]*id: address\?\.id \?\? undefined/);
assert.match(modern.form, /register\("address\.id"\)/);
assert.match(modern.action, /function staffAddressDelegate\(/);
assert.match(modern.action, /function staffAddressData\(/);
assert.match(modern.action, /function syncStaffAddress\(/);
assert.match(modern.action, /await model\.updateMany\(\{[\s\S]*where: \{ id, \[ownerField\]: employeeId \}/);
assert.match(modern.action, /create: \[staffAddressData\(a\)\]/);
assert.match(modern.action, /await syncStaffAddress\(type, id, data\.address\)/);
assert.doesNotMatch(modern.action, /updateData\.addresses\s*=\s*\{\s*deleteMany/);
assert.doesNotMatch(modern.action, /ManagerAddress has fewer fields/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(modern.matrix) as MatrixRow[];
for (const route of [
  "/Doctor_Details.php, /employees/doctors/[id]",
  "/Manager_Details.php, /employees/managers/[id]",
  "/Nurse_Details.php, /employees/nurses/[id]",
  "/Teacher_Details.php, /employees/teachers/[id]",
]) {
  const row = matrix.find((entry) => entry.modernRoute === route);
  assert.ok(row, `Missing matrix row for ${route}`);
  assert.match(row.status ?? "", /address edit provenance/);
  assert.match(row.verification ?? "", /preserve existing staff address rows in place/);
  assert.match(
    row.verification ?? "",
    /verify-legacy-staff-address-preservation-contract\.ts/,
  );
}

console.log("legacy staff address preservation assertions passed");
