import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/payroll_det_b.js",
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/Monthly_report_b.php",
  legacyFragment:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/payroll_det_data_b.php",
  legacyData:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/classes/Data.class.php",
  redirect: "src/app/(app)/Monthly_report_b.php/route.ts",
  guardMap: "src/lib/legacy-page-guards.ts",
  page: "src/app/(app)/reports/monthly-branch/page.tsx",
  data: "src/app/(app)/reports/monthly/monthly-data.ts",
  client: "src/app/(app)/reports/monthly/monthly-client.tsx",
  fragmentRoute: "src/app/payroll_det_data_b.php/route.ts",
  fragmentRenderer: "src/lib/legacy/monthly-attendance-fragment.ts",
  exportButton: "src/components/shared/export-button.tsx",
  matrix: "docs/page-parity-matrix.json",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

const branchFunction =
  contents.legacyData.match(
    /public function getmonthlyattendanceperbr\(\$from, \$is_excel = false, \$brid\)[\s\S]*?return \$glob;/,
  )?.[0] ?? "";
const liveChildRosterQuery =
  branchFunction.match(
    /\n\s*\$sql = "select cid, cname, clname,child_num, brname,b\.prefix, classname, joining_date from t_child c[\s\S]*?order by cid ";/,
  )?.[0] ?? "";

assert.match(contents.legacyPhp, /Check::protectPageOrFunction\('Monthly_report\.php'\)/);
assert.match(contents.legacyPhp, /window\.location = 'Monthly_report\.php'/);
assert.match(contents.legacyPhp, /id="branchid" value="<\?php echo \$brid; \?>"/);
assert.match(contents.legacyPhp, /<title>Attendance Report - <\?php echo \$branchname; \?><\/title>/);
assert.match(contents.legacyPhp, /Monthly Attendance Report For <\?php echo \$branchname; \?>/);
assert.match(contents.legacyPhp, /name="p" value="<\?= date\("Y-m"\) \?>"/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">N<\/b>o Report/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">P<\/b>resent/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">A<\/b>bscent/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">W<\/b>eekends/);
assert.match(contents.legacyPhp, /<b style="font-size: 1\.1em;">H<\/b>olidays/);
assert.match(contents.legacyPhp, /id="selecteddate"/);
assert.match(contents.legacyPhp, /js\/payroll_det_b\.js/);

assert.match(contents.legacyJs, /var brid = \$\('#branchid'\)\.val\(\)/);
assert.match(contents.legacyJs, /date = moment\(\)\.format\('YYYY-MM'\)/);
assert.match(contents.legacyJs, /format:\s*"yyyy-mm"/);
assert.match(contents.legacyJs, /#selecteddate"\)\.html\("Showing Data For " \+ date\)/);
assert.match(contents.legacyJs, /url:\s*'payroll_det_data_b\.php'/);
assert.match(contents.legacyJs, /from:\s*date/);
assert.match(contents.legacyJs, /brid:\s*brid/);
assert.match(contents.legacyJs, /"paging":\s*false/);
assert.match(contents.legacyJs, /"sDom":\s*'Tlfrtpi'/);
assert.match(contents.legacyJs, /"oTableTools"/);
assert.match(contents.legacyJs, /"copy"/);
assert.match(contents.legacyJs, /"print"/);
assert.match(contents.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(contents.legacyJs, /'sExtends':\s*'xls'/);
assert.match(contents.legacyJs, /\[0,\s*"asc"\]/);

assert.match(
  contents.legacyFragment,
  /getmonthlyattendanceperbr\(\$_REQUEST\["from"\], null , \$_REQUEST\["brid"\]\)/,
);
assert.match(contents.legacyFragment, /id="datatable_ajax"/);
assert.match(contents.legacyFragment, /thead \.filters th/);
assert.match(contents.legacyFragment, /if\(count < 6\)/);
assert.match(contents.legacyFragment, /table\s*\n\s*\.column\( colIdx \)\s*\n\s*\.search\( this\.value \)/);

assert.match(branchFunction, /SELECT clid FROM t_class WHERE branch_id = '\$brid'/);
assert.match(branchFunction, /class_id IN \$classesforbr/);
assert.match(branchFunction, /from t_daily_report where active = 1 and is_rep_draft = 0 and status = 'present' AND class_id IN \$classesforbr/);
assert.match(branchFunction, /from t_daily_report where active = 1 and is_rep_draft = 0 and status = 'absent' AND class_id IN \$classesforbr/);
assert.match(branchFunction, /from t_child c left join t_branch b/);
assert.match(branchFunction, /where c\.active = 1 and c\.deleted = 0 and c\.is_draft = 0/);
assert.match(branchFunction, /\$arr\[\$value\['cid'\]\]\['branch'\] = \$value\['prefix'\]/);
assert.match(liveChildRosterQuery, /from t_child c left join t_branch b/);
assert.doesNotMatch(liveChildRosterQuery, /t_child_h/);
assert.match(branchFunction, /\$glob\["extra"\]\['Child #'\]/);
assert.match(branchFunction, /\$glob\["extra"\]\['Branch'\]/);
assert.match(branchFunction, /\$glob\["extra"\]\['Class'\]/);
assert.match(branchFunction, /\$glob\["extra"\]\['31'\]/);
assert.match(branchFunction, /\$glob\["extra"\]\['P\/A'\]/);

assert.match(contents.redirect, /export const runtime = "nodejs"/);
assert.match(contents.redirect, /auth\(\)/);
assert.match(contents.redirect, /getLegacyAccessPermissionDecision/);
assert.match(contents.redirect, /"Monthly_report\.php"/);
assert.match(contents.redirect, /resolveLegacyBranchId\(brid\)/);
assert.match(contents.redirect, /new URL\("\/reports\/monthly", request\.url\)/);
assert.match(contents.redirect, /new URL\("\/reports\/monthly-branch", request\.url\)/);
assert.match(contents.redirect, /target\.searchParams\.set\("branch", branchId\)/);
assert.match(contents.redirect, /normalizeMonth\(source\.get\("month"\)\)/);
assert.match(contents.redirect, /normalizeMonth\(source\.get\("from"\)\)/);
assert.match(contents.redirect, /normalizeMonth\(source\.get\("p"\)\)/);
assert.match(contents.redirect, /NextResponse\.redirect\(target\)/);

assert.match(contents.guardMap, /"Monthly_report\.php"[\s\S]*"\/Monthly_report_b\.php"/);

assert.match(contents.page, /redirect\("\/reports\/monthly"\)/);
assert.match(contents.page, /normalizeMonthKey\(params\.month\)/);
assert.match(contents.page, /normalizeMonthKey\(params\.from\)/);
assert.match(contents.page, /normalizeMonthKey\(params\.p\)/);
assert.match(contents.page, /const title = `Monthly Attendance Report For \$\{selectedBranch\.name\}`/);
assert.match(contents.page, /showBranchColumn/);
assert.match(contents.page, /lockBranch/);

assert.match(contents.data, /createdAt:\s*\{ lt:\s*nextMonth \}/);
assert.match(contents.data, /\.\.\.\(branchId \? \{ branchId \} : \{\}\)/);
assert.match(contents.data, /class:\s*\{ select:\s*\{ id:\s*true,\s*name:\s*true,\s*legacyId:\s*true,\s*branchId:\s*true \} \}/);
assert.match(contents.data, /branch:\s*\{ select:\s*\{ id:\s*true,\s*name:\s*true,\s*prefix:\s*true,\s*legacyId:\s*true \} \}/);
assert.match(contents.data, /branchName: child\.branch\?\.prefix \?\? child\.branch\?\.name \?\? "-"/);
assert.match(contents.data, /oneTimeGlobalHolidays/);
assert.match(contents.data, /repeatedGlobalHolidays/);
assert.match(contents.data, /utcDate\(year, monthIndex, day\)\.getUTCDay\(\) === 0/);

assert.match(contents.client, /buildExportColumns\(showBranchColumn\)/);
assert.match(contents.client, /\.\.\.\(includeBranch \? \[\{ header: "Branch", key: "branchName" \}\] : \[\]\)/);
assert.match(contents.client, /lockBranch/);
assert.match(contents.client, /Showing Data For \{monthKey\}/);
assert.match(contents.client, /<LegendItem code="A" label="Abscent" \/>/);
assert.match(contents.client, /<ExportButton/);
assert.match(contents.client, /data=\{filteredExportRows\}/);
assert.match(contents.client, /window\.print\(\)/);
assert.match(contents.client, /P\/A = present \/ absent/);

assert.match(contents.fragmentRoute, /readField\(request,\s*"from"\)/);
assert.match(contents.fragmentRoute, /readField\(request,\s*"brid"\)/);
assert.match(contents.fragmentRoute, /resolveLegacyBranchId\(brid\)/);
assert.match(contents.fragmentRoute, /includeBranch:\s*true/);
assert.match(contents.fragmentRoute, /renderMonthlyAttendanceFragment\(\{/);

assert.match(contents.fragmentRenderer, /headers\(includeBranch: boolean\)/);
assert.match(contents.fragmentRenderer, /"Child #"/);
assert.match(contents.fragmentRenderer, /"Branch"/);
assert.match(contents.fragmentRenderer, /"P\/A"/);
assert.match(contents.fragmentRenderer, /renderFilterScript\(includeBranch \? 6 : 5\)/);

assert.match(contents.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(contents.exportButton, /Copy table/);
assert.match(contents.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(contents.exportButton, /Export as CSV \(\.csv\)/);
assert.match(contents.exportButton, /Export as PDF \(\.pdf\)/);

assert.match(
  contents.matrix,
  /Monthly_report_b\.php[\s\S]*restored - legacy branch monthly matrix, TableTools export, print, AJAX fragment, and bridge restored/,
);
assert.match(
  contents.matrix,
  /Monthly_report_b\.php[\s\S]*verify-legacy-branch-monthly-attendance-tabletools-contract\.ts/,
);

console.log("legacy branch monthly attendance TableTools contract assertions passed");
