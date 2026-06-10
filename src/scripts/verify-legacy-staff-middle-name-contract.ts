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

assert.match(contents.schema, /model Teacher[\s\S]*middleName\s+String\?/);
assert.match(contents.schema, /model Nurse[\s\S]*middleName\s+String\?/);
assert.match(contents.schema, /model Doctor[\s\S]*middleName\s+String\?/);
assert.match(contents.schema, /model Manager[\s\S]*middleName\s+String\?/);

assert.match(contents.validation, /middleName:\s*z\.string\(\)/);
assert.match(contents.mapper, /middleName:\s*emp\.middleName\s*\?\?\s*""/);
assert.match(contents.action, /middleName\?:\s*string\s*\|\s*null/);
assert.match(contents.action, /createData\.middleName\s*=\s*data\.middleName\s*\?\?\s*null/);
assert.match(contents.action, /updateData\.middleName\s*=\s*data\.middleName\s*\|\|\s*null/);
assert.match(contents.form, /supportsMiddleName\s*=\s*true/);
assert.match(contents.form, /htmlFor="middleName"/);
assert.match(contents.form, /\{\.\.\.register\("middleName"\)\}/);

console.log("legacy staff middle-name contract assertions passed");
