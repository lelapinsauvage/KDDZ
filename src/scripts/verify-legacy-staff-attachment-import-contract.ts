import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const legacy = {
  teacherPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/Teacher_Details.php`,
    "utf8",
  ),
  teacherJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/Teacher_Details.js`,
    "utf8",
  ),
  nursePhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/Nurse_Details.php`,
    "utf8",
  ),
  nurseJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/Nurse_Details.js`,
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
  importer: readFileSync("src/scripts/migration/migrate-employees.ts", "utf8"),
  form: readFileSync("src/components/employees/employee-form-client.tsx", "utf8"),
  mapper: readFileSync("src/components/employees/map-employee-to-form.ts", "utf8"),
  actions: readFileSync("src/lib/actions/employees.ts", "utf8"),
  staffAttachments: readFileSync(
    "src/components/employees/staff-attachments-section.tsx",
    "utf8",
  ),
  teacherDetail: readFileSync(
    "src/app/(app)/employees/teachers/[id]/teacher-detail-client.tsx",
    "utf8",
  ),
  nurseDetail: readFileSync(
    "src/app/(app)/employees/nurses/[id]/nurse-detail-client.tsx",
    "utf8",
  ),
  databaseMatrix: readFileSync("docs/database-mapping-matrix.md", "utf8"),
  pageMatrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
};

assert.match(legacy.teacherPhp, /Teacher_Details\.js/);
assert.match(legacy.nursePhp, /Nurse_Details\.js/);

for (const source of [legacy.teacherJs, legacy.nurseJs]) {
  assert.match(source, /Attachment_title/);
  assert.match(source, /ProfileDoc/);
  assert.match(source, /Check_id/);
  assert.match(source, /AddAttToTeacher|AddAttToNurse/);
}

assert.match(legacy.dataClass, /function AddAttToTeacher/);
assert.match(legacy.dataClass, /function AddAttToTeacherN/);
assert.match(legacy.dataClass, /function AddAttToTeacherNN/);
assert.match(legacy.dataClass, /function AddAttToNurseN/);
assert.match(legacy.dataClass, /t_teacher_attachments/);
assert.match(legacy.dataClass, /t_nurse_attachments/);
assert.match(legacy.dataClass, /att_title/);
assert.match(legacy.dataClass, /exp_date/);
assert.match(legacy.ajaxRouter, /AddAttToTeacher/);
assert.match(legacy.ajaxRouter, /AddAttToTeacherN/);
assert.match(legacy.ajaxRouter, /AddAttToTeacherNN/);
assert.match(legacy.ajaxRouter, /AddAttToNurseN/);

const teacherAttachmentModel =
  /model TeacherAttachment \{[\s\S]*?@@map\("teacher_attachments"\)/.exec(
    modern.schema,
  )?.[0] ?? "";
const nurseAttachmentModel =
  /model NurseAttachment \{[\s\S]*?@@map\("nurse_attachments"\)/.exec(
    modern.schema,
  )?.[0] ?? "";

for (const model of [teacherAttachmentModel, nurseAttachmentModel]) {
  for (const field of [
    "sourceDatabase",
    "legacyKey",
    "legacyId",
    "legacyTable",
    "filename",
    "fileUrl",
    "type",
    "expiryDate",
  ]) {
    assert.match(model, new RegExp(`${field}\\s+`), `model field ${field}`);
  }
}
assert.match(teacherAttachmentModel, /legacyTeacherId\s+Int\?/);
assert.match(nurseAttachmentModel, /legacyNurseId\s+Int\?/);

assert.match(modern.importer, /interface OldTeacherAttachment \{[\s\S]*tattid: number/);
assert.match(modern.importer, /att_title: string/);
assert.match(modern.importer, /url: string/);
assert.match(modern.importer, /teacher_id: string/);
assert.match(modern.importer, /type: string/);
assert.match(modern.importer, /exp_date: string/);
assert.match(modern.importer, /SELECT \* FROM t_teacher_attachments WHERE active = 1/);
assert.match(modern.importer, /SELECT \* FROM t_nurse_attachments WHERE active = 1/);
assert.match(modern.importer, /legacyKey\(sourceDatabase, "t_teacher_attachments", legacyId\)/);
assert.match(modern.importer, /legacyKey\(sourceDatabase, "t_nurse_attachments", legacyId\)/);
assert.match(modern.importer, /legacyTeacherId/);
assert.match(modern.importer, /legacyNurseId/);
assert.match(modern.importer, /filename,\s*\n\s*fileUrl,\s*\n\s*type: cleanString\(row\.type\),\s*\n\s*expiryDate: parseDate\(row\.exp_date\)/);
assert.match(modern.importer, /if \(!teacherId \|\| !legacyId\) \{\s*skipped\+\+;/);
assert.match(modern.importer, /if \(!nurseId \|\| !legacyId\) \{\s*attSkipped\+\+;/);

assert.match(modern.mapper, /employeeAttachments = \(emp\.attachments \?\? \[\]\)\.map/);
assert.match(modern.mapper, /expiryDate: fmtDate\(attachment\.expiryDate\)/);
assert.match(modern.form, /employeeDocumentScope\(type: EmployeeType\)/);
assert.match(modern.form, /type: "CONTRACT"/);
assert.match(modern.actions, /staffAttachmentCreateData/);
assert.match(modern.actions, /cleanDocumentFileUrl/);
assert.match(modern.staffAttachments, /StaffAttachmentsSection/);
assert.match(modern.staffAttachments, /attachment\.title \|\| attachment\.filename/);
assert.match(modern.staffAttachments, /Expires \$\{format\(new Date\(attachment\.expiryDate\)/);
assert.match(modern.teacherDetail, /StaffAttachmentsSection/);
assert.match(modern.nurseDetail, /StaffAttachmentsSection/);

for (const table of ["t_teacher_attachments", "t_nurse_attachments"]) {
  const rows = modern.databaseMatrix
    .split("\n")
    .filter((line) => line.includes(`| ${table} |`));
  assert.ok(rows.length >= 3, `Expected matrix rows for ${table}`);
  for (const row of rows) {
    assert.match(row, /mapped - migrated by migrate-employees\.ts/);
    assert.match(row, /sourceDatabase/);
    assert.match(row, /legacyKey/);
    assert.match(row, /legacy id/);
    assert.match(row, /legacy (teacher|nurse) id/);
    assert.match(row, /title/);
    assert.match(row, /file URL/);
    assert.match(row, /type/);
    assert.match(row, /expiry/);
    assert.doesNotMatch(row, /Needs source count, migrated count, skipped count, orphan report/);
  }
}

type MatrixRow = {
  modernRoute?: string;
  verification?: string;
};

const pageMatrix = JSON.parse(modern.pageMatrix) as MatrixRow[];
for (const route of [
  "/Teacher_Details.php, /employees/teachers/[id]",
  "/Nurse_Details.php, /employees/nurses/[id]",
]) {
  const row = pageMatrix.find((entry) => entry.modernRoute === route);
  assert.ok(row, `Missing page matrix row for ${route}`);
  assert.match(row.verification ?? "", /attachment import fidelity/);
  assert.match(
    row.verification ?? "",
    /verify-legacy-staff-attachment-import-contract\.ts/,
  );
}

console.log("legacy staff attachment import assertions passed");
