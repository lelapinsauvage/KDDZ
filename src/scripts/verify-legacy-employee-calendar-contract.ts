import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const files = {
  legacyPhp: `${legacyRoot}/Front/templates/admin/calendar.php`,
  legacyJs: `${legacyRoot}/Front/templates/admin/js/calendar.js`,
  bridge: "src/app/(app)/calendar.php/page.tsx",
  page: "src/app/(app)/employees/calendar/page.tsx",
  client: "src/app/(app)/employees/calendar/calendar-client.tsx",
  actions: "src/lib/actions/employee-events.ts",
  migration: "src/scripts/migration/migrate-employees.ts",
  guards: "src/lib/legacy-page-guards.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('calendar\.php'\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /\$id = 0/);
assert.match(text.legacyPhp, /\$encrid = \$_REQUEST\["id"\]/);
assert.match(text.legacyPhp, /\$db->encrypt_decrypt\('decrypt', \$encrid\)/);
assert.match(text.legacyPhp, /id="emp_id" value="<\?= \$id \?>"/);
assert.match(text.legacyPhp, /<h3 class="page-title">\s*Tasks\s*<\/h3>/);
for (const label of ["Warning", "Day OFF", "Sick", "Absent"]) {
  assert.match(text.legacyPhp, new RegExp(escapeRegExp(label)));
}
for (const label of [
  "Create Task",
  "Update/Delete Event",
  "Status",
  "Select Status",
  "Reference Number",
  "Date",
  "Create Task",
  "Update",
  "Remove",
  "Close",
]) {
  assert.match(text.legacyPhp, new RegExp(escapeRegExp(label)));
}
for (const value of ["sick", "absent", "day_off", "warning"]) {
  assert.match(text.legacyPhp, new RegExp(`<option value="${value}">`));
}

assert.match(text.legacyJs, /id = \$\('#emp_id'\)\.val\(\)/);
assert.match(text.legacyJs, /if \(\$\(this\)\.val\(\) == "day_off" \|\| \$\(this\)\.val\(\) == ""\)/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/getTasksEvents'/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/changeEvent'/);
assert.match(text.legacyJs, /url": "\.\.\/\.\.\/\.\.\/ajax\/v1\/getDayTasks"/);
assert.match(text.legacyJs, /type: 'insert'/);
assert.match(text.legacyJs, /updateEvent\('delete'\)/);
assert.match(text.legacyJs, /function updateEvent\(type\)/);
assert.match(text.legacyPhp, /onclick="updateEvent\('update'\)"/);
assert.match(text.legacyJs, /message: "<b>are you sure you want to delete this Event #"/);
assert.match(text.legacyJs, /var header = \["#", "Name", "Status", "Reference No", "Date", "Action"\]/);
assert.match(text.legacyJs, /if \(id == 0\) \{\s*viewmore\(startt, "all", "All Tasks", 0\)/);
assert.match(text.legacyJs, /if \(id == 0\) \{\s*element\.find\('\.fc-event-title'\)\.append\(event\.name \+ " : " \+ event\.number\)/);
assert.match(text.legacyJs, /else \{\s*element\.find\('\.fc-event-title'\)\.append\(event\.ename \+ " : " \+ event\.name\)/);
assert.match(text.legacyJs, /CheckApprovaldate[\s\S]*\/\*/);

assert.match(text.bridge, /resolveLegacyStaffId\("teacher", id\)/);
assert.match(text.bridge, /redirect\(`\/employees\/calendar\?employeeId=\$\{encodeURIComponent\(teacherId\)\}`\)/);
assert.match(text.bridge, /redirect\("\/employees\/calendar"\)/);

assert.match(text.page, /getEmployees\("teacher", \{ isActive: true, pageSize: "all" \}\)/);
assert.match(text.page, /getEmployees\("nurse", \{ isActive: true, pageSize: "all" \}\)/);
assert.match(text.page, /getEmployees\("doctor", \{ isActive: true, pageSize: "all" \}\)/);
assert.match(text.page, /getEmployees\("manager", \{ isActive: true, pageSize: "all" \}\)/);
assert.match(text.page, /getEmployeeEvents\(\{ month, year \}\)/);
assert.match(text.page, /initialEmployeeId=\{params\.employeeId\}/);

for (const value of ["SICK", "ABSENT", "DAY_OFF", "WARNING"]) {
  assert.match(text.client, new RegExp(`value: "${value}"`));
}
assert.match(text.client, /title="Tasks"/);
assert.match(text.client, /SelectValue placeholder="All Employees"/);
assert.match(text.client, /<SelectItem value="ALL">All Employees<\/SelectItem>/);
assert.match(text.client, /function openDay\(day: number\)/);
assert.match(text.client, /if \(employeeFilter === "ALL"\) \{/);
assert.match(text.client, /setDayDetailsDate\(dateStr\)/);
assert.match(text.client, /setDayDetailsOpen\(true\)/);
assert.match(text.client, /setFormEmployeeId\(employeeFilter\)/);
assert.match(text.client, /<DialogTitle>All Tasks<\/DialogTitle>/);
for (const column of ["#", "Name", "Status", "Reference No", "Date", "Action"]) {
  assert.match(text.client, new RegExp(escapeRegExp(column)));
}
assert.match(text.client, /formStatus !== "DAY_OFF"/);
assert.match(text.client, /placeholder="Reference Number"/);
assert.match(text.client, /Create Task/);
assert.match(text.client, /Update Task/);
assert.match(text.client, /Delete Event/);

assert.match(text.actions, /export async function getEmployeeEvents/);
assert.match(text.actions, /branchId: \{ in: orgBranchIds \}/);
assert.match(text.actions, /export async function createEmployeeEvent/);
assert.match(text.actions, /verifyBranchAccess\(branchId, orgId\)/);
assert.match(text.actions, /export async function updateEmployeeEvent/);
assert.match(text.actions, /export async function deleteEmployeeEvent/);
assert.match(text.actions, /revalidatePath\("\/employees\/calendar"\)/);
assert.match(text.actions, /where\.employeeId = params\.employeeId/);

assert.match(text.migration, /interface OldTeacherEmployeeEvent/);
assert.match(text.migration, /SELECT \* FROM t_emp_status WHERE active = 1 ORDER BY id/);
assert.match(text.migration, /if \(normalized === "sick"\) return "SICK"/);
assert.match(text.migration, /if \(normalized === "absent"\) return "ABSENT"/);
assert.match(text.migration, /if \(normalized === "day_off"\) return "DAY_OFF"/);
assert.match(text.migration, /if \(normalized === "warning"\) return "WARNING"/);
assert.match(text.migration, /legacyKey\(sourceDatabase, "t_emp_status", legacyId\)/);
assert.match(text.migration, /legacyTable: "t_emp_status"/);
assert.match(text.migration, /legacyTeacherId/);
assert.match(text.migration, /referenceNumber: cleanString\(row\.ref_nb\)/);

assert.match(text.guards, /legacyPage: "calendar\.php"[\s\S]*"\/employees\/calendar"[\s\S]*"\/calendar\.php"/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/calendar.php, /employees/calendar",
);

assert.ok(row);
assert.match(row.status ?? "", /restored - legacy employee task calendar bridge/);
assert.match(row.verification ?? "", /`t_emp_status`/);
assert.match(row.verification ?? "", /All Employees/);
assert.match(row.verification ?? "", /Reference No/);
assert.match(row.verification ?? "", /verify-legacy-employee-calendar-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /Remaining work/);

const markdownRow = text.matrixMd
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/calendar.php |"));
assert.match(markdownRow ?? "", /restored - legacy employee task calendar bridge/);
assert.match(markdownRow ?? "", /All Employees/);
assert.match(markdownRow ?? "", /Browser smoke/);
assert.doesNotMatch(markdownRow ?? "", /Remaining work/);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("legacy employee calendar contract assertions passed");
