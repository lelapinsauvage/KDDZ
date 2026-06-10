import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const legacy = {
  dailyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/dailyreport.js`,
    "utf8",
  ),
  absenceJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/absentreport.js`,
    "utf8",
  ),
  dataClass: readFileSync(
    `${legacyRoot}/Front/templates/admin/classes/Data.class.php`,
    "utf8",
  ),
  ajaxRouter: readFileSync(`${legacyRoot}/ajax/v1/index.php`, "utf8"),
};

const modern = {
  schema: readFileSync("prisma/schema.prisma", "utf8"),
  dailyImporter: readFileSync(
    "src/scripts/migration/migrate-daily-reports.ts",
    "utf8",
  ),
  absenceImporter: readFileSync(
    "src/scripts/migration/migrate-absences.ts",
    "utf8",
  ),
  dailyForm: readFileSync(
    "src/components/daily-reports/daily-report-form.tsx",
    "utf8",
  ),
  absenceForm: readFileSync(
    "src/components/absent-reports/absence-report-form.tsx",
    "utf8",
  ),
  dailyActions: readFileSync("src/lib/actions/daily-reports.ts", "utf8"),
  absenceActions: readFileSync("src/lib/actions/absent-reports.ts", "utf8"),
  dailyDetail: readFileSync(
    "src/app/(app)/daily-reports/[id]/detail-client.tsx",
    "utf8",
  ),
  absenceDetail: readFileSync(
    "src/app/(app)/absent-reports/[id]/detail-client.tsx",
    "utf8",
  ),
  dailyBridge: readFileSync("src/app/(app)/dailyreport.php/page.tsx", "utf8"),
  absenceBridge: readFileSync(
    "src/app/(app)/absentreport.php/page.tsx",
    "utf8",
  ),
  databaseMatrix: readFileSync("docs/database-mapping-matrix.md", "utf8"),
  pageMatrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
};

for (const source of [legacy.dailyJs, legacy.absenceJs]) {
  assert.match(source, /ProfileDoc/);
  assert.match(source, /Attachment_title/);
  assert.match(source, /Check_id/);
}
assert.match(legacy.dailyJs, /AddAttToDaily/);
assert.match(legacy.dailyJs, /images\/RepDocs/);
assert.match(legacy.dailyJs, /function generateattachment\(\)/);
assert.match(legacy.dailyJs, /src="\.\/images\/RepDocs\/default\.jpg"/);
assert.match(legacy.dailyJs, /placeholder="Image Title"/);
assert.match(legacy.dailyJs, /function sel_generateattachment\(\)/);
assert.match(legacy.dailyJs, /sel_attachment_values\[i\]\.att_title/);
assert.match(legacy.dailyJs, /sel_attachment_values\[i\]\.rattid/);
assert.match(legacy.dailyJs, /function getAttValues\(\)/);
assert.match(legacy.dailyJs, /attachment_values\.push\(\{ ProfileDoc: profileDoc, Attachment_title: attachment_title, Check_id: check_id\}\)/);
assert.match(legacy.dailyJs, /function deleteattachment\(oc\)/);
assert.match(legacy.dailyJs, /function deleteEletattachment\(\)/);
assert.match(legacy.absenceJs, /AddAttToAbsent/);
assert.match(legacy.absenceJs, /images\/AbsDocs/);

assert.match(legacy.dataClass, /function AddAttToDaily/);
assert.match(legacy.dataClass, /function AddAttToAbsent/);
assert.match(legacy.dataClass, /t_daily_attachments/);
assert.match(legacy.dataClass, /t_absent_attachments/);
assert.match(legacy.dataClass, /RepDocs/);
assert.match(legacy.dataClass, /AbsDocs/);
assert.match(legacy.ajaxRouter, /AddAttToDaily/);
assert.match(legacy.ajaxRouter, /AddAttToAbsent/);

const dailyAttachmentModel =
  /model DailyReportAttachment \{[\s\S]*?@@map\("daily_report_attachments"\)/.exec(
    modern.schema,
  )?.[0] ?? "";
const absenceAttachmentModel =
  /model AbsenceAttachment \{[\s\S]*?@@map\("absence_attachments"\)/.exec(
    modern.schema,
  )?.[0] ?? "";

for (const model of [dailyAttachmentModel, absenceAttachmentModel]) {
  for (const field of [
    "sourceDatabase",
    "legacyKey",
    "legacyId",
    "legacyTable",
    "filename",
    "fileUrl",
  ]) {
    assert.match(model, new RegExp(`${field}\\s+`), `model field ${field}`);
  }
}
assert.match(dailyAttachmentModel, /legacyDailyReportId\s+Int\?/);
assert.match(absenceAttachmentModel, /legacyAbsenceReportId\s+Int\?/);

assert.match(modern.dailyImporter, /interface OldDailyAttachment \{[\s\S]*rattid: number/);
assert.match(modern.dailyImporter, /att_title: string/);
assert.match(modern.dailyImporter, /url: string/);
assert.match(modern.dailyImporter, /formid: string/);
assert.match(modern.dailyImporter, /att_title\s*→ filename/);
assert.match(modern.dailyImporter, /SELECT \* FROM t_daily_attachments WHERE active = 1/);
assert.match(modern.dailyImporter, /legacyKey\(sourceDatabase, "t_daily_attachments", legacyId\)/);
assert.match(modern.dailyImporter, /legacyDailyReportId/);
assert.match(modern.dailyImporter, /filename,\s*\n\s*fileUrl/);
assert.match(modern.dailyImporter, /if \(!dailyReportId \|\| !legacyId\) \{\s*attSkipped\+\+;/);
assert.match(modern.dailyImporter, /if \(!fileUrl\) \{\s*attSkipped\+\+;/);
assert.match(modern.dailyImporter, /Daily Report Attachments: \$\{attCount\} migrated, \$\{attSkipped\} skipped/);

assert.match(modern.absenceImporter, /interface OldAbsenceAttachment \{[\s\S]*rattid: number/);
assert.match(modern.absenceImporter, /att_title: string/);
assert.match(modern.absenceImporter, /url: string/);
assert.match(modern.absenceImporter, /formid: string/);
assert.match(modern.absenceImporter, /datetime: string/);
assert.match(modern.absenceImporter, /SELECT \* FROM t_absent_attachments WHERE active = 1 ORDER BY rattid/);
assert.match(modern.absenceImporter, /legacyKey\(sourceDatabase, "t_absent_attachments", legacyId\)/);
assert.match(modern.absenceImporter, /legacyAbsenceReportId/);
assert.match(modern.absenceImporter, /filename,\s*\n\s*fileUrl,\s*\n\s*createdAt: parseDate\(a\.datetime\)/);
assert.match(modern.absenceImporter, /if \(!absenceReportId \|\| !Number\.isFinite\(legacyId\)\) \{\s*attSkipped\+\+;/);
assert.match(modern.absenceImporter, /if \(!fileUrl\) \{\s*attSkipped\+\+;/);
assert.match(modern.absenceImporter, /Absence Attachments: \$\{attCount\} migrated, \$\{attSkipped\} skipped/);

assert.match(modern.dailyForm, /scope: "daily-report"/);
assert.match(modern.dailyForm, /removeAttachmentIds/);
assert.match(modern.dailyForm, /href=\{attachment\.fileUrl\}/);
assert.match(modern.dailyForm, /visibleExistingAttachments/);
assert.match(modern.dailyForm, /setRemovedAttachmentIds/);
assert.match(modern.dailyForm, /\{attachment\.filename\}/);
assert.match(modern.dailyForm, /attachmentsArray\.append\(\{ title: "", fileName: file\?\.name \?\? "" \}\)/);
assert.match(modern.dailyForm, /\.\.\.register\(`attachments\.\$\{index\}\.title`\)/);
assert.match(modern.dailyForm, /setAttachmentFile\(index, file\)/);
assert.match(modern.dailyForm, /uploadedAttachments\.push\(\{\s*title: \(data\.attachments \?\? \[\]\)\[index\]\?\.title,\s*fileName: file\.name,\s*fileUrl: uploaded\.publicUrl,\s*\}\)/);
assert.match(modern.dailyActions, /dailyAttachmentCreates/);
assert.match(modern.dailyActions, /removeAttachmentIds/);
assert.match(modern.dailyActions, /attachments: true/);
assert.match(modern.dailyActions, /title\?\.\s*trim\(\)\s*\|\|\s*attachment\.fileName\?\.\s*trim\(\)\s*\|\|\s*"attachment"/);
assert.match(modern.dailyDetail, /report\.attachments\.map/);
assert.match(modern.dailyDetail, /href=\{attachment\.fileUrl\}/);

assert.match(modern.absenceForm, /scope: "absence-report"/);
assert.match(modern.absenceForm, /removeAttachmentIds/);
assert.match(modern.absenceForm, /\/images\/AbsDocs\/\$\{fileUrl\}/);
assert.match(modern.absenceActions, /removeAttachmentIds/);
assert.match(modern.absenceActions, /attachments: true/);
assert.match(modern.absenceDetail, /report\.attachments\.map/);
assert.match(modern.dailyBridge, /import DailyReportsPage from "\.\.\/daily-reports\/page"/);
assert.match(
  modern.dailyBridge,
  /return <DailyReportsPage searchParams=\{Promise\.resolve\(\{\}\)\} \/>/,
);
assert.match(
  modern.absenceBridge,
  /import AbsentReportsPage from "\.\.\/absent-reports\/page"/,
);
assert.match(
  modern.absenceBridge,
  /return <AbsentReportsPage searchParams=\{Promise\.resolve\(\{\}\)\} \/>/,
);

const tableExpectations = [
  {
    table: "t_daily_attachments",
    status: /mapped - migrated by migrate-daily-reports\.ts/,
    reportId: /legacy daily report id/,
  },
  {
    table: "t_absent_attachments",
    status: /mapped - migrated by migrate-absences\.ts/,
    reportId: /legacy absence report id/,
  },
];

for (const expectation of tableExpectations) {
  const rows = modern.databaseMatrix
    .split("\n")
    .filter((line) => line.includes(`| ${expectation.table} |`));
  assert.ok(rows.length >= 3, `Expected matrix rows for ${expectation.table}`);
  for (const row of rows) {
    assert.match(row, expectation.status);
    assert.match(row, /sourceDatabase/);
    assert.match(row, /legacyKey/);
    assert.match(row, /legacyId/);
    assert.match(row, /legacyTable/);
    assert.match(row, expectation.reportId);
    assert.match(row, /title\/filename/);
    assert.match(row, /file URL/);
    assert.match(row, /migrated vs skipped counts/);
    assert.doesNotMatch(row, /Needs source count, migrated count, skipped count, orphan report/);
  }
}

type MatrixRow = {
  modernRoute?: string;
  verification?: string;
  status?: string;
};

const pageMatrix = JSON.parse(modern.pageMatrix) as MatrixRow[];
for (const route of [
  "/dailyreport.php, /daily-reports/[id]/edit, /daily-reports/new?childId=",
  "/absentreport.php, /absent-reports/[id]/edit, /absent-reports/new?childId=",
]) {
  const row = pageMatrix.find((entry) => entry.modernRoute === route);
  assert.ok(row, `Missing page matrix row for ${route}`);
  assert.match(row.verification ?? "", /attachment import fidelity/);
  assert.match(
    row.verification ?? "",
    /verify-legacy-report-attachment-import-contract\.ts/,
  );
}

const dailyRow = pageMatrix.find((entry) =>
  entry.modernRoute?.startsWith("/dailyreport.php"),
);
assert.doesNotMatch(dailyRow?.status ?? "", /attachments\/layout audit remains/);
assert.doesNotMatch(dailyRow?.verification ?? "", /attachments audit against `dailyreport\.js`/);
assert.match(dailyRow?.verification ?? "", /`dailyreport\.js` attachment workflow audit/);

console.log("legacy report attachment import assertions passed");
