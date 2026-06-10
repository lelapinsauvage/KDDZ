import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildEmptyNotificationPayload,
  buildNotificationGroup,
  cleanLegacyNotificationBody,
  DEFAULT_NATURES,
  LEGACY_NOTIFICATION_GROUP_COUNT,
} from "@/lib/parent-notification-contract";

const legacyRoot = "/Users/karimsaab/Desktop/Garderie Project";

const sources = {
  legacyPhp: `${legacyRoot}/Garderie-old-backup/ws/notifications_master.php`,
  iosParser: `${legacyRoot}/KiddzOnline/KiddzOnline/Classes/WebFunctions.swift`,
  route: "src/app/api/parent/notifications/[childId]/route.ts",
  wsMaster: "src/app/ws/notifications_master.php/route.ts",
  wsAlias: "src/app/ws/notifications.php/route.ts",
  contract: "src/lib/parent-notification-contract.ts",
  parentMatrix: "docs/parent-api-contract-matrix.md",
  pageMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(sources).map(([key, path]) => [key, readFileSync(path, "utf8")])
) as Record<keyof typeof sources, string>;

const emptyPayload = buildEmptyNotificationPayload();

assert.equal(typeof emptyPayload, "object", "payload must be an object");
assert.equal(Array.isArray(emptyPayload), false, "payload must not be an array");
assert.equal(typeof emptyPayload.info, "object", "payload must include info");
assert.equal(typeof emptyPayload.info.name, "string", "info.name must be string");
assert.equal(
  typeof emptyPayload.info.no_notifications,
  "string",
  "info.no_notifications must be string"
);

for (let index = 1; index <= LEGACY_NOTIFICATION_GROUP_COUNT; index++) {
  const key = `notification${index}`;
  const group = emptyPayload[key];

  assert.equal(typeof group, "object", `${key} must be an object`);
  assert.equal(Array.isArray(group), false, `${key} must not be an array`);

  const typedGroup = group as ReturnType<typeof buildNotificationGroup>;
  assert.equal(typeof typedGroup.name, "string", `${key}.name must be string`);
  assert.equal(Array.isArray(typedGroup.details), true, `${key}.details must be array`);
}

const sampleGroup = buildNotificationGroup("Sample", [
  {
    subject: 101,
    body: 'Body with "quotes"',
    datetime: new Date("2026-06-08T10:20:00.000Z"),
  },
]);
const [sampleDetail] = sampleGroup.details;

assert.equal(typeof sampleGroup.name, "string", "sample group name must be string");
assert.equal(Array.isArray(sampleGroup.details), true, "sample details must be array");
assert.equal(typeof sampleDetail.subject, "string", "sample subject must be string");
assert.equal(typeof sampleDetail.body, "string", "sample body must be string");
assert.equal(typeof sampleDetail.datetime, "string", "sample datetime must be string");
assert.equal(sampleDetail.subject, "101");
assert.equal(sampleDetail.body, "Body with quotes");
assert.equal(
  cleanLegacyNotificationBody('Legacy "clean" check'),
  "Legacy clean check"
);

assert.equal(
  DEFAULT_NATURES.length,
  LEGACY_NOTIFICATION_GROUP_COUNT,
  "fallback natures must cover every iOS force-read group"
);

assert.match(text.legacyPhp, /\$main\['info'\] = \$info/);
assert.match(text.legacyPhp, /\$main\['notification'\.\$inc\] = \$notification/);
assert.match(text.legacyPhp, /return str_replace\('"', '', \$string\)/);

assert.match(text.iosParser, /for i in 1\.\.\.11/);
assert.match(text.iosParser, /jsonResult\["notification\\\(i\)" \] as! NSDictionary/);
assert.match(text.iosParser, /\["details"\] as! NSArray/);
assert.match(text.iosParser, /\["subject"\] as\? String\)![\s\S]*\["body"\] as\? String\)![\s\S]*\["datetime"\] as\? String\)!/);

assert.match(text.contract, /export const LEGACY_NOTIFICATION_GROUP_COUNT = 11/);
assert.match(text.contract, /export const DEFAULT_NATURES/);
assert.match(text.contract, /export function buildEmptyNotificationPayload/);
assert.match(text.contract, /result\[`notification\$\{index \+ 1\}`\] = buildNotificationGroup/);
assert.match(text.contract, /export function buildNotificationGroup/);
assert.match(text.contract, /details: details\.map\(buildNotificationDetail\)/);
assert.match(text.contract, /export function cleanLegacyNotificationBody/);

assert.match(text.route, /readString\(body, \["usites", "pid", "child_id", "childId"\]\)/);
assert.match(text.route, /if \(request\.method === "POST" && !postedChildId\)/);
assert.match(text.route, /resolveLegacyNotificationContext\(requestedChildId\)/);
assert.match(text.route, /const natures = await loadNotificationNatures\(\)/);
assert.match(text.route, /withDefaultNotificationNatures\(natures\)/);
assert.match(text.route, /catch \(error\)[\s\S]*isPrismaConnectionError\(error\)[\s\S]*buildEmptyNotificationPayload\(\)/);
assert.match(text.route, /contentTable === "t_events"/);
assert.match(text.route, /contentTable === "t_alarms_msg"/);
assert.match(text.route, /contentTable === "new_assessment"/);
assert.match(text.route, /contentTable in ALARM_TABLE_TYPES/);
assert.match(text.route, /cleanLegacyNotificationBody/);

assert.match(text.wsMaster, /forwardLegacyChildWsRoute\(request, parentNotificationsGet\)/);
assert.match(text.wsMaster, /forwardLegacyChildWsRoute\(request, parentNotificationsPost\)/);
assert.match(text.wsAlias, /export \{ GET, POST \} from "\.\.\/notifications_master\.php\/route"/);

assert.match(text.parentMatrix, /ws\/notifications_master\.php \| usites/);
assert.match(text.parentMatrix, /eleven `notificationN` groups for iOS/);
assert.match(text.parentMatrix, /database-connection empty eleven-group fallback restored/);
assert.match(text.pageMatrix, /`notifications_master` payloads now share a reusable contract assertion/);
assert.match(text.topGaps, /the eleven `notificationN` groups the iOS parser force-reads/);

console.log("parent notification legacy contract assertions passed");
