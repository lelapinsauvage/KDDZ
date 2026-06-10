import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/alarmsVaccinations.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/alarmsVaccinations.js",
  bridge: "src/app/(app)/alarmsVaccinations.php/page.tsx",
  page: "src/app/(app)/alarms/vaccinations/page.tsx",
  client: "src/app/(app)/alarms/vaccinations/vaccinations-client.tsx",
  receiptClient:
    "src/app/(app)/alarms/_components/staff-receipt-alarms-client.tsx",
  actions: "src/lib/actions/alarms.ts",
  vaccinationJob: "src/lib/jobs/vaccination-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /<title>Vaccinations Alarms Management<\/title>/);
assert.match(text.legacyPhp, /Vaccinations Notifications Listing/);
assert.match(text.legacyPhp, /Set All As Viewed/);
assert.match(text.legacyPhp, /Teachers/);
assert.match(text.legacyPhp, /Parents/);
assert.match(text.legacyPhp, /Sent Vaccinations Reminders/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history"/);
assert.match(text.legacyPhp, /id="datatable_ajax_history_parents"/);
assert.match(text.legacyJs, /getAlarmsVaccinations/);
assert.match(text.legacyJs, /getAlarmsVaccinationsHistory/);
assert.match(text.legacyJs, /getAlarmsVaccinationsHistoryParents/);
assert.match(text.legacyJs, /setNotificationsAsSeenAssessment/);
assert.match(text.legacyJs, /upAlarmStatusAssessment/);

assert.match(text.bridge, /redirect\("\/alarms\/vaccinations"\)/);
assert.match(text.page, /getVaccinationDueAlarms\(\)/);
assert.match(text.page, /getVaccinationAlarmNotifications\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getVaccinationAlarmHistory\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /notificationAlarms/);
assert.match(text.client, /title="Vaccination Alarms"/);
assert.match(text.client, /Due Reminders/);
assert.match(text.client, /Notifications/);
assert.match(text.client, /All Branches/);
assert.match(text.client, /Generate/);
assert.match(text.client, /No vaccination reminders found/);
assert.match(text.client, /family="vaccination"/);

for (const sharedSurface of [
  'title: "Vaccinations Notifications Listing"',
  'description: "Vaccination reminders sent to staff and parents"',
  'historyTitle: "Sent Vaccination Alarms"',
  'searchPlaceholder: "Search vaccination alarms..."',
  'historyPlaceholder: "Search sent vaccination alarms..."',
  'emptyTitle: "No vaccination notifications"',
  "Vaccination reminders matching the current filters will appear here.",
  'generationFailure: "Vaccination generation failed."',
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
    `Missing shared vaccination notification surface: ${sharedSurface}`,
  );
}

assert.match(text.actions, /export async function getVaccinationAlarmNotifications/);
assert.match(text.actions, /export async function getVaccinationAlarmHistory/);
assert.match(text.actions, /export async function generateVaccinationAlarms/);
assert.match(text.actions, /export async function markVaccinationAlarmViewed/);
assert.match(text.actions, /export async function markAllVaccinationAlarmsViewed/);
assert.match(text.vaccinationJob, /deliverPushNotification/);
assert.match(text.vaccinationJob, /pushDeliveryAuditData/);
assert.match(text.vaccinationJob, /pushDelivery/);
assert.match(text.vaccinationJob, /recipientUserIds: params\.recipientUserIds/);
assert.match(text.vaccinationJob, /manualNextDueDate/);
assert.match(text.vaccinationJob, /candidateKey/);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/alarmsVaccinations.php",
);
assert.ok(row);
assert.equal(row.modernRoute, "/alarmsVaccinations.php, /alarms/vaccinations");
assert.equal(
  row.status,
  "partial - legacy vaccination alarms bridge, generator, receipt read-state, sent history, class targeting, message-portal parent delivery, and browser visual audit restored",
);
assert.match(row.verification ?? "", /Browser smoke confirmed `\/alarmsVaccinations\.php` redirects to `\/alarms\/vaccinations`/);
assert.match(row.verification ?? "", /Vaccination Alarms/);
assert.match(row.verification ?? "", /Notifications search\/status\/branch\/date filters/);
assert.match(row.verification ?? "", /Sent Vaccination Alarms/);
assert.match(row.verification ?? "", /no broken images or app errors/);
assert.match(row.verification ?? "", /provider-neutral staff push delivery/);
assert.match(row.verification ?? "", /pushDelivery/);
assert.match(row.verification ?? "", /verify-vaccination-push-delivery\.ts/);
assert.match(row.verification ?? "", /Manual `Vaccination\.nextDueDate`/);
assert.doesNotMatch(row.verification ?? "", /reconciliation with manual `Vaccination\.nextDueDate`/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsVaccinations.php |"));
assert.match(markdownRow ?? "", /browser visual audit restored/);
assert.match(markdownRow ?? "", /Browser smoke confirmed `\/alarmsVaccinations\.php`/);
assert.match(markdownRow ?? "", /provider-neutral staff push delivery/);
assert.match(markdownRow ?? "", /Manual `Vaccination\.nextDueDate`/);
assert.doesNotMatch(markdownRow ?? "", /final visual audit/);

assert.match(
  text.topGaps,
  /Vaccination alarms now audit provider-neutral staff push delivery on generated due reminders/,
);
assert.match(
  text.topGaps,
  /Manual `Vaccination\.nextDueDate` records now reconcile into the same generated alarm path/,
);

console.log("legacy vaccination alarms visual contract assertions passed");
