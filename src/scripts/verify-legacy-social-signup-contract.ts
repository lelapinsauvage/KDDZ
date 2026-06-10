import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacySignupClass:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/signup.class.php",
  legacySignupPage:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/sign_up.php",
  auth: "src/lib/auth.ts",
  socialAuth: "src/lib/legacy-social-auth.ts",
  signupActions: "src/lib/actions/legacy-signup.ts",
  signupPage: "src/app/(auth)/signup/page.tsx",
  signupClient: "src/app/(auth)/signup/signup-client.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacySignupClass, /isset\(\$_GET\['new_social'\]\)/);
assert.match(
  text.legacySignupClass,
  /We don\\'t see you as a registered user\. Perhaps you\\'d like to sign up :\)/,
);
assert.match(text.legacySignupClass, /facebookMisc/);
assert.match(text.legacySignupClass, /twitterMisc/);
assert.match(text.legacySignupClass, /INSERT INTO `login_integration`/);
assert.match(text.legacySignupPage, /\$signUp->getPost\('name'\)/);
assert.match(text.legacySignupPage, /\$signUp->getPost\('username'\)/);
assert.match(text.legacySignupPage, /\$signUp->getPost\('email'\)/);

assert.match(text.socialAuth, /createLegacySocialSignupPrefill/);
assert.match(text.socialAuth, /login_integration_signup/);
assert.match(text.socialAuth, /recordType: "social_signup_prefill"/);
assert.match(text.socialAuth, /expiresAt/);
assert.match(text.socialAuth, /getLegacySocialSignupPrefill/);
assert.match(text.socialAuth, /consumeLegacySocialSignupPrefill/);
assert.match(text.socialAuth, /recordType: "social_signup_prefill_used"/);
assert.match(text.socialAuth, /legacyTable: "login_integration"/);
assert.match(text.socialAuth, /recordType: "social_integration"/);
assert.match(text.socialAuth, /linked_from: "modern_legacy_social_signup"/);

assert.match(text.auth, /createLegacySocialSignupPrefill/);
assert.match(text.auth, /\/signup\?new_social=1&social=/);
assert.match(text.auth, /return prefillKey/);

assert.match(text.signupActions, /getLegacySocialSignupPrefill/);
assert.match(text.signupActions, /consumeLegacySocialSignupPrefill/);
assert.match(text.signupActions, /socialSignupPrefill/);
assert.match(
  text.signupActions,
  /We don't see you as a registered user\. Perhaps you'd like to sign up :\)/,
);
assert.match(text.signupActions, /socialSignupKey/);
assert.match(text.signupActions, /socialSignup: \{/);

assert.match(text.signupPage, /social\?: string \| string\[\]/);
assert.match(text.signupPage, /getLegacySignupPageData\(/);
assert.match(text.signupClient, /data\.socialSignupPrefill\?\.name/);
assert.match(text.signupClient, /data\.socialSignupPrefill\?\.username/);
assert.match(text.signupClient, /data\.socialSignupPrefill\?\.email/);
assert.match(text.signupClient, /socialSignupKey: data\.socialSignupPrefill\?\.key/);
assert.match(text.signupClient, /data\.socialSignupNotice/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const rows = new Map(matrix.map((row) => [row.legacyPhp, row]));
for (const legacyPhp of [
  "Front/templates/admin/users/classes/signup.class.php",
  "Front/templates/admin/users/sign_up.php",
]) {
  const row = rows.get(legacyPhp);
  assert.ok(row, `${legacyPhp} row exists`);
  assert.match(row.status ?? "", /social signup/);
  assert.match(row.verification ?? "", /new_social/);
  assert.match(row.verification ?? "", /verify-legacy-social-signup-contract\.ts/);
}

assert.match(text.markdownMatrix, /verify-legacy-social-signup-contract\.ts/);
assert.match(text.topGaps, /signed social signup prefill/);

console.log("legacy social signup contract assertions passed");
