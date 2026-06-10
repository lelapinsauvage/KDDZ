import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/Medical_forms5.php`,
    "utf8",
  ),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/Medical_forms5.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/Medical_forms5.php/route.ts", "utf8"),
  page: readFileSync("src/app/(app)/medical/accidents/page.tsx", "utf8"),
  client: readFileSync(
    "src/app/(app)/medical/accidents/accident-reports-client.tsx",
    "utf8",
  ),
  actions: readFileSync("src/lib/actions/medical.ts", "utf8"),
  guards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  exportButton: readFileSync("src/components/shared/export-button.tsx", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('medical_reports\.php'\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /\$branch = \$db->getBranches\(\)/);
assert.match(text.legacyPhp, /\$forms = \$db->getForms\(\)/);
assert.match(text.legacyPhp, /\$child = \$db->getChildinfoformfive\(\)/);
assert.match(text.legacyPhp, /<h4 class="modal-title">Create an Accident Report<\/h4>/);
assert.match(text.legacyPhp, /id="createform"/);
assert.match(text.legacyPhp, /Choose Child/);
assert.match(text.legacyPhp, /id="btnSubmitform"[\s\S]*Create Report/);
assert.match(text.legacyPhp, /<h3 class="page-title">\s*Accident Reports\s*<\/h3>/);
assert.match(text.legacyPhp, /Accident Reports Listing/);
assert.match(text.legacyPhp, /id="newform1"[\s\S]*New Accident Report/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(
  text.legacyPhp,
  /fa-slack[\s\S]*Image[\s\S]*F Name[\s\S]*L Name[\s\S]*Cause[\s\S]*Branch[\s\S]*Class[\s\S]*Place[\s\S]*First Aid[\s\S]*Date[\s\S]*Action/,
);
assert.match(text.legacyPhp, /name="ids"/);
assert.match(text.legacyPhp, /name="name"/);
assert.match(text.legacyPhp, /name="lname"/);
assert.match(text.legacyPhp, /name="dob"/);
assert.match(text.legacyPhp, /name="content" id="content"/);
assert.match(text.legacyPhp, /name="class"/);
assert.match(text.legacyPhp, /name="nat"/);
assert.match(text.legacyPhp, /name="gender"/);
assert.match(text.legacyPhp, /id="mind1"/);
assert.match(text.legacyPhp, /id="maxd1"/);
assert.match(text.legacyPhp, /id="ClearInputs"/);
assert.match(text.legacyPhp, /dataTables\.tableTools\.min\.js/);
assert.match(text.legacyPhp, /js\/Medical_forms5\.js/);

assert.match(text.legacyJs, /\/\*var conn = new ab\.Session/);
assert.match(text.legacyJs, /conn\.subscribe\("new_form5"\+cat_master/);
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
assert.match(text.legacyJs, /getformfiveAllHashed/);
assert.match(text.legacyJs, /"data":\s*"form_id"/);
assert.match(text.legacyJs, /"data":\s*"image"/);
assert.match(text.legacyJs, /"data":\s*"cname"/);
assert.match(text.legacyJs, /"data":\s*"clname"/);
assert.match(text.legacyJs, /"data":\s*"cause"/);
assert.match(text.legacyJs, /"data":\s*"brname"/);
assert.match(text.legacyJs, /"data":\s*"classname"/);
assert.match(text.legacyJs, /"data":\s*"place"/);
assert.match(text.legacyJs, /"data":\s*"firstaid"/);
assert.match(text.legacyJs, /"data":\s*"datetime"/);
assert.match(text.legacyJs, /d\.search\.value = 'DATE_RANGE'/);
assert.match(text.legacyJs, /d\.columns\[9\]\.Min_Range = \$\('#mind1'\)\.val\(\) \+ " 00:00:00"/);
assert.match(text.legacyJs, /d\.columns\[9\]\.Max_Range = \$\('#maxd1'\)\.val\(\) \+ " 23:59:59"/);
assert.match(text.legacyJs, /"order":\s*\[\s*\[\s*0,\s*"desc"\s*\]/);
assert.match(text.legacyJs, /input\[name=ids\][\s\S]*\.column\(0\)/);
assert.match(text.legacyJs, /input\[name=name\][\s\S]*\.column\(2\)/);
assert.match(text.legacyJs, /input\[name=lname\][\s\S]*\.column\(3\)/);
assert.match(text.legacyJs, /input\[name=dob\][\s\S]*\.column\(4\)/);
assert.match(text.legacyJs, /#content[\s\S]*table\.column\(5\)/);
assert.match(text.legacyJs, /input\[name=class\][\s\S]*\.column\(6\)/);
assert.match(text.legacyJs, /input\[name=nat\][\s\S]*\.column\(7\)/);
assert.match(text.legacyJs, /input\[name=gender\][\s\S]*\.column\(8\)/);
assert.match(text.legacyJs, /function medform\(childid\)/);
assert.match(text.legacyJs, /\$\('#modalAddForm'\)\.modal\(\)/);
assert.match(text.legacyJs, /\$\("#newform1"\)\.click/);
assert.match(text.legacyJs, /\$\("#createform"\)\.on\("change"/);
assert.match(text.legacyJs, /classes\/encrypt\.php/);
assert.match(text.legacyJs, /Medical_form5\.php\?id=/);
assert.match(text.legacyJs, /function deleteform1\(sid\)/);
assert.match(text.legacyJs, /url: '..\/..\/..\/ajax\/v1\/deleteform1'/);

assert.match(text.bridge, /export const runtime = "nodejs"/);
assert.match(text.bridge, /new URL\("\/medical\/accidents", request\.url\)/);
assert.match(text.bridge, /NextResponse\.redirect/);
assert.match(text.bridge, /export async function GET\(request: NextRequest\)/);
assert.match(text.bridge, /export async function POST\(request: NextRequest\)/);

assert.match(text.guards, /legacyPage: "medical_reports\.php"[\s\S]*"\/Medical_forms5\.php"/);
assert.match(text.guards, /legacyPage: "medical_reports\.php"[\s\S]*prefixes: \["\/medical\/"\]/);

assert.match(text.page, /searchParams: Promise<\{ branch\?: string \}>/);
assert.match(text.page, /getMedicalForms\(\{[\s\S]*formType:\s*"ACCIDENTS"[\s\S]*pageSize:\s*"all"/);
assert.match(text.page, /branchId:\s*scopedBranch\?\.id/);
assert.match(text.page, /legacyNumber\(d, "_oldId", "form_id", "id"\)/);
assert.match(text.page, /cause: legacyString\(d, "cause", "accidentCause"\)/);
assert.match(text.page, /place: legacyString\(d, "place", "location"\)/);
assert.match(text.page, /firstAid: legacyString\(d, "firstaid", "firstAid", "firstAidGiven"\)/);
assert.match(text.page, /createdAt: form\.createdAt\.toISOString\(\)/);

assert.match(text.actions, /pageSize\?: number \| "all"/);
assert.match(text.actions, /const paginated = pageSize !== "all"/);
assert.match(text.actions, /formType/);

assert.match(text.client, /const PAGE_SIZES = \["10", "20", "50", "100", "150", "ALL"\]/);
assert.match(text.client, /title=\{pageTitle\}/);
assert.match(text.client, /Accident Reports Listing/);
assert.match(text.client, /New Accident Report/);
assert.match(text.client, /filename="accident-reports"/);
assert.match(text.client, /sheetName="Accident Reports Listing"/);
assert.match(text.client, /columns=\{accidentReportsExportColumns\}/);
assert.match(text.client, /window\.print\(\)/);
assert.match(text.client, /placeholder="Form #"/);
assert.match(text.client, /placeholder="F Name"/);
assert.match(text.client, /placeholder="L Name"/);
assert.match(text.client, /placeholder="Cause"/);
assert.match(text.client, /placeholder="Place"/);
assert.match(text.client, /placeholder="First Aid"/);
assert.match(text.client, /type="date"/);
assert.match(text.client, /header: "Form #"/);
assert.match(text.client, />Image</);
assert.match(text.client, /header: "F Name"/);
assert.match(text.client, /header: "L Name"/);
assert.match(text.client, /header: "Cause"/);
assert.match(text.client, /header: "Branch"/);
assert.match(text.client, /header: "Class"/);
assert.match(text.client, /header: "Place"/);
assert.match(text.client, /header: "First Aid"/);
assert.match(text.client, /header: "Date"/);
assert.match(text.client, />Action</);
assert.match(text.client, /\/images\/EmpPhoto\/\$\{photo\}/);
assert.match(text.client, /href=\{`\/medical\/accidents\/\$\{report\.id\}`\}/);
assert.match(text.client, /rightId - leftId/);

assert.match(text.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(text.exportButton, /Copy table/);
assert.match(text.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(text.exportButton, /Export as CSV \(\.csv\)/);
assert.match(text.exportButton, /Export as PDF \(\.pdf\)/);

const matrix = JSON.parse(text.matrix) as Array<{
  legacyPhp: string;
  status: string;
  verification: string;
}>;
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/Medical_forms5.php",
);
assert.ok(row, "page parity row for Medical_forms5.php");
assert.equal(
  row.status,
  "restored - legacy accident reports roster, TableTools exports, print, visual smoke, and bridge restored",
);
assert.doesNotMatch(row.verification, /Remaining work/);
assert.match(row.verification, /legacy TableTools Copy, PDF, XLS, and Print/);
assert.match(row.verification, /modern XLSX replacement/);
assert.match(row.verification, /commented legacy websocket refresh/);
assert.match(row.verification, /Browser smoke confirmed/);
assert.match(row.verification, /verify-legacy-accident-reports-roster-contract\.ts/);

assert.match(
  text.matrixMd,
  /Medical_forms5\.php \| Front\/templates\/admin\/js\/Medical_forms5\.js \| \/Medical_forms5\.php, \/medical\/accidents \| restored - legacy accident reports roster, TableTools exports, print, visual smoke, and bridge restored/,
);
assert.doesNotMatch(
  text.matrixMd,
  /Medical_forms5\.php[^\n]*Remaining work/,
);
assert.match(
  text.matrixMd,
  /Medical_forms5\.php[\s\S]*verify-legacy-accident-reports-roster-contract\.ts/,
);

console.log("legacy accident reports roster contract assertions passed");
