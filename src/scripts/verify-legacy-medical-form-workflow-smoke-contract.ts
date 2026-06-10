import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

type Contract = {
  formNumber: 1 | 2 | 3 | 4;
  legacyPhp: string;
  legacyJs: string;
  route: string;
  modernNewRoute: string;
  modernDetailPattern: RegExp;
  formType: string;
  fallbackRoute: string;
  status: string;
  verifierSnippet: string;
  phpNeedles: RegExp[];
  jsNeedles: RegExp[];
  clientFile: string;
  clientNeedles: RegExp[];
};

const contracts: Contract[] = [
  {
    formNumber: 1,
    legacyPhp: "Front/templates/admin/Medical_form1.php",
    legacyJs: "Front/templates/admin/js/Medical_form1.js",
    route: "/medical/general",
    modernNewRoute: "/medical/general/new",
    modernDetailPattern: /\/medical\/general\/\$\{encodeURIComponent\(formId\)\}/,
    formType: "GENERAL",
    fallbackRoute: "/medical/general",
    status: "restored - legacy general medical form workflow, visual smoke, and deep-link bridge restored",
    verifierSnippet: "verify-legacy-medical-form-workflow-smoke-contract.ts",
    clientFile: "src/app/(app)/medical/general/[id]/general-detail-client.tsx",
    phpNeedles: [
      /Check::protectPageOrFunction\('medical_report\.php'\)/,
      /Saved Drs/,
      /id="has_insurance"/,
      /id="ins_type"/,
      /id="ins_exp"/,
      /Add Disability/,
      /Add Med\. Case/,
      /Add Medication/,
      /Add Surgical Operation/,
      /Add Allergy/,
      /Add New Attachments/,
      /btnUpdate/,
      /btnDraft/,
      /js\/Medical_form1\.js/,
    ],
    jsNeedles: [
      /var is_draft = 1/,
      /var is_draft = 0/,
      /UpdateFormOne/,
      /Medical_form1\.php\?id=/,
      /classes\/encrypt\.php/,
      /getFormOneData/,
    ],
    clientNeedles: [
      /title="Medical Form - General Information"/,
      /Saved Drs/,
      /Insurance Infos/,
      /Has Insurance/,
      /Disability/,
      /Medical Case/,
      /Medication/,
      /Surgical Operation/,
      /Allergy/,
      /Save As Draft/,
      /Save Changes/,
      /MedicalAttachmentsSection/,
      /is_rep_draft: nextStatus === "DRAFT" \? 1 : 0/,
    ],
  },
  {
    formNumber: 2,
    legacyPhp: "Front/templates/admin/Medical_form2.php",
    legacyJs: "Front/templates/admin/js/Medical_form2.js",
    route: "/medical/conditions",
    modernNewRoute: "/medical/conditions/new",
    modernDetailPattern: /\/medical\/conditions\/\$\{encodeURIComponent\(formId\)\}/,
    formType: "CONDITIONS",
    fallbackRoute: "/medical/conditions",
    status: "restored - legacy suffering form workflow, visual smoke, and deep-link bridge restored",
    verifierSnippet: "verify-legacy-medical-form-workflow-smoke-contract.ts",
    clientFile: "src/app/(app)/medical/conditions/[id]/condition-detail-client.tsx",
    phpNeedles: [
      /Check::protectPageOrFunction\('medical_report\.php'\)/,
      /CheckSufferingForm/,
      /id="asses_date"/,
      /Hearing/,
      /Speaking/,
      /Sight/,
      /Respiration/,
      /Eating Disorder/,
      /Health Problem/,
      /Add New Attachments/,
      /btnUpdate/,
      /btnDraft/,
      /js\/Medical_form2\.js/,
    ],
    jsNeedles: [
      /var is_draft = 1/,
      /var is_draft = 0/,
      /UpdateFormTwo/,
      /Medical_form2\.php\?id=/,
      /classes\/encrypt\.php/,
      /getFormTwoData/,
    ],
    clientNeedles: [
      /title="Medical Form - General Information"/,
      /General Health/,
      /Hearing/,
      /Speaking/,
      /Sight/,
      /Respiration/,
      /Eating Disorder/,
      /Other Health Problems/,
      /Save As Draft/,
      /Save Changes/,
      /MedicalAttachmentsSection/,
      /is_rep_draft: nextStatus === "DRAFT" \? 1 : 0/,
    ],
  },
  {
    formNumber: 3,
    legacyPhp: "Front/templates/admin/Medical_form3.php",
    legacyJs: "Front/templates/admin/js/Medical_form3.js",
    route: "/medical/visits",
    modernNewRoute: "/medical/visits/new",
    modernDetailPattern: /\/medical\/visits\/\$\{encodeURIComponent\(formId\)\}/,
    formType: "VISITS",
    fallbackRoute: "/medical/visits",
    status: "restored - legacy medical visit form workflow, visual smoke, and deep-link bridge restored",
    verifierSnippet: "verify-legacy-medical-form-workflow-smoke-contract.ts",
    clientFile: "src/app/(app)/medical/visits/[id]/visit-detail-client.tsx",
    phpNeedles: [
      /Check::protectPageOrFunction\('medical_report\.php'\)/,
      /Medical Visit/,
      /id="visit_date"/,
      /id="height"/,
      /id="weight"/,
      /With Glasses/,
      /Nose and Throat/,
      /Thyriod/,
      /Heart And Arterial System/,
      /Skin - Hair - Nails/,
      /Add New Attachments/,
      /btnUpdate/,
      /btnDraft/,
      /js\/Medical_form3\.js/,
    ],
    jsNeedles: [
      /var is_draft = 1/,
      /var is_draft = 0/,
      /AddFormThree/,
      /formdata\.append\('visit_date', visit_date\)/,
      /formdata\.append\('height', height\)/,
      /Medical_form3\.php\?id=/,
      /classes\/encrypt\.php/,
      /getFormThreeData/,
    ],
    clientNeedles: [
      /title="Medical Visit"/,
      /General Info/,
      /Height \(CM\)/,
      /Blood Pressure/,
      /With Glasses/,
      /Nose and Throat/,
      /Thyriod/,
      /Heart And Arterial System/,
      /Skin - Hair - Nails/,
      /Save As Draft/,
      /Save Changes/,
      /MedicalAttachmentsSection/,
      /const isDraft = nextStatus === "DRAFT" \? 1 : 0/,
      /is_rep_draft: isDraft/,
    ],
  },
  {
    formNumber: 4,
    legacyPhp: "Front/templates/admin/Medical_form4.php",
    legacyJs: "Front/templates/admin/js/Medical_form4.js",
    route: "/medical/vaccinations",
    modernNewRoute: "/medical/vaccinations/new",
    modernDetailPattern: /\/medical\/vaccinations\/\$\{encodeURIComponent\(formId\)\}/,
    formType: "VACCINATIONS",
    fallbackRoute: "/medical/vaccinations",
    status: "restored - legacy vaccination form workflow, visual smoke, and deep-link bridge restored",
    verifierSnippet: "verify-legacy-medical-form-workflow-smoke-contract.ts",
    clientFile: "src/app/(app)/medical/vaccinations/[id]/vaccination-detail-client.tsx",
    phpNeedles: [
      /Check::protectPageOrFunction\('medical_report\.php'\)/,
      /Vaccination/,
      /id="hepdate"/,
      /id="ipvdate"/,
      /id="opvdate1"/,
      /id="dptdate1"/,
      /id="hasbedate1"/,
      /id="mmrdate1"/,
      /id="ndptdate"/,
      /id="dtdate1"/,
      /Add New Attachments/,
      /btnUpdate/,
      /btnDraft/,
      /js\/Medical_form4\.js/,
    ],
    jsNeedles: [
      /var is_draft = 1/,
      /var is_draft = 0/,
      /AddFormFour/,
      /formdata\.append\('hepdate', hepdate\)/,
      /formdata\.append\('dptdate1', dptdate1\)/,
      /Medical_form4\.php\?id=/,
      /classes\/encrypt\.php/,
      /getFormFourData/,
    ],
    clientNeedles: [
      /title="Vaccination"/,
      /Hepatiti's B/,
      /DPT-Hib-HepB/,
      /Measles/,
      /MMR/,
      /DPT/,
      /DT/,
      /Save As Draft/,
      /Save Changes/,
      /MedicalAttachmentsSection/,
      /is_rep_draft: nextStatus === "DRAFT" \? 1 : 0/,
    ],
  },
];

const matrix = readFileSync("docs/page-parity-matrix.json", "utf8");
const matrixMd = readFileSync("docs/page-parity-matrix.md", "utf8");
const matrixRows = JSON.parse(matrix) as Array<{
  legacyPhp: string;
  status: string;
  verification: string;
}>;

for (const contract of contracts) {
  const php = readFileSync(`${legacyRoot}/${contract.legacyPhp}`, "utf8");
  const js = readFileSync(`${legacyRoot}/${contract.legacyJs}`, "utf8");
  const route = readFileSync(
    `src/app/(app)/Medical_form${contract.formNumber}.php/route.ts`,
    "utf8",
  );
  const client = readFileSync(contract.clientFile, "utf8");

  for (const needle of contract.phpNeedles) assert.match(php, needle);
  for (const needle of contract.jsNeedles) assert.match(js, needle);
  for (const needle of contract.clientNeedles) assert.match(client, needle);

  assert.match(route, /export const runtime = "nodejs"/);
  assert.match(route, new RegExp(`resolveLegacyMedicalFormId\\("${contract.formType}", fid\\)`));
  assert.match(route, /resolveLegacyChildId\(id\)/);
  assert.match(route, contract.modernDetailPattern);
  assert.match(route, new RegExp(`new URL\\("${contract.modernNewRoute}", request\\.url\\)`));
  assert.match(route, /target\.searchParams\.set\("childId", childId\)/);
  assert.match(route, new RegExp(`new URL\\("${contract.fallbackRoute}", request\\.url\\)`));
  assert.match(route, /export async function GET\(request: NextRequest\)/);
  assert.match(route, /export async function POST\(request: NextRequest\)/);

  const row = matrixRows.find((entry) => entry.legacyPhp === contract.legacyPhp);
  assert.ok(row, `page parity row for ${contract.legacyPhp}`);
  assert.equal(row.status, contract.status);
  assert.doesNotMatch(row.verification, /Remaining work/);
  assert.match(row.verification, /hard HTTP route-handler bridge/);
  assert.match(row.verification, /Browser smoke confirmed/);
  assert.match(row.verification, new RegExp(contract.verifierSnippet));

  assert.match(matrixMd, new RegExp(`Medical_form${contract.formNumber}\\.php[\\s\\S]*${contract.status}`));
  assert.match(matrixMd, new RegExp(`Medical_form${contract.formNumber}\\.php[\\s\\S]*${contract.verifierSnippet}`));
}

console.log("legacy medical form workflow smoke contract assertions passed");
