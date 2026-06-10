import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";
const legacyAdmin = `${legacyRoot}/Front/templates/admin`;
const legacyDataClass = readFileSync(
  `${legacyAdmin}/classes/Data.class.php`,
  "utf8",
);
const legacyUsersSql = readFileSync(
  `${legacyRoot}/ajax/annual backups/kiddzonl_users29sept.sql`,
  "utf8",
);
const legacyMasterSql = readFileSync(
  `${legacyRoot}/ajax/annual backups/kiddzonl_master29sept.sql`,
  "utf8",
);

const modern = {
  actions: readFileSync("src/lib/actions/employees.ts", "utf8"),
  listingClient: readFileSync(
    "src/components/employees/employee-listing-client.tsx",
    "utf8",
  ),
  teacherPermissions: readFileSync(
    "src/lib/legacy-teacher-action-permissions.ts",
    "utf8",
  ),
  pageGuards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  teacherNewPage: readFileSync(
    "src/app/(app)/employees/teachers/new/page.tsx",
    "utf8",
  ),
  teacherEditPage: readFileSync(
    "src/app/(app)/employees/teachers/[id]/edit/page.tsx",
    "utf8",
  ),
  teacherDetailPage: readFileSync(
    "src/app/(app)/employees/teachers/[id]/page.tsx",
    "utf8",
  ),
  doctorEditPage: readFileSync(
    "src/app/(app)/employees/doctors/[id]/edit/page.tsx",
    "utf8",
  ),
  nurseEditPage: readFileSync(
    "src/app/(app)/employees/nurses/[id]/edit/page.tsx",
    "utf8",
  ),
  managerEditPage: readFileSync(
    "src/app/(app)/employees/managers/[id]/edit/page.tsx",
    "utf8",
  ),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  topGaps: readFileSync("docs/top-20-restoration-gaps.md", "utf8"),
};

const rosterRoles = [
  { role: "doctor", title: "Doctor", listPage: "doctors.php" },
  { role: "nurse", title: "Nurse", listPage: "nurses.php" },
  { role: "manager", title: "Manager", listPage: "managers.php" },
] as const;

for (const page of rosterRoles) {
  const legacyRoster = readFileSync(`${legacyAdmin}/${page.listPage}`, "utf8");
  const legacyDetailJs = readFileSync(
    `${legacyAdmin}/js/${page.title}_Details.js`,
    "utf8",
  );
  const legacyRosterJs = readFileSync(
    `${legacyAdmin}/js/${page.listPage.replace(".php", ".js")}`,
    "utf8",
  );

  assert.match(
    legacyRoster,
    /<\?php\/\/ if\(Check::protectPageOrFunction\('addTeacher','ACTION'\)\)\{ \?>/,
    `${page.listPage} addTeacher guard should stay documented as commented legacy code`,
  );
  assert.match(
    legacyDataClass,
    new RegExp(
      `//if \\(Check::protectPageOrFunction\\('updateTeacher','ACTION'\\)\\)[\\s\\S]{0,220}href='${page.title}_Details\\.php\\?id=`,
    ),
    `${page.title} edit button should be preceded by the commented legacy updateTeacher guard`,
  );
  assert.match(
    legacyDataClass,
    /\/\/if \(Check::protectPageOrFunction\('deleteTeacher','ACTION'\)\)[\s\S]{0,140}delemp\(/,
    `${page.title} delete button should be preceded by the commented legacy deleteTeacher guard`,
  );
  assert.match(legacyDetailJs, new RegExp(`ajax/v1/add${page.title}`));
  assert.match(legacyDetailJs, new RegExp(`ajax/v1/update${page.title}`));
  assert.match(legacyRosterJs, new RegExp(`ajax/v1/delete${page.title}`));
}

const teacherRoster = readFileSync(`${legacyAdmin}/teachers.php`, "utf8");
assert.match(
  teacherRoster,
  /<\?php if\(Check::protectPageOrFunction\('addTeacher','ACTION'\)\)\{ \?>/,
);
assert.match(
  legacyDataClass,
  /if \(Check::protectPageOrFunction\('updateTeacher','ACTION'\)\)\s*\$buttons \.= "<a class='btn btn-icon-only btn-circle blue' href='Teacher_Details\.php\?id=/,
);
assert.match(
  legacyDataClass,
  /if \(Check::protectPageOrFunction\('deleteTeacher','ACTION'\)\)\s*\$buttons\.="<a class='btn btn-icon-only btn-circle red' onclick='delemp\(/,
);

assert.match(legacyUsersSql, /'addTeacher', 'ACTION'/);
assert.match(legacyUsersSql, /'updateTeacher', 'ACTION'/);
assert.match(legacyUsersSql, /'deleteTeacher', 'ACTION'/);
assert.match(legacyMasterSql, /'addTeacher', 'ACTION'/);
for (const actionName of [
  "addDoctor",
  "updateDoctor",
  "deleteDoctor",
  "addNurse",
  "updateNurse",
  "deleteNurse",
  "addManager",
  "updateManager",
  "deleteManager",
]) {
  assert.doesNotMatch(legacyUsersSql, new RegExp(`'${actionName}', 'ACTION'`));
  assert.doesNotMatch(legacyMasterSql, new RegExp(`'${actionName}', 'ACTION'`));
}

assert.match(
  modern.teacherPermissions,
  /LEGACY_TEACHER_ACTION_NAMES = \[[\s\S]*"addTeacher"[\s\S]*"updateTeacher"[\s\S]*"deleteTeacher"/,
);
const enforcedEmployeeActions = Array.from(
  modern.actions.matchAll(/requireLegacyActionAllowed\(ctx, "([^"]+)"\)/g),
  (match) => match[1],
);
assert.deepEqual(
  Array.from(new Set(enforcedEmployeeActions)).sort(),
  ["addTeacher", "deleteTeacher", "updateTeacher"].sort(),
);
for (const actionName of [
  "addDoctor",
  "updateDoctor",
  "deleteDoctor",
  "addNurse",
  "updateNurse",
  "deleteNurse",
  "addManager",
  "updateManager",
  "deleteManager",
]) {
  assert.doesNotMatch(modern.actions, new RegExp(`"${actionName}"`));
}
assert.match(
  modern.listingClient,
  /const canAdd = type !== "teacher" \|\| teacherActionPermissions\.canAddTeacher/,
);
assert.match(
  modern.listingClient,
  /const canUpdate = type !== "teacher" \|\| teacherActionPermissions\.canUpdateTeacher/,
);
assert.match(
  modern.listingClient,
  /const canDelete = type !== "teacher" \|\| teacherActionPermissions\.canDeleteTeacher/,
);
assert.match(modern.teacherNewPage, /getLegacyTeacherActionPermissions/);
assert.match(modern.teacherEditPage, /getLegacyTeacherActionPermissions/);
assert.match(modern.teacherDetailPage, /getLegacyTeacherActionPermissions/);
assert.doesNotMatch(modern.doctorEditPage, /getLegacyTeacherActionPermissions/);
assert.doesNotMatch(modern.nurseEditPage, /getLegacyTeacherActionPermissions/);
assert.doesNotMatch(modern.managerEditPage, /getLegacyTeacherActionPermissions/);

for (const page of rosterRoles) {
  assert.match(
    modern.pageGuards,
    new RegExp(
      `legacyPage: "${page.listPage}"[\\s\\S]*exact: \\["/employees/${page.role}s", "/${page.listPage}", "/${page.title}_Details\\.php"\\][\\s\\S]*prefixes: \\["/employees/${page.role}s/"\\]`,
    ),
  );
}

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(modern.matrix) as MatrixRow[];
for (const route of [
  "/Doctor_Details.php, /employees/doctors/[id]",
  "/Manager_Details.php, /employees/managers/[id]",
  "/Nurse_Details.php, /employees/nurses/[id]",
]) {
  const row = matrix.find((entry) => entry.modernRoute === route);
  assert.ok(row, `Missing matrix row for ${route}`);
  assert.match(row.status ?? "", /action audit completed/);
  assert.doesNotMatch(row.status ?? "", /action audit remains/);
  assert.match(row.verification ?? "", /no active legacy ACTION gate/);
  assert.match(
    row.verification ?? "",
    /verify-legacy-staff-action-audit-contract\.ts/,
  );
}
assert.match(modern.topGaps, /Doctor\/nurse\/manager staff pages/);
assert.match(
  modern.topGaps,
  /verify-legacy-staff-action-audit-contract\.ts/,
);

console.log("legacy staff action audit assertions passed");
