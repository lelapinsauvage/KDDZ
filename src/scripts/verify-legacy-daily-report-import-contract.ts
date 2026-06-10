import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const legacy = {
  dailyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/dailyreport.php`,
    "utf8",
  ),
  dailyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/dailyreport.js`,
    "utf8",
  ),
};

const modern = {
  schema: readFileSync("prisma/schema.prisma", "utf8"),
  importer: readFileSync(
    "src/scripts/migration/migrate-daily-reports.ts",
    "utf8",
  ),
  reconciler: readFileSync(
    "src/scripts/migration/reconcile-migration-counts.ts",
    "utf8",
  ),
  dailyFields: readFileSync("src/lib/legacy-daily-report-fields.ts", "utf8"),
  parentDailyContract: readFileSync("src/lib/parent-daily-contract.ts", "utf8"),
  parentDailyRoute: readFileSync(
    "src/app/api/parent/daily/[childId]/route.ts",
    "utf8",
  ),
  parentDetailedRoute: readFileSync(
    "src/app/api/parent/daily/[childId]/detailed/route.ts",
    "utf8",
  ),
  fieldVerifier: readFileSync(
    "src/scripts/verify-legacy-daily-report-field-contract.ts",
    "utf8",
  ),
  dailyVerifier: readFileSync(
    "src/scripts/verify-parent-daily-contract.ts",
    "utf8",
  ),
  credentialedVerifier: readFileSync(
    "src/scripts/verify-parent-credentialed-native-e2e.ts",
    "utf8",
  ),
  databaseMatrix: readFileSync("docs/database-mapping-matrix.md", "utf8"),
  migrationReadme: readFileSync("src/scripts/migration/README.md", "utf8"),
};

assert.match(legacy.dailyPhp, /dailyreport/i);
assert.match(legacy.dailyJs, /AddAttToDaily/);
for (const token of [
  "reportdate",
  "breakfast_id",
  "bftime",
  "breakf",
  "lunch_id",
  "lntime",
  "lunchf",
  "lunch_id2",
  "lntime2",
  "lunchf2",
  "dessert",
  "dess_portion",
  "desstime",
  "is_sleep",
  "sleep_from",
  "sleep_to",
  "sleep_from1",
  "sleep_to1",
  "sleep_from2",
  "sleep_to2",
  "pantchecked",
  "shirtchecked",
  "tshirthecked",
  "boxerchecked",
  "sockschecked",
  "wipeschecked",
  "brushchecked",
  "towelchecked",
  "diaperschecked",
  "babybottlechecked",
  "milkchecked",
  "is_rep_draft",
]) {
  assert.match(
    `${legacy.dailyPhp}\n${legacy.dailyJs}`,
    new RegExp(token, "i"),
    `legacy daily token ${token}`,
  );
}

const dailyModel =
  /model DailyReport \{[\s\S]*?@@map\("daily_reports"\)/.exec(
    modern.schema,
  )?.[0] ?? "";
for (const field of [
  "childId",
  "reportDate",
  "status",
  "breakfastFoodId",
  "breakfastPortion",
  "breakfastTime",
  "lunchFoodId",
  "lunchPortion",
  "lunchTime",
  "dessert",
  "dessertPortion",
  "dessertTime",
  "isSleep",
  "sleepFrom",
  "sleepTo",
  "diarrhea",
  "urinePotty",
  "stoolPotty",
  "urineDiaper",
  "stoolDiaper",
  "mood",
  "cough",
  "runnyNose",
  "vomit",
  "remarks",
  "legacyData",
]) {
  assert.match(dailyModel, new RegExp(`${field}\\s+`), `DailyReport field ${field}`);
}
assert.match(dailyModel, /@@unique\(\[childId, reportDate\]\)/);

assert.match(modern.importer, /Migration: t_daily_report → DailyReport/);
assert.match(modern.importer, /interface OldDailyReport \{[\s\S]*report_id: number/);
assert.match(modern.importer, /taken_meds\?: string/);
assert.match(modern.importer, /mood2\?: string/);
assert.match(modern.importer, /constipation\?: string \| number/);
assert.match(modern.importer, /sleep_from1\?: string/);
assert.match(modern.importer, /sleep_to2\?: string/);
assert.match(modern.importer, /wipeschecked\?: string \| number/);
assert.match(modern.importer, /function dailyReportLegacyData/);
assert.match(modern.importer, /sourceDatabase,\s*\n\s*sourceTable: "t_daily_report"/);
assert.match(modern.importer, /shouldBackfillDailyReportLegacyData/);
assert.match(modern.importer, /legacyData\.sourceDatabase !== sourceDatabase/);
assert.match(modern.importer, /legacyData\.sourceTable !== "t_daily_report"/);
assert.match(
  modern.importer,
  /SELECT \* FROM t_daily_report WHERE active = 1 ORDER BY report_id/,
);
assert.match(modern.importer, /getMapping\("child", row\.child_id\)/);
assert.match(modern.importer, /parseDate\(row\.reportdate\)/);
assert.match(modern.importer, /where: \{ childId, reportDate \}/);
assert.match(modern.importer, /setMapping\("daily_report", row\.report_id, existing\.id\)/);
assert.match(modern.importer, /reportStatus = toBool\(row\.is_rep_draft\) \? "DRAFT" : "SUBMITTED"/);
assert.match(modern.importer, /breakfastTime: parseTime\(row\.bftime\)/);
assert.match(modern.importer, /breakfastPortion: mapPortionSize\(row\.breakf\)/);
assert.match(modern.importer, /lunchTime: parseTime\(row\.lntime\)/);
assert.match(modern.importer, /lunchPortion: mapPortionSize\(row\.lunchf\)/);
assert.match(modern.importer, /dessert: cleanString\(row\.dessert\)/);
assert.match(modern.importer, /dessertPortion: mapPortionSize\(row\.dess_portion\)/);
assert.match(modern.importer, /isSleep: toBool\(row\.is_sleep\)/);
assert.match(modern.importer, /diarrhea: toBool\(row\.diahria\)/);
assert.match(modern.importer, /mood: cleanString\(row\.mood\)/);
assert.match(modern.importer, /legacyData: dailyReportLegacyData\(row, sourceDatabase\)/);
assert.match(
  modern.importer,
  /Daily Reports: \$\{migrated\} migrated, \$\{skipped\} skipped, \$\{errors\} errors/,
);

assert.match(modern.reconciler, /id: "daily_reports\.t_daily_report"/);
assert.match(modern.reconciler, /sourceTable: "t_daily_report"/);
assert.match(modern.reconciler, /sourceWhere: "active = 1"/);
assert.match(modern.reconciler, /targetTable: "daily_reports"/);
assert.match(modern.reconciler, /targetWhere: byLegacyDataSourceTable\("t_daily_report"\)/);

for (const source of [
  modern.dailyFields,
  modern.parentDailyContract,
  modern.parentDailyRoute,
  modern.parentDetailedRoute,
  modern.fieldVerifier,
  modern.dailyVerifier,
  modern.credentialedVerifier,
]) {
  assert.match(source, /t_daily_report|sourceTable|daily/i);
}
assert.match(modern.dailyFields, /dailyReportLegacyDataPatch/);
assert.match(modern.dailyFields, /dailyReportLegacyProgress/);
assert.match(modern.dailyFields, /d_progress_all/);
assert.match(modern.dailyFields, /lunch_id2/);
assert.match(modern.dailyFields, /sleep_from1/);
assert.match(modern.dailyFields, /wipeschecked/);
assert.match(modern.parentDailyContract, /buildEmptyLegacyDailyPayload/);
assert.match(modern.parentDailyContract, /mapLegacyDailyReport/);
assert.match(modern.parentDailyContract, /mapLegacyDetailedDailyReport/);
assert.match(modern.parentDailyContract, /resolveTakenMedicineNames/);
assert.match(modern.parentDailyContract, /readString\(legacy, \["report_id"\]\)/);
assert.match(modern.parentDailyContract, /readString\(legacy, \["status"\]\) \?\? "present"/);
assert.match(modern.parentDailyContract, /sleep_from1/);
assert.match(modern.parentDailyContract, /sleep_to2/);
assert.match(modern.parentDailyContract, /taken_meds/);
assert.match(modern.parentDailyContract, /medicineNames/);
assert.match(modern.dailyVerifier, /parent daily legacy contract assertions passed/);
assert.match(modern.credentialedVerifier, /ws\/daily\.php/);
assert.match(modern.credentialedVerifier, /ws\/newdaily\.php/);

const rows = modern.databaseMatrix
  .split("\n")
  .filter((line) => line.includes("| t_daily_report |"));
assert.equal(rows.length, 3);
for (const row of rows) {
  assert.match(row, /DailyReport/);
  assert.match(row, /mapped - migrated by migrate-daily-reports\.ts/);
  assert.match(row, /sourceDatabase\/sourceTable inside legacyData/);
  assert.match(row, /raw legacy payload/);
  assert.match(row, /parent mobile `daily\.php`\/`newdaily\.php` parity/);
  assert.match(row, /Daily Reports: migrated\/skipped\/errors/);
  assert.match(row, /daily_reports\.t_daily_report/);
  assert.doesNotMatch(row, /mapped - verify columns\/transforms/);
}

assert.match(modern.migrationReadme, /Daily report rows from `t_daily_report`/);
assert.match(modern.migrationReadme, /DailyReport\.legacyData\.sourceDatabase/);

console.log("legacy daily report import assertions passed");
