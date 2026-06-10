import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsEvents.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsEvents.js",
  bridge: "src/app/(app)/alarmsEvents.php/page.tsx",
  page: "src/app/(app)/alarms/events/page.tsx",
  client: "src/app/(app)/alarms/events/event-alarms-client.tsx",
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

assert.match(text.legacyPhp, /<title>Events Alarms Management<\/title>/);
assert.match(text.legacyPhp, /This Page Shows Alarms Listing & History For 1-Day Events/);
assert.match(text.legacyPhp, /Events Alarms Listing/);
assert.match(text.legacyPhp, /Set All As Viewed/);
assert.match(text.legacyPhp, /Teachers/);
assert.match(text.legacyPhp, /Parents/);
assert.match(text.legacyPhp, /Sent Events Alarms/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history_parent"/);
assert.match(text.legacyJs, /getAlarmsEvents/);
assert.match(text.legacyJs, /getAlarmsEventsHistory/);
assert.match(text.legacyJs, /getAlarmsEventsParentsHistory/);
assert.match(text.legacyJs, /setNotificationsAsSeenMedicine/);
assert.match(text.legacyJs, /upAlarmStatusMedicine/);

assert.match(text.bridge, /redirect\("\/alarms\/events"\)/);
assert.match(text.page, /getEvents\(\{ isActive: true \}\)/);
assert.match(text.page, /getAlarms\(\{ type: "EVENT", pageSize: "all" \}\)/);
assert.match(text.page, /getEventAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getEventAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.client, /title="Event Alarms"/);
assert.match(text.client, /Dashboard/);
assert.match(text.client, /Notifications/);
assert.match(text.client, /All Branches/);
assert.match(text.client, /Generate Holiday Alarms/);
assert.match(text.client, /Generate Event Alarms/);
assert.match(text.client, /Event Title/);
assert.match(text.client, /No upcoming events found/);
assert.match(text.client, /family="event"/);
assert.match(text.client, /showGenerate=\{false\}/);

for (const sharedSurface of [
  'title: "Events Notifications Listing"',
  'description: "Holiday and event reminders sent to staff and parents"',
  'historyTitle: "Sent Events Alarms"',
  'searchPlaceholder: "Search event alarms..."',
  'historyPlaceholder: "Search sent event alarms..."',
  'emptyTitle: "No event notifications"',
  "Event and holiday reminders matching the current filters will appear here.",
  'generationFailure: "Event generation failed."',
  "Set All As Viewed",
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
    `Missing shared event notification surface: ${sharedSurface}`,
  );
}

assert.match(text.actions, /export async function getEventAlarmNotifications/);
assert.match(text.actions, /export async function getEventAlarmHistory/);
assert.match(text.actions, /export async function generateEventAlarms/);
assert.match(text.actions, /export async function generateHolidayAlarms/);
assert.match(text.actions, /export async function markEventAlarmViewed/);
assert.match(text.actions, /export async function markAllEventAlarmsViewed/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsEvents.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsEvents.php, /alarms/events");
assert.equal(
  row.status,
  "partial - legacy event alarms bridge, event read-state, sent history, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsEvents\.php` redirects to `\/alarms\/events`/);
assert.match(row.verification ?? "", /Event Alarms/);
assert.match(row.verification ?? "", /Dashboard and Notifications tabs/);
assert.match(row.verification ?? "", /Sent Events Alarms/);
assert.match(row.verification ?? "", /no broken images or app errors/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsEvents.php |"));
assert.match(markdownRow ?? "", /browser visual audit restored/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsEvents\.php`/);

assert.match(
  text.topGaps,
  /Event alarms browser smoke now confirms the legacy `\/alarmsEvents\.php` bridge/,
);

console.log("legacy event alarms visual contract assertions passed");
