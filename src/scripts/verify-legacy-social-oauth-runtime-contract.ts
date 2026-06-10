import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyLogin:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/login.php",
  legacyIntegration:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/integration.class.php",
  auth: "src/lib/auth.ts",
  socialAuth: "src/lib/legacy-social-auth.ts",
  loginActions: "src/lib/actions/legacy-login.ts",
  loginPage: "src/app/(auth)/login/page.tsx",
  readme: "README.md",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyLogin, /\$jigowatt_integration->enabledMethods/);
assert.match(text.legacyLogin, /login\.php\?login=<\?php echo \$key; \?>/);
assert.match(text.legacyIntegration, /Hybrid_Auth/);
assert.match(text.legacyIntegration, /login_integration/);
for (const provider of ["facebook", "google", "twitter", "yahoo"]) {
  assert.match(text.legacyIntegration, new RegExp(provider));
}

assert.match(text.socialAuth, /LEGACY_SOCIAL_PROVIDER_DEFINITIONS/);
assert.match(text.socialAuth, /AUTH_FACEBOOK_ID/);
assert.match(text.socialAuth, /AUTH_GOOGLE_ID/);
assert.match(text.socialAuth, /AUTH_TWITTER_ID/);
assert.match(text.socialAuth, /authProviderId: null/);
assert.match(text.socialAuth, /resolveLegacySocialAuthIdentity/);
assert.match(text.socialAuth, /recordType: "social_integration"/);
assert.match(text.socialAuth, /login_integration_audit/);
assert.match(text.socialAuth, /recordType: "social_login_audit"/);

assert.match(text.auth, /import Facebook from "next-auth\/providers\/facebook"/);
assert.match(text.auth, /import Google from "next-auth\/providers\/google"/);
assert.match(text.auth, /import Twitter from "next-auth\/providers\/twitter"/);
assert.match(text.auth, /legacyOAuthProviders/);
assert.match(text.auth, /configuredLegacyOAuthProviders/);
assert.match(text.auth, /isLegacySocialAuthProvider/);
assert.match(text.auth, /resolveLegacySocialAuthIdentity/);
assert.match(text.auth, /recordLegacySocialLoginAudit/);
assert.match(text.auth, /async signIn\(\{ account, user \}\)/);
assert.match(text.auth, /async jwt\(params\)/);
assert.match(text.auth, /token\.legacyLogin = payload\.legacyLogin/);
assert.match(text.auth, /token\.legacyAccess = payload\.legacyAccess/);

assert.match(text.loginActions, /legacySocialProviderStatuses/);
assert.match(text.loginActions, /authProviderId/);
assert.match(text.loginActions, /isConfigured/);
assert.match(text.loginActions, /isSupported/);

assert.match(text.loginPage, /handleSocialSignIn/);
assert.match(text.loginPage, /signIn\(method\.authProviderId/);
assert.match(text.loginPage, /disabled=\{!method\.authProviderId \|\| !method\.isConfigured\}/);

for (const envName of [
  "AUTH_FACEBOOK_ID",
  "AUTH_FACEBOOK_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_TWITTER_ID",
  "AUTH_TWITTER_SECRET",
]) {
  assert.match(text.readme, new RegExp(envName));
}

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const rows = new Map(matrix.map((row) => [row.legacyPhp, row]));
for (const legacyPhp of [
  "Front/templates/admin/users/login.php",
  "Front/templates/admin/users/classes/login.class.php",
  "Front/templates/admin/users/classes/integration.class.php",
  "Front/templates/admin/users/admin/page/integration.php",
]) {
  const row = rows.get(legacyPhp);
  assert.ok(row, `${legacyPhp} row exists`);
  assert.match(row.verification ?? "", /Auth\.js OAuth/);
  assert.match(row.verification ?? "", /Facebook, Google, and Twitter/);
  assert.match(row.verification ?? "", /login_integration/);
}
assert.match(text.markdownMatrix, /verify-legacy-social-oauth-runtime-contract\.ts/);
assert.match(text.topGaps, /Facebook, Google, and Twitter Auth\.js OAuth runtime/);
assert.doesNotMatch(text.topGaps, /social\/OAuth runtime behavior, and exact browser-session/);

console.log("legacy social OAuth runtime contract assertions passed");
