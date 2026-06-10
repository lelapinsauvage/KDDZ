import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsPayments.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsPayments.js",
  bridge: "src/app/(app)/alarmsPayments.php/page.tsx",
  page: "src/app/(app)/alarms/payments/page.tsx",
  client: "src/app/(app)/alarms/payments/payment-alarms-client.tsx",
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

assert.match(text.legacyPhp, /<title>Payments Alarms Management<\/title>/);
assert.match(text.legacyPhp, /Notifications Listing/);
assert.match(text.legacyPhp, /Alarm details/);
assert.match(text.legacyPhp, />\s*To\s*</);
assert.match(text.legacyPhp, /Alarm Time/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyJs, /getAlarmsPayments/);
assert.match(text.legacyJs, /\{"data": "To"\}/);
assert.match(text.legacyJs, /setNotificationsAsSeen/);
assert.match(text.legacyJs, /upAlarmStatus/);

assert.match(text.bridge, /redirect\("\/alarms\/payments"\)/);
assert.match(text.page, /getAlarms\(\{ type: "PAYMENT", pageSize: "all" \}\)/);
assert.match(text.page, /getOverduePayments\(\)/);
assert.match(text.page, /getPaymentAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getPaymentAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.client, /title="Payment Alarms"/);
assert.match(text.client, /Dashboard/);
assert.match(text.client, /Notifications/);
assert.match(text.client, /Total Overdue/);
assert.match(text.client, /Overdue Payments/);
assert.match(text.client, /Children with Overdue/);
assert.match(text.client, /All Branches/);
assert.match(text.client, /Generate/);
assert.match(text.client, /No payment alarms found/);
assert.match(text.client, /family="payment"/);

for (const sharedSurface of [
  'title: "Payments Notifications Listing"',
  'description: "Payment reminders sent to parents"',
  'historyTitle: "Sent Payment Alarms"',
  'searchPlaceholder: "Search payment alarms..."',
  'historyPlaceholder: "Search sent payment alarms..."',
  'emptyTitle: "No payment notifications"',
  "Payment reminders matching the current filters will appear here.",
  'generationFailure: "Payment generation failed."',
  'listingLabel: "Recipients"',
  "Set All As Viewed",
  "Generate",
  'label: "Mark as Viewed"',
  ">Alarm Details</SortableHeader>",
  ">Alarm Time</SortableHeader>",
  'header: "Status"',
  'header: "Branch"',
  'header: "Actions"',
  'header: "Type"',
  'header: "To"',
  'header: "Seen"',
]) {
  assert.ok(
    text.receiptClient.includes(sharedSurface),
    `Missing shared payment notification surface: ${sharedSurface}`,
  );
}

assert.match(text.actions, /export async function getPaymentAlarmNotifications/);
assert.match(text.actions, /export async function getPaymentAlarmHistory/);
assert.match(text.actions, /export async function generatePaymentAlarms/);
assert.match(text.actions, /export async function markPaymentAlarmViewed/);
assert.match(text.actions, /export async function markAllPaymentAlarmsViewed/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsPayments.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsPayments.php, /alarms/payments");
assert.equal(
  row.status,
  "partial - legacy payment alarms bridge, generators, receipt read-state, sent history, generated receipts, message-portal parent delivery, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsPayments\.php` redirects to `\/alarms\/payments`/);
assert.match(row.verification ?? "", /Payment Alarms/);
assert.match(row.verification ?? "", /Dashboard and Notifications tabs/);
assert.match(row.verification ?? "", /Sent Payment Alarms/);
assert.match(row.verification ?? "", /no broken images or app errors/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsPayments.php |"));
assert.match(markdownRow ?? "", /browser visual audit restored/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsPayments\.php`/);
assert.match(markdownRow ?? "", /final sent-state semantics/);

assert.match(
  text.topGaps,
  /Payment alarms browser smoke now confirms the legacy `\/alarmsPayments\.php` bridge/,
);

console.log("legacy payment alarms visual contract assertions passed");
