import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacySignup:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/sign_up.php",
  modernSignupPage: "src/app/(auth)/signup/page.tsx",
  modernSignup: "src/app/(auth)/signup/signup-client.tsx",
  rootBridge: "src/app/(auth)/sign_up.php/page.tsx",
  usersBridge: "src/app/(auth)/users/sign_up.php/page.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

const legacyLabels = [
  "Full name",
  "Username",
  "Choose your username",
  "Email",
  "Password",
  "Create a password",
  "Password again",
  "Confirm your password",
  "Create my account",
];

for (const label of legacyLabels) {
  assert.match(text.legacySignup, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(text.modernSignup, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const legacyMarketingCopy = [
  "Create a new account",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Features",
  "Cras placerat scelerisque vehicula.",
];

for (const copy of legacyMarketingCopy) {
  assert.match(text.legacySignup, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(text.modernSignup, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(text.legacySignup, /id="sign-up-form"/);
assert.match(text.legacySignup, /\$signUp->profileSignUpFields\(\)/);
assert.match(text.legacySignup, /\$signUp->doCaptcha\(true\)/);
assert.match(text.modernSignup, /data\.profileFields/);
assert.match(text.modernSignupPage, /captchaMode/);
assert.match(text.rootBridge, /redirect\(`\/signup\$\{searchSuffix\(await searchParams\)\}`\)/);
assert.match(text.usersBridge, /redirect\(`\/signup\$\{searchSuffix\(await searchParams\)\}`\)/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/users/sign_up.php",
);
assert.ok(row);
assert.match(
  row.status ?? "",
  /restored - legacy signup page shell, (social signup prefill, )?side copy, fields, and bridges restored/,
);
assert.match(row.verification ?? "", /right-column legacy marketing copy/);
assert.match(row.verification ?? "", /verify-legacy-signup-shell-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /Remaining work is exact legacy marketing side-copy/);

const markdownRows = text.markdownMatrix
  .split("\n")
  .filter((line) =>
    line.includes("| Front/templates/admin/users/sign_up.php |"),
  );
assert.equal(markdownRows.length, 1);
assert.match(
  markdownRows[0],
  /restored - legacy signup page shell, (social signup prefill, )?side copy, fields, and bridges restored/,
);
assert.doesNotMatch(markdownRows[0], /Remaining work is exact legacy marketing side-copy/);

console.log("legacy signup shell contract assertions passed");
