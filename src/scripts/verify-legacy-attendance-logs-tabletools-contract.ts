import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/PA_logs.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/pa_logs.js",
  bridge: "src/app/(app)/PA_logs.php/page.tsx",
  page: "src/app/(app)/employees/attendance-logs/page.tsx",
  client: "src/app/(app)/employees/attendance-logs/attendance-logs-client.tsx",
  dataTable: "src/components/shared/data-table.tsx",
  exportButton: "src/components/shared/export-button.tsx",
  migration: "src/scripts/migration/migrate-employees.ts",
  matrix: "docs/page-parity-matrix.json",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyPhp, /Check::protectPageOrFunction\('PA_logs\.php'\)/);
assert.match(contents.legacyPhp, /<title>Logs Management<\/title>/);
assert.match(contents.legacyPhp, /id="date_from" value="<\?= \$from \?>"/);
assert.match(contents.legacyPhp, /id="date_to" value="<\?= \$to \?>"/);
assert.match(contents.legacyPhp, /Logs Listing/);
assert.match(contents.legacyPhp, /id="datatable_ajax"/);
assert.match(contents.legacyPhp, /Log[\s\S]*Reader ID[\s\S]*Reader[\s\S]*Date[\s\S]*Time[\s\S]*Status[\s\S]*Card ID[\s\S]*Teacher No[\s\S]*Note[\s\S]*Datetime/);

assert.match(contents.legacyJs, /starttt = moment\(\)\.format\('YYYY-MM-DD'\)/);
assert.match(contents.legacyJs, /enddd = moment\(\)\.format\('YYYY-MM-DD'\)/);
assert.match(contents.legacyJs, /getActivities\(starttt, enddd\)/);
assert.match(contents.legacyJs, /"url": "\.\.\/\.\.\/\.\.\/ajax\/v1\/getLogs\?from=" \+ from \+ "&to=" \+ to/);
assert.match(contents.legacyJs, /"lengthMenu":\s*\[\s*\[\s*10,\s*20,\s*50,\s*100,\s*150,\s*-1\]/);
assert.match(contents.legacyJs, /"sDom":\s*'Tlfrtip'/);
assert.match(contents.legacyJs, /"oTableTools"/);
assert.match(contents.legacyJs, /"copy"/);
assert.match(contents.legacyJs, /"print"/);
assert.match(contents.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(contents.legacyJs, /'sExtends':\s*'xls'/);
assert.match(contents.legacyJs, /\[0,\s*"desc"\]/);
assert.match(contents.legacyJs, /\/\/ var conn = new ab\.Session/);
assert.match(contents.legacyJs, /\/\/\s*conn\.subscribe/);

assert.match(contents.bridge, /redirect\(suffix \? `\/employees\/attendance-logs\?\$\{suffix\}` : "\/employees\/attendance-logs"\)/);
assert.match(contents.bridge, /\["readerId", source\.readerId \?\? source\.ac_no\]/);
assert.match(contents.bridge, /\["reader", source\.reader \?\? source\.name\]/);
assert.match(contents.bridge, /\["logDate", source\.log\]/);
assert.match(contents.bridge, /\["logTime", source\.site\]/);
assert.match(contents.bridge, /\["status", source\.status \?\? source\.shift\]/);
assert.match(contents.bridge, /\["cardId", source\.cardId \?\? source\.date_out\]/);
assert.match(contents.bridge, /\["teacherNo", source\.teacherNo \?\? source\.time_out\]/);
assert.match(contents.bridge, /\["note", source\.note \?\? source\.date_in\]/);
assert.match(contents.bridge, /\["datetime", source\.datetime \?\? source\.time_in\]/);

assert.match(contents.page, /getAttendanceLogs\(\{ pageSize: "all" \}\)/);
assert.match(contents.page, /getEmployees\("teacher", \{ pageSize: "all" \}\)/);
assert.match(contents.page, /const legacyData = readRecord\(noteRecord\.legacyData\)/);
assert.match(contents.page, /legacyId\s*=\s*readNumber\(noteRecord, "legacyId"\) \?\? readNumber\(legacyData, "atid"\)/);
assert.match(contents.page, /legacyReaderId: readText\(legacyData, "readerid"\)/);
assert.match(contents.page, /legacyReaderName: readText\(legacyData, "readername"\)/);
assert.match(contents.page, /legacyDate: readText\(legacyData, "tdate"\)/);
assert.match(contents.page, /legacyTime: readText\(legacyData, "ttime"\)/);
assert.match(contents.page, /legacyStatus: readText\(noteRecord, "legacyStatus"\) \?\? readText\(legacyData, "status"\)/);
assert.match(contents.page, /legacyCardId: readText\(legacyData, "cardid"\)/);
assert.match(contents.page, /legacyTeacherNo:[\s\S]*readText\(legacyData, "teacher_id"\)/);
assert.match(contents.page, /legacyDatetime: readText\(legacyData, "datetime"\)/);

assert.match(contents.client, /const attendanceExportColumns: ExportColumn\[] = \[/);
assert.match(contents.client, /\{ header: "Log", key: "log" \}/);
assert.match(contents.client, /\{ header: "Reader ID", key: "readerId" \}/);
assert.match(contents.client, /\{ header: "Reader", key: "reader" \}/);
assert.match(contents.client, /\{ header: "Date", key: "date" \}/);
assert.match(contents.client, /\{ header: "Time", key: "time" \}/);
assert.match(contents.client, /\{ header: "Status", key: "status" \}/);
assert.match(contents.client, /\{ header: "Card ID", key: "cardId" \}/);
assert.match(contents.client, /\{ header: "Teacher No", key: "teacherNo" \}/);
assert.match(contents.client, /\{ header: "Note", key: "note" \}/);
assert.match(contents.client, /\{ header: "Datetime", key: "datetime" \}/);
assert.match(contents.client, /function todayIso\(\)/);
assert.match(contents.client, /const \[dateFrom, setDateFrom\] = useState\(initialDateFrom \|\| todayIso\(\)\)/);
assert.match(contents.client, /const \[dateTo, setDateTo\] = useState\(initialDateTo \|\| todayIso\(\)\)/);
assert.match(contents.client, /<ExportButton[\s\S]*filename="attendance-logs"[\s\S]*columns=\{attendanceExportColumns\}[\s\S]*data=\{exportRows\}/);
assert.match(contents.client, /window\.print\(\)/);
assert.match(contents.client, /pageSizeOptions=\{\[10, 20, 50, 100, 150, "all"\]\}/);

assert.match(contents.dataTable, /pageSizeOptions\?: Array<number \| "all">/);
assert.match(contents.dataTable, /pageSizeOptions = \[10, 20, 30, 50, 100\]/);
assert.match(contents.dataTable, /<ExportButton[\s\S]*data=\{exportData\}/);

assert.match(contents.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(contents.exportButton, /Copy table/);
assert.match(contents.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(contents.exportButton, /Export as CSV \(\.csv\)/);
assert.match(contents.exportButton, /Export as PDF \(\.pdf\)/);

assert.match(contents.migration, /Teacher biometric\/scanner attendance logs/);
assert.match(contents.migration, /t_teacher_attendance/);
assert.match(contents.migration, /teacherAttendance/);

assert.match(
  contents.matrix,
  /PA_logs\.php[\s\S]*restored - legacy attendance logs columns, filters, TableTools export, print, and bridge restored/,
);
assert.match(
  contents.matrix,
  /PA_logs\.php[\s\S]*verify-legacy-attendance-logs-tabletools-contract\.ts/,
);

console.log("legacy attendance logs TableTools contract assertions passed");
