import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  listing: "src/components/employees/employee-listing-client.tsx",
  columns: "src/components/employees/employee-columns.tsx",
  actions: "src/lib/actions/employees.ts",
  teacherPage: "src/app/(app)/employees/teachers/page.tsx",
  nursePage: "src/app/(app)/employees/nurses/page.tsx",
  doctorPage: "src/app/(app)/employees/doctors/page.tsx",
  managerPage: "src/app/(app)/employees/managers/page.tsx",
  teacherBridge: "src/app/(app)/teachers.php/page.tsx",
  nurseBridge: "src/app/(app)/nurses.php/page.tsx",
  doctorBridge: "src/app/(app)/doctors.php/page.tsx",
  managerBridge: "src/app/(app)/managers.php/page.tsx",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.listing, /\{ header: "#", key: "legacyId" \}/);
assert.match(contents.listing, /\{ header: "F Name", key: "firstName" \}/);
assert.match(contents.listing, /\{ header: "L Name", key: "lastName" \}/);
assert.match(contents.listing, /header:\s*"DOB"[\s\S]*key:\s*"dateOfBirth"/);
assert.match(contents.listing, /\{ header: "Branch", key: "branch" \}/);
assert.match(contents.listing, /type === "teacher"[\s\S]*\{ header: "Class", key: "className" \}[\s\S]*\{ header: "Mobile", key: "mobile" \}/);
assert.match(contents.listing, /\{ header: "Nationality", key: "nationality" \}/);
assert.match(contents.listing, /\{ header: "Gender", key: "gender" \}/);
assert.match(contents.listing, /header:\s*"Date"[\s\S]*key:\s*"createdAt"/);
assert.match(contents.listing, /header:\s*"Status"[\s\S]*key:\s*"status"/);
assert.match(contents.listing, /<ExportButton[\s\S]*columns=\{exportColumns\}[\s\S]*data=\{filteredData as unknown as Record<string, unknown>\[\]\}/);
assert.match(contents.listing, /window\.print\(\)/);
assert.match(contents.listing, /pageSizeOptions=\{\[10, 20, 50, 100, 150, "all"\]\}/);
assert.match(contents.listing, /label: "Update Placement"/);
assert.match(contents.listing, /label: "Deactivate Selected"/);
assert.match(contents.listing, /<DialogTitle>Update Selected Employees<\/DialogTitle>/);
assert.match(contents.listing, /<Label htmlFor="staff-placement-branch">Site<\/Label>/);
assert.match(contents.listing, /<Label htmlFor="staff-placement-class">Shift<\/Label>/);
assert.match(contents.listing, /bulkUpdateEmployeePlacement\(type, employeeIds/);
assert.match(contents.listing, /requiresClassPlacement = type === "teacher"/);
assert.match(contents.listing, /canUpdate = type !== "teacher" \|\| teacherActionPermissions\.canUpdateTeacher/);
assert.match(contents.listing, /canDelete = type !== "teacher" \|\| teacherActionPermissions\.canDeleteTeacher/);

assert.match(contents.columns, /legacyId/);
assert.match(contents.columns, /Calendar/);
assert.match(contents.columns, /view\.php\?p=teacher&id=/);
assert.match(contents.columns, /className/);

assert.match(contents.actions, /export async function getEmployees/);
assert.match(contents.actions, /pageSize = 20/);
assert.match(contents.actions, /const paginated = pageSize !== "all"/);
assert.match(contents.actions, /if \(type === "teacher"\)[\s\S]*include\.class = true/);
assert.match(contents.actions, /export async function getEmployeePlacementOptions/);
assert.match(contents.actions, /export async function bulkUpdateEmployeePlacement/);
assert.match(contents.actions, /requireOrgSafe\(\)/);
assert.match(contents.actions, /employeeIds\.length > 500/);
assert.match(contents.actions, /requireLegacyActionAllowed\(ctx, "updateTeacher"\)/);
assert.match(contents.actions, /Branch does not belong to your organization/);
assert.match(contents.actions, /Class does not belong to the selected branch/);
assert.match(contents.actions, /db\.teacher\.updateMany[\s\S]*data: \{ branchId, classId \}/);
assert.match(contents.actions, /db\.nurse\.updateMany[\s\S]*data: \{ branchId \}/);
assert.match(contents.actions, /db\.doctor\.updateMany[\s\S]*data: \{ branchId \}/);
assert.match(contents.actions, /db\.manager\.updateMany[\s\S]*data: \{ branchId \}/);

for (const [key, route] of [
  ["teacherPage", "teacher"],
  ["nursePage", "nurse"],
  ["doctorPage", "doctor"],
  ["managerPage", "manager"],
] as const) {
  assert.match(contents[key], new RegExp(`getEmployees\\("${route}", \\{ pageSize: "all" \\}\\)`));
  assert.match(contents[key], /getEmployeePlacementOptions\(\)/);
  assert.match(contents[key], /<EmployeeListingClient/);
  assert.match(contents[key], /placementOptions=/);
}

for (const [key, route] of [
  ["teacherBridge", "/employees/teachers"],
  ["nurseBridge", "/employees/nurses"],
  ["doctorBridge", "/employees/doctors"],
  ["managerBridge", "/employees/managers"],
] as const) {
  assert.match(contents[key], /withLegacySearchQuery/);
  assert.match(contents[key], new RegExp(route.replaceAll("/", "\\/")));
}

const staffRows = [
  {
    legacyPhp: "doctors.php",
    legacyJs: "doctors.js",
    route: "/doctors.php, /employees/doctors",
    status:
      "restored - legacy doctors roster columns, q bridge, copy/PDF exports, page sizes, selected placement, selected deactivate, and detail form audit restored",
    placement: "bulk branch update",
  },
  {
    legacyPhp: "managers.php",
    legacyJs: "managers.js",
    route: "/managers.php, /employees/managers",
    status:
      "restored - legacy managers roster columns, q bridge, copy/PDF exports, page sizes, selected placement, selected deactivate, and detail form audit restored",
    placement: "bulk branch update",
  },
  {
    legacyPhp: "nurses.php",
    legacyJs: "nurses.js",
    route: "/nurses.php, /employees/nurses",
    status:
      "restored - legacy nurses roster columns, q bridge, copy/PDF exports, page sizes, selected placement, selected deactivate, and detail form audit restored",
    placement: "bulk branch update",
  },
  {
    legacyPhp: "teachers.php",
    legacyJs: "teachers.js",
    route: "/teachers.php, /employees/teachers",
    status:
      "restored - legacy teachers roster columns, q bridge, copy/PDF exports, page sizes, selected placement, selected deactivate, row actions, ACL, and detail form audit restored",
    placement: "bulk branch/class update",
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const row of staffRows) {
  assert.match(
    contents.matrix,
    new RegExp(`${escapeRegExp(row.legacyPhp)}[\\s\\S]*${escapeRegExp(row.status)}`),
  );
  assert.match(
    contents.matrix,
    new RegExp(`${escapeRegExp(row.legacyPhp)}[\\s\\S]*selected-row Update Placement modal backed by an org-safe ${escapeRegExp(row.placement)}`),
  );
  assert.match(
    contents.matrixMd,
    new RegExp(`${escapeRegExp(row.legacyPhp)} \\| Front/templates/admin/js/${escapeRegExp(row.legacyJs)} \\| ${escapeRegExp(row.route)} \\| ${escapeRegExp(row.status)}`),
  );
  assert.match(
    contents.matrixMd,
    new RegExp(`${escapeRegExp(row.legacyPhp)}[\\s\\S]*selected-row Update Placement modal backed by an org-safe ${escapeRegExp(row.placement)}`),
  );
  assert.match(
    contents.matrixMd,
    new RegExp(`${escapeRegExp(row.legacyPhp)}[\\s\\S]*verify-legacy-staff-roster-contract\\.ts`),
  );
  assert.match(
    contents.matrixMd,
    new RegExp(`${escapeRegExp(row.legacyPhp)}[\\s\\S]*verify-legacy-staff-detail-visual-smoke-contract\\.ts`),
  );
  assert.doesNotMatch(
    contents.matrixMd,
    new RegExp(`${escapeRegExp(row.legacyPhp)}[^\\n]*detail form audit remains`),
  );
}

console.log("legacy staff roster contract assertions passed");
