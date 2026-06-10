import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  disabledPage: "src/components/auth/legacy-disabled-page.tsx",
  action: "src/lib/actions/legacy-login.ts",
  disabledRoute: "src/app/(auth)/disabled.php/page.tsx",
  usersDisabledRoute: "src/app/(auth)/users/disabled.php/page.tsx",
  publicPaths: "src/lib/auth-public-paths.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.disabledRoute, /<LegacyDisabledPage/);
assert.match(contents.disabledRoute, /initialName=\{firstParam\(params\.name\) \?\? ""\}/);
assert.match(contents.disabledRoute, /initialEmail=\{firstParam\(params\.email\) \?\? ""\}/);
assert.match(contents.usersDisabledRoute, /<LegacyDisabledPage/);
assert.match(contents.usersDisabledRoute, /initialName=\{firstParam\(params\.name\) \?\? ""\}/);
assert.match(contents.usersDisabledRoute, /initialEmail=\{firstParam\(params\.email\) \?\? ""\}/);
assert.match(contents.publicPaths, /pathname === "\/disabled\.php"/);
assert.match(contents.publicPaths, /pathname === "\/users\/disabled\.php"/);

assert.match(contents.disabledPage, /Oops, Access Denied/);
assert.match(contents.disabledPage, /Sorry, your username or user group has been disabled!/);
assert.match(contents.disabledPage, /Fill out this form if you feel this is in error\./);
assert.match(contents.disabledPage, /value="User \/ Group Disabled"[\s\S]*Disabled Message/);
assert.match(contents.disabledPage, /value="a Bug fix"[\s\S]*Report a bug/);
assert.match(contents.disabledPage, /What colour is the sky\?/);
assert.match(contents.disabledPage, /Email Sent Successfully/);
assert.match(contents.disabledPage, /submitLegacyDisabledContact/);

assert.match(contents.action, /export async function submitLegacyDisabledContact/);
assert.match(contents.action, /You must enter your name\./);
assert.match(contents.action, /Please enter a valid email address\./);
assert.match(contents.action, /You have enter an invalid e-mail address, try again\./);
assert.match(contents.action, /Please enter a subject\./);
assert.match(contents.action, /Please enter your message\./);
assert.match(contents.action, /Please enter the verification code\./);
assert.match(contents.action, /The verification code you entered is incorrect\./);
assert.match(contents.action, /verify !== "blue"/);
assert.match(contents.action, /legacyTable:\s*"disabled_contact"/);
assert.match(contents.action, /recordType:\s*"disabled_contact"/);
assert.match(contents.action, /recordKey:\s*subject/);
assert.match(contents.action, /recordValue:\s*comments/);
assert.match(contents.action, /role:\s*"ADMIN"/);
assert.match(contents.action, /notification\.createMany/);
assert.match(contents.action, /category:\s*"DISABLED_CONTACT"/);
assert.match(contents.action, /deliverEmail\(\{/);
assert.match(contents.action, /mode:\s*"bcc"/);
assert.match(contents.action, /emailDeliveryAuditData\(emailDelivery\)/);
assert.match(contents.action, /revalidatePath\("\/disabled\.php"\)/);
assert.match(contents.action, /revalidatePath\("\/users\/disabled\.php"\)/);

assert.match(
  contents.matrix,
  /users\/disabled\.php[\s\S]*restored - legacy disabled notice and contact form restored/,
);
assert.match(
  contents.matrix,
  /users\/disabled\.php[\s\S]*recordType = disabled_contact/,
);
assert.match(
  contents.matrix,
  /users\/disabled\.php[\s\S]*provider-backed BCC admin email attempts/,
);

assert.match(
  contents.matrixMd,
  /Front\/templates\/admin\/users\/disabled\.php \|  \| \/disabled\.php, \/users\/disabled\.php \| restored - legacy disabled notice and contact form restored/,
);
assert.match(
  contents.matrixMd,
  /users\/disabled\.php[\s\S]*recordType = disabled_contact/,
);
assert.match(
  contents.matrixMd,
  /users\/disabled\.php[\s\S]*verify-legacy-disabled-contact-contract\.ts/,
);
assert.doesNotMatch(
  contents.matrixMd,
  /users\/disabled\.php[^\n]*admin delivery restored/,
);

console.log("legacy disabled contact contract assertions passed");
