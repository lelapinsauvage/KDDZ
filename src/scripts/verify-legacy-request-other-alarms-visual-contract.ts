import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  requestLegacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsRequests.php",
  requestLegacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsRequests.js",
  otherLegacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsOthers.php",
  otherLegacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsOthers.js",
  requestBridge: "src/app/(app)/alarmsRequests.php/page.tsx",
  otherBridge: "src/app/(app)/alarmsOthers.php/page.tsx",
  requestPage: "src/app/(app)/alarms/requests/page.tsx",
  otherPage: "src/app/(app)/alarms/others/page.tsx",
  requestClient: "src/app/(app)/alarms/requests/request-alarms-client.tsx",
  otherClient: "src/app/(app)/alarms/others/other-alarms-client.tsx",
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

assert.match(text.requestLegacyPhp, /<title>Requests Alarms<\/title>/);
assert.match(text.requestLegacyPhp, /Notifications Listing/);
assert.match(text.requestLegacyPhp, /Set All As Viewed/);
assert.match(text.requestLegacyPhp, /Teachers/);
assert.match(text.requestLegacyPhp, /Parents/);
assert.match(text.requestLegacyPhp, /Sent Alarms/);
assert.match(text.requestLegacyPhp, /id="datatable_ajax"/);
assert.match(text.requestLegacyPhp, /id="datatable_ajax_history"/);
assert.match(text.requestLegacyPhp, /id="datatable_ajax_history_parents"/);
assert.match(text.requestLegacyJs, /getAlarmsRequests/);
assert.match(text.requestLegacyJs, /getAlarmsRequestsHistory/);
assert.match(text.requestLegacyJs, /getAlarmsRequestsHistoryParents/);
assert.match(text.requestLegacyJs, /setNotificationsAsSeen/);
assert.match(text.requestLegacyJs, /upAlarmStatus/);

assert.match(text.otherLegacyPhp, /<title>Other Alarms<\/title>/);
assert.match(text.otherLegacyPhp, /Notifications Listing/);
assert.match(text.otherLegacyPhp, /Set All As Viewed/);
assert.match(text.otherLegacyPhp, /Teachers/);
assert.match(text.otherLegacyPhp, /Parents/);
assert.match(text.otherLegacyPhp, /Sent Alarms/);
assert.match(text.otherLegacyPhp, /id="datatable_ajax"/);
assert.match(text.otherLegacyPhp, /id="datatable_ajax_history"/);
assert.match(text.otherLegacyPhp, /id="datatable_ajax_history_parents"/);
assert.match(text.otherLegacyJs, /getAlarmsOthers/);
assert.match(text.otherLegacyJs, /getAlarmsOthersHistory/);
assert.match(text.otherLegacyJs, /getAlarmsOthersHistoryParents/);
assert.match(text.otherLegacyJs, /setNotificationsAsSeen/);
assert.match(text.otherLegacyJs, /upAlarmStatus/);

assert.match(text.requestBridge, /redirect\("\/alarms\/requests"\)/);
assert.match(text.otherBridge, /redirect\("\/alarms\/others"\)/);
assert.match(text.requestPage, /getAlarms\(\{ type: "REQUEST", pageSize: "all" \}\)/);
assert.match(text.requestPage, /getRequestAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.requestPage, /getRequestAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.otherPage, /getAlarms\(\{ type: "OTHER", pageSize: "all" \}\)/);
assert.match(text.otherPage, /getOtherAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.otherPage, /getOtherAlarmHistory\(\{ pageSize: "all" \}\)/);

for (const surface of [
  "Request Alarms",
  "Dashboard",
  "Notifications",
  "All Statuses",
  "Pending",
  "Resolved",
  "Search requests...",
  "No request alarms found.",
  "Request",
  "Date",
  "Status",
  "Branch",
  "Actions",
  'family="request"',
]) {
  assert.ok(text.requestClient.includes(surface), `Missing request dashboard surface: ${surface}`);
}

for (const surface of [
  "Other Alarms",
  "Dashboard",
  "Notifications",
  "All Branches",
  "Search alarms...",
  "No other alarms found.",
  "Description",
  "Due Date",
  "Status",
  "Branch",
  "Actions",
  'family="other"',
]) {
  assert.ok(text.otherClient.includes(surface), `Missing other dashboard surface: ${surface}`);
}

for (const sharedSurface of [
  'title: "Requests Notifications Listing"',
  'description: "Request alerts sent to staff and parents"',
  'historyTitle: "Sent Requests Alarms"',
  'searchPlaceholder: "Search request alarms..."',
  'historyPlaceholder: "Search sent request alarms..."',
  'emptyTitle: "No request notifications"',
  "Request reminders matching the current filters will appear here.",
  'generationFailure: "Request alarm generation is not available."',
  'title: "Others Notifications Listing"',
  'description: "Other alerts sent to staff and parents"',
  'historyTitle: "Sent Others Alarms"',
  'searchPlaceholder: "Search other alarms..."',
  'historyPlaceholder: "Search sent other alarms..."',
  'emptyTitle: "No other notifications"',
  "Other reminders matching the current filters will appear here.",
  'generationFailure: "Other alarm generation is not available."',
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
    `Missing shared request/other receipt surface: ${sharedSurface}`,
  );
}

for (const actionName of [
  "getRequestAlarmNotifications",
  "getRequestAlarmHistory",
  "markRequestAlarmViewed",
  "markAllRequestAlarmsViewed",
  "getOtherAlarmNotifications",
  "getOtherAlarmHistory",
  "markOtherAlarmViewed",
  "markAllOtherAlarmsViewed",
]) {
  assert.match(text.actions, new RegExp(`export async function ${actionName}`));
}

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];

const requestRow = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsRequests.php",
);
assert.ok(requestRow);
assert.equal(requestRow.modernRoute, "/alarmsRequests.php, /alarms/requests");
assert.equal(
  requestRow.status,
  "partial - legacy request alarms bridge, staff/parent read-state, sent history, message-portal parent delivery, and browser visual audit restored",
);
assert.match(requestRow.verification ?? "", /Browser smoke confirmed `\/alarmsRequests\.php` redirects to `\/alarms\/requests`/);
assert.match(requestRow.verification ?? "", /Dashboard and Notifications tabs/);
assert.match(requestRow.verification ?? "", /Sent Requests Alarms/);
assert.match(requestRow.verification ?? "", /no broken images or app errors/);

const otherRow = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsOthers.php",
);
assert.ok(otherRow);
assert.equal(otherRow.modernRoute, "/alarmsOthers.php, /alarms/others");
assert.equal(
  otherRow.status,
  "partial - legacy other alarms bridge, staff/parent read-state, sent history, message-portal parent delivery, and browser visual audit restored",
);
assert.match(otherRow.verification ?? "", /Browser smoke confirmed `\/alarmsOthers\.php` redirects to `\/alarms\/others`/);
assert.match(otherRow.verification ?? "", /Dashboard and Notifications tabs/);
assert.match(otherRow.verification ?? "", /Sent Others Alarms/);
assert.match(otherRow.verification ?? "", /no broken images or app errors/);

for (const legacyPhp of ["alarmsRequests.php", "alarmsOthers.php"]) {
  const markdownRow = text.markdownMatrix
    .split("\n")
    .find((line) => line.includes(`| Front/templates/admin/${legacyPhp} |`));
  assert.match(markdownRow ?? "", /browser visual audit restored/);
  assert.match(markdownRow ?? "", new RegExp(`Browser smoke confirmed \`/${legacyPhp.replace(".", "\\.")}\``));
  assert.doesNotMatch(markdownRow ?? "", /final visual audit/);
}

assert.match(
  text.topGaps,
  /Request and Other alarms browser smoke now confirms the legacy `\/alarmsRequests\.php` and `\/alarmsOthers\.php` bridges/,
);

console.log("legacy request/other alarms visual contract assertions passed");
