import assert from "node:assert/strict";
import fs from "node:fs";

const permissions = fs.readFileSync(
  "src/lib/legacy-access-permissions.ts",
  "utf8",
);
const actionPermissions = fs.readFileSync(
  "src/lib/legacy-action-permissions.ts",
  "utf8",
);
const systemPermissions = fs.readFileSync(
  "src/lib/legacy-system-action-permissions.ts",
  "utf8",
);
const pageGuards = fs.readFileSync("src/lib/legacy-page-guards.ts", "utf8");
const appLayout = fs.readFileSync("src/app/(app)/layout.tsx", "utf8");
const accessActions = fs.readFileSync(
  "src/lib/actions/legacy-access-control.ts",
  "utf8",
);
const accessPage = fs.readFileSync(
  "src/app/(app)/settings/access-control/page.tsx",
  "utf8",
);
const accessClient = fs.readFileSync(
  "src/app/(app)/settings/access-control/access-control-client.tsx",
  "utf8",
);

assert.match(permissions, /parsePhpLevelIds/);
assert.match(permissions, /recordType:\s*\{\s*in: LEGACY_ACCESS_CONFIGS\.map\(\(config\) => config\.userRecordType\),/);
assert.match(permissions, /recordType:\s*\{\s*in: LEGACY_ACCESS_CONFIGS\.map\(\(config\) => config\.actionRecordType\),/);
assert.match(permissions, /config\) => config\.grantRecordType/);
assert.match(permissions, /level\.config\.grantRecordType === grant\.recordType/);
assert.match(permissions, /if \(relevantActions\.length > 0\)/);
assert.match(permissions, /\{ isConfigured: true, isAllowed: false \}/);
assert.match(permissions, /const isAllowed = grants\.some/);
assert.match(permissions, /decisions\[requestKey\] = \{ isConfigured: true, isAllowed \}/);
assert.match(actionPermissions, /getLegacyAccessPermissionDecision\(\s*ctx,\s*actionName,\s*"ACTION"/);
assert.match(actionPermissions, /return \{ ok: false as const, error: "Access denied" \}/);
assert.match(systemPermissions, /LEGACY_SYSTEM_ACTION_NAMES = \["manageSystem"\]/);
assert.match(systemPermissions, /requireLegacyAdminPanelAccess/);

assert.match(pageGuards, /LEGACY_GUARDED_PAGE_NAMES/);
assert.match(pageGuards, /Branch_Dashboard\.php/);
assert.match(pageGuards, /message_portal_class\.php/);
assert.match(appLayout, /getLegacyAccessPermissionMap/);
assert.match(appLayout, /legacyPermissionAllows\(legacyPagePermissions\[guardedLegacyPage\]\)/);
assert.match(appLayout, /redirect\("\/forbidden\.php"\)/);

assert.match(accessPage, /requireLegacyAdminPanelAccess\(\)/);
assert.match(accessPage, /getLegacyAccessControlMatrix/);
assert.match(accessActions, /getLegacyAccessControlMatrix/);
assert.match(accessActions, /getLegacyAccessLevelUsers/);
assert.match(accessActions, /updateLegacyAccessControlLevels/);
assert.match(accessActions, /No level selected!/);
assert.match(accessActions, /updateMany\(\{\s*where:\s*\{[\s\S]+recordType: config\.grantRecordType,[\s\S]+data: \{ isActive: false \}/);
assert.match(accessActions, /tx\.legacyAccessControlRecord\.upsert/);
assert.match(accessActions, /updated_from: "modern_legacy_access_control"/);
assert.match(accessActions, /createLegacyAccessLevel/);
assert.match(accessActions, /Level name \$\{levelName\} already exists\./);
assert.match(accessActions, /updateLegacyAccessLevel/);
assert.match(accessActions, /existing\.legacyId === 1/);
assert.match(accessActions, /deleteLegacyAccessLevel/);
assert.match(accessActions, /The admin level cannot be deleted\./);
assert.match(accessActions, /This level still has users in it!/);

assert.match(accessClient, /New level/);
assert.match(accessClient, /Select all/);
assert.match(accessClient, /Clear/);
assert.match(accessClient, /Save selected/);
assert.match(accessClient, /Allowed Actions/);
assert.match(accessClient, /No migrated access-control records found\./);
assert.match(accessClient, /id="level-message"/);
assert.match(accessClient, /Admin level cannot be deleted/);
assert.match(accessClient, /Level still has users/);
assert.match(accessClient, /Registered Date/);
assert.match(accessClient, /Last Login/);

console.log("legacy access-control runtime contract assertions passed");
