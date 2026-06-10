import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";
const legacyPhp = readFileSync(
  `${legacyRoot}/Front/templates/admin/Teacher_Details.php`,
  "utf8",
);
const legacyJs = readFileSync(
  `${legacyRoot}/Front/templates/admin/js/Teacher_Details.js`,
  "utf8",
);

const modern = {
  schema: readFileSync("prisma/schema.prisma", "utf8"),
  validation: readFileSync("src/lib/validations/employee.ts", "utf8"),
  action: readFileSync("src/lib/actions/employees.ts", "utf8"),
  mapper: readFileSync("src/components/employees/map-employee-to-form.ts", "utf8"),
  form: readFileSync("src/components/employees/employee-form-client.tsx", "utf8"),
  detail: readFileSync(
    "src/app/(app)/employees/teachers/[id]/teacher-detail-client.tsx",
    "utf8",
  ),
  snapshot: readFileSync("src/components/employees/legacy-staff-snapshot.tsx", "utf8"),
  importer: readFileSync("src/scripts/migration/migrate-employees.ts", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
};

const legacyFields = [
  "username",
  "f_name",
  "m_name",
  "l_name",
  "dob",
  "pob",
  "regnum",
  "nationality",
  "martial",
  "noc",
  "sel_gender",
  "has_medcase",
  "medcase",
  "tel",
  "mobile",
  "cnss",
  "email",
  "cnssnum",
  "sec_degree",
  "sec_degree_y",
  "uni_degree",
  "uni_degree_y",
  "engselected",
  "engread",
  "engwrite",
  "engspeak",
  "frselected",
  "frread",
  "frwrite",
  "frspeak",
  "arselected",
  "arread",
  "arwrite",
  "arspeak",
  "remarks",
  "active",
  "classid",
  "sel_branch",
];

for (const id of legacyFields) {
  assert.match(legacyPhp, new RegExp(`id="${id}"`), `legacy PHP field ${id}`);
}

for (const field of legacyFields.filter(
  (field) =>
    ![
      "username",
      "engselected",
      "frselected",
      "arselected",
    ].includes(field),
)) {
  assert.match(
    legacyJs,
    new RegExp(`var ${field} = \\$\\("#${field}"\\)\\.val\\(\\)`),
    `legacy JS reads ${field}`,
  );
  assert.match(
    legacyJs,
    new RegExp(`formData\\.append\\('${field}', ${field}\\)`),
    `legacy JS posts ${field}`,
  );
}
for (const field of ["engselected", "frselected", "arselected"]) {
  assert.match(
    legacyJs,
    new RegExp(`\\$\\("#${field}"\\)\\.is\\(':checked'\\)`),
    `legacy JS reads checkbox ${field}`,
  );
  assert.match(
    legacyJs,
    new RegExp(`formData\\.append\\('${field}', ${field}\\)`),
    `legacy JS posts ${field}`,
  );
}
assert.match(legacyJs, /var username = \$\("#username"\)\.val\(\)/);
assert.match(legacyJs, /formData\.append\('username', username\)/);
assert.match(legacyJs, /url: '..\/..\/..\/ajax\/v1\/addTeacher'/);
assert.match(legacyJs, /url: '..\/..\/..\/ajax\/v1\/updateTeacher'/);

const teacherModel = /model Teacher \{[\s\S]*?@@map\("teachers"\)/.exec(
  modern.schema,
)?.[0] ?? "";

for (const field of [
  "username",
  "middleName",
  "placeOfBirth",
  "registerNumber",
  "maritalStatus",
  "numberOfChildren",
  "gender",
  "medicalCase",
  "medicalCaseDescription",
  "telephone",
  "cnss",
  "cnssNo",
  "secondaryDegree",
  "secondaryDegreeYear",
  "universityDegree",
  "universityDegreeYear",
  "specialization",
  "classId",
  "remarks",
]) {
  assert.match(teacherModel, new RegExp(`${field}\\s+`), `teacher model ${field}`);
  assert.match(modern.mapper, new RegExp(`${field}:\\s*emp\\.${field}\\s*\\?\\?`), `mapper ${field}`);
}
assert.match(teacherModel, /languages\s+TeacherLanguage\[\]/);

for (const field of [
  "middleName",
  "placeOfBirth",
  "registerNumber",
  "maritalStatus",
  "numberOfChildren",
  "gender",
  "medicalCase",
  "medicalCaseDescription",
  "telephone",
  "cnss",
  "cnssNo",
  "secondaryDegree",
  "secondaryDegreeYear",
  "universityDegree",
  "universityDegreeYear",
  "specialization",
  "classId",
  "remarks",
]) {
  assert.match(modern.validation, new RegExp(`${field}:\\s*z\\.`), `validation ${field}`);
}

assert.match(modern.form, /supportsMiddleName\s*=\s*true/);
assert.match(modern.form, /htmlFor="middleName"/);
assert.match(modern.form, /htmlFor="placeOfBirth"/);
assert.match(modern.form, /htmlFor="registerNumber"/);
assert.match(modern.form, /htmlFor="maritalStatus"/);
assert.match(modern.form, /htmlFor="numberOfChildren"/);
assert.match(modern.form, /htmlFor="gender"/);
assert.match(modern.form, /htmlFor="medicalCase"/);
assert.match(modern.form, /htmlFor="secondaryDegree"/);
assert.match(modern.form, /htmlFor="universityDegree"/);
assert.match(modern.form, /htmlFor="classId"/);

for (const field of [
  "m_name",
  "pob",
  "martial",
  "noc",
  "sel_gender",
  "has_medcase",
  "medcase",
  "cnss",
  "cnssnum",
  "sec_degree",
  "sec_degree_y",
  "uni_degree",
  "uni_degree_y",
  "engselected",
  "frselected",
  "arselected",
  "remarks",
  "classid",
  "t_user_id",
]) {
  assert.match(modern.importer, new RegExp(`${field}:`), `import interface ${field}`);
}
assert.match(modern.importer, /middleName:\s*cleanString\(row\.m_name\)/);
assert.match(modern.importer, /placeOfBirth:\s*cleanString\(row\.pob\)/);
assert.match(modern.importer, /maritalStatus:\s*mapTeacherMaritalStatus\(row\.martial\)/);
assert.match(modern.importer, /numberOfChildren:\s*toInt\(row\.noc\)/);
assert.match(modern.importer, /gender:\s*mapGender\(row\.sel_gender\)/);
assert.match(modern.importer, /medicalCase:\s*toBool\(row\.has_medcase\)/);
assert.match(modern.importer, /medicalCaseDescription:\s*cleanString\(row\.medcase\)/);
assert.match(modern.importer, /cnss:\s*cleanString\(row\.cnss\)/);
assert.match(modern.importer, /cnssNo:\s*cleanString\(row\.cnssnum\)/);
assert.match(modern.importer, /secondaryDegree:\s*cleanString\(row\.sec_degree\)/);
assert.match(modern.importer, /universityDegree:\s*cleanString\(row\.uni_degree\)/);
assert.match(modern.importer, /specialization:\s*cleanString\(row\.uni_degree\)/);
assert.match(modern.importer, /classId = getMapping\("class", row\.classid\)/);
assert.match(modern.importer, /legacyTeacherLanguages\(row\)/);
assert.match(modern.importer, /teacherLanguage\.createMany/);

for (const field of [
  "teacher.middleName",
  "teacher.placeOfBirth",
  "teacher.registerNumber",
  "teacher.gender",
  "teacher.maritalStatus",
  "teacher.numberOfChildren",
  "teacher.universityDegree",
  "teacher.secondaryDegree",
  "teacher.cnss",
  "teacher.cnssNo",
  "teacher.medicalCaseDescription",
  "teacher.remarks",
]) {
  assert.match(modern.detail, new RegExp(field.replace(".", "\\.")), `detail ${field}`);
}
assert.match(modern.snapshot, /Teacher/);
assert.match(modern.snapshot, /Languages/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(modern.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.modernRoute === "/Teacher_Details.php, /employees/teachers/[id]",
);
assert.ok(row, "Missing teacher matrix row");
assert.match(row.status ?? "", /legacy teacher field parity restored/);
assert.match(row.verification ?? "", /full active legacy `Teacher_Details\.js` payload/);
assert.match(row.verification ?? "", /language rows/);
assert.match(row.verification ?? "", /verify-legacy-teacher-fields-contract\.ts/);

console.log("legacy teacher field assertions passed");
