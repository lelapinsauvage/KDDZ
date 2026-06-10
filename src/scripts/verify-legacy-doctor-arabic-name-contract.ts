import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  validation: "src/lib/validations/employee.ts",
  action: "src/lib/actions/employees.ts",
  mapper: "src/components/employees/map-employee-to-form.ts",
  form: "src/components/employees/employee-form-client.tsx",
  schema: "prisma/schema.prisma",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [
    key,
    readFileSync(path, "utf8"),
  ]),
) as Record<keyof typeof files, string>;

assert.match(contents.schema, /model Doctor[\s\S]*firstNameAr\s+String\?/);
assert.match(contents.schema, /model Doctor[\s\S]*middleNameAr\s+String\?/);
assert.match(contents.schema, /model Doctor[\s\S]*lastNameAr\s+String\?/);

for (const field of ["firstNameAr", "middleNameAr", "lastNameAr"]) {
  assert.match(contents.validation, new RegExp(`${field}:\\s*z\\.string\\(\\)`));
  assert.match(contents.mapper, new RegExp(`${field}:\\s*emp\\.${field}\\s*\\?\\?\\s*""`));
  assert.match(contents.action, new RegExp(`${field}\\?:\\s*string\\s*\\|\\s*null`));
  assert.match(contents.form, new RegExp(`htmlFor="${field}"`));
  assert.match(contents.form, new RegExp(`\\{\\.\\.\\.register\\("${field}"\\)\\}`));
}

assert.match(contents.form, /supportsArabicName\s*=\s*type\s*===\s*"doctor"\s*\|\|\s*type\s*===\s*"manager"/);
assert.match(contents.action, /if\s*\(type\s*===\s*"doctor"\)\s*\{[\s\S]*createData\.firstNameAr/);
assert.match(contents.action, /if\s*\(type\s*===\s*"doctor"\)\s*\{[\s\S]*updateData\.firstNameAr/);

console.log("legacy doctor Arabic-name contract assertions passed");
