import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyAdminEdit:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/edit_user.class.php",
  legacyAdminUsers:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/users.php",
  legacyIntegration:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/integration.class.php",
  adminClient: "src/app/(app)/settings/legacy-users/legacy-users-client.tsx",
  adminActions: "src/lib/actions/legacy-users.ts",
  profileClient: "src/app/(app)/profile/profile-client.tsx",
  socialAuth: "src/lib/legacy-social-auth.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyAdminEdit, /DELETE FROM login_integration WHERE user_id = :id/);
assert.doesNotMatch(text.legacyAdminEdit, /Hybrid_Auth|link_account|authenticate\(/);
assert.doesNotMatch(text.legacyAdminUsers, /link_account|authenticate\(|integration-facebook-enable/);

assert.match(text.legacyIntegration, /if \( !empty\( \$_GET\['link'\] \) \)/);
assert.match(text.legacyIntegration, /public function link_account/);
assert.match(text.legacyIntegration, /\$_SESSION\['jigowatt'\]\['user_id'\]/);
assert.match(text.legacyIntegration, /INSERT INTO `login_integration`/);
assert.match(text.legacyIntegration, /UPDATE `login_integration` SET `\$link`/);

assert.match(text.adminClient, /Social Links/);
assert.match(text.adminClient, /handleSocialUnlink/);
assert.match(text.adminClient, /Unlink/);
assert.doesNotMatch(text.adminClient, /signIn\(authProviderId/);

assert.match(text.adminActions, /unlinkLegacyAdminUserSocialProvider/);
assert.match(text.adminActions, /recordType: "social_unlink_audit"/);
assert.doesNotMatch(text.adminActions, /admin.*social_link_audit|social_link_audit.*admin/i);

assert.match(text.profileClient, /handleSocialConnect/);
assert.match(text.profileClient, /signIn\(authProviderId, \{ callbackUrl: "\/profile" \}\)/);
assert.match(text.socialAuth, /linkLegacySocialAuthIdentityByEmail/);
assert.match(text.socialAuth, /linked_from: "modern_oauth_verified_email"/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const rows = new Map(matrix.map((row) => [row.legacyPhp, row]));
for (const legacyPhp of [
  "Front/templates/admin/users/admin/classes/edit_user.class.php",
  "Front/templates/admin/users/admin/users.php",
]) {
  const row = rows.get(legacyPhp);
  assert.ok(row, `${legacyPhp} row exists`);
  assert.match(row.status ?? "", /^restored -/);
  assert.doesNotMatch(row.status ?? "", /admin OAuth reconnect remains/);
  assert.match(row.verification ?? "", /legacy admin edit source has no user-owned OAuth link flow/);
  assert.match(row.verification ?? "", /verify-legacy-admin-social-link-boundary-contract\.ts/);
  assert.doesNotMatch(row.verification ?? "", /Remaining work is admin-side active OAuth reconnect/);
}

assert.match(text.markdownMatrix, /verify-legacy-admin-social-link-boundary-contract\.ts/);
assert.doesNotMatch(text.markdownMatrix, /admin OAuth reconnect remains/);
assert.match(text.topGaps, /Profile social reconnect\/link management is restored/);
assert.match(text.topGaps, /Profile and admin social unlink management is restored/);
assert.doesNotMatch(text.topGaps, /profile\/admin OAuth reconnect\/link management/);

console.log("legacy admin social link boundary contract assertions passed");
