import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/newyear.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/newyear.js",
  action: "src/lib/actions/new-year.ts",
  client: "src/app/(app)/settings/new-year/new-year-client.tsx",
  exporter: "src/lib/database-sql-export.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /exportdb\.php\?dbname=/);
assert.match(text.legacyPhp, /Create A new Garderie/);
assert.match(text.legacyPhp, /Optional Imports/);
assert.match(text.legacyPhp, /Mandatory Imports/);
assert.match(text.legacyPhp, /Teachers/);
assert.match(text.legacyPhp, /Children/);

assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/ArchiveAndCreate'/);
for (const field of [
  "newdbname",
  "optional",
  "requiredimports",
  "selectedTeacher",
  "newClassTeacher",
  "selectedChild",
  "newClassChild",
  "newChildSN",
]) {
  assert.match(text.legacyJs, new RegExp(field));
}

assert.match(text.exporter, /export async function createDatabaseSqlDump/);
assert.match(text.exporter, /pg_dump/);
assert.match(text.exporter, /fallbackDump/);

assert.match(text.action, /createDatabaseSqlDump/);
assert.match(text.action, /putObjectFromFile/);
assert.match(text.action, /function legacyArchiveDatabaseName/);
assert.match(text.action, /async function createArchiveSnapshot/);
assert.match(text.action, /legacy-archives/);
assert.match(text.action, /newyear/);
assert.match(text.action, /ArchiveAndCreate/);
assert.match(text.action, /archiveSnapshot = await createArchiveSnapshot/);
assert.match(text.action, /legacyArchiveMode: "sql_snapshot_plus_transactional_progression"/);
assert.match(text.action, /tx\.legacyYearDatabase\.upsert/);
assert.match(text.action, /legacyTable: "ArchiveAndCreate"/);
assert.match(text.action, /archiveAndCreate: archivePayload/);
for (const field of [
  "archiveDatabaseName",
  "legacyCurrentDatabaseName",
  "optional",
  "requiredimports",
  "selectedTeacher",
  "selectedChild",
  "legacyTeacherId",
  "legacyChildId",
  "legacyClassId",
  "childNumber",
  "previousClassId",
  "previousSchoolYearId",
]) {
  assert.match(text.action, new RegExp(field));
}

assert.match(text.client, /href="\/exportdb\.php"/);
assert.match(text.client, /optionalImports/);
assert.match(text.client, /mandatoryImports/);
assert.match(text.client, /generateChildNumber/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/newyear.php",
);
assert.ok(row);
assert.match(row.status ?? "", /archive snapshot/);
assert.match(row.verification ?? "", /ArchiveAndCreate/);
assert.match(row.verification ?? "", /LegacyYearDatabase/);
assert.match(row.verification ?? "", /sql_snapshot_plus_transactional_progression/);
assert.match(row.verification ?? "", /verify-legacy-newyear-archive-contract\.ts/);
assert.doesNotMatch(row.status ?? "", /physical archive\/import parity remains/);
assert.doesNotMatch(row.verification ?? "", /Remaining work is exact destructive/);

const markdownRow = text.matrixMd
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/newyear.php |"));
assert.match(markdownRow ?? "", /archive snapshot/);
assert.match(markdownRow ?? "", /LegacyYearDatabase/);
assert.doesNotMatch(markdownRow ?? "", /physical archive\/import parity remains/);

console.log("legacy newyear archive contract assertions passed");
