import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsMedicine.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsMedicine.js",
  bridge: "src/app/(app)/alarmsMedicine.php/page.tsx",
  page: "src/app/(app)/alarms/medicine/page.tsx",
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

assert.match(text.legacyPhp, /<title>Medicine Alarms Management<\/title>/);
assert.match(text.legacyPhp, /Medicine Alarms Listing/);
assert.match(text.legacyPhp, /Set All As Viewed/);
assert.match(text.legacyPhp, /Teachers/);
assert.match(text.legacyPhp, /Parents/);
assert.match(text.legacyPhp, /Sent Medicine Alarms/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history_parents"/);
assert.match(text.legacyJs, /getAlarmsMedicine/);
assert.match(text.legacyJs, /getAlarmsMedicineHistory/);
assert.match(text.legacyJs, /getAlarmsMedicineHistoryParents/);
assert.match(text.legacyJs, /setNotificationsAsSeenMedicine/);
assert.match(text.legacyJs, /upAlarmStatusMedicine/);

assert.match(text.bridge, /redirect\("\/alarms\/medicine"\)/);
assert.match(text.page, /getMedicineAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getMedicineAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /family="medicine"/);

for (const sharedSurface of [
  'title: "Medicine Alarms Listing"',
  'description: "Medication-time reminders sent to staff"',
  'historyTitle: "Sent Medicine Alarms"',
  'searchPlaceholder: "Search medicine alarms..."',
  'historyPlaceholder: "Search sent alarms..."',
  'emptyTitle: "No medicine notifications"',
  "Medication reminders matching the current filters will appear here.",
  'generationFailure: "Medicine generation failed."',
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
    `Missing shared medicine notification surface: ${sharedSurface}`,
  );
}

assert.match(text.actions, /export async function getMedicineAlarmNotifications/);
assert.match(text.actions, /export async function getMedicineAlarmHistory/);
assert.match(text.actions, /export async function generateMedicineAlarms/);
assert.match(text.actions, /export async function markMedicineAlarmViewed/);
assert.match(text.actions, /export async function markAllMedicineAlarmsViewed/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsMedicine.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsMedicine.php, /alarms/medicine");
assert.equal(
  row.status,
  "partial - legacy medicine alarms bridge, staff/parent read-state, sent history, class targeting, message-portal parent delivery, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsMedicine\.php` redirects to `\/alarms\/medicine`/);
assert.match(row.verification ?? "", /Medicine Alarms Listing/);
assert.match(row.verification ?? "", /Sent Medicine Alarms/);
assert.match(row.verification ?? "", /no broken images or app errors/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsMedicine.php |"));
assert.match(markdownRow ?? "", /browser visual audit restored/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsMedicine\.php`/);
assert.doesNotMatch(markdownRow ?? "", /final visual audit/);

assert.match(
  text.topGaps,
  /Medicine alarms browser smoke now confirms the legacy `\/alarmsMedicine\.php` bridge/,
);

console.log("legacy medicine alarms visual contract assertions passed");
