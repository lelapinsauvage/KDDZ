import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/Medical_form5.php`,
    "utf8",
  ),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/Medical_form5.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/Medical_form5.php/route.ts", "utf8"),
  page: readFileSync("src/app/(app)/medical/accidents/[id]/page.tsx", "utf8"),
  client: readFileSync(
    "src/app/(app)/medical/accidents/[id]/accident-detail-client.tsx",
    "utf8",
  ),
  attachments: readFileSync(
    "src/components/medical/medical-attachments-section.tsx",
    "utf8",
  ),
  legacyChild: readFileSync("src/lib/legacy-child.ts", "utf8"),
  legacyMedicalForm: readFileSync("src/lib/legacy-medical-form.ts", "utf8"),
  guards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('medical_report\.php'\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /\$teacher = \$db->getTeacher\(\)/);
assert.match(text.legacyPhp, /\$_REQUEST\['id'\][\s\S]*encrypt_decrypt\('decrypt'/);
assert.match(text.legacyPhp, /\$_REQUEST\['fid'\][\s\S]*encrypt_decrypt\('decrypt'/);
assert.match(text.legacyPhp, /getformprogress\(\$table, \$form, \$form_id\)/);
assert.match(text.legacyPhp, /id="emp_id"/);
assert.match(text.legacyPhp, /id="form_id"/);
assert.match(text.legacyPhp, /Accident Report/);
assert.match(text.legacyPhp, /id="LabelName"/);
assert.match(text.legacyPhp, /id="IdImageUpload"/);
assert.match(text.legacyPhp, /Accident Cause/);
assert.match(text.legacyPhp, /id="cause"/);
assert.match(text.legacyPhp, /id="accident_date"/);
assert.match(text.legacyPhp, /id="accident_time"/);
assert.match(text.legacyPhp, /Accident Details/);
assert.match(text.legacyPhp, /id="place"/);
assert.match(text.legacyPhp, /id="area"/);
assert.match(text.legacyPhp, /id="camnum"/);
assert.match(text.legacyPhp, /First Aid/);
assert.match(text.legacyPhp, /id="firstaid"/);
assert.match(text.legacyPhp, /id="em_hospital"/);
assert.match(text.legacyPhp, /id="treatment"/);
assert.match(text.legacyPhp, /id="teacher_id"/);
assert.match(text.legacyPhp, /Attachments/);
assert.match(text.legacyPhp, /Add New Attachments/);
assert.match(text.legacyPhp, /Save Accident Report|btnUpdate/);
assert.match(text.legacyPhp, /Save As Draft|btnDraft/);
assert.match(text.legacyPhp, /Fall \(the child had fallen\)/);
assert.match(text.legacyPhp, /Water/);
assert.match(text.legacyPhp, /x-ray/);
assert.match(text.legacyPhp, /js\/Medical_form5\.js/);

assert.match(text.legacyJs, /function Create\(ac_no, form_id\)/);
assert.match(text.legacyJs, /var is_draft = 1/);
assert.match(text.legacyJs, /function Update\(ac_no, form_id\)/);
assert.match(text.legacyJs, /var is_draft = 0/);
assert.match(text.legacyJs, /url: '..\/..\/..\/ajax\/v1\/AddFormFive'/);
assert.match(text.legacyJs, /formdata\.append\('childid', ac_no\)/);
assert.match(text.legacyJs, /formdata\.append\('cause', cause\)/);
assert.match(text.legacyJs, /formdata\.append\('accident_date', accident_date\)/);
assert.match(text.legacyJs, /formdata\.append\('accident_time', accident_time\)/);
assert.match(text.legacyJs, /formdata\.append\('place', place\)/);
assert.match(text.legacyJs, /formdata\.append\('area', area\)/);
assert.match(text.legacyJs, /formdata\.append\('camnum', camnum\)/);
assert.match(text.legacyJs, /formdata\.append\('firstaid', firstaid\)/);
assert.match(text.legacyJs, /formdata\.append\('em_hospital', em_hospital\)/);
assert.match(text.legacyJs, /formdata\.append\('treatment', treatment\)/);
assert.match(text.legacyJs, /formdata\.append\('teacher_id', teacher_id\)/);
assert.match(text.legacyJs, /formdata\.append\('branch_id', branch_id\)/);
assert.match(text.legacyJs, /formdata\.append\('class_id', class_id\)/);
assert.match(text.legacyJs, /AddAttToForm/);
assert.match(text.legacyJs, /Attachment_title/);
assert.match(text.legacyJs, /Please Fill the mendatory Fields \(RED\)/);
assert.match(text.legacyJs, /getFormFiveData/);
assert.match(text.legacyJs, /mydata\['rep_det'\]\['is_rep_draft'\] == 0[\s\S]*btnDraft/);
assert.match(text.legacyJs, /images\/EmpPhoto/);
assert.match(text.legacyJs, /images\/MedForms/);

assert.match(text.bridge, /export const runtime = "nodejs"/);
assert.match(text.bridge, /resolveLegacyMedicalFormId\("ACCIDENTS", fid\)/);
assert.match(text.bridge, /resolveLegacyChildId\(id\)/);
assert.match(text.bridge, /new URL\(`\/medical\/accidents\/\$\{encodeURIComponent\(formId\)\}`/);
assert.match(text.bridge, /new URL\("\/medical\/accidents\/new", request\.url\)/);
assert.match(text.bridge, /target\.searchParams\.set\("childId", childId\)/);
assert.match(text.bridge, /new URL\("\/medical\/accidents", request\.url\)/);
assert.match(text.bridge, /export async function GET\(request: NextRequest\)/);
assert.match(text.bridge, /export async function POST\(request: NextRequest\)/);

assert.match(text.legacyChild, /legacyNumericCandidates\(identifier\)/);
assert.match(text.legacyChild, /UUID_PATTERN\.test\(normalizedIdentifier\)/);
assert.match(text.legacyMedicalForm, /legacyNumericCandidates\(identifier\)/);
assert.match(text.legacyMedicalForm, /data: \{ path: \["_oldId"\]/);
assert.match(text.legacyMedicalForm, /data: \{ path: \["form_id"\]/);

assert.match(text.guards, /legacyPage: "medical_report\.php"[\s\S]*"\/Medical_form5\.php"/);
assert.match(text.guards, /legacyPage: "medical_report\.php"[\s\S]*\^\\\/medical\\\/accidents\\\/\[\^\/\]\+\$/);

assert.match(text.page, /getEmployees\("teacher", \{ isActive: true, pageSize: "all" \}\)/);
assert.match(text.page, /id === "new"/);
assert.match(text.page, /childId: requestedChildId \?\? ""/);
assert.match(text.page, /status: "DRAFT"/);
assert.match(text.page, /legacyNumber\(data, "teacher_id"\)/);
assert.match(text.page, /accidentDate: legacyString\(data, "accident_date", "date"\)/);
assert.match(text.page, /emergencyHospital: hospital === "true" \? "Yes" : hospital === "false" \? "No" : hospital/);
assert.match(text.page, /initialAttachments=\{form\.attachments\.map/);

assert.match(text.client, /const causePresets = \[/);
assert.match(text.client, /Fall \(the child had fallen\)/);
assert.match(text.client, /const placePresets = \[/);
assert.match(text.client, /const firstAidPresets = \[/);
assert.match(text.client, /const treatmentPresets = \["x-ray", "Stitch", "fracture"\]/);
assert.match(text.client, /requiredSubmitFields/);
assert.match(text.client, /Accident Cause/);
assert.match(text.client, /Date/);
assert.match(text.client, /Time/);
assert.match(text.client, /The accident happened/);
assert.match(text.client, /Specify Area/);
assert.match(text.client, /Camera Number/);
assert.match(text.client, /Emergency Hospital/);
assert.match(text.client, /The teacher who filled the report is/);
assert.match(text.client, /MedicalAttachmentsSection/);
assert.match(text.client, /Save As Draft/);
assert.match(text.client, /Save Accident Report/);
assert.match(text.client, /status === "DRAFT" \? 1 : 0/);
assert.match(text.client, /child_id: child\?\.legacyId/);
assert.match(text.client, /branch_id: child\?\.branchLegacyId/);
assert.match(text.client, /class_id: child\?\.classLegacyId/);
assert.match(text.client, /teacher_id: teacher\?\.legacyId/);
assert.match(text.client, /router\.push\(`\/medical\/accidents\/\$\{result\.formId\}`\)/);

assert.match(text.attachments, /images\/MedForms/);
assert.match(text.attachments, /<Label>Title<\/Label>/);

const matrix = JSON.parse(text.matrix) as Array<{
  legacyPhp: string;
  status: string;
  verification: string;
}>;
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/Medical_form5.php",
);
assert.ok(row, "page parity row for Medical_form5.php");
assert.equal(
  row.status,
  "restored - legacy accident report form workflow, visual smoke, and deep-link bridge restored",
);
assert.doesNotMatch(row.verification, /Remaining work/);
assert.match(row.verification, /hard HTTP route-handler bridge/);
assert.match(row.verification, /Browser smoke confirmed/);
assert.match(row.verification, /verify-legacy-accident-report-form-contract\.ts/);

assert.match(
  text.matrixMd,
  /Medical_form5\.php \| Front\/templates\/admin\/js\/Medical_form5\.js \| \/Medical_form5\.php, \/medical\/accidents\/\[id\], \/medical\/accidents\/new\?childId= \| restored - legacy accident report form workflow, visual smoke, and deep-link bridge restored/,
);
assert.doesNotMatch(text.matrixMd, /Medical_form5\.php[^\n]*Remaining work/);

console.log("legacy accident report form contract assertions passed");
