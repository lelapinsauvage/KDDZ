import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsInsurance.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsInsurance.js",
  bridge: "src/app/(app)/alarmsInsurance.php/page.tsx",
  page: "src/app/(app)/alarms/insurance/page.tsx",
  receiptClient:
    "src/app/(app)/alarms/_components/staff-receipt-alarms-client.tsx",
  actions: "src/lib/actions/alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /<title>Insurance Alarms Management<\/title>/);
assert.match(text.legacyPhp, /This Page Shows Alerts Sent Concerning Expiring Child Insurance/);
assert.match(text.legacyPhp, /Insurance Notifications Listing/);
assert.match(text.legacyPhp, /Set All As Viewed/);
assert.match(text.legacyPhp, /Teachers/);
assert.match(text.legacyPhp, /Parents/);
assert.match(text.legacyPhp, /Sent Insurance Reminders/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history_parents"/);
assert.match(text.legacyJs, /getAlarmsInsurance/);
assert.match(text.legacyJs, /getAlarmsInsuranceHistory/);
assert.match(text.legacyJs, /getAlarmsInsuranceHistoryParents/);
assert.match(text.legacyJs, /setNotificationsAsSeenMedical/);
assert.match(text.legacyJs, /upAlarmStatusMedical/);

assert.match(text.bridge, /redirect\("\/alarms\/insurance"\)/);
assert.match(text.page, /getInsuranceAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getInsuranceAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /family="insurance"/);

for (const sharedSurface of [
  'title: "Insurance Notifications Listing"',
  'description: "Alerts sent concerning expiring child insurance"',
  'historyTitle: "Sent Insurance Reminders"',
  'searchPlaceholder: "Search insurance alarms..."',
  'historyPlaceholder: "Search sent reminders..."',
  'emptyTitle: "No insurance notifications"',
  "Expiring child insurance reminders matching the current filters will appear here.",
  'generationFailure: "Insurance generation failed."',
  "Set All As Viewed",
  "Generate",
  'label: "Mark as Viewed"',
  'header: "Status"',
  'header: "Branch"',
  'header: "Type"',
  'header: "To"',
  'header: "Seen"',
]) {
  assert.ok(
    text.receiptClient.includes(sharedSurface),
    `Missing shared insurance notification surface: ${sharedSurface}`,
  );
}

assert.match(text.actions, /export async function getInsuranceAlarmNotifications/);
assert.match(text.actions, /export async function getInsuranceAlarmHistory/);
assert.match(text.actions, /export async function generateInsuranceAlarms/);
assert.match(text.actions, /export async function markInsuranceAlarmViewed/);
assert.match(text.actions, /export async function markAllInsuranceAlarmsViewed/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsInsurance.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsInsurance.php, /alarms/insurance");
assert.equal(
  row.status,
  "partial - legacy insurance alarms bridge, staff/parent read-state, sent history, class targeting, message-portal parent delivery, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsInsurance\.php` redirects to `\/alarms\/insurance`/);
assert.match(row.verification ?? "", /Insurance Notifications Listing/);
assert.match(row.verification ?? "", /Sent Insurance Reminders/);
assert.match(row.verification ?? "", /no broken images or app errors/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsInsurance.php |"));
assert.match(markdownRow ?? "", /browser visual audit restored/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsInsurance\.php`/);
assert.doesNotMatch(markdownRow ?? "", /final visual audit/);

assert.match(
  text.topGaps,
  /Insurance alarms browser smoke now confirms the legacy `\/alarmsInsurance\.php` bridge/,
);

console.log("legacy insurance alarms visual contract assertions passed");
