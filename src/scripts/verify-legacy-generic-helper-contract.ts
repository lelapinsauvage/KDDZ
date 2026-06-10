import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/generic.class.php",
  "utf8",
);
const remoteValidation = fs.readFileSync(
  "src/lib/legacy-auth-remote-validation.ts",
  "utf8",
);
const addUserRoute = fs.readFileSync(
  "src/app/(app)/users/admin/classes/add_user.class.php/route.ts",
  "utf8",
);
const addLevelRoute = fs.readFileSync(
  "src/app/(app)/users/admin/classes/add_level.class.php/route.ts",
  "utf8",
);
const authSettings = fs.readFileSync(
  "src/lib/actions/legacy-auth-settings.ts",
  "utf8",
);
const genericRuntime = fs.readFileSync(
  "src/scripts/verify-legacy-auth-general-options-runtime-contract.ts",
  "utf8",
);
const profileActions = fs.readFileSync("src/lib/actions/profile.ts", "utf8");
const legacyUsers = fs.readFileSync("src/lib/actions/legacy-users.ts", "utf8");
const accessControl = fs.readFileSync(
  "src/lib/actions/legacy-access-control.ts",
  "utf8",
);
const appLayout = fs.readFileSync("src/app/(app)/layout.tsx", "utf8");
const emailDelivery = fs.readFileSync("src/lib/email-delivery.ts", "utf8");
const notifications = fs.readFileSync(
  "src/lib/actions/notification-templates.ts",
  "utf8",
);
const auth = fs.readFileSync("src/lib/auth.ts", "utf8");

for (const method of [
  "getOption",
  "updateOption",
  "sendEmail",
  "generateProfile",
  "profileFieldTypes",
  "generateProfileTabs",
  "generateProfilePanels",
  "denyAccessLogs",
  "generateAccessLogs",
  "hashPassword",
  "validatePassword",
  "checkExists",
]) {
  assert.match(legacy, new RegExp(`function ${method}\\(`));
}

assert.match(remoteValidation, /isLegacyUsernameAvailable/);
assert.match(remoteValidation, /isLegacyEmailAvailable/);
assert.match(remoteValidation, /isLegacyLevelNameAvailable/);
assert.match(remoteValidation, /legacyBooleanResponse/);
assert.match(remoteValidation, /legacyUserSuggestionsResponse/);
assert.match(remoteValidation, /legacyLevelSuggestionsResponse/);
assert.match(addUserRoute, /requireLegacyAdminPanelAccess\(\)/);
assert.match(addUserRoute, /hasLegacyFlag\(fields, "checkusername"\)/);
assert.match(addUserRoute, /hasLegacyFlag\(fields, "checkemail"\)/);
assert.match(addUserRoute, /fieldValue\(fields, "searchUsers"\)/);
assert.match(addLevelRoute, /requireLegacyAdminPanelAccess\(\)/);
assert.match(addLevelRoute, /hasLegacyFlag\(fields, "checklevel"\)/);
assert.match(addLevelRoute, /fieldValue\(fields, "searchLevels"\)/);

assert.match(authSettings, /updateLegacyAuthGeneralSettings/);
assert.match(authSettings, /updateLegacyAuthDeniedSettings/);
assert.match(authSettings, /updateLegacyAuthIntegrationSettings/);
assert.match(authSettings, /updateLegacyAuthUpdateSettings/);
assert.match(genericRuntime, /guest-redirect/);
assert.match(genericRuntime, /default_session/);
assert.match(genericRuntime, /disable-logins-enable/);
assert.match(genericRuntime, /restrict-signups-by-email/);

assert.match(profileActions, /buildLegacyProfileFields/);
assert.match(profileActions, /profile-timestamps-enable/);
assert.match(profileActions, /profile-timestamps-admin-enable/);
assert.match(profileActions, /take: 10/);
assert.match(legacyUsers, /getLegacyProfileFields/);
assert.match(legacyUsers, /createLegacyProfileField/);
assert.match(legacyUsers, /updateLegacyProfileField/);
assert.match(legacyUsers, /deleteLegacyProfileField/);
assert.match(legacyUsers, /login_profile_fields/);
assert.match(legacyUsers, /login_profiles/);

assert.match(accessControl, /getLegacyAccessControlMatrix/);
assert.match(accessControl, /updateLegacyAccessControlLevels/);
assert.match(accessControl, /createLegacyAccessLevel/);
assert.match(accessControl, /updateLegacyAccessLevel/);
assert.match(appLayout, /getLegacyAccessPermissionMap/);
assert.match(appLayout, /legacyPermissionAllows/);

assert.match(emailDelivery, /deliverEmail/);
assert.match(emailDelivery, /mode: "individual" \| "bcc"/);
assert.match(notifications, /sendLegacyBulkEmail/);
assert.match(notifications, /mode: "bcc"/);
assert.match(auth, /compare\(`md5:\$\{legacyMd5\}`, user\.passwordHash\)/);
assert.match(auth, /passwordHash: await hash\(password, 12\)/);

console.log("legacy generic helper contract assertions passed");
