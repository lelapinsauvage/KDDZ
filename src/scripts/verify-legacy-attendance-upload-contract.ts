import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const files = {
  legacyPhp: `${legacyRoot}/Front/templates/admin/attendance.php`,
  legacyJs: `${legacyRoot}/Front/templates/admin/js/attendance.js`,
  legacyAjax: `${legacyRoot}/ajax/v1/index.php`,
  legacyData: `${legacyRoot}/Front/templates/admin/classes/Data.class.php`,
  bridge: "src/app/(app)/attendance.php/page.tsx",
  page: "src/app/(app)/employees/attendance/page.tsx",
  client: "src/app/(app)/employees/attendance/attendance-client.tsx",
  preselect: "src/lib/legacy-attendance-preselect-contract.ts",
  employeeEvents: "src/lib/actions/employee-events.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('attendance\.php'\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /id="emp_id" value="<\?= \$emp_id \?>"/);
assert.match(text.legacyPhp, /Teachers Attendance Upload/);
assert.match(text.legacyPhp, /Form Allowed:<\/b> CSV ONLY/);
assert.match(text.legacyPhp, /images\/Attendance\/formattendance\.JPG/);
assert.match(
  text.legacyPhp,
  /id="ProfileImage"[\s\S]*accept="\.csv, application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet, application\/vnd\.ms-excel"/,
);

assert.match(text.legacyJs, /var emp_id = \$\("#emp_id"\)\.val\(\)/);
assert.match(text.legacyJs, /message: "Please Choose File "/);
assert.match(text.legacyJs, /formdata\.append\('image', \$\('#ProfileImage'\)\.prop\('files'\)\[0\]\)/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/uploadattendance'/);
assert.match(text.legacyJs, /\$\("#ProfileImage"\)\.on\("change"/);
assert.match(text.legacyJs, /conn\.subscribe\("new_attendance"\+cat_master/);
assert.match(
  text.legacyAjax,
  /\$app->post\('\/uploadattendance'[\s\S]*\$_FILES\['image'\][\s\S]*\$db->uploadattendance\(\$image\)/,
);
assert.match(text.legacyData, /public function uploadattendance\(\$File\)/);
assert.match(text.legacyData, /\$this->fetchCSV\(\$File\['tmp_name'\]\)/);
assert.match(
  text.legacyData,
  /\['readerid', 'readername','tdate','ttime','status','cardid','teacher_id','tdefault','uby'\]/,
);

assert.match(text.bridge, /resolveLegacyStaffId\("teacher", id\)/);
assert.match(text.bridge, /attendancePreselectTarget\(teacherId\)/);
assert.match(text.bridge, /redirect\("\/employees\/attendance"\)/);
assert.match(text.preselect, /encodeURIComponent\(employeeId\)/);
assert.match(text.preselect, /return "ALL"/);

assert.match(text.page, /getEmployees\("teacher", \{ pageSize: "all" \}\)/);
assert.match(text.page, /getEmployees\("nurse", \{ pageSize: "all" \}\)/);
assert.match(text.page, /getEmployees\("doctor", \{ pageSize: "all" \}\)/);
assert.match(text.page, /getEmployees\("manager", \{ pageSize: "all" \}\)/);
assert.match(text.page, /normalizeAttendancePreselectedEmployeeId/);

assert.match(text.client, /function parseCsv\(text: string\)/);
assert.match(text.client, /function isLegacyScannerRow\(row: string\[\]\)/);
assert.match(text.client, /function buildAttendanceLogsFromCsv/);
for (const field of [
  "legacyReaderId",
  "legacyReaderName",
  "legacyDate",
  "legacyTime",
  "legacyStatus",
  "legacyCardId",
  "legacyTeacherName",
  "legacyDefault",
  "readerid",
  "readername",
  "tdate",
  "ttime",
  "status",
  "cardid",
  "teacher_id",
  "tdefault",
]) {
  assert.match(text.client, new RegExp(escapeRegExp(field)));
}
assert.match(text.client, /source: "runtime_legacy_attendance_upload"/);
assert.match(text.client, /sourceTable: "t_teacher_attendance"/);
assert.match(text.client, /"legacy_id"/);
assert.match(text.client, /"teacher_name"/);
assert.match(text.client, /"cardid_from_name_seed"/);
assert.match(text.client, /Successfully uploaded \$\{count\} \$\{parsed\.format === "legacy-scanner"/);
assert.match(text.client, /Please upload a CSV file only/);
assert.match(text.client, /Teachers Attendance Upload/);
assert.match(text.client, /Form Allowed:[\s\S]*CSV ONLY/);
assert.match(text.client, /Legacy scanner columns: Reader ID, Reader Name, Date, Time/);
assert.match(text.client, /Choose CSV/);
assert.match(text.client, /CSV Preview/);
assert.match(text.client, /Upload CSV Data/);
assert.match(text.client, /Upload Attendance/);

assert.match(text.employeeEvents, /export async function bulkCreateAttendanceLogs/);
assert.match(text.employeeEvents, /verifyBranchAccess\(branchId, orgId\)/);
assert.match(text.employeeEvents, /db\.teacherAttendance\.createMany/);
assert.match(text.employeeEvents, /readerId: log\.readerId \?\? null/);
assert.match(text.employeeEvents, /readerName: log\.readerName \?\? null/);
assert.match(text.employeeEvents, /cardId: log\.cardId \?\? null/);
assert.match(text.employeeEvents, /note: log\.note \?\? null/);
assert.match(text.employeeEvents, /revalidatePath\("\/employees\/attendance"\)/);
assert.match(text.employeeEvents, /revalidatePath\("\/employees\/attendance-logs"\)/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/attendance.php, /employees/attendance",
);

assert.ok(row);
assert.match(row.status ?? "", /restored - legacy attendance bridge/);
assert.match(row.verification ?? "", /legacy scanner CSV/);
assert.match(row.verification ?? "", /Browser smoke/);
assert.match(row.verification ?? "", /verify-legacy-attendance-upload-contract\.ts/);

const markdownRow = text.matrixMd
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/attendance.php |"));
assert.match(markdownRow ?? "", /restored - legacy attendance bridge/);
assert.match(markdownRow ?? "", /legacy scanner CSV/);
assert.match(markdownRow ?? "", /Browser smoke/);
assert.doesNotMatch(markdownRow ?? "", /Remaining work is exact field\/action audit/);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("legacy attendance upload contract assertions passed");
