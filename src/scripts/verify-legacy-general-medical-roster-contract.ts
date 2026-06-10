import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/Medical_forms1.php`,
    "utf8",
  ),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/Medical_forms1.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/Medical_forms1.php/route.ts", "utf8"),
  page: readFileSync("src/app/(app)/medical/general/page.tsx", "utf8"),
  client: readFileSync(
    "src/app/(app)/medical/general/medical-general-client.tsx",
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
assert.match(text.legacyPhp, /\$child = \$db->getChildinfo\(\)/);
assert.match(text.legacyPhp, /<h4 class="modal-title">Create a Medical Form<\/h4>/);
assert.match(text.legacyPhp, /id="createform"/);
assert.match(text.legacyPhp, /Choose Child/);
assert.match(text.legacyPhp, /id="btnSubmitform"[\s\S]*Create Form/);
assert.match(text.legacyPhp, /<h3 class="page-title">\s*General Info\s*<\/h3>/);
assert.match(text.legacyPhp, /General Form Listing/);
assert.match(text.legacyPhp, /id="newform1"[\s\S]*New Child General Form/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(
  text.legacyPhp,
  /fa-slack[\s\S]*Image[\s\S]*F Name[\s\S]*L Name[\s\S]*DOB[\s\S]*Branch[\s\S]*Class[\s\S]*Year[\s\S]*Gender[\s\S]*Date[\s\S]*Action/,
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
assert.match(text.legacyPhp, /js\/Medical_forms1\.js/);

assert.match(text.legacyJs, /\/\*var conn = new ab\.Session/);
assert.match(text.legacyJs, /conn\.subscribe\("new_form1"\+cat_master/);
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
assert.match(text.legacyJs, /getformoneAllHashed/);
assert.match(text.legacyJs, /"data":\s*"form_id"/);
assert.match(text.legacyJs, /"data":\s*"image"/);
assert.match(text.legacyJs, /"data":\s*"cname"/);
assert.match(text.legacyJs, /"data":\s*"clname"/);
assert.match(text.legacyJs, /"data":\s*"dob"/);
assert.match(text.legacyJs, /"data":\s*"brname"/);
assert.match(text.legacyJs, /"data":\s*"classname"/);
assert.match(text.legacyJs, /"data":\s*"db_id"/);
assert.match(text.legacyJs, /"data":\s*"gender"/);
assert.match(text.legacyJs, /"data":\s*"datetime"/);
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
assert.match(text.legacyJs, /Medical_form1\.php\?id=/);
assert.match(text.legacyJs, /function deleteform1\(sid\)/);
assert.match(text.legacyJs, /url: '..\/..\/..\/ajax\/v1\/deleteform1'/);

assert.match(text.bridge, /export const runtime = "nodejs"/);
assert.match(text.bridge, /new URL\("\/medical\/general", request\.url\)/);
assert.match(text.bridge, /NextResponse\.redirect/);
assert.match(text.bridge, /export async function GET\(request: NextRequest\)/);
assert.match(text.bridge, /export async function POST\(request: NextRequest\)/);

assert.match(text.guards, /legacyPage: "medical_reports\.php"[\s\S]*"\/Medical_forms1\.php"/);
assert.match(text.guards, /legacyPage: "medical_reports\.php"[\s\S]*prefixes: \["\/medical\/"\]/);

assert.match(text.page, /getMedicalForms\(\{ formType: "GENERAL", pageSize: "all" \}\)/);
assert.match(text.page, /getBranches\(\)/);
assert.match(text.page, /getClasses\(\)/);
assert.match(text.page, /getSchoolYears\(\)/);
assert.match(text.page, /legacyNumber\(data, "_oldId", "form_id", "id"\)/);
assert.match(text.page, /legacyNumber\(data, "db_id"\)/);
assert.match(text.page, /schoolYearByLegacyId/);
assert.match(text.page, /childNumber: form\.child\.childNumber \?\? form\.child\.legacyId\?\.toString\(\)/);

assert.match(text.actions, /pageSize\?: number \| "all"/);
assert.match(text.actions, /const paginated = pageSize !== "all"/);
assert.match(text.actions, /formType/);

assert.match(text.client, /const PAGE_SIZES = \["10", "20", "50", "100", "150", "ALL"\]/);
assert.match(text.client, /const \[pageSize, setPageSize\][\s\S]*"10"/);
assert.match(text.client, /title="General Info"/);
assert.match(text.client, /General Form Listing/);
assert.match(text.client, /New Child General Form/);
assert.match(text.client, /filename="general-medical-forms"/);
assert.match(text.client, /sheetName="General Form Listing"/);
assert.match(text.client, /columns=\{exportColumns\}/);
assert.match(text.client, /data=\{filteredForms as unknown as Record<string, unknown>\[\]\}/);
assert.match(text.client, /window\.print\(\)/);
assert.match(text.client, /placeholder="Form #"/);
assert.match(text.client, /placeholder="F Name"/);
assert.match(text.client, /placeholder="L Name"/);
assert.match(text.client, /placeholder="DOB"/);
assert.match(text.client, /placeholder="Class"/);
assert.match(text.client, /placeholder="Year"/);
assert.match(text.client, /placeholder="Gender"/);
assert.match(text.client, />Form #<\/TableHead>/);
assert.match(text.client, />Image<\/TableHead>/);
assert.match(text.client, />F Name<\/TableHead>/);
assert.match(text.client, />L Name<\/TableHead>/);
assert.match(text.client, />DOB<\/TableHead>/);
assert.match(text.client, />Branch<\/TableHead>/);
assert.match(text.client, />Class<\/TableHead>/);
assert.match(text.client, />Year<\/TableHead>/);
assert.match(text.client, />Gender<\/TableHead>/);
assert.match(text.client, />Date<\/TableHead>/);
assert.match(text.client, />Action<\/TableHead>/);
assert.match(text.client, /\/images\/EmpPhoto\/\$\{photo\}/);
assert.match(text.client, /href=\{`\/medical\/general\/\$\{form\.id\}`\}/);
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
  (entry) => entry.legacyPhp === "Front/templates/admin/Medical_forms1.php",
);
assert.ok(row, "page parity row for Medical_forms1.php");
assert.equal(
  row.status,
  "restored - legacy general form roster, TableTools exports, print, visual smoke, and bridge restored",
);
assert.doesNotMatch(row.verification, /Remaining work/);
assert.match(row.verification, /legacy TableTools Copy, PDF, XLS, and Print/);
assert.match(row.verification, /modern XLSX replacement/);
assert.match(row.verification, /commented legacy websocket refresh/);
assert.match(row.verification, /Browser smoke confirmed/);
assert.match(
  row.verification,
  /verify-legacy-general-medical-roster-contract\.ts/,
);
assert.match(
  text.matrixMd,
  /Medical_forms1\.php \| Front\/templates\/admin\/js\/Medical_forms1\.js \| \/Medical_forms1\.php, \/medical\/general \| restored - legacy general form roster, TableTools exports, print, visual smoke, and bridge restored/,
);
assert.doesNotMatch(text.matrixMd, /Medical_forms1\.php[^\n]*final logged-in visual smoke/);

console.log("legacy general medical roster contract verified.");
