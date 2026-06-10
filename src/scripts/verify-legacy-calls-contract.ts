import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyCallsPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/calls.php",
  legacyCallsJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/calls.js",
  legacyBranchCallsPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/bcalls.php",
  legacyBranchCallsJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/bcalls.js",
  legacyCallPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/call.php",
  legacyCallJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/call.js",
  callsBridge: "src/app/(app)/calls.php/page.tsx",
  branchCallsBridge: "src/app/(app)/bcalls.php/page.tsx",
  branchCallsModernBridge: "src/app/(app)/branches/[id]/calls/page.tsx",
  callBridge: "src/app/(app)/call.php/page.tsx",
  callsPage: "src/app/(app)/calls/page.tsx",
  callsClient: "src/app/(app)/calls/calls-management-client.tsx",
  exportButton: "src/components/shared/export-button.tsx",
  callDetailPage: "src/app/(app)/calls/[id]/page.tsx",
  callDetailClient: "src/app/(app)/calls/[id]/call-detail-client.tsx",
  callDialog: "src/app/(app)/children/[id]/calls/call-report-dialog.tsx",
  actions: "src/lib/actions/calls.ts",
  branchResolver: "src/lib/legacy-branch.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyCallsPhp, /Check::protectPageOrFunction\('calls\.php'\)/);
assert.match(text.legacyCallsPhp, /<title>Calls Management<\/title>/);
assert.match(text.legacyCallsPhp, /\$branch = \$db->getBranches\(\)/);
assert.match(text.legacyCallsPhp, /\$forms = \$db->getForms\(\)/);
assert.match(text.legacyCallsPhp, /\$child = \$db->getChildinfoformfive\(\)/);
assert.match(text.legacyCallsPhp, /Create Calls Report/);
assert.match(text.legacyCallsPhp, /id="createform"/);
assert.match(text.legacyCallsPhp, /New Call Report/);
assert.match(text.legacyCallsPhp, /Incoming\/Outgoing Calls Listing/);
assert.match(text.legacyCallsPhp, /id="datatable_ajax"/);
assert.match(text.legacyCallsPhp, /Image[\s\S]*F Name[\s\S]*L Name[\s\S]*Call Type[\s\S]*Branch[\s\S]*Class[\s\S]*Cause[\s\S]*Subject[\s\S]*Date[\s\S]*Action/);
assert.match(text.legacyCallsPhp, /name="ids"/);
assert.match(text.legacyCallsPhp, /name="name"/);
assert.match(text.legacyCallsPhp, /name="lname"/);
assert.match(text.legacyCallsPhp, /name="dob"/);
assert.match(text.legacyCallsPhp, /id="content"/);
assert.match(text.legacyCallsPhp, /name="class"/);
assert.match(text.legacyCallsPhp, /name="nat"/);
assert.match(text.legacyCallsPhp, /name="gender"/);
assert.match(text.legacyCallsPhp, /id="mind1"/);
assert.match(text.legacyCallsPhp, /id="maxd1"/);
assert.match(text.legacyCallsPhp, /id="ClearInputs"/);
assert.match(text.legacyCallsPhp, /<script src="js\/calls\.js" type="text\/javascript"><\/script>/);

assert.match(text.legacyCallsJs, /var ArrayColumns = \[/);
assert.match(text.legacyCallsJs, /\{"data": "child_num"\}/);
assert.match(text.legacyCallsJs, /\{"data": "image"\}/);
assert.match(text.legacyCallsJs, /\{"data": "cname"\}/);
assert.match(text.legacyCallsJs, /\{"data": "clname"\}/);
assert.match(text.legacyCallsJs, /\{"data": "calltype"\}/);
assert.match(text.legacyCallsJs, /\{"data": "brname"\}/);
assert.match(text.legacyCallsJs, /\{"data": "classname"\}/);
assert.match(text.legacyCallsJs, /\{"data": "causeofcall"\}/);
assert.match(text.legacyCallsJs, /\{"data": "subject"\}/);
assert.match(text.legacyCallsJs, /\{"data": "datetime"\}/);
assert.match(text.legacyCallsJs, /"lengthMenu":\s*\[\s*\[\s*10,\s*20,\s*50,\s*100,\s*150,\s*-1\]/);
assert.match(text.legacyCallsJs, /\[10,\s*20,\s*50,\s*100,\s*150,\s*"All"\]/);
assert.match(text.legacyCallsJs, /"pageLength":\s*10/);
assert.match(text.legacyCallsJs, /"oTableTools"/);
assert.match(text.legacyCallsJs, /"copy"/);
assert.match(text.legacyCallsJs, /"print"/);
assert.match(text.legacyCallsJs, /'sExtends': 'pdf'/);
assert.match(text.legacyCallsJs, /'sExtends': 'xls'/);
assert.match(text.legacyCallsJs, /\/\/ var conn = new ab\.Session/);
assert.match(text.legacyCallsJs, /\/\/ conn\.subscribe\("new_form6"\+cat_master/);
assert.match(text.legacyCallsJs, /\/\/ console\.warn\('WebSocket connection closed'\)/);
assert.match(text.legacyCallsJs, /getformsixAllHashed/);
assert.match(text.legacyCallsJs, /d\.search\.value = 'DATE_RANGE'/);
assert.match(text.legacyCallsJs, /d\.columns\[9\]\.Min_Range = \$\('#mind1'\)\.val\(\)/);
assert.match(text.legacyCallsJs, /d\.columns\[9\]\.Max_Range = strdate1/);
assert.match(text.legacyCallsJs, /"order":\s*\[\s*\[\s*0,\s*"desc"\s*\]/);
assert.match(text.legacyCallsJs, /deletecall/);
assert.match(text.legacyCallsJs, /#newform1/);
assert.match(text.legacyCallsJs, /#createform/);

assert.match(text.legacyBranchCallsPhp, /Check::protectPageOrFunction\('calls\.php'\)/);
assert.match(text.legacyBranchCallsPhp, /isset\(\$_GET\['brid'\]\)/);
assert.match(text.legacyBranchCallsPhp, /encrypt_decrypt\('decrypt', \$encrid\)/);
assert.match(text.legacyBranchCallsPhp, /window\.location = 'calls\.php'/);
assert.match(text.legacyBranchCallsPhp, /fetchBranchName\(\$brid\)/);
assert.match(text.legacyBranchCallsPhp, /Calls Management - <\?php\s+echo \$branchname; \?>/);
assert.match(text.legacyBranchCallsPhp, /id="branchid" value="<\?php echo \$brid; \?>"/);
assert.match(text.legacyBranchCallsPhp, /Calls Reports - <\?php\s+echo \$branchname; \?>/);
assert.match(text.legacyBranchCallsPhp, /name="content" <\?php if\(isset\(\$brid\)\)\{ echo 'disabled'; \}/);
assert.match(text.legacyBranchCallsPhp, /<script src="js\/bcalls\.js" type="text\/javascript"><\/script>/);
assert.match(text.legacyBranchCallsJs, /var brid = \$\('#branchid'\)\.val\(\)/);
assert.match(text.legacyBranchCallsJs, /getformsixAllperbranchHashed/);
assert.match(text.legacyBranchCallsJs, /brid: brid/);
assert.match(text.legacyBranchCallsJs, /"pageLength":\s*10/);
assert.match(text.legacyBranchCallsJs, /"copy"/);
assert.match(text.legacyBranchCallsJs, /"print"/);
assert.match(text.legacyBranchCallsJs, /'sExtends': 'pdf'/);
assert.match(text.legacyBranchCallsJs, /'sExtends': 'xls'/);
assert.match(text.legacyBranchCallsJs, /\/\/ var conn = new ab\.Session/);
assert.match(
  text.legacyBranchCallsJs,
  /\/\/ conn\.subscribe\("new_form6"\+cat_master/,
);
assert.match(
  text.legacyBranchCallsJs,
  /\/\/ console\.warn\('WebSocket connection closed'\)/,
);

assert.match(text.legacyCallPhp, /Check::protectPageOrFunction\('call\.php'\)/);
assert.match(text.legacyCallPhp, /\$cause = \$db->getCauses\(\)/);
assert.match(text.legacyCallPhp, /<title>Calls Form<\/title>/);
assert.match(text.legacyCallPhp, /\$name = "Call Report"/);
assert.match(text.legacyCallPhp, /encrypt_decrypt\('decrypt', \$encrid\)/);
assert.match(text.legacyCallPhp, /getformprogress\(\$table, \$form, \$form_id\)/);
assert.match(text.legacyCallPhp, /id="emp_id" value="<\?= \$emp_id \?>"/);
assert.match(text.legacyCallPhp, /id="form_id" value="<\?= \$form_id \?>"/);
assert.match(text.legacyCallPhp, /green\.jpg[\s\S]*Form Filled Completely/);
assert.match(text.legacyCallPhp, /red\.jpg[\s\S]*Form Not Filled Completely/);
assert.match(text.legacyCallPhp, /id="IdImageUpload" src="\.\/images\/EmpPhoto\/default\.jpg"/);
assert.match(text.legacyCallPhp, /id="calltype"[\s\S]*Incoming[\s\S]*Outgoing/);
assert.match(text.legacyCallPhp, /id="accident_date"/);
assert.match(text.legacyCallPhp, /id="accident_time"/);
assert.match(text.legacyCallPhp, /id="causeofcall"/);
assert.match(text.legacyCallPhp, /id="subject"/);
assert.match(text.legacyCallPhp, /id="remarks"/);
assert.match(text.legacyCallPhp, /id="teacher_id"/);
assert.match(text.legacyCallPhp, /id="attachment_form"/);
assert.match(text.legacyCallPhp, /id="btnAddRequest"/);
assert.match(text.legacyCallPhp, /btnUpdate"> Save <\/button>/);
assert.match(text.legacyCallPhp, /class="btn btn-warning btn-circle btn-fill btn-wd btnDraft"> Save As Draft <\/button>/);
assert.match(text.legacyCallPhp, /<script src="js\/call\.js" type="text\/javascript"><\/script>/);

assert.match(text.legacyCallJs, /function Create\(ac_no, form_id\)/);
assert.match(text.legacyCallJs, /var is_draft = 1/);
assert.match(text.legacyCallJs, /function Update\(ac_no, form_id\)/);
assert.match(text.legacyCallJs, /var is_draft = 0/);
assert.match(text.legacyCallJs, /if \(calltype == ""\)/);
assert.match(text.legacyCallJs, /if \(accident_date == ""\)/);
assert.match(text.legacyCallJs, /if \(accident_time == ""\)/);
assert.match(text.legacyCallJs, /if \(causeofcall == ""\)/);
assert.match(text.legacyCallJs, /if \(subject == ""\)/);
assert.match(text.legacyCallJs, /if \(teacher_id == ""\)/);
assert.match(text.legacyCallJs, /Please Fill the mendatory Fields \(RED\) !!/);
assert.match(text.legacyCallJs, /formdata\.append\('is_draft', is_draft\)/);
assert.match(text.legacyCallJs, /formdata\.append\('form_id', form_id\)/);
assert.match(text.legacyCallJs, /formdata\.append\('childid', ac_no\)/);
assert.match(text.legacyCallJs, /formdata\.append\('calltype', calltype\)/);
assert.match(text.legacyCallJs, /formdata\.append\('accident_date', accident_date\)/);
assert.match(text.legacyCallJs, /formdata\.append\('accident_time', accident_time\)/);
assert.match(text.legacyCallJs, /formdata\.append\('causeofcall', causeofcall\)/);
assert.match(text.legacyCallJs, /formdata\.append\('subject', subject\)/);
assert.match(text.legacyCallJs, /formdata\.append\('remarks', remarks\)/);
assert.match(text.legacyCallJs, /formdata\.append\('teacher_id', teacher_id\)/);
assert.match(text.legacyCallJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/AddFormSix'/);
assert.match(text.legacyCallJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/AddAttToForm'/);
assert.match(text.legacyCallJs, /window\.location\.replace\("call\.php\?id="\+cfdata\+"\&fid="\+cdata\)/);
assert.match(text.legacyCallJs, /getFormSixData/);
assert.match(text.legacyCallJs, /if \(mydata\['rep_det'\]\['is_rep_draft'\] == 0\)/);
assert.match(text.legacyCallJs, /\$\("\.btnUpdate"\)\.on\("click"/);
assert.match(text.legacyCallJs, /\$\("\.btnDraft"\)\.on\("click"/);
assert.match(text.legacyCallJs, /Update\(ids, fids\)/);
assert.match(text.legacyCallJs, /Create\(ids, fids\)/);
assert.match(text.legacyCallJs, /getAllCauses/);
assert.match(text.legacyCallJs, /images\/MedForms\/default\.jpg/);
assert.match(text.legacyCallJs, /sel_generateattachment/);
assert.match(text.legacyCallJs, /getAttValues/);

assert.match(text.callsBridge, /import CallsManagementPage from "\.\.\/calls\/page"/);
assert.match(text.callsBridge, /export default CallsManagementPage/);
assert.match(text.branchCallsBridge, /resolveLegacyBranchId\(brid\)/);
assert.match(text.branchCallsBridge, /import CallsManagementPage from "\.\.\/calls\/page"/);
assert.match(text.branchCallsBridge, /Promise\.resolve\(modernParams\)/);
assert.match(text.branchCallsBridge, /branch: branchId/);
assert.match(text.branchCallsModernBridge, /redirect\(`\/calls\?branch=\$\{encodeURIComponent\(id\)\}`\)/);
assert.match(text.branchResolver, /legacyNumericCandidates\(identifier\)/);
assert.match(text.branchResolver, /UUID_PATTERN\.test\(normalizedIdentifier\)/);
assert.match(text.callBridge, /if \(!fid\?\.trim\(\)\)/);
assert.match(text.callBridge, /import StandaloneCallPage from "\.\.\/calls\/\[id\]\/page"/);
assert.match(text.callBridge, /params=\{Promise\.resolve\(\{ id: fid\.trim\(\) \}\)\}/);
assert.match(text.callBridge, /searchParams=\{Promise\.resolve\(\{ legacyChild: id\?\.trim\(\) \}\)\}/);

assert.match(text.callsPage, /function parsePageSize\(value: string \| undefined\): CallsPageSize/);
assert.match(text.callsPage, /const parsed = Number\(value\) \|\| 10/);
assert.match(text.callsPage, /return 10/);
assert.match(text.callsPage, /getCallLogs\(listParams\)/);
assert.match(text.callsPage, /getCallLogs\(\{ \.\.\.listParams, page: 1, pageSize: "all" \}\)/);
assert.match(text.callsPage, /branchId: params\.branch && params\.branch !== "ALL" \? params\.branch : undefined/);
assert.match(text.callsPage, /classId: params\.class && params\.class !== "ALL" \? params\.class : undefined/);
assert.match(text.callsPage, /direction: parseDirection\(params\.direction\)/);
assert.match(text.callsPage, /dateFrom: params\.dateFrom \|\| undefined/);
assert.match(text.callsPage, /dateTo: params\.dateTo \|\| undefined/);

assert.match(text.callsClient, /filename="calls"/);
assert.match(text.callsClient, /sheetName="Calls Reports"/);
assert.match(text.callsClient, /onClick=\{\(\) => window\.print\(\)\}/);
assert.match(text.callsClient, /disabled=\{calls\.length === 0\}/);
assert.match(text.callsClient, /<div className="hidden print:block">/);
assert.match(text.callsClient, /Printed on/);
assert.match(text.callsClient, /New Call Report/);
assert.match(text.callsClient, /All Branches/);
assert.match(text.callsClient, /All Classes/);
assert.match(text.callsClient, /All Types/);
assert.match(text.callsClient, /Date from/);
assert.match(text.callsClient, /Date to/);
assert.match(text.callsClient, /<TableHead>#<\/TableHead>[\s\S]*<TableHead>Image<\/TableHead>[\s\S]*<TableHead>F Name<\/TableHead>[\s\S]*<TableHead>L Name<\/TableHead>[\s\S]*<TableHead>Call Type<\/TableHead>[\s\S]*<TableHead>Branch<\/TableHead>[\s\S]*<TableHead>Class<\/TableHead>[\s\S]*<TableHead>Cause<\/TableHead>[\s\S]*<TableHead>Subject<\/TableHead>[\s\S]*<TableHead>Date<\/TableHead>/);
assert.match(text.callsClient, /href=\{`\/calls\/\$\{call\.id\}`\}/);
assert.match(text.callsClient, /Delete call log/);
assert.match(text.callsClient, /\[10, 20, 50, 100, 150\]\.map/);
assert.match(text.callsClient, /<SelectItem value="all">All<\/SelectItem>/);
assert.match(text.callsClient, /Showing <span className="font-medium text-foreground">\{pageStart\}/);
assert.match(text.callsClient, /function GlobalCallDialog/);
assert.match(text.callsClient, /Create Call Report/);
assert.match(text.callsClient, /Child \*/);
assert.match(text.callsClient, /Select child/);
assert.match(text.callsClient, /Type \*/);
assert.match(text.callsClient, /Date \*/);
assert.match(text.callsClient, /Time \*/);
assert.match(text.callsClient, /Cause of Call \*/);
assert.match(text.callsClient, /Subject \*/);
assert.match(text.callsClient, /Teacher Who Filled Report \*/);
assert.match(text.callsClient, /Save As Draft/);
assert.match(text.callsClient, /if \(isDraft\) \{[\s\S]*return null/);
assert.match(text.callsClient, /Please fill the mandatory fields \(red\)\./);

assert.match(text.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(text.exportButton, /handleExport\("copy"\)/);
assert.match(text.exportButton, /handleExport\("xlsx"\)/);
assert.match(text.exportButton, /handleExport\("pdf"\)/);
assert.match(text.exportButton, /Copy table/);
assert.match(text.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(text.exportButton, /Export as PDF \(\.pdf\)/);

assert.match(text.callDialog, /function validateBeforeSave\(isDraft: boolean\)/);
assert.match(text.callDialog, /if \(isDraft\) \{[\s\S]*return null/);
assert.match(text.callDialog, /Call type is required/);
assert.match(text.callDialog, /Date is required/);
assert.match(text.callDialog, /Time is required/);
assert.match(text.callDialog, /Cause of call is required/);
assert.match(text.callDialog, /Subject is required/);
assert.match(text.callDialog, /Teacher is required/);
assert.match(text.callDialog, /Existing attachments/);
assert.match(text.callDialog, /Remove \$\{attachment\.filename\}/);
assert.match(text.callDialog, /accept="image\/\*,\.pdf"/);
assert.match(text.callDialog, /Save Call Report/);
assert.match(text.callDialog, /Save As Draft/);

assert.match(text.actions, /pageSize = 10/);
assert.match(text.actions, /orderBy: \[\{ legacyId: "desc" \}, \{ date: "desc" \}, \{ createdAt: "desc" \}\]/);
assert.match(text.actions, /export async function getCallLogDetail/);
assert.match(text.actions, /decodeMaybeURIComponent\(identifier\.trim\(\)\)/);
assert.match(text.actions, /legacyNumericCandidates\(identifier\)/);
assert.match(text.actions, /legacyNumericCandidates\(options\.legacyChildId\)/);
assert.match(text.actions, /UUID_PATTERN\.test\(normalizedIdentifier\)/);
assert.match(text.actions, /legacyId: \{ in: legacyIds \}/);
assert.match(text.actions, /legacyKey: normalizedIdentifier/);
assert.match(text.actions, /legacyId: \{ in: legacyChildIds \}/);
assert.match(text.actions, /attachments: \{[\s\S]*where: \{ isActive: true \}/);
assert.match(text.actions, /function validateCallLogData\(data: CallLogMutationData\)/);
assert.match(text.actions, /if \(data\.isDraft\) return null/);
assert.match(text.actions, /is_rep_draft: data\.isDraft \? 1 : 0/);
assert.match(text.actions, /formType: "CALL_LOG"/);
assert.match(text.actions, /data\.removeAttachmentIds\?\.length/);
assert.match(text.actions, /data: \{ isActive: false \}/);

assert.match(text.callDetailPage, /getCallLogDetail\(id, \{ legacyChildId: legacyChild \}\)/);
assert.match(text.callDetailPage, /progress = legacyNumber\(legacyData, "f_progress"\) \?\? \(call\.isDraft \? 0 : 1\)/);
assert.match(text.callDetailClient, /Form Filled Completely/);
assert.match(text.callDetailClient, /Form Not Filled Completely/);
assert.match(text.callDetailClient, /window\.print\(\)/);
assert.match(text.callDetailClient, /setEditOpen\(true\)/);
assert.match(text.callDetailClient, /setDeleteOpen\(true\)/);
assert.match(text.callDetailClient, /Child Calls/);
assert.match(text.callDetailClient, /Section title="Call"/);
assert.match(text.callDetailClient, /Section title="Cause of Call"/);
assert.match(text.callDetailClient, /Section title="Subject"/);
assert.match(text.callDetailClient, /Section title="Attachments"/);
assert.match(text.callDetailClient, /setPreviewAttachment\(attachment\)/);
assert.match(text.callDetailClient, /CallReportDialog/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const branchRow = matrix.find(
  (row) => row.modernRoute === "/bcalls.php, /branches/[id]/calls, /calls",
);
const detailRow = matrix.find(
  (row) => row.modernRoute === "/calls/[id], /call.php",
);
const callsRow = matrix.find((row) => row.modernRoute === "/calls.php, /calls");

assert.ok(branchRow);
assert.ok(detailRow);
assert.ok(callsRow);
assert.equal(
  branchRow.status,
  "restored - legacy branch-scoped calls listing, bridge, filters, exports, page sizes, and zero-data smoke parity restored",
);
assert.equal(
  detailRow.status,
  "restored - legacy Form 6 standalone shell, workflow, attachments, and direct legacy bridge restored",
);
assert.match(branchRow.verification ?? "", /verify-legacy-calls-contract\.ts/);
assert.match(detailRow.verification ?? "", /verify-legacy-calls-contract\.ts/);
assert.match(callsRow.verification ?? "", /default 10-row page size/);
assert.match(branchRow.verification ?? "", /Browser smoke confirmed `\/bcalls\.php\?brid=` renders the branch-scoped calls listing/);
assert.match(detailRow.verification ?? "", /Browser detail smoke now uses a temporary source-provenanced Form 6 `CallLog` fixture/);
assert.match(detailRow.verification ?? "", /`\/calls\/\[id\]` rendered `Call Report #910001`/);
assert.match(detailRow.verification ?? "", /Canonical migrated-row detail acceptance remains part of production import verification/);

const markdownRows = {
  branch: text.markdownMatrix
    .split("\n")
    .find((line) => line.includes("| Front/templates/admin/bcalls.php |")),
  detail: text.markdownMatrix
    .split("\n")
    .find((line) => line.includes("| Front/templates/admin/call.php |")),
  calls: text.markdownMatrix
    .split("\n")
    .find((line) => line.includes("| Front/templates/admin/calls.php |")),
};

assert.match(
  markdownRows.branch ?? "",
  /restored - legacy branch-scoped calls listing, bridge, filters, exports, page sizes, and zero-data smoke parity restored/,
);
assert.match(
  markdownRows.branch ?? "",
  /Browser smoke confirmed `\/bcalls\.php\?brid=` renders the branch-scoped calls listing/,
);
assert.doesNotMatch(markdownRows.branch ?? "", /visual smoke remains/);
assert.match(
  markdownRows.detail ?? "",
  /restored - legacy Form 6 standalone shell, workflow, attachments, and direct legacy bridge restored/,
);
assert.match(
  markdownRows.detail ?? "",
  /Browser detail smoke now uses a temporary source-provenanced Form 6 `CallLog` fixture/,
);
assert.match(markdownRows.detail ?? "", /`\/calls\/\[id\]` rendered `Call Report #910001`/);
assert.doesNotMatch(markdownRows.detail ?? "", /visual smoke remains/);
assert.match(
  markdownRows.calls ?? "",
  /restored - legacy incoming\/outgoing call listing bridge, exports, page sizes, and Form 6 creation restored/,
);
assert.match(
  markdownRows.calls ?? "",
  /Browser smoke confirmed the 10-row default selector, legacy headers, zero-data empty state/,
);
assert.doesNotMatch(markdownRows.calls ?? "", /final logged-in visual smoke/);

assert.match(
  text.topGaps,
  /Legacy `calls\.js` and `bcalls\.js` WebSocket refresh blocks are commented out/,
);
assert.match(
  text.topGaps,
  /Browser detail smoke now covers `\/calls\/\[id\]` with a temporary source-provenanced Form 6 `CallLog` fixture/,
);
assert.match(
  text.topGaps,
  /Remaining work is canonical production import acceptance against real migrated call rows/,
);
assert.doesNotMatch(
  text.topGaps,
  /Remaining work is final logged-in visual smoke after local database\/runtime state is clean and exact TableTools export\/print visual parity/,
);

console.log("legacy calls contract assertions passed");
