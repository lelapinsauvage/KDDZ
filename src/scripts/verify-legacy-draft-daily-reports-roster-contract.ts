import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/dailyreportsd.php`,
    "utf8",
  ),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/dailyreportsd.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/dailyreportsd.php/route.ts", "utf8"),
  page: readFileSync("src/app/(app)/daily-reports/drafts/page.tsx", "utf8"),
  client: readFileSync(
    "src/app/(app)/daily-reports/daily-reports-client.tsx",
    "utf8",
  ),
  actions: readFileSync("src/lib/actions/daily-reports.ts", "utf8"),
  guards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  workflowFields: readFileSync(
    "src/lib/legacy-daily-report-fields.ts",
    "utf8",
  ),
  exportButton: readFileSync("src/components/shared/export-button.tsx", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('dailyreportsd\.php'\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /\$branch = \$db->getBranches\(\)/);
assert.match(text.legacyPhp, /\$child = \$db->getChildinfofdaily\(\)/);
assert.match(text.legacyPhp, /\$direct = \$db->directapproval\(\)/);
assert.match(text.legacyPhp, /<title>Daily Reports<\/title>/);
assert.match(text.legacyPhp, /<h3 class="page-title">\s*Drafts Daily Reports\s*<\/h3>/);
assert.match(text.legacyPhp, /Tip:[\s\S]*You can Select many rows to approve at once/);
assert.match(text.legacyPhp, /Draft Reports Listing/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_selections"/);
assert.match(
  text.legacyPhp,
  /fa-slack[\s\S]*Image[\s\S]*F Name[\s\S]*L Name[\s\S]*Status[\s\S]*Branch[\s\S]*Class[\s\S]*Report Date[\s\S]*Date[\s\S]*Action/,
);
assert.match(text.legacyPhp, /name="ids"/);
assert.match(text.legacyPhp, /name="name"/);
assert.match(text.legacyPhp, /name="lname"/);
assert.match(text.legacyPhp, /name="dob"/);
assert.match(text.legacyPhp, /name="content" id="content"/);
assert.match(text.legacyPhp, /data-text="<\?= \$value\['brname'\] \?>"/);
assert.match(text.legacyPhp, /name="class"/);
assert.match(text.legacyPhp, /name="nat"/);
assert.match(text.legacyPhp, /id="mind1"/);
assert.match(text.legacyPhp, /id="maxd1"/);
assert.match(text.legacyPhp, /id="ClearInputs"/);
assert.match(text.legacyPhp, /id="aprove"[\s\S]*Approve Selected/);
assert.match(text.legacyPhp, /dataTables\.tableTools\.min\.js/);
assert.match(text.legacyPhp, /js\/dailyreportsd\.js/);

assert.match(text.legacyJs, /direct === '1'/);
assert.match(text.legacyJs, /getdailyAllDraftHashed/);
assert.match(text.legacyJs, /getdailyAllDraftHashedWithSelections/);
assert.match(text.legacyJs, /"lengthMenu":\s*\[\s*\[\s*10,\s*20,\s*50,\s*100,\s*150,\s*-1\]/);
assert.match(text.legacyJs, /\[10,\s*20,\s*50,\s*100,\s*150,\s*"All"\]/);
assert.match(text.legacyJs, /"pageLength":\s*10/);
assert.match(text.legacyJs, /"oTableTools"/);
assert.match(text.legacyJs, /"copy"/);
assert.match(text.legacyJs, /"print"/);
assert.match(text.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(text.legacyJs, /'sExtends':\s*'xls'/);
assert.match(text.legacyJs, /"processing":\s*true/);
assert.match(text.legacyJs, /"serverSide":\s*true/);
assert.match(text.legacyJs, /"data":\s*"child_num"/);
assert.match(text.legacyJs, /"data":\s*"image"/);
assert.match(text.legacyJs, /"data":\s*"cname"/);
assert.match(text.legacyJs, /"data":\s*"clname"/);
assert.match(text.legacyJs, /"data":\s*"status"/);
assert.match(text.legacyJs, /"data":\s*"brname"/);
assert.match(text.legacyJs, /"data":\s*"classname"/);
assert.match(text.legacyJs, /"data":\s*"reportdate"/);
assert.match(text.legacyJs, /"data":\s*"datetime"/);
assert.match(text.legacyJs, /d\.columns\[8\]\.Min_Range = \$\('#mind1'\)\.val\(\) \+ " 00:00:00"/);
assert.match(text.legacyJs, /d\.columns\[8\]\.Max_Range = \$\('#maxd1'\)\.val\(\) \+ " 23:59:59"/);
assert.match(text.legacyJs, /selectedChildren\.push\(kdnumber\)/);
assert.match(text.legacyJs, /selectedChildrendate\.push\(reportdate\)/);
assert.match(text.legacyJs, /#aprove[\s\S]*approveSelected/);
assert.match(text.legacyJs, /childid:\s*selectedChildren/);
assert.match(text.legacyJs, /datesid:\s*selectedChildrendate/);

assert.match(text.bridge, /export const runtime = "nodejs"/);
assert.match(text.bridge, /new URL\("\/daily-reports\/drafts", request\.url\)/);
assert.match(text.bridge, /NextResponse\.redirect/);
assert.match(text.bridge, /export async function GET\(request: NextRequest\)/);
assert.match(text.bridge, /export async function POST\(request: NextRequest\)/);

assert.match(text.guards, /"dailyreportsd\.php"/);
assert.match(text.guards, /legacyPage: "dailyreportsd\.php"[\s\S]*exact: \["\/daily-reports\/drafts", "\/dailyreportsd\.php"\]/);
assert.match(text.guards, /legacyPage: "dailyreportsd\.php"[\s\S]*prefixes: \["\/daily-reports\/drafts\/"\]/);

assert.match(text.page, /getDraftReports\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getBranches\(\)/);
assert.match(text.page, /getCurrentLegacyDailyReportDirectApprovalEnabled\(\)/);
assert.match(text.page, /workflowStatus: report\.status/);
assert.match(text.page, /dailyStatus: legacyStatus \?\? "present"/);
assert.match(text.page, /variant="drafts"/);
assert.match(text.page, /initialStatusFilter="DRAFT"/);
assert.match(text.page, /enableBulkApproval=\{!directApprovalEnabled\}/);

assert.match(text.actions, /function isLegacyDraftApprovable/);
assert.match(text.actions, /legacyStatus !== "present"/);
assert.match(text.actions, /breakfastPortion !== "undefined" && lunchPortion !== "undefined"/);
assert.match(text.actions, /export async function approveDailyReports/);
assert.match(text.actions, /approveDailyReportsSchema/);
assert.match(text.actions, /status: "DRAFT"/);
assert.match(text.actions, /dailyReportLegacyWorkflowPatch\(\s*"SUBMITTED"/);
assert.match(text.actions, /revalidatePath\("\/daily-reports\/drafts"\)/);
assert.match(text.actions, /export async function getDraftReports/);
assert.match(text.actions, /return getDailyReports\(\{ \.\.\.params, status: "DRAFT" \}\)/);

assert.match(text.workflowFields, /is_rep_draft: status === "SUBMITTED" \? "0" : "1"/);
assert.match(text.workflowFields, /next\.is_rep_draft = options\.workflowStatus === "SUBMITTED" \? "0" : "1"/);

assert.match(text.client, /const PAGE_SIZES = \["10", "20", "50", "100", "150", "ALL"\]/);
assert.match(text.client, /const \[pageSize, setPageSize\][\s\S]*"10"/);
assert.match(text.client, /if \(variant === "drafts" && report\.workflowStatus !== "DRAFT"\) return false/);
assert.match(text.client, /const title = variant === "drafts" \? "Drafts Daily Reports" : "Daily Reports"/);
assert.match(text.client, /const listingTitle = variant === "drafts" \? "Draft Reports Listing" : "Daily Reports Listing"/);
assert.match(text.client, /enableBulkApproval/);
assert.match(text.client, /selectedReports\.length/);
assert.match(text.client, /handleApproveSelected/);
assert.match(text.client, /approveDailyReports\(Array\.from\(selectedIds\)\)/);
assert.match(text.client, /Approve Selected/);
assert.match(text.client, /<ExportButton/);
assert.match(text.client, /filename=\{variant === "drafts" \? "draft-daily-reports" : "daily-reports"\}/);
assert.match(text.client, /sheetName=\{listingTitle\}/);
assert.match(text.client, /columns=\{dailyReportsExportColumns\}/);
assert.match(text.client, /data=\{filteredReports as unknown as Record<string, unknown>\[\]\}/);
assert.match(text.client, /window\.print\(\)/);
assert.match(text.client, /placeholder="Child #"/);
assert.match(text.client, /placeholder="F Name"/);
assert.match(text.client, /placeholder="L Name"/);
assert.match(text.client, /placeholder="Status"/);
assert.match(text.client, /placeholder="Report Date"/);
assert.match(text.client, /type="date"[\s\S]*createdFrom/);
assert.match(text.client, /type="date"[\s\S]*createdTo/);
assert.match(text.client, /Clear/);
assert.match(text.client, />Child #<\/TableHead>/);
assert.match(text.client, />Image<\/TableHead>/);
assert.match(text.client, />F Name<\/TableHead>/);
assert.match(text.client, />L Name<\/TableHead>/);
assert.match(text.client, />Status<\/TableHead>/);
assert.match(text.client, />Branch<\/TableHead>/);
assert.match(text.client, />Class<\/TableHead>/);
assert.match(text.client, />Report Date<\/TableHead>/);
assert.match(text.client, />Date<\/TableHead>/);
assert.match(text.client, />Action<\/TableHead>/);
assert.match(text.client, /\/images\/EmpPhoto\/\$\{photo\}/);
assert.match(text.client, /href=\{`\/daily-reports\/\$\{report\.id\}`\}/);
assert.match(text.client, /href=\{`\/daily-reports\/\$\{report\.id\}\/edit`\}/);
assert.match(text.client, /href=\{`\/daily-reports\/\$\{report\.id\}\/print`\}/);

assert.match(text.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(text.exportButton, /Copy table/);
assert.match(text.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(text.exportButton, /Export as PDF \(\.pdf\)/);

const matrix = JSON.parse(text.matrix) as Array<{
  legacyPhp: string;
  status: string;
  verification: string;
}>;
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/dailyreportsd.php",
);
assert.ok(row, "page parity row for dailyreportsd.php");
assert.equal(
  row.status,
  "restored - legacy draft daily report roster, filters, TableTools exports, print, page sizes, selected approval, and bridge restored",
);
assert.doesNotMatch(row.verification, /Remaining work/);
assert.match(row.verification, /legacy TableTools Copy, PDF, XLS, and Print/);
assert.match(row.verification, /modern XLSX replacement/);
assert.match(row.verification, /selected-row approval/);
assert.match(row.verification, /Browser smoke confirmed/);
assert.match(
  row.verification,
  /verify-legacy-draft-daily-reports-roster-contract\.ts/,
);
assert.match(
  text.matrixMd,
  /dailyreportsd\.php \| Front\/templates\/admin\/js\/dailyreportsd\.js \| \/dailyreportsd\.php, \/daily-reports\/drafts \| restored - legacy draft daily report roster, filters, TableTools exports, print, page sizes, selected approval, and bridge restored/,
);
assert.doesNotMatch(text.matrixMd, /dailyreportsd\.php[^\n]*visual audit remains/);

console.log("legacy draft daily reports roster contract verified.");
