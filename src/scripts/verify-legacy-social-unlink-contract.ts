import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyIntegration:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/integration.class.php",
  profileActions: "src/lib/actions/profile.ts",
  legacyUsersActions: "src/lib/actions/legacy-users.ts",
  profileClient: "src/app/(app)/profile/profile-client.tsx",
  legacyUsersClient:
    "src/app/(app)/settings/legacy-users/legacy-users-client.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyIntegration, /\$_GET\['unlink'\]/);
assert.match(text.legacyIntegration, /private function unlink/);
assert.match(text.legacyIntegration, /UPDATE `login_integration` SET \$provider = null/);
assert.match(text.legacyIntegration, /Successfully unlinked from/);

assert.match(text.profileActions, /providerKey: string/);
assert.match(text.profileActions, /unlinkCurrentUserLegacySocialProvider/);
assert.match(text.profileActions, /login_integration/);
assert.match(text.profileActions, /social_unlink_audit/);
assert.match(text.profileActions, /modern_profile_social_unlink/);
assert.match(text.profileActions, /linkedSocialProviderList/);
assert.match(text.profileActions, /revalidatePath\("\/profile"\)/);

assert.match(text.legacyUsersActions, /providerKey: string/);
assert.match(text.legacyUsersActions, /unlinkLegacyAdminUserSocialProvider/);
assert.match(text.legacyUsersActions, /requireLegacyAdminPanelAccess/);
assert.match(text.legacyUsersActions, /modern_legacy_user_admin_social_unlink/);
assert.match(text.legacyUsersActions, /social_unlink_audit/);

assert.match(text.profileClient, /legacyIntegrations/);
assert.match(text.profileClient, /handleSocialUnlink/);
assert.match(text.profileClient, /unlinkCurrentUserLegacySocialProvider/);
assert.match(text.profileClient, /Unlink/);

assert.match(text.legacyUsersClient, /handleSocialUnlink/);
assert.match(text.legacyUsersClient, /unlinkLegacyAdminUserSocialProvider/);
assert.match(text.legacyUsersClient, /integration\.providerKey/);
assert.match(text.legacyUsersClient, /Unlink/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
for (const legacyPhp of [
  "Front/templates/admin/users/classes/profile.class.php",
  "Front/templates/admin/users/profile.php",
  "Front/templates/admin/users/admin/users.php",
  "Front/templates/admin/users/classes/integration.class.php",
]) {
  const row = matrix.find((entry) => entry.legacyPhp === legacyPhp);
  assert.ok(row, `${legacyPhp} row exists`);
  assert.match(row.verification ?? "", /social unlink/i);
  assert.match(row.verification ?? "", /social_unlink_audit/);
}

assert.match(text.markdownMatrix, /verify-legacy-social-unlink-contract\.ts/);
assert.match(text.topGaps, /Profile and admin social unlink/);

console.log("legacy social unlink contract assertions passed");
