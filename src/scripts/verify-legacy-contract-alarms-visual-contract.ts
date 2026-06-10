import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsContracts.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsContracts.js",
  bridge: "src/app/(app)/alarmsContracts.php/page.tsx",
  page: "src/app/(app)/alarms/contracts/page.tsx",
  receiptClient:
    "src/app/(app)/alarms/_components/staff-receipt-alarms-client.tsx",
  actions: "src/lib/actions/alarms.ts",
  contractJob: "src/lib/jobs/contract-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /<title>Contracts Alarms Management<\/title>/);
assert.match(text.legacyPhp, /Contracts Notifications Listing/);
assert.match(text.legacyPhp, /Set All As Viewed/);
assert.match(text.legacyPhp, /Sent Contracts Reminders/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history"/);
assert.match(text.legacyJs, /getAlarmsContracts/);
assert.match(text.legacyJs, /getAlarmsContractsHistory/);
assert.match(text.legacyJs, /setNotificationsAsSeenAssessment/);
assert.match(text.legacyJs, /upAlarmStatusAssessment/);

assert.match(text.bridge, /redirect\("\/alarms\/contracts"\)/);
assert.match(text.page, /getContractAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getContractAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /family="contract"/);

for (const sharedSurface of [
  'title: "Contracts Notifications Listing"',
  'description: "Staff document and contract expiry reminders"',
  'historyTitle: "Sent Contracts Reminders"',
  'searchPlaceholder: "Search contract alarms..."',
  'historyPlaceholder: "Search sent contract reminders..."',
  'emptyTitle: "No contract notifications"',
  "Staff contract and document reminders matching the current filters will appear here.",
  'generationFailure: "Contract generation failed."',
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
    `Missing shared contract notification surface: ${sharedSurface}`,
  );
}

assert.match(text.actions, /export async function getContractAlarmNotifications/);
assert.match(text.actions, /export async function getContractAlarmHistory/);
assert.match(text.actions, /export async function generateContractAlarms/);
assert.match(text.actions, /export async function markContractAlarmViewed/);
assert.match(text.actions, /export async function markAllContractAlarmsViewed/);
assert.match(text.contractJob, /deliverPushNotification/);
assert.match(text.contractJob, /pushDeliveryAuditData/);
assert.match(text.contractJob, /pushDelivery/);
assert.match(text.contractJob, /recipientUserIds: params\.recipientUserIds/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsContracts.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsContracts.php, /alarms/contracts");
assert.equal(
  row.status,
  "partial - legacy contract alarms bridge, staff read-state, sent history, targeting, date fidelity, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsContracts\.php` redirects to `\/alarms\/contracts`/);
assert.match(row.verification ?? "", /Contracts Notifications Listing/);
assert.match(row.verification ?? "", /Sent Contracts Reminders/);
assert.match(row.verification ?? "", /no broken images or app errors/);
assert.match(row.verification ?? "", /provider-neutral staff push delivery/);
assert.match(row.verification ?? "", /pushDelivery/);
assert.match(row.verification ?? "", /verify-contract-push-delivery\.ts/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsContracts.php |"));
assert.match(markdownRow ?? "", /browser visual audit restored/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsContracts\.php`/);
assert.match(markdownRow ?? "", /provider-neutral staff push delivery/);

assert.match(
  text.topGaps,
  /Contract alarms now audit provider-neutral staff push delivery on generated staff document-expiry reminders/,
);

console.log("legacy contract alarms visual contract assertions passed");
