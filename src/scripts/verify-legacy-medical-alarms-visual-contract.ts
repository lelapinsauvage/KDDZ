import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsMedical.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsMedical.js",
  bridge: "src/app/(app)/alarmsMedical.php/page.tsx",
  page: "src/app/(app)/alarms/medical/page.tsx",
  client: "src/app/(app)/alarms/medical/medical-alarms-client.tsx",
  actions: "src/lib/actions/alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /<title>Reports Alarms Management<\/title>/);
assert.match(text.legacyPhp, /Medical Notifications Listing/);
assert.match(text.legacyPhp, /Set All As Viewed/);
assert.match(text.legacyPhp, /Teachers/);
assert.match(text.legacyPhp, /Parents/);
assert.match(text.legacyPhp, /Sent Reports Reminders/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history_parents"/);
assert.match(text.legacyJs, /getAlarmsMedical/);
assert.match(text.legacyJs, /getAlarmsMedicalReportsHistory/);
assert.match(text.legacyJs, /getAlarmsMedicalReportsHistoryParents/);
assert.match(text.legacyJs, /setNotificationsAsSeenMedical/);
assert.match(text.legacyJs, /upAlarmStatusMedical/);

assert.match(text.bridge, /redirect\("\/alarms\/medical"\)/);
assert.match(text.page, /getMedicalAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getMedicalAlarmHistory\(\{ pageSize: "all" \}\)/);

for (const surface of [
  "Medical Notifications Listing",
  "Missing and incomplete medical report reminders",
  "Teachers",
  "Sent Reports Reminders",
  "Search medical alarms...",
  "Search sent reminders...",
  "All Status",
  "All Types",
  "All Branches",
  "Alarm date from",
  "Alarm date to",
  "History date from",
  "History date to",
  "Generate",
  "Set All As Viewed",
  "Alarm Details",
  "Alarm Time",
  "Status",
  "Branch",
  "Actions",
  "Type",
  "Content",
  "Time",
  "To",
  "Seen",
  "No medical notifications",
  "No sent reminders",
  "Mark as Viewed",
]) {
  assert.ok(text.client.includes(surface), `Missing medical alarm surface: ${surface}`);
}

assert.match(text.actions, /export async function getMedicalAlarmNotifications/);
assert.match(text.actions, /export async function getMedicalAlarmHistory/);
assert.match(text.actions, /export async function generateMedicalAlarms/);
assert.match(text.actions, /export async function markMedicalAlarmViewed/);
assert.match(text.actions, /export async function markAllMedicalAlarmsViewed/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsMedical.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsMedical.php, /alarms/medical");
assert.equal(
  row.status,
  "partial - legacy medical alarms bridge, deep links, generator, staff/parent read-state, class targeting, message-portal parent delivery, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsMedical\.php` redirects to `\/alarms\/medical`/);
assert.match(row.verification ?? "", /Medical Notifications Listing/);
assert.match(row.verification ?? "", /Sent Reports Reminders/);
assert.match(row.verification ?? "", /no broken images or app errors/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsMedical.php |"));
assert.match(markdownRow ?? "", /browser visual audit restored/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsMedical\.php`/);
assert.doesNotMatch(markdownRow ?? "", /final visual audit/);

assert.match(
  text.topGaps,
  /Medical alarms browser smoke now confirms the legacy `\/alarmsMedical\.php` bridge/,
);

console.log("legacy medical alarms visual contract assertions passed");
