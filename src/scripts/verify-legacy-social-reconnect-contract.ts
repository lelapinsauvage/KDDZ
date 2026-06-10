import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyProfile:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/profile.class.php",
  legacyIntegration:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/integration.class.php",
  auth: "src/lib/auth.ts",
  socialAuth: "src/lib/legacy-social-auth.ts",
  profileActions: "src/lib/actions/profile.ts",
  profileClient: "src/app/(app)/profile/profile-client.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyProfile, /integration\.class\.php/);
assert.match(text.legacyProfile, /profile-public-enable/);
assert.match(text.legacyIntegration, /Hybrid_Auth/);
assert.match(text.legacyIntegration, /enabledMethods/);
assert.match(text.legacyIntegration, /login_integration/);

assert.match(text.socialAuth, /linkLegacySocialAuthIdentityByEmail/);
assert.match(text.socialAuth, /resolveStaffLoginIdentity\(db, email\)/);
assert.match(text.socialAuth, /recordType: "social_integration"/);
assert.match(text.socialAuth, /legacyTable: "login_integration"/);
assert.match(text.socialAuth, /linked_from: "modern_oauth_verified_email"/);
assert.match(text.socialAuth, /recordType: "social_link_audit"/);

assert.match(text.auth, /linkLegacySocialAuthIdentityByEmail/);
assert.match(text.auth, /identity \?\?= await linkLegacySocialAuthIdentityByEmail/);
assert.match(text.auth, /createLegacySocialSignupPrefill/);

assert.match(text.profileActions, /legacySocialProviderStatuses/);
assert.match(text.profileActions, /authProviderId/);
assert.match(text.profileActions, /isSupported/);
assert.match(text.profileActions, /isConfigured/);

assert.match(text.profileClient, /import \{ signIn \} from "next-auth\/react"/);
assert.match(text.profileClient, /handleSocialConnect/);
assert.match(text.profileClient, /signIn\(authProviderId, \{ callbackUrl: "\/profile" \}\)/);
assert.match(text.profileClient, /Needs credentials/);
assert.match(text.profileClient, /Unavailable/);
assert.match(text.profileClient, /Connect/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const rows = new Map(matrix.map((row) => [row.legacyPhp, row]));
for (const legacyPhp of [
  "Front/templates/admin/users/classes/profile.class.php",
  "Front/templates/admin/users/profile.php",
  "Front/templates/admin/users/classes/integration.class.php",
]) {
  const row = rows.get(legacyPhp);
  assert.ok(row, `${legacyPhp} row exists`);
  assert.match(row.status ?? "", /reconnect|link/);
  assert.match(row.verification ?? "", /verified provider email/);
  assert.match(row.verification ?? "", /verify-legacy-social-reconnect-contract\.ts/);
}

assert.match(text.markdownMatrix, /verify-legacy-social-reconnect-contract\.ts/);
assert.match(text.topGaps, /verified provider email/);

console.log("legacy social reconnect contract assertions passed");
