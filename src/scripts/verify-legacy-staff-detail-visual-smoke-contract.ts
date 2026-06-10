import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin";

type DetailContract = {
  role: "doctor" | "manager" | "nurse" | "teacher";
  title: "Doctor" | "Manager" | "Nurse" | "Teacher";
  legacyPhp: string;
  legacyJs: string;
  matrixRoute: string;
  status: string;
  newRoute: string;
  bridgeFile: string;
  detailImport: string;
  newImport: string;
  bridgeIdMatcher: RegExp;
  legacyNeedles: RegExp[];
  formNeedles: RegExp[];
};

const verifier = "src/scripts/verify-legacy-staff-detail-visual-smoke-contract.ts";

const detailContracts: DetailContract[] = [
  {
    role: "doctor",
    title: "Doctor",
    legacyPhp: "Front/templates/admin/Doctor_Details.php",
    legacyJs: "Front/templates/admin/js/Doctor_Details.js",
    matrixRoute: "/Doctor_Details.php, /employees/doctors/[id]",
    status:
      "restored - legacy doctor detail/create form, field parity, visual smoke, bridge, and save workflow contract restored",
    newRoute: "/employees/doctors/new",
    bridgeFile: "src/app/(app)/Doctor_Details.php/page.tsx",
    detailImport: "../employees/doctors/[id]/page",
    newImport: "../employees/doctors/new/page",
    bridgeIdMatcher: /resolveLegacyStaffId\("doctor", id\)/,
    legacyNeedles: [
      /id="ProfileImage"/,
      /id="m_name"/,
      /id="f_name_ar"/,
      /id="m_name_ar"/,
      /id="l_name_ar"/,
      /id="pob"/,
      /id="uni_degree_ar"/,
      /AddAttToDoctorN/,
      /btnUpdate">Create Doctor<\/button>/,
      /\$\(".btndraft"\)\.hide\(\)/,
    ],
    formNeedles: [
      /type === "doctor"/,
      /Arabic First Name/,
      /Arabic Father Name/,
      /Arabic Family Name/,
      /Arabic Studied Domain/,
      /Registration \/ License No/,
    ],
  },
  {
    role: "manager",
    title: "Manager",
    legacyPhp: "Front/templates/admin/Manager_Details.php",
    legacyJs: "Front/templates/admin/js/Manager_Details.js",
    matrixRoute: "/Manager_Details.php, /employees/managers/[id]",
    status:
      "restored - legacy manager detail/create form, field parity, visual smoke, bridge, and save workflow contract restored",
    newRoute: "/employees/managers/new",
    bridgeFile: "src/app/(app)/Manager_Details.php/page.tsx",
    detailImport: "../employees/managers/[id]/page",
    newImport: "../employees/managers/new/page",
    bridgeIdMatcher: /resolveLegacyStaffId\("manager", id\)/,
    legacyNeedles: [
      /id="ProfileImage"/,
      /id="m_name"/,
      /id="f_name_ar"/,
      /id="m_name_ar"/,
      /id="l_name_ar"/,
      /id="pob"/,
      /id="uni_degree_ar"/,
      /AddAttToManagerN/,
      /btnUpdate">Create Manager<\/button>/,
      /\$\(".btndraft"\)\.hide\(\)/,
    ],
    formNeedles: [
      /type === "manager"/,
      /Arabic First Name/,
      /Arabic Father Name/,
      /Arabic Family Name/,
      /Arabic Studied Domain/,
      /Studied Domain/,
    ],
  },
  {
    role: "nurse",
    title: "Nurse",
    legacyPhp: "Front/templates/admin/Nurse_Details.php",
    legacyJs: "Front/templates/admin/js/Nurse_Details.js",
    matrixRoute: "/Nurse_Details.php, /employees/nurses/[id]",
    status:
      "restored - legacy nurse detail/create form, field parity, visual smoke, bridge, and save workflow contract restored",
    newRoute: "/employees/nurses/new",
    bridgeFile: "src/app/(app)/Nurse_Details.php/page.tsx",
    detailImport: "../employees/nurses/[id]/page",
    newImport: "../employees/nurses/new/page",
    bridgeIdMatcher: /resolveLegacyStaffId\("nurse", id\)/,
    legacyNeedles: [
      /id="ProfileImage"/,
      /id="m_name"/,
      /id="f_name_ar"/,
      /id="m_name_ar"/,
      /id="l_name_ar"/,
      /id="pob"/,
      /id="uni_degree_ar"/,
      /AddAttToNurseN/,
      /btnUpdate">Create Nurse<\/button>/,
      /\$\(".btndraft"\)\.hide\(\)/,
    ],
    formNeedles: [
      /type === "nurse"/,
      /Arabic First Name/,
      /Arabic Father Name/,
      /Arabic Family Name/,
      /Arabic Studied Domain/,
      /Studied Domain/,
    ],
  },
  {
    role: "teacher",
    title: "Teacher",
    legacyPhp: "Front/templates/admin/Teacher_Details.php",
    legacyJs: "Front/templates/admin/js/Teacher_Details.js",
    matrixRoute: "/Teacher_Details.php, /employees/teachers/[id]",
    status:
      "restored - legacy teacher detail/create form, field parity, visual smoke, bridge, and update ACL restored",
    newRoute: "/employees/teachers/new",
    bridgeFile: "src/app/(app)/Teacher_Details.php/page.tsx",
    detailImport: "../employees/teachers/[id]/page",
    newImport: "../employees/teachers/new/page",
    bridgeIdMatcher: /resolveLegacyStaffId\("teacher", id\)/,
    legacyNeedles: [
      /id="ProfileImage"/,
      /id="m_name"/,
      /id="pob"/,
      /id="martial"/,
      /id="noc"/,
      /id="has_medcase"/,
      /id="medcase"/,
      /AddAttToTeacherN/,
      /btnUpdate">Create Teacher<\/button>/,
      /\$\(".btndraft"\)\.hide\(\)/,
    ],
    formNeedles: [
      /type === "teacher"/,
      /Marital Status/,
      /Children Count/,
      /Medical Case/,
      /Register #/,
      /requireLegacyActionAllowed\(ctx, "addTeacher"\)/,
      /requireLegacyActionAllowed\(ctx, "updateTeacher"\)/,
    ],
  },
];

const sharedFiles = {
  form: readFileSync("src/components/employees/employee-form-client.tsx", "utf8"),
  actions: readFileSync("src/lib/actions/employees.ts", "utf8"),
  matrix: JSON.parse(readFileSync("docs/page-parity-matrix.json", "utf8")) as Array<{
    legacyPhp: string;
    modernRoute: string;
    status: string;
    verification: string;
  }>,
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

const sharedFormNeedles = [
  /ProfileImage|profile photo|Photo/i,
  /A\. Account & Core/,
  /B\. Contact & Address/,
  /C\. Education & Languages/,
  /E\. Placement/,
  /F\. Documents/,
  /<input type="hidden" \{\.\.\.register\("imageUrl"\)\} \/>/,
  /accept="image\/\*"/,
  /Middle Name/,
  /Place of Birth/,
  /Region/,
  /Street/,
  /CNSS/,
  /CNSS #/,
  /Secondary Degree/,
  /University Degree/,
  /Language/,
  /Contract/,
  /Certificate/,
  /isEditing \? `Update \$\{singular\}` : `Create \$\{singular\}`/,
];

for (const needle of sharedFormNeedles) {
  assert.match(sharedFiles.form, needle);
}

for (const contract of detailContracts) {
  const legacyPhp = readFileSync(`${legacyRoot}/${contract.title}_Details.php`, "utf8");
  const legacyJs = readFileSync(`${legacyRoot}/js/${contract.title}_Details.js`, "utf8");
  const bridge = readFileSync(contract.bridgeFile, "utf8");

  for (const needle of contract.legacyNeedles) {
    assert.match(`${legacyPhp}\n${legacyJs}`, needle);
  }
  for (const needle of contract.formNeedles) {
    assert.match(`${sharedFiles.form}\n${sharedFiles.actions}`, needle);
  }

  assert.match(legacyJs, /function Create\(\)/);
  assert.match(legacyJs, /function Update\(ac_no\)/);
  assert.match(legacyJs, /\$\(".btnUpdate"\)\.on\("click"/);
  assert.match(legacyJs, /deletethisimage\(id\)/);
  assert.match(bridge, contract.bridgeIdMatcher);
  assert.match(bridge, new RegExp(contract.detailImport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(bridge, new RegExp(contract.newImport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const row = sharedFiles.matrix.find((entry) => entry.legacyPhp === contract.legacyPhp);
  assert.ok(row, `matrix row exists for ${contract.legacyPhp}`);
  assert.equal(row.modernRoute, contract.matrixRoute);
  assert.equal(row.status, contract.status);
  assert.match(row.verification, /Browser smoke confirmed the no-id legacy PHP bridge/);
  assert.match(row.verification, /Account\/Core, Contact\/Address, Education\/CNSS\/Languages, Placement, and Documents/);
  assert.match(row.verification, /no unhandled runtime errors, and no broken images/);
  assert.match(row.verification, new RegExp(verifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(row.verification, /Remaining work/);

  assert.match(sharedFiles.matrixMd, new RegExp(`${contract.legacyPhp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\n]*${contract.status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(sharedFiles.matrixMd, new RegExp(`${contract.legacyPhp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\n]*${verifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.doesNotMatch(sharedFiles.matrixMd, new RegExp(`${contract.legacyPhp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\n]*visual audit remains`));
}

for (const [legacyPhp, status] of [
  [
    "Front/templates/admin/doctors.php",
    "restored - legacy doctors roster columns, q bridge, copy/PDF exports, page sizes, selected placement, selected deactivate, and detail form audit restored",
  ],
  [
    "Front/templates/admin/managers.php",
    "restored - legacy managers roster columns, q bridge, copy/PDF exports, page sizes, selected placement, selected deactivate, and detail form audit restored",
  ],
  [
    "Front/templates/admin/nurses.php",
    "restored - legacy nurses roster columns, q bridge, copy/PDF exports, page sizes, selected placement, selected deactivate, and detail form audit restored",
  ],
  [
    "Front/templates/admin/teachers.php",
    "restored - legacy teachers roster columns, q bridge, copy/PDF exports, page sizes, selected placement, selected deactivate, row actions, ACL, and detail form audit restored",
  ],
] as const) {
  const row = sharedFiles.matrix.find((entry) => entry.legacyPhp === legacyPhp);
  assert.ok(row, `matrix row exists for ${legacyPhp}`);
  assert.equal(row.status, status);
  assert.match(row.verification, /detail\/create form audit is now Browser-smoke-confirmed/);
  assert.match(row.verification, new RegExp(verifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(row.verification, /detail form audit remains/);
}

console.log("legacy staff detail visual smoke contract assertions passed");
