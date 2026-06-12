import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyNotifications:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/notifications.php",
  legacyMessagePortal:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/message_portal.php",
  migration: "src/scripts/migration/migrate-alarms.ts",
  actions: "src/lib/actions/notification-templates.ts",
  client:
    "src/app/(app)/settings/notifications/notification-settings-client.tsx",
  parentNotifications: "src/app/api/parent/notifications/[childId]/route.ts",
  topGaps: "docs/top-20-restoration-gaps.md",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyNotifications, /Notifications/);
for (const key of [
  "notifications-sms-enable",
  "notifications-email-enable",
  "notifications-whatsapp-enable",
]) {
  assert.match(contents.legacyNotifications, new RegExp(key));
}
assert.match(contents.legacyNotifications, /notifications-form/);

assert.match(contents.legacyMessagePortal, /\$naturesel = \$db->getNature\(\)/);
assert.match(contents.legacyMessagePortal, /<select class="form-control"\s+id="nature" name="nature">/);
assert.match(contents.legacyMessagePortal, /\$nature\['id'\]/);
assert.match(contents.legacyMessagePortal, /\$nature\['n_name'\]/);

assert.match(contents.migration, /SELECT \* FROM notifications_nature ORDER BY id/);
for (const column of [
  "n_name",
  "descr",
  "table1",
  "table2",
  "table3",
  "n_order",
  "active",
]) {
  assert.match(contents.migration, new RegExp(column));
}
assert.match(contents.migration, /isActive: toBool\(row\.active\)/);

assert.match(contents.actions, /export interface LegacyNotificationNatureRow/);
assert.match(contents.actions, /export async function getLegacyNotificationNatures/);
assert.match(contents.actions, /export async function updateLegacyNotificationNatureStatus/);
assert.match(contents.actions, /requireOrgSafe\(\)/);
assert.match(contents.actions, /db\.legacyNotificationNature\.findUnique/);
assert.match(contents.actions, /Legacy notification nature not found/);
assert.match(contents.actions, /db\.legacyNotificationNature\.update/);
assert.match(contents.actions, /isActive,/);
assert.match(contents.actions, /active: isActive \? 1 : 0/);
assert.match(contents.actions, /updated_from: "modern_legacy_notification_natures"/);
assert.match(contents.actions, /revalidatePath\("\/settings\/notifications"\)/);

assert.match(contents.client, /Legacy Notification Natures/);
assert.match(contents.client, /const \[legacyNatures, setLegacyNatures\] = useState\(natures\)/);
assert.match(contents.client, /updateLegacyNotificationNatureStatus/);
assert.match(contents.client, /function handleNatureToggle/);
assert.match(contents.client, /setLegacyNatures\(\(prev\) =>/);
assert.match(contents.client, /Legacy notification nature updated\./);
assert.match(contents.client, /Legacy notification nature update failed\./);
assert.match(contents.client, /checked=\{nature\.isActive\}/);
assert.match(contents.client, /onCheckedChange=\{\(checked\) =>/);
assert.match(contents.client, /handleNatureToggle\(nature, checked\)/);

assert.match(contents.parentNotifications, /loadNotificationNatures/);
assert.match(contents.parentNotifications, /isActive: true/);
assert.match(contents.parentNotifications, /item\.isActive/);
assert.match(contents.parentNotifications, /loadNatureDetails\(item, child, parentUser\)/);

assert.match(
  contents.matrix,
  /Front\/templates\/admin\/users\/admin\/page\/notifications\.php[\s\S]*restored - legacy notification settings, natures, active-state editing, send logs, and delivery audits restored/,
);
assert.match(contents.matrix, /verify-legacy-notification-nature-admin-contract\.ts/);
assert.doesNotMatch(
  contents.matrix,
  /notifications\.php[\s\S]*custom notification send\/edit workflows still need audit/,
);
assert.doesNotMatch(
  contents.topGaps,
  /Remaining work is parent\/custom notification families and production external provider send-job parity/,
);
assert.match(
  contents.topGaps,
  /Parent\/custom notification family restoration is now covered across birthday, assessment, medical, medicine, insurance, vaccination, payment, general\/closure, request, other, event, message, and `notifications_nature` admin\/runtime surfaces/,
);
assert.match(
  contents.topGaps,
  /Remaining acceptance is production external provider send-job execution plus canonical `notifications_nature` acceptance after production import/,
);

assert.match(
  contents.matrixMd,
  /Front\/templates\/admin\/users\/admin\/page\/notifications\.php \|  \| \/settings\/notifications \| restored - legacy notification settings, natures, active-state editing, send logs, and delivery audits restored/,
);

console.log("legacy notification nature admin contract assertions passed");
