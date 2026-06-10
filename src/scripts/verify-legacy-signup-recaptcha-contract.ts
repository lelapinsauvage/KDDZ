import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyClass:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/signup.class.php",
  legacyPage:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/sign_up.php",
  action: "src/lib/actions/legacy-signup.ts",
  client: "src/app/(auth)/signup/signup-client.tsx",
  page: "src/app/(auth)/signup/page.tsx",
  settings: "src/lib/actions/legacy-auth-settings.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyClass, /public function doCaptcha/);
assert.match(text.legacyClass, /parent::getOption\('integration-captcha'\)/);
assert.match(text.legacyClass, /case 'reCAPTCHA'/);
assert.match(text.legacyClass, /recaptcha_check_answer/);
assert.match(text.legacyClass, /reCAPTCHA-public-key/);
assert.match(text.legacyClass, /reCAPTCHA-private-key/);
assert.match(text.legacyClass, /Please enter the correct captcha!/);
assert.match(text.legacyClass, /\$this->doCaptcha\(false\)/);
assert.match(text.legacyPage, /\$signUp->doCaptcha\(true\)/);

assert.match(text.settings, /"integration-captcha"/);
assert.match(text.settings, /"reCAPTCHA-public-key"/);
assert.match(text.settings, /"reCAPTCHA-private-key"/);

assert.match(text.action, /captchaMode: string;/);
assert.match(text.action, /recaptchaPublicKey: string;/);
assert.match(text.action, /captchaToken\?: string;/);
assert.match(text.action, /async function verifyLegacySignupCaptcha/);
assert.match(text.action, /integration-captcha/);
assert.match(text.action, /reCAPTCHA-private-key/);
assert.match(text.action, /https:\/\/www\.google\.com\/recaptcha\/api\/siteverify/);
assert.match(text.action, /Please enter the correct captcha!/);
assert.match(text.action, /const captcha = await verifyLegacySignupCaptcha/);
assert.match(text.action, /captcha: captcha\.legacyData \?\? null/);

assert.match(text.page, /recaptchaPublicKey: ""/);
assert.match(text.client, /import Script from "next\/script"/);
assert.match(text.client, /readRecaptchaToken/);
assert.match(text.client, /resetRecaptcha/);
assert.match(text.client, /captchaToken/);
assert.match(text.client, /function LegacyCaptcha/);
assert.match(text.client, /data\.captchaMode === "reCAPTCHA"/);
assert.match(text.client, /data-sitekey=\{data\.recaptchaPublicKey\}/);
assert.match(text.client, /https:\/\/www\.google\.com\/recaptcha\/api\.js/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const signupRow = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/users/classes/signup.class.php",
);
assert.ok(signupRow);
assert.match(signupRow.status ?? "", /reCAPTCHA runtime enforcement/);
assert.match(signupRow.verification ?? "", /verifyLegacySignupCaptcha/);
assert.match(signupRow.verification ?? "", /verify-legacy-signup-recaptcha-contract\.ts/);
assert.doesNotMatch(signupRow.status ?? "", /captcha\/OAuth remain/);
assert.doesNotMatch(signupRow.verification ?? "", /active reCAPTCHA\/PlayThru enforcement/);

const integrationRow = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/users/admin/page/integration.php",
);
assert.ok(integrationRow);
assert.match(integrationRow.status ?? "", /reCAPTCHA runtime enforcement restored/);
assert.match(integrationRow.verification ?? "", /siteverify/);

const settingsRow = matrix.find(
  (entry) =>
    entry.legacyPhp === "Front/templates/admin/users/admin/classes/settings.class.php",
);
assert.ok(settingsRow);
assert.match(settingsRow.verification ?? "", /signup reCAPTCHA runtime enforcement/);

const emailsRow = matrix.find(
  (entry) =>
    entry.legacyPhp === "Front/templates/admin/users/admin/page/emails-welcome.php",
);
assert.ok(emailsRow);
assert.match(emailsRow.status ?? "", /reCAPTCHA runtime restored/);

for (const legacyPath of [
  "Front/templates/admin/users/classes/signup.class.php",
  "Front/templates/admin/users/admin/page/integration.php",
]) {
  const markdownRow = text.matrixMd
    .split("\n")
    .find((line) => line.includes(`| ${legacyPath} |`));
  assert.match(markdownRow ?? "", /reCAPTCHA runtime/);
}

console.log("legacy signup recaptcha contract assertions passed");
