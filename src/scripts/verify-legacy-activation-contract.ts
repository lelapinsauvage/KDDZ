import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/activate.php",
  activationPage: "src/components/auth/legacy-activation-page.tsx",
  activateRoute: "src/app/(auth)/activate.php/page.tsx",
  usersActivateRoute: "src/app/(auth)/users/activate.php/page.tsx",
  publicPaths: "src/lib/auth-public-paths.ts",
  templates: "src/lib/actions/notification-templates.ts",
  notificationsClient:
    "src/app/(app)/settings/notifications/notification-settings-client.tsx",
  signup: "src/lib/actions/legacy-signup.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacy, /class Activate extends Generic/);
assert.match(contents.legacy, /isset\(\$_GET\['key'\]\)/);
assert.match(contents.legacy, /isset\(\$_GET\['resend'\]\) && \$_GET\['resend'\] == '1'/);
assert.match(contents.legacy, /function getKey\(/);
assert.match(contents.legacy, /login_confirm`.`key`\s*=\s*:key/);
assert.match(contents.legacy, /type`\s*=\s*'new_user'/);
assert.match(contents.legacy, /Your activation link is incorrect\./);
assert.match(contents.legacy, /Your account has been activated!/);
assert.match(contents.legacy, /email-activate-msg/);
assert.match(contents.legacy, /email-activate-subj/);
assert.match(contents.legacy, /function resendKey\(/);
assert.match(contents.legacy, /email-activate-resend-subj/);
assert.match(contents.legacy, /email-activate-resend-msg/);
assert.match(contents.legacy, /Activation link resent to email\./);
assert.match(contents.legacy, /function signedIn\(/);
assert.match(contents.legacy, /Your account has already been activated\./);
assert.match(contents.legacy, /You have not activated your account yet\./);

assert.match(contents.activateRoute, /<LegacyActivationPage searchParams=\{searchParams\}/);
assert.match(contents.usersActivateRoute, /<LegacyActivationPage searchParams=\{searchParams\}/);
assert.match(contents.publicPaths, /pathname === "\/activate\.php"/);
assert.match(contents.publicPaths, /pathname === "\/users\/activate\.php"/);

assert.match(contents.activationPage, /type ActivationStatus =/);
for (const status of [
  "activated",
  "incorrect",
  "already",
  "pending",
  "resend-missing",
  "resend-sent",
  "resend-unconfigured",
  "resend-failed",
]) {
  assert.match(contents.activationPage, new RegExp(`"${status}"`));
}
assert.match(contents.activationPage, /legacyTable: \{ in: \["login_confirm", "login_confirm_man"\] \}/);
assert.match(contents.activationPage, /recordType: "new_user"/);
assert.match(contents.activationPage, /recordKey: token/);
assert.match(contents.activationPage, /emailVerified: new Date\(\)/);
assert.match(contents.activationPage, /isActive: true/);
assert.match(contents.activationPage, /recordType: "new_user_activated"/);
assert.match(contents.activationPage, /legacyTemplate\([\s\S]*"email-activate-subj"[\s\S]*"email-activate-msg"/);
assert.match(contents.activationPage, /legacyTemplate\([\s\S]*"email-activate-resend-subj"[\s\S]*"email-activate-resend-msg"/);
assert.match(contents.activationPage, /deliverEmail\(\{/);
assert.match(contents.activationPage, /category: "ACTIVATED"/);
assert.match(contents.activationPage, /source: "legacy_activation_success"/);
assert.match(contents.activationPage, /emailDeliveryAuditData\(emailDelivery\)/);
assert.match(contents.activationPage, /category: "ACTIVATION_RESEND"/);
assert.match(contents.activationPage, /source: "legacy_activation_resend"/);
assert.match(contents.activationPage, /resendEmail/);
assert.match(contents.activationPage, /Use your pending activation link directly/);
assert.match(contents.activationPage, /Activation email delivery is not configured yet\./);
assert.match(contents.activationPage, /Activation email delivery failed\./);
assert.match(contents.activationPage, /Your account has been activated!/);
assert.match(contents.activationPage, /Your activation link is incorrect\./);
assert.match(contents.activationPage, /Your account has already been activated\./);
assert.match(contents.activationPage, /You have not activated your account yet\./);
assert.match(contents.activationPage, /You do not have an activation key!/);

assert.match(contents.templates, /ACTIVATION_RESEND: \{[\s\S]*email-activate-resend-subj[\s\S]*email-activate-resend-msg/);
assert.match(contents.templates, /ACTIVATION_ACTIVATED: \{[\s\S]*email-activate-subj[\s\S]*email-activate-msg/);
assert.match(contents.notificationsClient, /ACTIVATION_RESEND: \{[\s\S]*label: "Resend link"/);
assert.match(contents.notificationsClient, /ACTIVATION_ACTIVATED: \{[\s\S]*label: "Activated"/);
assert.match(contents.notificationsClient, /\{\{activate\}\}/);
assert.match(contents.signup, /legacyTable: "login_confirm"/);
assert.match(contents.signup, /legacyKey: `\$\{sourceDatabase\}:login_confirm:new_user:\$\{key\}`/);
assert.match(contents.signup, /recordType: "new_user"/);
assert.match(contents.signup, /category: requireActivation \? "ACTIVATION_RESEND" : "WELCOME"/);
assert.match(contents.signup, /emailDeliveryAuditData\(welcomeDelivery\)/);

assert.match(
  contents.matrix,
  /users\/activate\.php[\s\S]*restored - legacy activation token flow, resend, template delivery, and provider audit restored/,
);
assert.match(
  contents.matrix,
  /emails-activate\.php[\s\S]*restored - legacy activation email templates, shortcodes, resend, and provider audit restored/,
);
assert.match(contents.matrix, /verify-legacy-activation-contract\.ts/);
assert.doesNotMatch(
  contents.matrix,
  /users\/activate\.php[\s\S]*Remaining work is production email credential rollout/,
);
assert.doesNotMatch(
  contents.matrix,
  /emails-activate\.php[\s\S]*credential rollout remains/,
);

assert.match(
  contents.matrixMd,
  /Front\/templates\/admin\/users\/activate\.php \|  \| \/activate\.php, \/users\/activate\.php \| restored - legacy activation token flow, resend, template delivery, and provider audit restored/,
);
assert.match(
  contents.matrixMd,
  /Front\/templates\/admin\/users\/admin\/page\/emails-activate\.php \|  \| \/settings\/notifications \| restored - legacy activation email templates, shortcodes, resend, and provider audit restored/,
);

console.log("legacy activation contract assertions passed");
