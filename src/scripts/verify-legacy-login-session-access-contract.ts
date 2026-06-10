import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyLogin:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/login.class.php",
  legacyCheck:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/check.class.php",
  access: "src/lib/legacy-access-permissions.ts",
  auth: "src/lib/auth.ts",
  authConfig: "src/lib/auth.config.ts",
  nextAuthTypes: "src/types/next-auth.d.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyLogin, /\$_SESSION\['jigowatt'\]\['user_level'\]/);
assert.match(text.legacyLogin, /\$_SESSION\['jigowatt'\]\['dbname'\]/);
assert.match(text.legacyLogin, /\$_SESSION\['jigowatt'\]\['dbid'\]/);
assert.match(text.legacyLogin, /\$_SESSION\['jigowatt'\]\['sel_year'\]/);
assert.match(text.legacyLogin, /actions_control/);
assert.match(text.legacyLogin, /login_levels/);
assert.match(text.legacyLogin, /system_actions/);
assert.match(text.legacyLogin, /\$_SESSION\['LEVELS'\]/);
assert.match(text.legacyLogin, /sysaction_name/);
assert.match(text.legacyLogin, /sysaction_type/);

assert.match(text.legacyCheck, /protectPageOrFunction/);
assert.match(text.legacyCheck, /\$_SESSION\['LEVELS'\]/);
assert.match(text.legacyCheck, /\$_SESSION\['jigowatt'\]\['user_level'\]/);
assert.match(text.legacyCheck, /in_array\(\$ID,\s*\$User_Levels\)/);

assert.match(text.access, /export type LegacyAccessSessionSnapshot/);
assert.match(text.access, /export async function getLegacyAccessSessionSnapshot/);
assert.match(text.access, /configuredActionKeys/);
assert.match(text.access, /allowedActionKeys/);
assert.match(text.access, /directUserActionKeys/);
assert.match(text.access, /parsePhpLevelIds/);
assert.match(text.access, /manager_system_action/);
assert.match(text.access, /manager_level_action_grant/);
assert.match(text.access, /level_action_grant/);
assert.match(text.access, /recordType: "user_action_grant"/);
assert.match(text.access, /if \(allowedByUser\) directUserActionKeys\.add\(actionKey\)/);
assert.match(text.access, /if \(allowedByLevel\) allowedActionKeys\.add\(actionKey\)/);
assert.doesNotMatch(
  text.access,
  /if \(allowedByLevel \|\| allowedByUser\) allowedActionKeys\.add\(actionKey\)/,
);

assert.match(text.auth, /getLegacyAccessSessionSnapshot/);
assert.match(text.auth, /const legacyAccess = await getLegacyAccessSessionSnapshot\(user\.id\)/);
assert.match(text.auth, /legacyAccess,/);
assert.match(text.authConfig, /token\.legacyAccess = user\.legacyAccess/);
assert.match(text.authConfig, /session\.user\.legacyAccess = token\.legacyAccess/);
assert.match(text.nextAuthTypes, /legacyAccess: LegacyAccessSessionSnapshot \| null/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/users/classes/login.class.php",
);
assert.ok(row);
assert.match(row.status ?? "", /action-control session snapshot/);
assert.match(row.verification ?? "", /legacyAccess/);
assert.match(row.verification ?? "", /\$_SESSION\['LEVELS'\]/);
assert.match(row.verification ?? "", /direct `users_control` audit keys/);
assert.doesNotMatch(row.verification ?? "", /action-control session grants/);
assert.doesNotMatch(row.status ?? "", /full action-control/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/classes/login.class.php |"),
  );
assert.match(markdownRow ?? "", /action-control session snapshot/);
assert.match(markdownRow ?? "", /legacyAccess/);
assert.doesNotMatch(markdownRow ?? "", /action-control session grants/);

assert.match(text.topGaps, /Auth\.js session now hydrates a legacy access snapshot/);
assert.match(text.topGaps, /direct `users_control` audit keys/);
assert.doesNotMatch(
  text.topGaps,
  /Remaining work is deciding whether to hydrate grant snapshots into sessions/,
);

console.log("legacy login session access contract assertions passed");
