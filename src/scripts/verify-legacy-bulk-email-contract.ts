import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyClass:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/send_email.class.php",
  legacyPage:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/send-email.php",
  actions: "src/lib/actions/notification-templates.ts",
  delivery: "src/lib/email-delivery.ts",
  client:
    "src/app/(app)/settings/notifications/notification-settings-client.tsx",
  settingsPage: "src/app/(app)/settings/notifications/page.tsx",
  bridge: "src/app/(app)/users/admin/page/send-email.php/page.tsx",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyClass, /class Send_email extends Generic/);
assert.match(contents.legacyClass, /function sendMail\(/);
assert.match(contents.legacyClass, /empty\(\$_POST\['to-levels'\]/);
assert.match(contents.legacyClass, /Please select a user group/);
assert.match(contents.legacyClass, /login_users` WHERE `user_level` LIKE :level_id/);
assert.match(contents.legacyClass, /array_unique\(\$emails\)/);
assert.match(contents.legacyClass, /parent::sendEmail\(\$emails, \$_POST\['subject'\], \$_POST\['message'\], '', true\)/);
assert.match(contents.legacyClass, /function displayLevels\(/);
assert.match(contents.legacyClass, /SELECT level_name, id FROM login_levels/);
assert.match(contents.legacyClass, /name="to-levels\[\]"/);
assert.match(contents.legacyPage, /send_email\.class\.php/);
assert.match(contents.legacyPage, /\$sendEmail->displayLevels\(\)/);
assert.match(contents.legacyPage, /name="subject"/);
assert.match(contents.legacyPage, /name="message"/);

assert.match(contents.bridge, /redirect\("\/settings\/notifications\?tab=bulk"\)/);
assert.match(contents.settingsPage, /getLegacyEmailLevels\(\)/);
assert.match(contents.settingsPage, /initialLegacyEmailLevels=/);
assert.match(contents.client, /function BulkEmailTab/);
assert.match(contents.client, /initialLevels\.map/);
assert.match(contents.client, /disabled=\{level\.isDisabled \|\| isPending\}/);
assert.match(contents.client, /setSelectedLevels\(activeLevels\.map\(\(level\) => level\.id\)\)/);
assert.match(contents.client, /sendLegacyBulkEmail\(\{/);
assert.match(contents.client, /externalEmailStatus\(result\.data\.emailDelivery\)/);

assert.match(contents.actions, /export async function getLegacyEmailLevels/);
assert.match(contents.actions, /recordType: \{ in: \["login_level", "manager_login_level"\] \}/);
assert.match(contents.actions, /orderBy: \[[\s\S]*sourceDatabase[\s\S]*legacyTable[\s\S]*legacyId/);
assert.match(contents.actions, /export async function sendLegacyBulkEmail/);
assert.match(contents.actions, /Array\.from\(new Set\(params\.levelIds\.filter\(Boolean\)\)\)/);
assert.match(contents.actions, /Please select a user group/);
assert.match(contents.actions, /Subject is required/);
assert.match(contents.actions, /Message is required/);
assert.match(contents.actions, /OR: \[\{ isDisabled: false \}, \{ isDisabled: null \}\]/);
assert.match(contents.actions, /parsePhpLevelIds\(row\.recordValue\)/);
assert.match(contents.actions, /recordType: "login_user"/);
assert.match(contents.actions, /recordType: "manager_login_user"/);
assert.match(contents.actions, /regularLevelKeys\.has\(`\$\{row\.sourceDatabase\}:\$\{levelId\}`\)/);
assert.match(contents.actions, /managerLevelKeys\.has\(`\$\{row\.sourceDatabase\}:\$\{levelId\}`\)/);
assert.match(contents.actions, /matchedEmails\.add\(row\.email\.toLowerCase\(\)\)/);
assert.match(contents.actions, /rolesForLegacyLevel/);
assert.match(contents.actions, /createInAppNotifications\(\{/);
assert.match(contents.actions, /type: "BULK_EMAIL"/);
assert.match(contents.actions, /category: "BULK_EMAIL"/);
assert.match(contents.actions, /mode: "bcc"/);
assert.match(contents.actions, /source: "legacy_bulk_email"/);
assert.match(contents.actions, /skippedNoModernUser/);

assert.match(contents.delivery, /provider: "disabled" \| "resend" \| "webhook"/);
assert.match(contents.delivery, /mode: "individual" \| "bcc"/);
assert.match(contents.delivery, /EMAIL_DELIVERY_WEBHOOK_URL/);
assert.match(contents.delivery, /RESEND_API_KEY/);
assert.match(contents.delivery, /EMAIL_FROM/);
assert.match(contents.delivery, /skippedCount/);
assert.match(contents.delivery, /deliverWithWebhook/);
assert.match(contents.delivery, /deliverWithResend/);

assert.match(
  contents.matrix,
  /send_email\.class\.php[\s\S]*restored - legacy bulk level targeting, BCC delivery, provider audit, and full level loading restored/,
);
assert.match(
  contents.matrix,
  /send-email\.php[\s\S]*restored - legacy level-targeted bulk send form, BCC provider delivery, bridge, and full level loading restored/,
);
assert.match(contents.matrix, /verify-legacy-bulk-email-contract\.ts/);
assert.doesNotMatch(
  contents.matrix,
  /send_email\.class\.php[\s\S]*remaining work is production SMTP/,
);
assert.doesNotMatch(
  contents.matrix,
  /send-email\.php[\s\S]*remaining work is production credential rollout/,
);

assert.match(
  contents.matrixMd,
  /Front\/templates\/admin\/users\/admin\/classes\/send_email\.class\.php \|  \| \/settings\/notifications \| restored - legacy bulk level targeting, BCC delivery, provider audit, and full level loading restored/,
);
assert.match(
  contents.matrixMd,
  /Front\/templates\/admin\/users\/admin\/page\/send-email\.php \|  \| \/users\/admin\/page\/send-email\.php, \/settings\/notifications\?tab=bulk \| restored - legacy level-targeted bulk send form, BCC provider delivery, bridge, and full level loading restored/,
);

console.log("legacy bulk email contract assertions passed");
