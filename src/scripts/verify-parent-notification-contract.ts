import assert from "node:assert/strict";
import {
  buildEmptyNotificationPayload,
  buildNotificationGroup,
  cleanLegacyNotificationBody,
  LEGACY_NOTIFICATION_GROUP_COUNT,
} from "@/lib/parent-notification-contract";

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

console.log("parent notification legacy contract assertions passed");
