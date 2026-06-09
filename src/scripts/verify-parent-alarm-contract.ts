import assert from "node:assert/strict";
import {
  buildEmptyLegacyParentAlarmPayload,
  buildLegacyAssessmentAlarmItem,
  buildLegacyChildAlarmItem,
  buildLegacyEventAlarmItem,
  buildLegacyGeneralAlarmItem,
  buildLegacyParentAlarmHeader,
} from "@/lib/parent-alarm-contracts";
import { encryptLegacyId, legacyNumericCandidates } from "@/lib/legacy-id";
import { normalizeLegacyInternalHref } from "@/lib/legacy-href";

const emptyPayload = buildEmptyLegacyParentAlarmPayload();

assert.equal(Array.isArray(emptyPayload), true, "empty alarm payload must be array");
assert.equal(emptyPayload.length, 1, "empty alarm payload must contain header");
assert.deepEqual(emptyPayload[0], { name: "", status: false, count: 0 });

const header = buildLegacyParentAlarmHeader(123, true, "5");
assert.deepEqual(header, { name: "123", status: true, count: 5 });

const baseAlarm = {
  id: "modern-alarm-id",
  message: "Fallback\ndetail",
  dueDate: new Date("2026-06-08T08:00:00.000Z"),
  isActive: true,
  referenceId: "modern-child-id",
  createdAt: new Date("2026-06-08T09:10:11.000Z"),
};

const child = {
  id: "modern-child-id",
  legacyId: 42,
};

const medicine = buildLegacyChildAlarmItem({
  alarm: {
    ...baseAlarm,
    legacyData: {
      aid: 7,
      child_id: 42,
      level: 0,
      details: "Take meds\r\nnow",
      datetime: "2026-06-08T09:10:11.000Z",
      status: 1,
      href: "alarmsMedicine.php",
    },
  },
  child,
  family: "medicine",
});

for (const key of [
  "aid",
  "child_id",
  "daysbefore",
  "details",
  "datetime",
  "status",
  "href",
  "href ",
] as const) {
  assert.equal(typeof medicine[key], "string", `medicine ${key} must be string`);
}
assert.equal(medicine.details, "Take medsnow");
assert.equal(medicine.datetime, "2026-06-08 09:10:11");

const insurance = buildLegacyChildAlarmItem({
  alarm: {
    ...baseAlarm,
    legacyData: { curr_date: "2026-06-30 00:00:00", datetime: null },
  },
  child,
  family: "insurance",
});
assert.equal(typeof insurance.date, "string", "insurance date must be string");
assert.equal(insurance.date, "2026-06-30");

const medical = buildLegacyChildAlarmItem({
  alarm: {
    ...baseAlarm,
    legacyData: {
      href: `Medical_form1.php?id=${encodeURIComponent(encryptLegacyId(42))}`,
    },
  },
  child,
  family: "medical",
});
assert.equal("status" in medical, false, "medical rows must omit status");
assert.equal("href" in medical, false, "medical rows must omit href");
assert.equal("href " in medical, false, "medical rows must omit legacy href-space");

const encryptedChildId = encryptLegacyId(42);
assert.equal(
  encryptedChildId,
  "cHJCd0RiLzJZWS9TampoL0orZk8rdz09",
  "legacy encrypted child id must match PHP encrypt_decrypt output"
);
assert.deepEqual(
  legacyNumericCandidates(encryptedChildId),
  [42],
  "legacy encrypted child id must round-trip to numeric id"
);
for (const legacyForm of [
  "Medical_form1.php",
  "Medical_form2.php",
  "Medical_form4.php",
]) {
  const normalizedHref = normalizeLegacyInternalHref(
    `${legacyForm}?id=${encodeURIComponent(encryptedChildId)}`
  );
  assert.equal(
    normalizedHref,
    `/${legacyForm}?id=${encodeURIComponent(encryptedChildId)}`,
    `${legacyForm} missing-report href must stay on the legacy PHP bridge`
  );
  const parsedId = new URL(
    normalizedHref,
    "https://kiddzonline.local"
  ).searchParams.get("id");
  assert.deepEqual(
    legacyNumericCandidates(parsedId),
    [42],
    `${legacyForm} href id must remain decryptable after URL parsing`
  );
}

const birthday = buildLegacyChildAlarmItem({
  alarm: {
    ...baseAlarm,
    legacyData: { details: "Stored detail" },
  },
  child,
  family: "birthdays",
  detailsOverride: "Birthday\nmessage",
});
assert.equal(birthday.details, "Birthdaymessage");

const general = buildLegacyGeneralAlarmItem({
  ...baseAlarm,
  legacyData: {
    aid: 8,
    child_id: 99,
    level: 1,
    details: "General\rnotice",
    datetime: "2026-06-08 07:00:00",
    status: 0,
    href: "alarms.php",
  },
});
assert.equal(general.hid, "99");
assert.equal(general.status, "0");
assert.equal(general.details, "Generalnotice");

const event = buildLegacyEventAlarmItem({
  title: "Fallback event",
  description: null,
  customSubject: null,
  customBody: null,
  date: new Date("2026-06-09T00:00:00.000Z"),
  isActive: true,
  createdAt: new Date("2026-06-08T06:05:04.000Z"),
  legacyData: {
    custom_subject: "Legacy event",
    edate: "2026-06-09",
    custom_body: "Body",
    submit_time: "2026-06-08 06:05:04",
    active: 1,
  },
});
assert.equal(event.subject, "Legacy event");
assert.equal(event.eventdate, "2026-06-09");
assert.equal(event["active "], "1");
assert.equal(event.active, "1");

const assessment = buildLegacyAssessmentAlarmItem({
  id: 12,
  childId: 42,
  message: "Assessment\nready",
  datetime: new Date("2026-06-08T05:04:03.000Z"),
});
assert.deepEqual(assessment, {
  id: "12",
  child_id: "42",
  message: "Assessmentready",
  datetime: "2026-06-08 05:04:03",
});

console.log("parent alarm legacy contract assertions passed");
