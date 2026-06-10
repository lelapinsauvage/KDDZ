import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";
const legacyAdmin = `${legacyRoot}/Front/templates/admin`;

const roles = [
  {
    title: "Teacher",
    photoDir: "TeacherPhoto",
    deleteEndpoint: "deleteteacherimage",
    deleteTable: "t_teacher_attachments",
    route: "/Teacher_Details.php, /employees/teachers/[id]",
  },
  {
    title: "Nurse",
    photoDir: "NursePhoto",
    deleteEndpoint: "deletenurseimage",
    deleteTable: "t_nurse_attachments",
    route: "/Nurse_Details.php, /employees/nurses/[id]",
  },
  {
    title: "Doctor",
    photoDir: "DoctorPhoto",
    deleteEndpoint: "deletedoctorimage",
    deleteTable: "t_garderie_doctor_attachments",
    route: "/Doctor_Details.php, /employees/doctors/[id]",
  },
  {
    title: "Manager",
    photoDir: "ManagerPhoto",
    deleteEndpoint: "deletemanagerimage",
    deleteTable: "t_manager_attachments",
    route: "/Manager_Details.php, /employees/managers/[id]",
  },
] as const;

const legacyDataClass = readFileSync(
  `${legacyAdmin}/classes/Data.class.php`,
  "utf8",
);
const legacyAjax = readFileSync(`${legacyRoot}/ajax/v1/index.php`, "utf8");

const modern = {
  form: readFileSync("src/components/employees/employee-form-client.tsx", "utf8"),
  mapper: readFileSync("src/components/employees/map-employee-to-form.ts", "utf8"),
  action: readFileSync("src/lib/actions/employees.ts", "utf8"),
  uploadClient: readFileSync("src/lib/uploads/client-upload.ts", "utf8"),
  uploadRoute: readFileSync("src/app/api/uploads/presign/route.ts", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
};

for (const role of roles) {
  const legacyPhp = readFileSync(`${legacyAdmin}/${role.title}_Details.php`, "utf8");
  const legacyJs = readFileSync(`${legacyAdmin}/js/${role.title}_Details.js`, "utf8");

  assert.match(
    legacyPhp,
    new RegExp(
      `id="IdImageUpload" src="\\.\\/images\\/${role.photoDir}\\/default\\.jpg"`,
    ),
  );
  assert.match(legacyPhp, /id="ProfileImage" accept="image\/\*"/);
  assert.match(legacyPhp, /btndraft">Save as Draft<\/button>/);
  assert.match(legacyJs, /\$\(".btndraft"\)\.hide\(\)/);
  assert.match(legacyJs, /formData\.append\('image', \$\('#ProfileImage'\)\.prop\('files'\)\[0\]\)/);
  assert.match(legacyJs, /ProfileImage"\)\.val\(""\)/);
  assert.match(legacyJs, new RegExp(`url: '../../../ajax/v1/${role.deleteEndpoint}'`));
  assert.match(
    legacyAjax,
    new RegExp(`\\$app->post\\('/${role.deleteEndpoint}'`),
  );
  assert.match(
    legacyDataClass,
    new RegExp(
      `function ${role.deleteEndpoint}\\([\\s\\S]*update ${role.deleteTable} set active = 0`,
    ),
  );
}

assert.match(modern.form, /<input type="hidden" \{\.\.\.register\("imageUrl"\)\} \/>/);
assert.match(modern.form, /function employeePhotoScope\(type: EmployeeType\)[\s\S]*return type;/);
assert.match(modern.form, /const storedImageUrl = watch\("imageUrl"\) \|\| ""/);
assert.match(modern.form, /const displayImageUrl = imagePreviewUrl \|\| storedImageUrl/);
assert.match(modern.form, /function clearImageSelection\(\)[\s\S]*setImageFile\(null\);[\s\S]*setImagePreviewUrl\(null\);/);
assert.match(modern.form, /function clearStoredImage\(\)[\s\S]*setValue\("imageUrl", "", \{ shouldDirty: true \}\);/);
assert.match(modern.form, /aria-label="Clear profile photo"/);
assert.match(modern.form, /title="Clear profile photo"/);
assert.match(modern.form, /<X className="size-4" \/>/);
assert.doesNotMatch(modern.form, /Save as Draft/);
assert.doesNotMatch(modern.form, /btndraft/);
assert.match(modern.form, /uploadFileWithPresign\(\{[\s\S]*scope: employeePhotoScope\(type\),[\s\S]*ownerId: employee\?\.id/);
assert.match(modern.form, /payload = \{[\s\S]*imageUrl: uploaded\.publicUrl/);
assert.match(modern.mapper, /imageUrl: emp\.imageUrl \?\? ""/);
assert.match(modern.action, /if \(data\.imageUrl !== undefined\) updateData\.imageUrl = data\.imageUrl \|\| null/);
assert.match(modern.uploadClient, /"teacher"[\s\S]*"nurse"[\s\S]*"doctor"[\s\S]*"manager"/);
assert.match(modern.uploadRoute, /"teacher"[\s\S]*"nurse"[\s\S]*"doctor"[\s\S]*"manager"/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(modern.matrix) as MatrixRow[];
for (const role of roles) {
  const row = matrix.find((entry) => entry.modernRoute === role.route);
  assert.ok(row, `Missing matrix row for ${role.route}`);
  assert.match(row.status ?? "", /profile-photo\/draft behavior audited/);
  assert.doesNotMatch(row.status ?? "", /save\/draft\/photo behavior audit remains/);
  assert.match(row.verification ?? "", /legacy staff draft button is hidden/);
  assert.match(row.verification ?? "", /profile photo uploads and clears through `?imageUrl`?/);
  assert.match(
    row.verification ?? "",
    /verify-legacy-staff-photo-draft-contract\.ts/,
  );
}

console.log("legacy staff photo/draft assertions passed");
