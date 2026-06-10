import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/login.php",
  loginPage: "src/app/(auth)/login/page.tsx",
  loginActions: "src/lib/actions/legacy-login.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /Sign in/);
assert.match(text.legacy, /name="username"/);
assert.match(text.legacy, /name="password"/);
assert.match(text.legacy, /name="remember"/);
assert.match(text.legacy, /Stay signed in/);
assert.match(text.legacy, /\$jigowatt_integration->enabledMethods/);
assert.match(text.legacy, /login\.php\?login=<\?php echo \$key; \?>/);
assert.match(text.legacy, /assets\/img\/<\?php echo \$key; \?>_signin\.png/);

assert.match(text.loginActions, /export async function getLegacySocialLoginMethods/);
assert.match(text.loginActions, /legacyTable: \{ in: \["login_settings", "login_settings_man"\] \}/);
assert.match(text.loginActions, /LEGACY_SOCIAL_PROVIDER_DEFINITIONS/);
assert.match(text.loginActions, /legacySocialProviderStatuses/);
assert.match(text.loginActions, /method\.settingKey/);
assert.match(text.loginActions, /legacyBool\(row\.settingValue\)/);
assert.match(text.loginActions, /href: `\/login\?login=\$\{method\.key\}`/);
assert.match(text.loginActions, /authProviderId: status\?\.authProviderId \?\? null/);
assert.match(text.loginActions, /isConfigured: status\?\.isConfigured \?\? false/);
assert.match(text.loginActions, /isSupported: status\?\.isSupported \?\? false/);

assert.match(text.loginPage, /getLegacySocialLoginMethods/);
assert.match(text.loginPage, /useEffect/);
assert.match(text.loginPage, /const \[socialMethods, setSocialMethods\]/);
assert.match(text.loginPage, /socialMethods\.length > 0/);
assert.match(text.loginPage, /socialMethods\.map/);
assert.match(text.loginPage, /handleSocialSignIn/);
assert.match(text.loginPage, /signIn\(method\.authProviderId/);
assert.match(text.loginPage, /disabled=\{!method\.authProviderId \|\| !method\.isConfigured\}/);
assert.match(text.loginPage, /method\.isConfigured/);
assert.match(text.loginPage, /legacySocialClasses/);
for (const provider of ["facebook", "google", "twitter", "yahoo"]) {
  assert.match(text.loginPage, new RegExp(`${provider}:`));
}

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/users/login.php",
);
assert.ok(row);
assert.match(row.status ?? "", /social visual parity restored/);
assert.match(row.verification ?? "", /enabled legacy buttons call `signIn\(provider\)`/);
assert.match(row.verification ?? "", /disabled\/missing-credential providers remain visibly unavailable/);
assert.match(row.verification ?? "", /integration-facebook-enable/);
assert.match(row.verification ?? "", /verify-legacy-login-social-visual-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /social visual audit remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/login.php |"),
  );
assert.match(markdownRow ?? "", /social visual parity restored/);
assert.doesNotMatch(markdownRow ?? "", /social visual audit remains/);

console.log("legacy login social visual contract assertions passed");
