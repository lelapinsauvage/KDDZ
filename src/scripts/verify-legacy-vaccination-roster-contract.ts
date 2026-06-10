import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/Medical_forms4.php`,
    "utf8",
  ),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/Medical_forms4.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/Medical_forms4.php/route.ts", "utf8"),
  page: readFileSync("src/app/(app)/medical/vaccinations/page.tsx", "utf8"),
  client: readFileSync(
    "src/app/(app)/medical/vaccinations/vaccinations-page-client.tsx",
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
assert.match(text.legacyPhp, /\$child = \$db->getChildinfoformfour\(\)/);
assert.match(text.legacyPhp, /<h4 class="modal-title">Create a Medical Form<\/h4>/);
assert.match(text.legacyPhp, /id="createform"/);
assert.match(text.legacyPhp, /Choose Child/);
assert.match(text.legacyPhp, /id="btnSubmitform"[\s\S]*Create Form/);
assert.match(text.legacyPhp, /<h3 class="page-title">\s*Vaccination Form\s*<\/h3>/);
assert.match(text.legacyPhp, /Vaccination Form Listing/);
assert.match(text.legacyPhp, /id="newform1"[\s\S]*New Child Vaccination Form/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(
  text.legacyPhp,
  /fa-slack[\s\S]*Image[\s\S]*F Name[\s\S]*L Name[\s\S]*DOB[\s\S]*Branch[\s\S]*Class[\s\S]*Nationality[\s\S]*Gender[\s\S]*Date[\s\S]*Action/,
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
assert.match(text.legacyPhp, /js\/Medical_forms4\.js/);

assert.match(text.legacyJs, /\/\*var conn = new ab\.Session/);
assert.match(text.legacyJs, /conn\.subscribe\("new_form4"\+cat_master/);
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
assert.match(text.legacyJs, /getformfourAllHashed/);
assert.match(text.legacyJs, /"data":\s*"form_id"/);
assert.match(text.legacyJs, /"data":\s*"image"/);
assert.match(text.legacyJs, /"data":\s*"cname"/);
assert.match(text.legacyJs, /"data":\s*"clname"/);
assert.match(text.legacyJs, /"data":\s*"dob"/);
assert.match(text.legacyJs, /"data":\s*"brname"/);
assert.match(text.legacyJs, /"data":\s*"classname"/);
assert.match(text.legacyJs, /"data":\s*"nationality"/);
assert.match(text.legacyJs, /"data":\s*"gender"/);
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
assert.match(text.legacyJs, /Medical_form4\.php\?id=/);
assert.match(text.legacyJs, /function deleteform1\(sid\)/);
assert.match(text.legacyJs, /url: '..\/..\/..\/ajax\/v1\/deleteform1'/);

assert.match(text.bridge, /export const runtime = "nodejs"/);
assert.match(text.bridge, /new URL\("\/medical\/vaccinations", request\.url\)/);
assert.match(text.bridge, /NextResponse\.redirect/);
assert.match(text.bridge, /export async function GET\(request: NextRequest\)/);
assert.match(text.bridge, /export async function POST\(request: NextRequest\)/);

assert.match(text.guards, /legacyPage: "medical_reports\.php"[\s\S]*"\/Medical_forms4\.php"/);
assert.match(text.guards, /legacyPage: "medical_reports\.php"[\s\S]*prefixes: \["\/medical\/"\]/);

assert.match(text.page, /getMedicalForms\(\{ formType: "VACCINATIONS", pageSize: "all" \}\)/);
assert.match(text.page, /getBranches\(\)/);
assert.match(text.page, /getClasses\(\)/);
assert.match(text.page, /legacyNumber\(data, "_oldId", "form_id", "id"\)/);
assert.match(text.page, /childNumber: form\.child\.childNumber \?\? form\.child\.legacyId\?\.toString\(\)/);
assert.match(text.page, /nationality: form\.child\.nationality/);

assert.match(text.actions, /pageSize\?: number \| "all"/);
assert.match(text.actions, /const paginated = pageSize !== "all"/);
assert.match(text.actions, /formType/);

assert.match(text.client, /const legacyPageSizeOptions = \[10, 20, 50, 100, 150, "all"\]/);
assert.match(text.client, /title="Vaccination Form"/);
assert.match(text.client, /Vaccination Form Listing/);
assert.match(text.client, /New Child Vaccination Form/);
assert.match(text.client, /filename: "vaccination-medical-forms"/);
assert.match(text.client, /sheetName: "Vaccination Form Listing"/);
assert.match(text.client, /columns: exportColumns/);
assert.match(text.client, /printOptions=\{\{ label: "Print" \}\}/);
assert.match(text.client, /placeholder="Form #"/);
assert.match(text.client, /placeholder="F Name"/);
assert.match(text.client, /placeholder="L Name"/);
assert.match(text.client, /placeholder="DOB"/);
assert.match(text.client, /placeholder="Class"/);
assert.match(text.client, /placeholder="Nationality"/);
assert.match(text.client, /placeholder="Gender"/);
assert.match(text.client, /type="date"/);
assert.match(text.client, /header: "#"/);
assert.match(text.client, /header: "Image"/);
assert.match(text.client, /header: "F Name"/);
assert.match(text.client, /header: "L Name"/);
assert.match(text.client, /header: "DOB"/);
assert.match(text.client, /header: "Branch"/);
assert.match(text.client, /header: "Class"/);
assert.match(text.client, /header: "Nationality"/);
assert.match(text.client, /header: "Gender"/);
assert.match(text.client, /accessorKey: "formDate"[\s\S]*header: "Date"/);
assert.match(text.client, /header: "Action"/);
assert.match(text.client, /\/images\/EmpPhoto\/\$\{photo\}/);
assert.match(text.client, /href=\{`\/medical\/vaccinations\/\$\{row\.original\.id\}`\}/);
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
  (entry) => entry.legacyPhp === "Front/templates/admin/Medical_forms4.php",
);
assert.ok(row, "page parity row for Medical_forms4.php");
assert.equal(
  row.status,
  "restored - legacy vaccination roster, TableTools exports, print, visual smoke, and bridge restored",
);
assert.doesNotMatch(row.verification, /Remaining work/);
assert.match(row.verification, /legacy TableTools Copy, PDF, XLS, and Print/);
assert.match(row.verification, /modern XLSX replacement/);
assert.match(row.verification, /commented legacy websocket refresh/);
assert.match(row.verification, /Browser smoke confirmed/);
assert.match(row.verification, /verify-legacy-vaccination-roster-contract\.ts/);
assert.match(
  text.matrixMd,
  /Medical_forms4\.php \| Front\/templates\/admin\/js\/Medical_forms4\.js \| \/Medical_forms4\.php, \/medical\/vaccinations \| restored - legacy vaccination roster, TableTools exports, print, visual smoke, and bridge restored/,
);
assert.doesNotMatch(text.matrixMd, /Medical_forms4\.php[^\n]*final logged-in visual smoke/);

console.log("legacy vaccination roster contract verified.");
