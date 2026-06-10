import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsBirthday.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsBirthday.js",
  bridge: "src/app/(app)/alarmsBirthday.php/page.tsx",
  page: "src/app/(app)/alarms/birthdays/page.tsx",
  receiptClient:
    "src/app/(app)/alarms/_components/staff-receipt-alarms-client.tsx",
  actions: "src/lib/actions/alarms.ts",
  birthdayJob: "src/lib/jobs/birthday-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /<title>Birthday Alarms Management<\/title>/);
assert.match(text.legacyPhp, /Birthdays Notifications Listing/);
assert.match(text.legacyPhp, /Set All As Viewed/);
assert.match(text.legacyPhp, /Sent Birthday Alarms/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history_parent"/);
assert.match(text.legacyJs, /getAlarmsBirthday/);
assert.match(text.legacyJs, /getAlarmsBirthdayHistory/);
assert.match(text.legacyJs, /getAlarmsBirthdayParentsHistory/);
assert.match(text.legacyJs, /setNotificationsAsSeenBirthday/);
assert.match(text.legacyJs, /upAlarmStatusBirthday/);

assert.match(text.bridge, /redirect\("\/alarms\/birthdays"\)/);
assert.match(text.page, /getBirthdayAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getBirthdayAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /family="birthday"/);

for (const sharedSurface of [
  'title: "Birthdays Notifications Listing"',
  'description: "Birthday reminders sent to staff"',
  'historyTitle: "Sent Birthday Alarms"',
  'searchPlaceholder: "Search birthday alarms..."',
  'historyPlaceholder: "Search sent birthday alarms..."',
  'emptyTitle: "No birthday notifications"',
  'emptyDescription:',
  'generationFailure: "Birthday generation failed."',
  "Set All As Viewed",
  'label: "Mark as Viewed"',
  'header: "Status"',
  'header: "Branch"',
  'header: "Type"',
  'header: "To"',
  'header: "Seen"',
]) {
  assert.ok(
    text.receiptClient.includes(sharedSurface),
    `Missing shared birthday notification surface: ${sharedSurface}`,
  );
}

assert.match(text.actions, /export async function getBirthdayAlarmNotifications/);
assert.match(text.actions, /export async function getBirthdayAlarmHistory/);
assert.match(text.actions, /export async function generateBirthdayAlarms/);
assert.match(text.actions, /export async function markBirthdayAlarmViewed/);
assert.match(text.actions, /export async function markAllBirthdayAlarmsViewed/);
assert.match(text.birthdayJob, /deliverPushNotification/);
assert.match(text.birthdayJob, /pushDeliveryAuditData/);
assert.match(text.birthdayJob, /pushDelivery/);
assert.match(text.birthdayJob, /recipientUserIds: params\.recipientUserIds/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsBirthday.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsBirthday.php, /alarms/birthdays");
assert.equal(
  row.status,
  "partial - legacy birthday alarms bridge, staff/parent read-state, sent history, class targeting, parent message delivery, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsBirthday\.php` redirects to `\/alarms\/birthdays`/);
assert.match(row.verification ?? "", /Birthdays Notifications Listing/);
assert.match(row.verification ?? "", /Sent Birthday Alarms/);
assert.match(row.verification ?? "", /no broken images or app errors/);
assert.match(row.verification ?? "", /provider-neutral staff push delivery/);
assert.match(row.verification ?? "", /pushDelivery/);
assert.match(row.verification ?? "", /verify-birthday-push-delivery\.ts/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsBirthday.php |"));
assert.match(markdownRow ?? "", /browser visual audit restored/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsBirthday\.php`/);
assert.match(markdownRow ?? "", /provider-neutral staff push delivery/);
assert.doesNotMatch(markdownRow ?? "", /final visual audit/);

assert.match(
  text.topGaps,
  /Birthday alarms now audit provider-neutral staff push delivery on generated birthday reminders/,
);

console.log("legacy birthday alarms visual contract assertions passed");
