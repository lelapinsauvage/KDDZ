import assert from "node:assert/strict";
import type { MealType, PortionSize } from "@/generated/prisma/client";
import {
  buildEmptyLegacyDailyPayload,
  mapLegacyDailyReport,
  mapLegacyDetailedDailyReport,
} from "@/lib/parent-daily-contract";
import {
  buildFailedLegacyParentLogin,
  buildSuccessfulLegacyParentLogin,
} from "@/lib/parent-login-contracts";
import {
  buildLegacyGarderieBootstrapPayload,
  mapLegacyGarderieBootstrapItem,
} from "@/lib/parent-mobile-bootstrap-contract";
import {
  buildEmptyLegacyMessageList,
  buildEmptyLegacyMessageThread,
  buildFailedLegacySendMessageResult,
  buildLegacyMessageListHeader,
  buildLegacyMessageListItem,
  buildLegacyMessageThreadItem,
  buildLegacyMessageThreadPayload,
  buildSentLegacySendMessageResult,
} from "@/lib/parent-message-contracts";
import {
  buildEmptyLegacyNativeListPayload,
  mapLegacyAbsenceReport,
  mapLegacyFinancePayment,
  mapLegacyFoodCalendarItems,
  mapLegacyHoliday,
  stripLegacyFoodCalendarGroupingFields,
} from "@/lib/parent-native-list-contracts";
import {
  buildEmptyNotificationPayload,
  buildNotificationGroup,
  LEGACY_NOTIFICATION_GROUP_COUNT,
} from "@/lib/parent-notification-contract";

type JsonRecord = Record<string, unknown>;
type DailyReportFixture = Parameters<typeof mapLegacyDailyReport>[0];

const dailyReport: DailyReportFixture = {
  id: "modern-report-id",
  reportDate: new Date("2026-06-07T00:00:00.000Z"),
  status: "SUBMITTED",
  breakfastPortion: "LITTLE" as PortionSize,
  breakfastTime: new Date("1970-01-01T07:30:00.000Z"),
  lunchPortion: "ALL" as PortionSize,
  lunchTime: new Date("1970-01-01T12:15:00.000Z"),
  dessert: "Apple",
  dessertPortion: "HALF" as PortionSize,
  dessertTime: new Date("1970-01-01T15:05:00.000Z"),
  isSleep: true,
  sleepFrom: new Date("1970-01-01T13:00:00.000Z"),
  sleepTo: new Date("1970-01-01T14:00:00.000Z"),
  diarrhea: true,
  urinePotty: 1,
  stoolPotty: 2,
  urineDiaper: 3,
  stoolDiaper: 4,
  mood: "happy",
  cough: true,
  runnyNose: true,
  vomit: false,
  remarks: "ok",
  legacyData: {
    report_id: 42,
    breakf: "little",
    lunchf: "well",
    dess_portion: "2",
    diahria: "1",
    taken_meds: "[5]",
  },
  breakfastFood: { name: "Eggs" },
  lunchFood: { name: "Rice" },
  fevers: [
    { temperature: "38.1", time: new Date("1970-01-01T09:00:00.000Z") },
    { temperature: "38.2", time: new Date("1970-01-01T10:00:00.000Z") },
    { temperature: "38.3", time: new Date("1970-01-01T11:00:00.000Z") },
    { temperature: "38.4", time: new Date("1970-01-01T12:00:00.000Z") },
    { temperature: "38.5", time: new Date("1970-01-01T13:00:00.000Z") },
  ],
  milks: [{ amountCc: 120, time: new Date("1970-01-01T16:30:00.000Z") }],
};

assertLegacyHeader(buildEmptyLegacyDailyPayload(), "daily empty header");

const androidDaily = mapLegacyDailyReport(dailyReport);
assertStringFields(androidDaily, [
  "report_id",
  "reportdate",
  "status",
  "bftime",
  "lntime",
  "dessert",
  "has_dess",
  "desstime",
  "is_sleep",
  "sleep_from",
  "sleep_to",
  "diahria",
  "remarks",
  "pantchecked",
  "shirtchecked",
  "tshirthecked",
  "boxerchecked",
  "sockschecked",
  "mtime",
  "bname",
  "lname",
], "android daily");
assertStringFields(androidDaily, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], "android daily fever slots");
assertDateStringFields(androidDaily, ["reportdate"], "android daily");
assertIntegerCoercibleFields(androidDaily, [
  "breakf",
  "lunchf",
  "dess_portion",
  "ur_pot",
  "stool_pot",
  "ur_di",
  "stool_di",
  "mcc",
], "android daily");

const iosDetailedDaily = mapLegacyDetailedDailyReport(
  dailyReport,
  new Map([[5, "Syrup"]])
);
assertStringFields(iosDetailedDaily, [
  "report_id",
  "reportdate",
  "status",
  "lname",
  "lntime",
  "bftime",
  "bname",
  "dessert",
  "desstime",
  "has_dess",
  "mood",
  "mood2",
  "ur_di",
  "ur_pot",
  "stool_di",
  "stool_pot",
  "diarrhea",
  "constipation",
  "sleep_from",
  "sleep_to",
  "sleep_from1",
  "sleep_to1",
  "sleep_from2",
  "sleep_to2",
  "is_sleep",
  "boxerchecked",
  "pantchecked",
  "shirtchecked",
  "sockschecked",
  "tshirthecked",
  "brushchecked",
  "towelchecked",
  "diaperschecked",
  "babybottlechecked",
  "milkchecked",
  "wipeschecked",
  "remarks",
  "vomit",
  "cough",
  "rnose",
], "ios detailed daily");
assertNumberFields(iosDetailedDaily, [
  "breakf",
  "lunchf",
  "dess_portion",
], "ios detailed daily");
assertArrayFields(iosDetailedDaily, [
  "fever",
  "milk",
  "takenmeds_Arr",
], "ios detailed daily");
assertStringFields(firstRecord(iosDetailedDaily.fever), ["fvalue", "ftime"], "ios fever item");
assertStringFields(firstRecord(iosDetailedDaily.milk), ["mcc", "mtime"], "ios milk item");

const absence = mapLegacyAbsenceReport({
  id: "modern-absence-id",
  legacyId: 77,
  date: new Date("2026-06-07T00:00:00.000Z"),
  reason: "sick",
  absentFrom: null,
  absentTo: null,
  hospitalized: true,
  hospitalName: null,
  doctorName: null,
  status: "PENDING",
  legacyData: null,
});
assertStringFields(absence, [
  "report_id",
  "reportdate",
  "ab_reason",
  "ab_from",
  "ab_to",
  "attend_hos",
  "hos_name",
  "dr_name",
  "is_rep_draft",
], "absence");
assertDateStringFields(absence, ["reportdate", "ab_from", "ab_to"], "absence");

const payment = mapLegacyFinancePayment({
  legacyId: 9,
  amount: "385.00",
  currency: "$",
  date: new Date("2026-06-07T00:00:00.000Z"),
  dateFrom: null,
  dateTo: null,
  method: "CASH",
  category: "XTRA_TIME",
  notes: null,
  legacyData: null,
});
assertStringFields(payment, [
  "type",
  "target",
  "for",
  "year",
  "from",
  "to",
  "currency",
  "datetime",
  "amount",
], "payment");

const foodItems = mapLegacyFoodCalendarItems([
  {
    id: "breakfast-row",
    legacyId: 12,
    legacyBranchId: 3,
    date: new Date("2026-06-07T00:00:00.000Z"),
    mealType: "BREAKFAST" as MealType,
    legacyData: { date: "2026-06-07", dessert: "Fruit" },
    food: { name: "Labneh" },
  },
  {
    id: "lunch-row",
    legacyId: 12,
    legacyBranchId: 3,
    date: new Date("2026-06-07T00:00:00.000Z"),
    mealType: "LUNCH" as MealType,
    legacyData: { date: "2026-06-07", dessert: "Fruit" },
    food: { name: "Rice" },
  },
]);
const food = stripLegacyFoodCalendarGroupingFields(foodItems[0]);
assertStringFields(food, ["dessert", "date", "bname", "lname"], "food calendar");
assertDateStringFields(food, ["date"], "food calendar");

const holiday = mapLegacyHoliday({
  name: "Fallback name",
  description: "Independence Day",
  date: new Date("2018-11-22T00:00:00.000Z"),
  repeated: true,
});
assertStringFields(holiday, ["description", "date"], "holiday calendar");
assertDateStringFields(holiday, ["date"], "holiday calendar");
assertLegacyHeader(buildEmptyLegacyNativeListPayload({ branch_id: 0 }), "native list empty header");

const emptyNotifications = buildEmptyNotificationPayload();
assert.equal(typeof emptyNotifications.info.name, "string");
assert.equal(typeof emptyNotifications.info.status, "boolean");
assert.equal(typeof emptyNotifications.info.no_notifications, "string");
for (let index = 1; index <= LEGACY_NOTIFICATION_GROUP_COUNT; index++) {
  const key = `notification${index}`;
  const group = asRecord(emptyNotifications[key], key);
  assertStringFields(group, ["name"], key);
  assertArrayFields(group, ["details"], key);
}
const notificationGroup = buildNotificationGroup("General", [
  { subject: 123, body: "Body", datetime: new Date("2026-06-08T10:20:00.000Z") },
]);
assertStringFields(notificationGroup, ["name"], "notification group");
assertStringFields(notificationGroup.details[0], [
  "subject",
  "body",
  "datetime",
], "notification detail");

const bootstrapItem = mapLegacyGarderieBootstrapItem({
  legacyId: 4,
  name: "Demo",
  alias: "kidzonli_demo_gar_",
  userManageDatabase: "kidzonli_demo_users",
  currentDatabase: "kidzonli_demo_gar",
  path: "/demo_et_parent/",
});
assertStringFields(bootstrapItem, [
  "gid",
  "garderie_name",
  "garderie_alias",
  "user_manage_db",
  "current_db",
  "path",
], "garderie bootstrap");
const bootstrapPayload = buildLegacyGarderieBootstrapPayload([]);
assert.ok(Array.isArray(bootstrapPayload));
assertStringFields(bootstrapPayload[0], [
  "gid",
  "garderie_name",
  "garderie_alias",
  "user_manage_db",
  "current_db",
  "path",
], "default garderie bootstrap");

const failedLogin = buildFailedLegacyParentLogin();
assert.equal(typeof failedLogin.status, "boolean");
assert.equal(failedLogin.id, 0);
assert.equal(failedLogin.usites, 0);
assertStringFields(failedLogin, [
  "fname",
  "lname",
  "url",
  "urlLabel",
  "feedback",
  "token",
  "childId",
], "failed login");
const successfulLogin = buildSuccessfulLegacyParentLogin({
  id: 123,
  usites: 456,
  fname: "Mira",
  lname: "Saab",
  token: "token",
  childId: "modern-child-id",
  modernParentUserId: "modern-parent-id",
});
assertStringFields(successfulLogin, [
  "id",
  "usites",
  "fname",
  "lname",
  "url",
  "urlLabel",
  "feedback",
  "token",
  "childId",
  "modernParentUserId",
], "successful login");
assert.equal(successfulLogin.status, true);

const messageHeader = buildLegacyMessageListHeader("Mira", true, 2);
assertStringFields(messageHeader, ["name"], "message list header");
assert.equal(typeof messageHeader.status, "boolean");
assert.equal(typeof messageHeader.count, "number");
const messageListItem = buildLegacyMessageListItem({
  datetime: "2026-06-08 12:00:00",
  threadId: 42,
  modernThreadId: "modern-thread",
  legacyThreadId: 42,
  subject: "Subject",
  lastMessage: "Message",
  originalSender: "Parent",
});
assertStringFields(messageListItem, [
  "datetime",
  "thread_id",
  "modern_thread_id",
  "subject",
  "last_message",
  "original_sender",
], "message list item");
assert.deepEqual(buildEmptyLegacyMessageList(), [{ name: "", status: false, count: 0 }]);

const messageThreadItem = buildLegacyMessageThreadItem({
  threadId: 42,
  modernThreadId: null,
  legacyThreadId: 42,
  datetime: "2026-06-08 12:00:00",
  sender: "Parent",
  senderType: "PARENT",
  subject: "Subject",
  message: "Reply",
  isRead: false,
});
const messageThreadPayload = buildLegacyMessageThreadPayload([messageThreadItem]);
assertStringFields(messageThreadPayload["1"], [
  "thread_id",
  "datetime",
  "sender",
  "sender_type",
  "subject",
  "message",
], "message thread item");
assert.equal(typeof messageThreadPayload["1"].is_read, "boolean");
assert.deepEqual(buildEmptyLegacyMessageThread(), []);
assert.deepEqual(buildFailedLegacySendMessageResult(), {
  feedback: "Message Failed to Send",
  threadid: 0,
});
assert.deepEqual(buildSentLegacySendMessageResult(42, "modern-thread"), {
  feedback: "Message Sent",
  threadid: 42,
  modern_thread_id: "modern-thread",
});

console.log("parent native parser field assertions passed");

function assertLegacyHeader(value: unknown, label: string) {
  assert.ok(Array.isArray(value), `${label} must be an array`);
  const header = asRecord(value[0], `${label}[0]`);
  assertStringFields(header, ["name"], label);
  assert.equal(typeof header.status, "boolean", `${label}.status must be boolean`);
  assert.equal(typeof header.count, "number", `${label}.count must be number`);
}

function assertStringFields(
  record: JsonRecord,
  keys: readonly string[],
  label: string
) {
  for (const key of keys) {
    assert.equal(typeof record[key], "string", `${label}.${key} must be string`);
  }
}

function assertNumberFields(
  record: JsonRecord,
  keys: readonly string[],
  label: string
) {
  for (const key of keys) {
    assert.equal(typeof record[key], "number", `${label}.${key} must be number`);
  }
}

function assertArrayFields(
  record: JsonRecord,
  keys: readonly string[],
  label: string
) {
  for (const key of keys) {
    assert.ok(Array.isArray(record[key]), `${label}.${key} must be array`);
  }
}

function assertIntegerCoercibleFields(
  record: JsonRecord,
  keys: readonly string[],
  label: string
) {
  for (const key of keys) {
    const value = record[key];
    const numeric = typeof value === "number" ? value : Number(value);
    assert.ok(
      Number.isInteger(numeric),
      `${label}.${key} must be integer-coercible`
    );
  }
}

function assertDateStringFields(
  record: JsonRecord,
  keys: readonly string[],
  label: string
) {
  for (const key of keys) {
    assert.match(
      String(record[key]),
      /^\d{4}-\d{2}-\d{2}$/,
      `${label}.${key} must be YYYY-MM-DD`
    );
  }
}

function firstRecord(value: unknown): JsonRecord {
  assert.ok(Array.isArray(value), "expected array");
  return asRecord(value[0], "first item");
}

function asRecord(value: unknown, label: string): JsonRecord {
  assert.ok(
    value && typeof value === "object" && !Array.isArray(value),
    `${label} must be object`
  );
  return value as JsonRecord;
}
