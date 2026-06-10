import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  legacyIntegrationPage:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/integration.php",
  legacyIntegrationClass:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/integration.class.php",
  legacySignupClass:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/signup.class.php",
  socialAuth: "src/lib/legacy-social-auth.ts",
  legacySignup: "src/lib/actions/legacy-signup.ts",
  legacyAuthSettings: "src/lib/actions/legacy-auth-settings.ts",
  legacyAuthSettingsClient:
    "src/app/(app)/settings/legacy-auth/legacy-auth-settings-client.tsx",
  loginPage: "src/app/(auth)/login/page.tsx",
  profileClient: "src/app/(app)/profile/profile-client.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyIntegrationPage, /integration-yahoo-enable/);
assert.match(text.legacyIntegrationPage, /integration-playThru-enable/);
assert.match(text.legacyIntegrationPage, /playThru-publisher-key/);
assert.match(text.legacyIntegrationPage, /playThru-scoring-key/);
assert.match(text.legacyIntegrationClass, /case 'yahoo'/);
assert.match(text.legacyIntegrationClass, /authenticate\( "OpenID", array\( "openid_identifier" => "https:\/\/me\.yahoo\.com\/" \) \)/);
assert.match(text.legacySignupClass, /case 'playThru'/);
assert.match(text.legacySignupClass, /AYAH_WEB_SERVICE_HOST', 'ws\.areyouahuman\.com'/);

assert.ok(existsSync("node_modules/next-auth/providers/facebook.js"));
assert.ok(existsSync("node_modules/next-auth/providers/google.js"));
assert.ok(existsSync("node_modules/next-auth/providers/twitter.js"));
assert.ok(!existsSync("node_modules/next-auth/providers/yahoo.js"));

assert.match(text.socialAuth, /key: "yahoo"[\s\S]*authProviderId: null/);
assert.match(text.socialAuth, /isSupported: Boolean\(provider\.authProviderId\)/);
assert.match(text.legacySignup, /if \(mode === "playThru"\)/);
assert.match(text.legacySignup, /providerArchived: true/);
assert.match(text.legacySignup, /Please enter the correct captcha!/);
assert.match(text.legacyAuthSettings, /"integration-yahoo-enable"/);
assert.match(text.legacyAuthSettings, /"playThru-publisher-key"/);
assert.match(text.legacyAuthSettings, /"playThru-scoring-key"/);

assert.match(text.legacyAuthSettingsClient, /Archived runtime/);
assert.match(text.legacyAuthSettingsClient, /PlayThru archived/);
assert.match(text.legacyAuthSettingsClient, /Yahoo OpenID and PlayThru keys are preserved for legacy audit/);
assert.match(text.loginPage, /disabled=\{!method\.authProviderId \|\| !method\.isConfigured\}/);
assert.match(text.profileClient, /method\.isSupported[\s\S]*Needs credentials[\s\S]*Unavailable/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const rows = new Map(matrix.map((row) => [row.legacyPhp, row]));
for (const legacyPhp of [
  "Front/templates/admin/users/admin/classes/settings.class.php",
  "Front/templates/admin/users/admin/page/integration.php",
  "Front/templates/admin/users/classes/signup.class.php",
]) {
  const row = rows.get(legacyPhp);
  assert.ok(row, `${legacyPhp} row exists`);
  assert.match(row.status ?? "", /^restored -/);
  assert.match(row.verification ?? "", /Yahoo OpenID and PlayThru are preserved as archived settings/);
  assert.match(row.verification ?? "", /verify-legacy-retired-auth-providers-contract\.ts/);
  assert.doesNotMatch(row.status ?? "", /Yahoo\/PlayThru decisions remain|PlayThru\/Yahoo decisions remain/);
  assert.doesNotMatch(row.verification ?? "", /Remaining work is Yahoo|Remaining work is PlayThru/);
}

assert.match(text.markdownMatrix, /verify-legacy-retired-auth-providers-contract\.ts/);
assert.match(text.topGaps, /Yahoo OpenID and PlayThru are preserved as archived settings/);
assert.doesNotMatch(text.topGaps, /Yahoo\/PlayThru replacement or retirement decisions/);

console.log("legacy retired auth providers contract assertions passed");
