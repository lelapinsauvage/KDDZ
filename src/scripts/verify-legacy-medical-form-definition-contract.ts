import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const legacy = {
  dataClass: readFileSync(
    `${legacyRoot}/Front/templates/admin/classes/Data.class.php`,
    "utf8",
  ),
  childrenPage: readFileSync(
    `${legacyRoot}/Front/templates/admin/children.php`,
    "utf8",
  ),
  childDraftsPage: readFileSync(
    `${legacyRoot}/Front/templates/admin/children_drafts.php`,
    "utf8",
  ),
  branchesPage: readFileSync(
    `${legacyRoot}/Front/templates/admin/branches.php`,
    "utf8",
  ),
  teachersPage: readFileSync(
    `${legacyRoot}/Front/templates/admin/teachers.php`,
    "utf8",
  ),
};

const modern = {
  schema: readFileSync("prisma/schema.prisma", "utf8"),
  migrationSql: readFileSync(
    "prisma/migrations/20260610004000_add_legacy_medical_form_definitions/migration.sql",
    "utf8",
  ),
  importer: readFileSync("src/scripts/migration/migrate-medical.ts", "utf8"),
  reconciler: readFileSync(
    "src/scripts/migration/reconcile-migration-counts.ts",
    "utf8",
  ),
  databaseMatrix: readFileSync("docs/database-mapping-matrix.md", "utf8"),
  migrationReadme: readFileSync("src/scripts/migration/README.md", "utf8"),
};

assert.match(legacy.dataClass, /function getForms\(\)/);
assert.match(
  legacy.dataClass,
  /select fid, form_name from t_medical_forms where active = 1/,
);
assert.match(legacy.dataClass, /function getFormRef\(\$formid\)/);
assert.match(
  legacy.dataClass,
  /select ref, form_name from t_medical_forms where fid = \$formid/,
);
assert.match(legacy.dataClass, /TRUNCATE `t_medical_forms`/);

for (const source of [
  legacy.childrenPage,
  legacy.childDraftsPage,
  legacy.branchesPage,
  legacy.teachersPage,
]) {
  assert.match(source, /Create a Medical Form/);
  assert.match(source, /id="selForm"/);
  assert.match(source, /\$forms\['forms'\]/);
  assert.match(source, /\$value\['fid'\]/);
  assert.match(source, /\$value\['form_name'\]/);
  assert.match(source, /data-text="<\?= \$value\['form_name'\] \?>"/);
}

const definitionModel =
  /model LegacyMedicalFormDefinition \{[\s\S]*?@@map\("legacy_medical_form_definitions"\)/.exec(
    modern.schema,
  )?.[0] ?? "";

for (const field of [
  "sourceDatabase",
  "legacyKey",
  "legacyId",
  "formName",
  "ref",
  "isActive",
  "legacyData",
  "createdAt",
]) {
  assert.match(definitionModel, new RegExp(`${field}\\s+`), `model field ${field}`);
}
assert.match(definitionModel, /legacyKey\s+String\s+@unique/);

assert.match(modern.migrationSql, /CREATE TABLE "legacy_medical_form_definitions"/);
assert.match(modern.migrationSql, /"sourceDatabase" TEXT NOT NULL/);
assert.match(modern.migrationSql, /"legacyKey" TEXT NOT NULL/);
assert.match(modern.migrationSql, /"legacyId" INTEGER NOT NULL/);
assert.match(modern.migrationSql, /"formName" TEXT NOT NULL/);
assert.match(modern.migrationSql, /"ref" TEXT/);
assert.match(modern.migrationSql, /"isActive" BOOLEAN NOT NULL DEFAULT true/);
assert.match(
  modern.migrationSql,
  /legacy_medical_form_definitions_legacyKey_key/,
);

assert.match(modern.importer, /interface OldMedicalFormDefinition/);
assert.match(modern.importer, /fid: number/);
assert.match(modern.importer, /form_name: string/);
assert.match(modern.importer, /ref: string/);
assert.match(modern.importer, /active: number/);
assert.match(modern.importer, /datetime: string/);
assert.match(modern.importer, /function migrateMedicalFormDefinitions/);
assert.match(modern.importer, /SELECT \* FROM t_medical_forms ORDER BY fid/);
assert.match(modern.importer, /legacyKey\(sourceDatabase, "t_medical_forms", legacyId\)/);
assert.match(modern.importer, /formName = cleanString\(row\.form_name\)/);
assert.match(modern.importer, /if \(!legacyId \|\| !formName\) \{\s*skipped\+\+;/);
assert.match(modern.importer, /prisma\.legacyMedicalFormDefinition\.findUnique/);
assert.match(modern.importer, /sourceDatabase,\s*\n\s*legacyKey: key,\s*\n\s*legacyId/);
assert.match(modern.importer, /formName,\s*\n\s*ref: cleanString\(row\.ref\)/);
assert.match(modern.importer, /isActive: toBool\(row\.active\)/);
assert.match(
  modern.importer,
  /legacyData: legacyRowData\(sourceDatabase, "t_medical_forms", legacyId, row\)/,
);
assert.match(modern.importer, /createdAt: parseDate\(row\.datetime\) \?\? new Date\(\)/);
assert.match(modern.importer, /setMapping\("medical_form_definition", legacyId/);
assert.match(
  modern.importer,
  /t_medical_forms: \$\{migrated\} migrated, \$\{updated\} updated, \$\{skipped\} skipped/,
);
assert.match(
  modern.importer,
  /await migrateMedicalFormDefinitions\(prisma, dryRun, sourceDatabase\)/,
);

assert.match(modern.reconciler, /id: "medical\.t_medical_forms"/);
assert.match(modern.reconciler, /sourceTable: "t_medical_forms"/);
assert.match(modern.reconciler, /targetTable: "legacy_medical_form_definitions"/);
assert.match(modern.reconciler, /Legacy selectable medical form definitions/);
assert.match(modern.reconciler, /form name, ref target/);

const rows = modern.databaseMatrix
  .split("\n")
  .filter((line) => line.includes("| t_medical_forms |"));
assert.equal(rows.length, 3);
for (const row of rows) {
  assert.match(row, /LegacyMedicalFormDefinition/);
  assert.match(row, /mapped - migrated by migrate-medical\.ts/);
  assert.match(row, /sourceDatabase/);
  assert.match(row, /legacyKey/);
  assert.match(row, /legacyId/);
  assert.match(row, /form name/);
  assert.match(row, /ref target/);
  assert.match(row, /active flag/);
  assert.match(row, /migrated vs updated vs skipped counts/);
  assert.match(row, /medical\.t_medical_forms/);
  assert.doesNotMatch(
    row,
    /Needs source count, migrated count, skipped count, orphan report/,
  );
}

assert.match(modern.migrationReadme, /t_medical_forms/);
assert.match(modern.migrationReadme, /LegacyMedicalFormDefinition/);

console.log("legacy medical form definition assertions passed");
