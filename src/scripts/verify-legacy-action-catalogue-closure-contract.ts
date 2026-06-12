import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const expectedLegacyActionNames = [
  "AddEditHolidays",
  "AddFoodToCalendar",
  "EditFoodCalendar",
  "EditSchoolFromTo",
  "FoodAllBranches",
  "Upnurseryinfo",
  "addBranch",
  "addChild",
  "addClass",
  "addTeacher",
  "deleteBranch",
  "deleteChild",
  "deleteClass",
  "deleteTeacher",
  "manageSystem",
  "updateBranch",
  "updateChild",
  "updateClass",
  "updateTeacher",
] as const;

const modern = {
  appShell: readFileSync("src/scripts/verify-legacy-app-shell-contract.ts", "utf8"),
  branchActions: readFileSync("src/lib/actions/branches.ts", "utf8"),
  branchClient: readFileSync("src/components/branches/branches-client.tsx", "utf8"),
  branchPermissions: readFileSync("src/lib/legacy-branch-action-permissions.ts", "utf8"),
  childActions: readFileSync("src/lib/actions/children.ts", "utf8"),
  childClient: readFileSync("src/components/children/children-page-client.tsx", "utf8"),
  childDraftsClient: readFileSync("src/components/children/drafts-page-client.tsx", "utf8"),
  childPermissions: readFileSync("src/lib/legacy-child-action-permissions.ts", "utf8"),
  classActions: readFileSync("src/lib/actions/classes.ts", "utf8"),
  classClient: readFileSync("src/components/classes/classes-client.tsx", "utf8"),
  classPermissions: readFileSync("src/lib/legacy-class-action-permissions.ts", "utf8"),
  foodActions: readFileSync("src/lib/actions/food.ts", "utf8"),
  foodContract: readFileSync("src/scripts/verify-legacy-food-calendar-fullcalendar-contract.ts", "utf8"),
  foodPermissions: readFileSync("src/lib/legacy-food-calendar-action-permissions.ts", "utf8"),
  holidayActions: readFileSync("src/lib/actions/settings.ts", "utf8"),
  holidayContract: readFileSync("src/scripts/verify-legacy-holiday-calendar-fullcalendar-contract.ts", "utf8"),
  holidayPermissions: readFileSync("src/lib/legacy-holiday-action-permissions.ts", "utf8"),
  nurseryContract: readFileSync("src/scripts/verify-legacy-nursery-info-visual-contract.ts", "utf8"),
  nurseryPermissions: readFileSync("src/lib/legacy-nursery-action-permissions.ts", "utf8"),
  profileActions: readFileSync("src/lib/actions/profile.ts", "utf8"),
  settingsContract: readFileSync("src/scripts/verify-legacy-settings-visual-contract.ts", "utf8"),
  staffActions: readFileSync("src/lib/actions/employees.ts", "utf8"),
  staffAudit: readFileSync("src/scripts/verify-legacy-staff-action-audit-contract.ts", "utf8"),
  systemPermissions: readFileSync("src/lib/legacy-system-action-permissions.ts", "utf8"),
  topGaps: readFileSync("docs/top-20-restoration-gaps.md", "utf8"),
};

assert.deepEqual(
  extractLegacyActionNames(legacyRoot),
  expectedLegacyActionNames,
  "legacy ACTION catalogue changed; map or intentionally retire every action before closing parity",
);

assertActionFamily("child", modern.childPermissions, modern.childActions, [
  "addChild",
  "updateChild",
  "deleteChild",
]);
assert.match(modern.childClient, /canAddChild/);
assert.match(modern.childClient, /canUpdateChild/);
assert.match(modern.childClient, /canDeleteChild/);
assert.match(modern.childDraftsClient, /canAddChild/);
assert.match(modern.childDraftsClient, /canUpdateChild/);
assert.match(modern.childDraftsClient, /canDeleteChild/);

assertActionFamily("class", modern.classPermissions, modern.classActions, [
  "addClass",
  "updateClass",
  "deleteClass",
]);
assert.match(modern.classClient, /canAddClass/);
assert.match(modern.classClient, /canUpdateClass/);
assert.match(modern.classClient, /canDeleteClass/);

assertActionFamily("branch", modern.branchPermissions, modern.branchActions, [
  "addBranch",
  "updateBranch",
  "deleteBranch",
]);
assert.match(modern.branchClient, /canAddBranch/);
assert.match(modern.branchClient, /canUpdateBranch/);
assert.match(modern.branchClient, /canDeleteBranch/);

assertActionFamily("teacher", modern.staffAudit, modern.staffActions, [
  "addTeacher",
  "updateTeacher",
  "deleteTeacher",
]);

assertActionFamily("holiday", modern.holidayPermissions, modern.holidayActions, [
  "AddEditHolidays",
]);
assert.match(modern.holidayContract, /AddEditHolidays/);

assertActionFamily("food calendar", modern.foodPermissions, modern.foodActions, [
  "AddFoodToCalendar",
  "EditFoodCalendar",
  "FoodAllBranches",
]);
assert.match(modern.foodContract, /AddFoodToCalendar/);
assert.match(modern.foodContract, /EditFoodCalendar/);
assert.match(modern.foodContract, /FoodAllBranches/);

assertActionFamily("nursery", modern.nurseryPermissions, modern.nurseryContract, [
  "Upnurseryinfo",
]);

assertActionFamily("settings", modern.settingsContract, modern.profileActions, [
  "EditSchoolFromTo",
]);

assertActionFamily("system", modern.systemPermissions, modern.appShell, [
  "manageSystem",
]);

assert.match(
  modern.topGaps,
  /exhaustive legacy ACTION catalogue audit now extracts every `Check::protectPageOrFunction\(\.\.\., 'ACTION'\)` name/,
);
assert.doesNotMatch(
  modern.topGaps,
  /Remaining work is final QA for any missed legacy edge ACTION guards/,
);

console.log("legacy action catalogue closure contract assertions passed");

function assertActionFamily(
  family: string,
  declarationSource: string,
  enforcementSource: string,
  actionNames: readonly string[],
) {
  for (const actionName of actionNames) {
    assert.match(
      declarationSource,
      new RegExp(escapeRegExp(actionName)),
      `${family} action ${actionName} must be declared in permission helpers or contract evidence`,
    );
    assert.match(
      enforcementSource,
      new RegExp(escapeRegExp(actionName)),
      `${family} action ${actionName} must be enforced or covered by contract evidence`,
    );
  }
}

function extractLegacyActionNames(root: string) {
  const names = new Set<string>();
  const pattern =
    /protectPageOrFunction\(\s*['"]([^'"]+)['"]\s*,\s*['"]ACTION['"]/g;

  for (const filePath of walkFiles(root)) {
    if (!/\.(php|js)$/i.test(filePath)) {
      continue;
    }

    const text = readFileSync(filePath, "utf8");
    for (const match of text.matchAll(pattern)) {
      names.add(match[1]);
    }
  }

  return Array.from(names).sort();
}

function walkFiles(root: string): string[] {
  const stat = statSync(root);
  if (stat.isFile()) {
    return [root];
  }
  if (!stat.isDirectory()) {
    return [];
  }

  return readdirSync(root).flatMap((entry) => walkFiles(join(root, entry)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
