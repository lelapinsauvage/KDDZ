import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin";

const staffDetailPages = [
  {
    role: "doctor",
    title: "Doctor",
    listPage: "doctors.php",
    photoDir: "DoctorPhoto",
    deleteEndpoint: "deletedoctorimage",
    bridge: "src/app/(app)/Doctor_Details.php/page.tsx",
    detailComponent: "DoctorDetailsPage",
    detailImport: "../employees/doctors/[id]/page",
    newComponent: "NewDoctorPage",
    newImport: "../employees/doctors/new/page",
    idVariable: "doctorId",
    matrixRoute: "/Doctor_Details.php, /employees/doctors/[id]",
  },
  {
    role: "manager",
    title: "Manager",
    listPage: "managers.php",
    photoDir: "ManagerPhoto",
    deleteEndpoint: "deletemanagerimage",
    bridge: "src/app/(app)/Manager_Details.php/page.tsx",
    detailComponent: "ManagerDetailsPage",
    detailImport: "../employees/managers/[id]/page",
    newComponent: "NewManagerPage",
    newImport: "../employees/managers/new/page",
    idVariable: "managerId",
    matrixRoute: "/Manager_Details.php, /employees/managers/[id]",
  },
  {
    role: "nurse",
    title: "Nurse",
    listPage: "nurses.php",
    photoDir: "NursePhoto",
    deleteEndpoint: "deletenurseimage",
    bridge: "src/app/(app)/Nurse_Details.php/page.tsx",
    detailComponent: "NurseDetailsPage",
    detailImport: "../employees/nurses/[id]/page",
    newComponent: "NewNursePage",
    newImport: "../employees/nurses/new/page",
    idVariable: "nurseId",
    matrixRoute: "/Nurse_Details.php, /employees/nurses/[id]",
  },
  {
    role: "teacher",
    title: "Teacher",
    listPage: "teachers.php",
    photoDir: "TeacherPhoto",
    deleteEndpoint: "deleteteacherimage",
    bridge: "src/app/(app)/Teacher_Details.php/page.tsx",
    detailComponent: "TeacherDetailsPage",
    detailImport: "../employees/teachers/[id]/page",
    newComponent: "NewTeacherPage",
    newImport: "../employees/teachers/new/page",
    idVariable: "teacherId",
    matrixRoute: "/Teacher_Details.php, /employees/teachers/[id]",
  },
] as const;

const matrix = JSON.parse(
  readFileSync("docs/page-parity-matrix.json", "utf8"),
) as Array<{ modernRoute?: string; status?: string; verification?: string }>;

for (const page of staffDetailPages) {
  const legacyPhp = readFileSync(
    `${legacyRoot}/${page.title}_Details.php`,
    "utf8",
  );
  const legacyJs = readFileSync(
    `${legacyRoot}/js/${page.title}_Details.js`,
    "utf8",
  );
  const bridge = readFileSync(page.bridge, "utf8");

  assert.match(
    legacyPhp,
    new RegExp(`Check::protectPageOrFunction\\('${page.listPage}'\\)`),
  );
  assert.match(
    legacyPhp,
    new RegExp(
      `id="IdImageUpload" src="\\.\\/images\\/${page.photoDir}\\/default\\.jpg"`,
    ),
  );
  assert.match(legacyPhp, /id="ProfileImage"/);
  assert.match(
    legacyPhp,
    new RegExp(`btnUpdate">Create ${page.title}<\\/button>`),
  );
  assert.match(legacyPhp, /btndraft">Save as Draft<\/button>/);

  assert.match(legacyJs, /function Create\(\)/);
  assert.match(legacyJs, /function Update\(ac_no\)/);
  assert.match(legacyJs, /ProfileImage/);
  assert.match(legacyJs, /deletethisimage\(id\)/);
  assert.match(legacyJs, new RegExp(page.deleteEndpoint));
  assert.match(legacyJs, /\$\(".btndraft"\)\.hide\(\)/);
  assert.match(legacyJs, /\$\(".btnUpdate"\)\.on\("click"/);

  assert.match(
    bridge,
    new RegExp(
      `import ${page.detailComponent} from "${page.detailImport.replace(/[.[\]]/g, "\\$&")}"`,
    ),
  );
  assert.match(
    bridge,
    new RegExp(
      `import ${page.newComponent} from "${page.newImport.replace(/[.[\]]/g, "\\$&")}"`,
    ),
  );
  assert.match(
    bridge,
    new RegExp(`resolveLegacyStaffId\\("${page.role}", id\\)`),
  );
  assert.match(
    bridge,
    new RegExp(`return <${page.newComponent} \\/>;`),
  );
  assert.match(
    bridge,
    new RegExp(
      `<${page.detailComponent} params=\\{Promise\\.resolve\\(\\{ id: ${page.idVariable} \\}\\)\\} \\/>`,
    ),
  );
  assert.doesNotMatch(bridge, /redirect\(/);
  assert.doesNotMatch(bridge, /encodeURIComponent/);

  const row = matrix.find((entry) => entry.modernRoute === page.matrixRoute);
  assert.ok(row, `Missing matrix row for ${page.matrixRoute}`);
  assert.match(row.status ?? "", /restored/);
  assert.match(row.verification ?? "", /legacy URL stability/);
  assert.match(
    row.verification ?? "",
    /verify-legacy-staff-detail-bridge-contract\.ts/,
  );
}

console.log("legacy staff detail bridge assertions passed");
