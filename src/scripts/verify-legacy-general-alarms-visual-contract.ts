import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyAlarmsPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarms.php",
  legacyAlarmsJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarms.js",
  alarmsBridge: "src/app/(app)/alarms.php/page.tsx",
  alarmsPage: "src/app/(app)/alarms/page.tsx",
  alarmsPageClient: "src/app/(app)/alarms/alarms-page-client.tsx",
  staffReceiptClient:
    "src/app/(app)/alarms/_components/staff-receipt-alarms-client.tsx",
  alarmsActions: "src/lib/actions/alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyAlarmsPhp, /protect\("\*"\)/);
assert.match(text.legacyAlarmsPhp, /<title>Alarms Management<\/title>/);
assert.match(text.legacyAlarmsPhp, /Notifications Listing/);
assert.match(text.legacyAlarmsPhp, /Teachers/);
assert.match(text.legacyAlarmsPhp, /Sent Alarms/);
assert.match(text.legacyAlarmsJs, /Set All As Viewed|setallviewed|viewed/i);

assert.match(text.alarmsBridge, /redirect\("\/alarms"\)/);
assert.match(text.alarmsPage, /getActionableAlarms\(\)/);
assert.match(text.alarmsPage, /getGeneralAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.alarmsPage, /getGeneralAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.alarmsPageClient, /<TabsTrigger value="dashboard">Dashboard<\/TabsTrigger>/);
assert.match(
  text.alarmsPageClient,
  /<TabsTrigger value="general">General Notifications<\/TabsTrigger>/,
);
assert.match(text.alarmsPageClient, /family="general"/);
assert.match(text.alarmsPageClient, /showGenerate=\{false\}/);

for (const expectedSurface of [
  'title: "Notifications Listing"',
  'description: "General notifications sent to staff and parents"',
  'historyTitle: "Sent Alarms"',
  'searchPlaceholder: "Search general alarms..."',
  'historyPlaceholder: "Search sent alarms..."',
  'emptyTitle: "No general notifications"',
  'emptyDescription:',
  'generationFailure: "General alarm generation is not available."',
  '<SelectItem value="ALL">All Status</SelectItem>',
  '<SelectItem value="New">New ({unreadCount})</SelectItem>',
  '<SelectItem value="Viewed">Viewed</SelectItem>',
  '<SelectItem value="ALL">All Branches</SelectItem>',
  'aria-label="Alarm date from"',
  'aria-label="Alarm date to"',
  "Set All As Viewed",
  'label: "Mark as Viewed"',
  'header: "Status"',
  'header: "Branch"',
  'header: "Type"',
  'header: "To"',
  'header: "Seen"',
]) {
  assert.ok(
    text.staffReceiptClient.includes(expectedSurface),
    `Missing general alarms surface: ${expectedSurface}`,
  );
}

assert.match(text.alarmsActions, /const GENERAL_RECEIPT_SOURCE = "custom_notifications"/);
assert.match(
  text.alarmsActions,
  /const GENERAL_PARENT_RECEIPT_SOURCE = "custom_notifications_parents"/,
);
assert.match(text.alarmsActions, /export async function getGeneralAlarmNotifications/);
assert.match(text.alarmsActions, /export async function getGeneralAlarmHistory/);
assert.match(text.alarmsActions, /export async function markGeneralAlarmViewed/);
assert.match(text.alarmsActions, /export async function markAllGeneralAlarmsViewed/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarms.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarms.php, /alarms");
assert.equal(
  row.status,
  "partial - legacy general alarms bridge, read-state, sent history, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarms\.php` redirects to `\/alarms`/);
assert.match(row.verification ?? "", /General Notifications/);
assert.match(row.verification ?? "", /Sent Alarms/);
assert.match(row.verification ?? "", /no broken images or browser errors/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarms.php |"));
assert.match(
  markdownRow ?? "",
  /partial - legacy general alarms bridge, read-state, sent history, and browser visual audit restored/,
);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarms\.php` redirects to `\/alarms`/);
assert.match(markdownRow ?? "", /Remaining work is exact legacy `t_alarms\.status` semantics/);
assert.doesNotMatch(markdownRow ?? "", /final visual audit/);

assert.match(
  text.topGaps,
  /General alarms browser smoke now confirms the restored `\/alarms\.php` bridge/,
);

console.log("legacy general alarms visual contract assertions passed");
