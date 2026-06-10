import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsAssessment.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsAssessment.js",
  bridge: "src/app/(app)/alarmsAssessment.php/page.tsx",
  page: "src/app/(app)/alarms/assessments/page.tsx",
  client: "src/app/(app)/alarms/assessments/assessments-client.tsx",
  receiptClient:
    "src/app/(app)/alarms/_components/staff-receipt-alarms-client.tsx",
  actions: "src/lib/actions/alarms.ts",
  assessmentJob: "src/lib/jobs/assessment-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /<title>Assessments Alarms Management<\/title>/);
assert.match(text.legacyPhp, /Assessments Notifications Listing/);
assert.match(text.legacyPhp, /Set All As Viewed/);
assert.match(text.legacyPhp, /Sent Assessment Reminders/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history"/);
assert.match(text.legacyPhp, /id="datatable_ajax_parents"/);
assert.match(text.legacyJs, /getAlarmsAssessment/);
assert.match(text.legacyJs, /getAlarmsAssessmentHistory/);
assert.match(text.legacyJs, /getAlarmsAssessmentParents/);
assert.match(text.legacyJs, /setNotificationsAsSeenAssessment/);
assert.match(text.legacyJs, /upAlarmStatusAssessment/);

assert.match(text.bridge, /redirect\("\/alarms\/assessments"\)/);
assert.match(text.page, /getAssessmentDueAlarms\(\)/);
assert.match(text.page, /getUpcomingAssessments\(\)/);
assert.match(text.page, /getAssessmentAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getAssessmentAlarmHistory\(\{ pageSize: "all" \}\)/);

for (const surface of [
  "Assessment Alarms",
  "Due Reports",
  "Notifications",
  "Today",
  "7 Days",
  "Scheduled",
  "All Branches",
  "All Due Dates",
  "Generate",
  "Due Assessment Reports",
  "Scheduled Assessment Dates",
  "Child #",
  "Child",
  "Assessment",
  "Class",
  "Branch",
  "Due Date",
  "Due In",
  "Create",
  'family="assessment"',
]) {
  assert.ok(text.client.includes(surface), `Missing assessment alarms surface: ${surface}`);
}

for (const sharedSurface of [
  'title: "Assessment Notifications Listing"',
  'description: "Assessment report reminders sent to staff"',
  'historyTitle: "Sent Assessment Alarms"',
  'searchPlaceholder: "Search assessment alarms..."',
  'historyPlaceholder: "Search sent assessment alarms..."',
  'emptyTitle: "No assessment notifications"',
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
    `Missing shared assessment notification surface: ${sharedSurface}`,
  );
}

assert.match(text.actions, /export async function getAssessmentDueAlarms/);
assert.match(text.actions, /export async function getUpcomingAssessments/);
assert.match(text.actions, /export async function getAssessmentAlarmNotifications/);
assert.match(text.actions, /export async function getAssessmentAlarmHistory/);
assert.match(text.actions, /export async function generateAssessmentAlarms/);
assert.match(text.actions, /export async function markAssessmentAlarmViewed/);
assert.match(text.actions, /export async function markAllAssessmentAlarmsViewed/);
assert.match(text.assessmentJob, /deliverPushNotification/);
assert.match(text.assessmentJob, /pushDeliveryAuditData/);
assert.match(text.assessmentJob, /parentPushDelivery/);
assert.match(text.assessmentJob, /recipientParentUserIds: params\.parentUserIds/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsAssessment.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsAssessment.php, /alarms/assessments");
assert.equal(
  row.status,
  "partial - legacy assessment alarms bridge, due queue, generator, read-state, sent history, class targeting, parent notification rows, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsAssessment\.php` redirects to `\/alarms\/assessments`/);
assert.match(row.verification ?? "", /Due Assessment Reports/);
assert.match(row.verification ?? "", /Scheduled Assessment Dates/);
assert.match(row.verification ?? "", /Sent Assessment Alarms/);
assert.match(row.verification ?? "", /provider-neutral parent push delivery/);
assert.match(row.verification ?? "", /parentPushDelivery/);
assert.match(row.verification ?? "", /no broken images or app errors/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsAssessment.php |"));
assert.match(
  markdownRow ?? "",
  /browser visual audit restored/,
);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsAssessment\.php`/);
assert.doesNotMatch(markdownRow ?? "", /final visual audit/);

assert.match(
  text.topGaps,
  /Assessment alarms browser smoke now confirms the legacy `\/alarmsAssessment\.php` bridge/,
);
assert.doesNotMatch(
  text.topGaps,
  /Remaining work is final per-question visual audit/,
);

console.log("legacy assessment alarms visual contract assertions passed");
