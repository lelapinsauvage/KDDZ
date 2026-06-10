import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/payroll_det.js",
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/Monthly_report.php",
  legacyFragment:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/payroll_det_data.php",
  legacyData:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/classes/Data.class.php",
  redirect: "src/app/(app)/Monthly_report.php/route.ts",
  page: "src/app/(app)/reports/monthly/page.tsx",
  data: "src/app/(app)/reports/monthly/monthly-data.ts",
  client: "src/app/(app)/reports/monthly/monthly-client.tsx",
  fragmentRoute: "src/app/payroll_det_data.php/route.ts",
  fragmentRenderer: "src/lib/legacy/monthly-attendance-fragment.ts",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyPhp, /Check::protectPageOrFunction\('Monthly_report\.php'\)/);
assert.match(contents.legacyPhp, /<title>Attendance Report<\/title>/);
assert.match(contents.legacyPhp, /Monthly Attendance Report/);
assert.match(contents.legacyPhp, /id="mind1"[\s\S]*value="<\?= date\("Y-m"\) \?>"/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">N<\/b>o Report/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">P<\/b>resent/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">A<\/b>bscent/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">W<\/b>eekends/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">H<\/b>olidays/);
assert.match(contents.legacyPhp, /id="selecteddate"/);
assert.match(contents.legacyPhp, /js\/payroll_det\.js/);

assert.match(contents.legacyJs, /date = moment\(\)\.format\('YYYY-MM'\)/);
assert.match(contents.legacyJs, /format:\s*"yyyy-mm"/);
assert.match(contents.legacyJs, /setTable\(\)/);
assert.match(contents.legacyJs, /#selecteddate"\)\.html\("Showing Data For " \+ date\)/);
assert.match(contents.legacyJs, /url:\s*'payroll_det_data\.php'/);
assert.match(contents.legacyJs, /from:\s*date/);
assert.match(contents.legacyJs, /"paging":\s*false/);
assert.match(contents.legacyJs, /"sDom":\s*'Tlfrtpi'/);
assert.match(contents.legacyJs, /"oTableTools"/);
assert.match(contents.legacyJs, /"copy"/);
assert.match(contents.legacyJs, /"print"/);
assert.match(contents.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(contents.legacyJs, /'sExtends':\s*'xls'/);
assert.match(contents.legacyJs, /\[0,\s*"asc"\]/);

assert.match(contents.legacyFragment, /getmonthlyattendance\(\$_REQUEST\["from"\]\)/);
assert.match(contents.legacyFragment, /id="datatable_ajax"/);
assert.match(contents.legacyFragment, /thead \.filters th/);
assert.match(contents.legacyFragment, /if\(count < 5\)/);
assert.match(contents.legacyFragment, /table\s*\n\s*\.column\( colIdx \)\s*\n\s*\.search\( this\.value \)/);

assert.match(contents.legacyData, /public function getmonthlyattendance\(\$from, \$is_excel = false\)/);
assert.match(contents.legacyData, /from t_daily_report where active = 1 and is_rep_draft = 0 and status = 'present'/);
assert.match(contents.legacyData, /from t_daily_report where active = 1 and is_rep_draft = 0 and status = 'absent'/);
assert.match(contents.legacyData, /from t_child c left join t_branch b/);
assert.match(contents.legacyData, /where c\.active = 1 and c\.deleted = 0 and c\.is_draft = 0/);
assert.doesNotMatch(
  contents.legacyData.match(/public function getmonthlyattendance\([\s\S]*?return \$glob;/)?.[0] ?? "",
  /t_child_h/,
);
assert.match(contents.legacyData, /\$glob\["extra"\]\['Child #'\]/);
assert.match(contents.legacyData, /\$glob\["extra"\]\['Class'\]/);
assert.match(contents.legacyData, /\$glob\["extra"\]\['31'\]/);
assert.match(contents.legacyData, /\$glob\["extra"\]\['P\/A'\]/);

assert.match(contents.redirect, /export const runtime = "nodejs"/);
assert.match(contents.redirect, /auth\(\)/);
assert.match(contents.redirect, /getLegacyAccessPermissionDecision/);
assert.match(contents.redirect, /"Monthly_report\.php"/);
assert.match(contents.redirect, /NextResponse\.redirect\(monthlyTarget\(request\)\)/);
assert.match(contents.redirect, /normalizeMonth\(source\.get\("month"\)\)/);
assert.match(contents.redirect, /normalizeMonth\(source\.get\("from"\)\)/);
assert.match(contents.redirect, /normalizeMonth\(source\.get\("p"\)\)/);
assert.match(contents.redirect, /target\.searchParams\.set\("month", month\)/);

assert.match(contents.page, /normalizeMonthKey\(params\.month\)/);
assert.match(contents.page, /normalizeMonthKey\(params\.from\)/);
assert.match(contents.page, /normalizeMonthKey\(params\.p\)/);
assert.match(contents.page, /loadMonthlyAttendance\(\{ branchId, classId, monthKey \}\)/);

assert.match(contents.data, /const dayColumns = Array\.from\(\{ length: 31 \}/);
assert.match(contents.data, /isActive:\s*true/);
assert.match(contents.data, /isDraft:\s*false/);
assert.match(contents.data, /createdAt:\s*\{ lt:\s*nextMonth \}/);
assert.match(contents.data, /status:\s*"SUBMITTED"/);
assert.match(contents.data, /jsonString\(report\?\.legacyData, "status"\)\?\.toLowerCase\(\)/);
assert.match(contents.data, /oneTimeGlobalHolidays/);
assert.match(contents.data, /repeatedGlobalHolidays/);
assert.match(contents.data, /utcDate\(year, monthIndex, day\)\.getUTCDay\(\) === 0/);
assert.match(contents.data, /href: string \| null = `\/daily-reports\/new\?childId=\$\{encodeURIComponent\(child\.id\)\}&date=\$\{currentDate\}`/);
assert.match(contents.data, /href = `\/daily-reports\/\$\{encodeURIComponent\(report\.id\)\}`/);
assert.match(contents.data, /href = `\/absent-reports\/\$\{encodeURIComponent\(absence\.id\)\}`/);

assert.match(contents.client, /const dayColumns = Array\.from\(\{ length: 31 \}/);
assert.match(contents.client, /type="month"/);
assert.match(contents.client, /Showing Data For \{monthKey\}/);
assert.match(contents.client, /<LegendItem code="N" label="No Report" \/>/);
assert.match(contents.client, /<LegendItem code="P" label="Present" \/>/);
assert.match(contents.client, /<LegendItem code="A" label="Abscent" \/>/);
assert.match(contents.client, /<LegendItem code="W" label="Weekends" \/>/);
assert.match(contents.client, /<LegendItem code="H" label="Holidays" \/>/);
assert.match(contents.client, /<ExportButton/);
assert.match(contents.client, /filename=\{filename\(monthKey\)\}/);
assert.match(contents.client, /sheetName="Attendance"/);
assert.match(contents.client, /columns=\{exportColumns\}/);
assert.match(contents.client, /data=\{filteredExportRows\}/);
assert.match(contents.client, /window\.print\(\)/);
assert.match(contents.client, /Child #/);
assert.match(contents.client, /P\/A = present \/ absent/);

assert.match(contents.fragmentRoute, /readField\(request,\s*"from"\)/);
assert.match(contents.fragmentRoute, /loadMonthlyAttendance\(\{\s*branchId:\s*null,\s*classId:\s*null,\s*monthKey/);
assert.match(contents.fragmentRoute, /renderMonthlyAttendanceFragment\(\{/);

assert.match(contents.fragmentRenderer, /headers\(includeBranch: boolean\)/);
assert.match(contents.fragmentRenderer, /"Child #"/);
assert.match(contents.fragmentRenderer, /"P\/A"/);
assert.match(contents.fragmentRenderer, /renderFilterScript\(includeBranch \? 6 : 5\)/);

assert.match(contents.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(contents.exportButton, /Copy table/);
assert.match(contents.exportButton, /Export as PDF \(\.pdf\)/);

assert.match(
  contents.matrix,
  /Monthly_report\.php[\s\S]*restored - legacy monthly attendance matrix, TableTools export, print, AJAX fragment, and bridge restored/,
);
assert.match(
  contents.matrix,
  /Monthly_report\.php[\s\S]*verify-legacy-monthly-attendance-tabletools-contract\.ts/,
);

console.log("legacy monthly attendance TableTools contract assertions passed");
