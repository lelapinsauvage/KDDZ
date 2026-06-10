import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const legacy = {
  notifCalendarPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/NotifCalendar.php`,
    "utf8",
  ),
  notifCalendarJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/NotifCalendar.js`,
    "utf8",
  ),
  eventAlarmsWs: readFileSync(`${legacyRoot}/ws/events_alarms.php`, "utf8"),
};

const modern = {
  schema: readFileSync("prisma/schema.prisma", "utf8"),
  importer: readFileSync(
    "src/scripts/migration/migrate-garderie-misc.ts",
    "utf8",
  ),
  reconciler: readFileSync(
    "src/scripts/migration/reconcile-migration-counts.ts",
    "utf8",
  ),
  eventsPage: readFileSync("src/app/(app)/settings/events/page.tsx", "utf8"),
  notifBridge: readFileSync("src/app/(app)/NotifCalendar.php/page.tsx", "utf8"),
  eventsClient: readFileSync(
    "src/app/(app)/settings/events/events-client.tsx",
    "utf8",
  ),
  settingsActions: readFileSync("src/lib/actions/settings.ts", "utf8"),
  eventAlarmsJob: readFileSync("src/lib/jobs/event-alarms.ts", "utf8"),
  parentAlarmsApi: readFileSync(
    "src/app/api/parent/alarms/[type]/route.ts",
    "utf8",
  ),
  parentNotificationsApi: readFileSync(
    "src/app/api/parent/notifications/[childId]/route.ts",
    "utf8",
  ),
  parentDeliveryVerifier: readFileSync(
    "src/scripts/verify-event-parent-delivery.ts",
    "utf8",
  ),
  databaseMatrix: readFileSync("docs/database-mapping-matrix.md", "utf8"),
  pageMatrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  pageMatrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

function modelBlock(schema: string, model: string) {
  return new RegExp(`model ${model} \\{[\\s\\S]*?@@map\\("`).exec(schema)?.[0] ?? "";
}

assert.match(legacy.notifCalendarPhp, /getNotifCauses\(\)/);
assert.match(legacy.notifCalendarPhp, /getBranches\(\)/);
assert.match(legacy.notifCalendarPhp, /Events Calendar/);
assert.match(legacy.notifCalendarPhp, /Alerts & Notifications/);
assert.match(legacy.notifCalendarPhp, /id=['"]calendar['"]/);
assert.match(legacy.notifCalendarPhp, /Add A Notification/);
assert.match(legacy.notifCalendarPhp, /daysbefore/);
assert.match(legacy.notifCalendarPhp, /branches/);

for (const token of [
  "populateEventsCalendar",
  "getEventNotifDetails",
  "getCauseSubjectAndBody",
  "saveNewEvents",
  "deletevent",
  "EventDaysBefore",
  "EventBranches",
  "EventSubject",
  "EventBody",
  "EventActive",
  "custom_subject",
  "custom_body",
  "daysbefore",
  "branches",
  "active",
  "branches_name",
]) {
  assert.match(legacy.notifCalendarJs, new RegExp(token));
}
assert.match(legacy.notifCalendarJs, /JSON\.parse\(daysbefore\)/);
assert.match(legacy.notifCalendarJs, /JSON\.parse\(branchesEvents\)/);

assert.match(
  legacy.eventAlarmsWs,
  /SELECT \* FROM t_events WHERE active = '1' AND edate <= CURDATE\(\) ORDER BY edate DESC/,
);
assert.match(legacy.eventAlarmsWs, /json_decode\(\$row\['branches'\], true\)/);
assert.match(legacy.eventAlarmsWs, /in_array\(\$branch_id, \$branchesarray\)/);
assert.match(legacy.eventAlarmsWs, /\['subject'\]\s*=\s*\$toreturn\[\$i\]\['custom_subject'\]/);
assert.match(legacy.eventAlarmsWs, /\['eventdate'\]\s*=\s*\$toreturn\[\$i\]\['edate'\]/);
assert.match(legacy.eventAlarmsWs, /\['custom_body'\]\s*=\s*\$toreturn\[\$i\]\['custom_body'\]/);
assert.match(legacy.eventAlarmsWs, /\['submit_time'\]\s*=\s*\$toreturn\[\$i\]\['submit_time'\]/);
assert.match(legacy.eventAlarmsWs, /\['active '\]\s*=\s*\$toreturn\[\$i\]\['active'\]/);

assert.match(modern.importer, /t_events\s+-> Event/);
assert.match(modern.importer, /interface OldEvent \{[\s\S]*id: number/);
assert.match(modern.importer, /submit_time: string \| Date/);
assert.match(modern.importer, /eventType: number/);
assert.match(modern.importer, /edate: string/);
assert.match(modern.importer, /custom_subject: string/);
assert.match(modern.importer, /custom_body: string/);
assert.match(modern.importer, /daysbefore: string/);
assert.match(modern.importer, /branches: string/);
assert.match(modern.importer, /active: number/);
assert.match(modern.importer, /tableExists\("t_events"\)/);
assert.match(modern.importer, /SELECT \* FROM t_events ORDER BY id/);
assert.match(modern.importer, /legacyKey\(sourceDatabase, "t_events", legacyId\)/);
assert.match(modern.importer, /getMapping\("event_type", toInt\(row\.eventType, 0\)\)/);
assert.match(modern.importer, /parseLegacyNumberList\(row\.branches\)/);
assert.match(modern.importer, /notificationBranchIds = legacyBranchIds/);
assert.match(modern.importer, /parseLegacyNumberList\(row\.daysbefore\)\.filter/);
assert.match(modern.importer, /days >= 1 && days <= 10/);
assert.match(modern.importer, /customSubject = cleanString\(row\.custom_subject\)/);
assert.match(modern.importer, /customBody = cleanString\(row\.custom_body\)/);
assert.match(modern.importer, /eventDate = asDate\(row\.edate\)/);
assert.match(modern.importer, /if \(!eventDate\) \{\s*skipped\+\+;/);
assert.match(modern.importer, /sourceDatabase,\s*\n\s*legacyKey: key,\s*\n\s*legacyId/);
assert.match(modern.importer, /organizationId,\s*\n\s*title:/);
assert.match(modern.importer, /description: customBody/);
assert.match(modern.importer, /customSubject,\s*\n\s*customBody/);
assert.match(modern.importer, /date: eventDate/);
assert.match(modern.importer, /eventTypeId/);
assert.match(modern.importer, /branchId: notificationBranchIds\.length === 1/);
assert.match(modern.importer, /notificationBranchIds,\s*\n\s*notificationDaysBefore/);
assert.match(modern.importer, /isActive: toBool\(row\.active\)/);
assert.match(modern.importer, /legacyBranchIds,\s*\n\s*modernBranchIds: notificationBranchIds/);
assert.match(modern.importer, /modernEventTypeId: eventTypeId/);
assert.match(modern.importer, /createdAt: asDate\(row\.submit_time\) \?\? new Date\(\)/);
assert.match(modern.importer, /t_events: \$\{migrated\} migrated, \$\{updated\} updated, \$\{skipped\} skipped/);

const eventModel = modelBlock(modern.schema, "Event");
for (const field of [
  "sourceDatabase",
  "legacyKey",
  "legacyId",
  "organizationId",
  "customSubject",
  "customBody",
  "date",
  "eventTypeId",
  "branchId",
  "notificationBranchIds",
  "notificationDaysBefore",
  "isActive",
  "legacyData",
]) {
  assert.match(eventModel, new RegExp(`${field}\\s+`), `Event field ${field}`);
}

assert.match(modern.reconciler, /garderie_misc\.t_events/);
assert.match(modern.reconciler, /sourceTable: "t_events"/);
assert.match(modern.reconciler, /targetTable: "events"/);
assert.match(modern.reconciler, /custom notification text/);
assert.match(modern.reconciler, /branch-list JSON/);
assert.match(modern.reconciler, /day-offset metadata/);

for (const token of [
  "notificationBranchIds",
  "notificationDaysBefore",
  "selectedBranchNames",
  "customSubject",
  "customBody",
  "eventTypeName",
  "branchName",
]) {
  assert.match(modern.eventsPage, new RegExp(token));
}

assert.match(modern.eventsClient, /notificationDaysBefore: \[1, 3, 7\]/);
assert.match(modern.eventsClient, /openEdit\(ev: EventItem\)/);
assert.match(modern.eventsClient, /ev\.notificationBranchIds/);
assert.match(modern.eventsClient, /ev\.notificationDaysBefore\.length/);
assert.match(modern.eventsClient, /defaultSubject/);
assert.match(modern.eventsClient, /defaultMessage/);
assert.match(modern.eventsClient, /createEvent\(\{/);
assert.match(modern.eventsClient, /updateEvent\(editingId,/);
assert.match(modern.eventsClient, /toggleBranch/);
assert.match(modern.eventsClient, /toggleReminderDay/);
assert.match(modern.eventsClient, /Array\.from\(\{ length: 10 \}/);
assert.match(modern.eventsClient, /title="Alerts & Notifications"/);
assert.match(modern.eventsClient, /Here You Can Schedule Messages\/Alerts prior of events/);
assert.match(modern.eventsClient, /Add A Notification/);
assert.match(modern.eventsClient, /Edit Notification/);
assert.match(modern.eventsClient, /Cause/);
assert.match(modern.eventsClient, /Event Date/);
assert.match(modern.eventsClient, /Characters Count:/);
assert.match(modern.eventsClient, /\(155 per SMS\)/);
assert.match(modern.eventsClient, /Branches: \{ev\.branchName\}/);
assert.match(modern.eventsClient, /ev\.isActive[\s\S]*\? ev\.eventTypeColor[\s\S]*: "#60778a"/);
assert.match(modern.eventsClient, /notificationTitle =[\s\S]*values\.title \|\| values\.customSubject \|\| eventType\?\.name \|\| "Notification"/);
assert.match(modern.eventsClient, /<input type="hidden" \{\.\.\.form\.register\("title"\)\} \/>/);

assert.match(modern.settingsActions, /function normalizeDaysBefore/);
assert.match(modern.settingsActions, /item >= 1 && item <= 10/);
assert.match(modern.settingsActions, /function verifyBranchListAccess/);
assert.match(modern.settingsActions, /export async function getEvents/);
assert.match(modern.settingsActions, /stringListFromJson\(event\.notificationBranchIds\)/);
assert.match(modern.settingsActions, /export async function createEvent/);
assert.match(modern.settingsActions, /normalizeStringArray\(data\.notificationBranchIds\)/);
assert.match(modern.settingsActions, /normalizeDaysBefore\(data\.notificationDaysBefore\)/);
assert.match(modern.settingsActions, /notificationBranchIds,\s*\n\s*notificationDaysBefore/);
assert.match(modern.settingsActions, /export async function updateEvent/);
assert.match(modern.settingsActions, /updateData\.notificationBranchIds = notificationBranchIds/);
assert.match(modern.settingsActions, /updateData\.notificationDaysBefore = notificationDaysBefore/);

assert.match(modern.eventAlarmsJob, /DEFAULT_REMINDER_DAYS = \[1, 3, 7\]/);
assert.match(modern.eventAlarmsJob, /EVENT_RECEIPT_SOURCE = "custom_notifications_events"/);
assert.match(
  modern.eventAlarmsJob,
  /EVENT_PARENT_RECEIPT_SOURCE = "custom_notifications_events_parents"/,
);
assert.match(modern.eventAlarmsJob, /function jsonReminderDays/);
assert.match(modern.eventAlarmsJob, /item >= 1 && item <= 10/);
assert.match(modern.eventAlarmsJob, /event\.customSubject/);
assert.match(modern.eventAlarmsJob, /event\.customBody/);
assert.match(modern.eventAlarmsJob, /event\.eventType\?\.defaultSubject/);
assert.match(modern.eventAlarmsJob, /event\.eventType\?\.defaultMessage/);
assert.match(modern.eventAlarmsJob, /event\.notificationDaysBefore === null/);
assert.match(modern.eventAlarmsJob, /jsonStringArray\(event\.notificationBranchIds\)/);
assert.match(modern.eventAlarmsJob, /sourceDatabase: event\.sourceDatabase/);

assert.match(modern.parentAlarmsApi, /async function handleEvents/);
assert.match(modern.parentAlarmsApi, /date: \{ lte: now \}/);
assert.match(modern.parentAlarmsApi, /eventMatchesChildBranch/);
assert.match(modern.parentAlarmsApi, /buildLegacyEventAlarmItem/);
assert.match(modern.parentNotificationsApi, /contentTable === "t_events"/);
assert.match(modern.parentNotificationsApi, /loadEventReceiptDetails/);
assert.match(modern.parentNotificationsApi, /loadEventDetails/);
assert.match(modern.parentNotificationsApi, /mapEventDetail/);
assert.match(modern.parentNotificationsApi, /eventMatchesChildBranch/);
assert.match(modern.parentDeliveryVerifier, /custom_notifications_events_parents/);
assert.match(modern.parentDeliveryVerifier, /notifications_master\.php/);

assert.match(modern.notifBridge, /redirect\(`\/settings\/events/);
assert.match(modern.notifBridge, /target\.set\("legacyEvent", id\.trim\(\)\)/);

const eventRows = modern.databaseMatrix
  .split("\n")
  .filter((line) => line.includes("| t_events |"));
assert.equal(eventRows.length, 3);
for (const row of eventRows) {
  assert.match(row, /mapped - migrated by migrate-garderie-misc\.ts/);
  assert.match(row, /sourceDatabase/);
  assert.match(row, /legacyKey/);
  assert.match(row, /legacyId/);
  assert.match(row, /event type mapping/);
  assert.match(row, /custom subject\/body/);
  assert.match(row, /notification branch ids/);
  assert.match(row, /1-10 day-offset metadata/);
  assert.match(row, /migrated vs updated vs skipped counts/);
  assert.doesNotMatch(
    row,
    /Needs source count, migrated count, skipped count, orphan report/,
  );
}

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const pageMatrix = JSON.parse(modern.pageMatrix) as MatrixRow[];
const eventsRow = pageMatrix.find(
  (entry) => entry.modernRoute === "/NotifCalendar.php, /settings/events",
);
assert.ok(eventsRow, "Missing /NotifCalendar.php page matrix row");
assert.match(eventsRow.status ?? "", /restored - legacy event notification calendar/);
assert.match(eventsRow.verification ?? "", /Event import fidelity/);
assert.match(eventsRow.verification ?? "", /verify-legacy-event-import-contract\.ts/);
assert.match(eventsRow.verification ?? "", /sourceDatabase, legacyKey\/id/);
assert.match(eventsRow.verification ?? "", /notification branch ids/);
assert.match(eventsRow.verification ?? "", /1-10 day reminder offsets/);
assert.match(eventsRow.verification ?? "", /Add A Notification/);
assert.match(eventsRow.verification ?? "", /Browser smoke/);
assert.doesNotMatch(eventsRow.verification ?? "", /Remaining work/);

assert.match(
  modern.pageMatrixMd,
  /NotifCalendar\.php \| Front\/templates\/admin\/js\/NotifCalendar\.js \| \/NotifCalendar\.php, \/settings\/events \| restored - legacy event notification calendar, modal actions, migration, and parent delivery restored/,
);
assert.match(
  modern.pageMatrixMd,
  /NotifCalendar\.php[\s\S]*custom subject\/body, multi-branch notification targeting, 1-10 day reminder offsets/,
);
assert.match(
  modern.pageMatrixMd,
  /NotifCalendar\.php[\s\S]*verify-legacy-event-import-contract\.ts/,
);
assert.match(
  modern.pageMatrixMd,
  /NotifCalendar\.php[\s\S]*legacy `id` as `legacyEvent` query context/,
);
assert.match(
  modern.pageMatrixMd,
  /NotifCalendar\.php[\s\S]*Add A Notification[\s\S]*Edit Notification/,
);

console.log("legacy event import assertions passed");
