import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyClass:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/edit_user.class.php",
  legacyPage:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/users.php",
  actions: "src/lib/actions/legacy-users.ts",
  client: "src/app/(app)/settings/legacy-users/legacy-users-client.tsx",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPage, /include_once\('classes\/edit_user\.class\.php'\)/);
assert.match(text.legacyPage, /Update user/);
assert.match(text.legacyPage, /\$edituser->getLevels\(\)/);
assert.match(text.legacyPage, /name="restricted"/);
assert.match(text.legacyPage, /name="delete"/);

assert.match(text.legacyClass, /\$this->original_level/);
assert.match(text.legacyClass, /name="user_level\[\]"/);
assert.match(text.legacyClass, /array_diff\(\$new_level, \$original_level\)/);
assert.match(text.legacyClass, /welcome_email` = "1"/);
assert.match(text.legacyClass, /\$this->sendWelcome/);
assert.match(text.legacyClass, /User information updated for/);

assert.match(text.actions, /export type LegacyAdminLevelOption = \{[\s\S]*welcomeEmail: boolean;/);
assert.match(text.actions, /welcomeEmail: level\.welcomeEmail \?\? false/);
assert.match(text.actions, /export async function updateLegacyAdminUser/);
assert.match(text.actions, /const previousLevelIds = parsePhpLevelIds\(existing\.recordValue\)/);
assert.match(text.actions, /const newWelcomeLevels = relevantLevels\.filter/);
assert.match(text.actions, /level\.welcomeEmail/);
assert.match(text.actions, /!previousLevelIds\.includes\(level\.legacyId\)/);
assert.match(text.actions, /legacyEmailTemplate\([\s\S]*"email-add-user-subj"[\s\S]*"email-add-user-msg"/);
assert.match(text.actions, /source: "legacy_admin_edit_user_welcome_level"/);
assert.match(text.actions, /welcomeLevelIds: newWelcomeLevels[\s\S]*\.map\(\(level\) => level\.legacyId\)[\s\S]*\.join\(",\"\)/);
assert.match(text.actions, /welcomeLevelEmail/);
assert.match(text.actions, /emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.actions, /record: returnedLegacyRecord/);

assert.match(text.client, /updateLegacyAdminUser\(editingUser\.id, payload\)/);
assert.match(text.client, /No user level has been selected\./);
assert.match(text.client, /<Label>Levels<\/Label>/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const editClassRow = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/classes/edit_user.class.php",
);
assert.ok(editClassRow);
assert.match(editClassRow.status ?? "", /welcome-level delivery audit restored/);
assert.match(editClassRow.verification ?? "", /welcome_email/);
assert.match(editClassRow.verification ?? "", /welcomeLevelEmail/);
assert.match(
  editClassRow.verification ?? "",
  /verify-legacy-admin-user-edit-welcome-delivery-contract\.ts/,
);
assert.doesNotMatch(editClassRow.verification ?? "", /delivery\/OAuth\/export remain/);

const usersRow = matrix.find(
  (entry) =>
    entry.legacyPhp === "Front/templates/admin/users/admin/users.php",
);
assert.ok(usersRow);
assert.match(usersRow.status ?? "", /welcome-level delivery audit restored/);
assert.match(usersRow.verification ?? "", /welcome_email/);
assert.doesNotMatch(usersRow.status ?? "", /legacy user edit page restored in modal$/);

const editClassMd = text.matrixMd
  .split("\n")
  .find((line) =>
    line.includes(
      "| Front/templates/admin/users/admin/classes/edit_user.class.php |",
    ),
  );
assert.match(editClassMd ?? "", /welcome-level delivery audit restored/);

const usersMd = text.matrixMd
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/users.php |"),
  );
assert.match(usersMd ?? "", /welcome-level delivery audit restored/);

console.log("legacy admin user edit welcome delivery contract assertions passed");
