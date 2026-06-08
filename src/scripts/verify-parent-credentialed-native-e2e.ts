import "dotenv/config";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { compare } from "bcryptjs";
import { NextRequest } from "next/server";
import { POST as absencePost } from "@/app/ws/absence.php/route";
import { POST as dailyPost } from "@/app/ws/daily.php/route";
import { POST as financePost } from "@/app/ws/finance.php/route";
import { POST as foodCalendarPost } from "@/app/ws/foodcalendar.php/route";
import { POST as holidayCalendarPost } from "@/app/ws/holcalendar.php/route";
import { POST as oldHolidayCalendarPost } from "@/app/ws/holcalendarOLD.php/route";
import { POST as parentLoginPost } from "@/app/ws/login.php/route";
import { POST as messagesListPost } from "@/app/ws/messagesList.php/route";
import { POST as detailedDailyPost } from "@/app/ws/newdaily.php/route";
import { POST as notificationsPost } from "@/app/ws/notifications_master.php/route";
import { db } from "@/lib/db";
import { LEGACY_NOTIFICATION_GROUP_COUNT } from "@/lib/parent-notification-contract";

type JsonRecord = Record<string, unknown>;
type LegacyRouteHandler = (
  request: NextRequest
) => Response | Promise<Response | undefined> | undefined;
type CandidateCoverage = Record<
  "daily" | "absence" | "finance" | "messages" | "foodCalendar" | "holidays",
  number
>;
type ParentCandidate = {
  username: string;
  score: number;
  coverage: CandidateCoverage;
};

const DEFAULT_PARENT_E2E_PASSWORD = "changeme123";

async function main() {
  const password = process.env.PARENT_E2E_PASSWORD ?? DEFAULT_PARENT_E2E_PASSWORD;
  const selectedParent = process.env.PARENT_E2E_USERNAME
    ? null
    : await findCredentialedParent(password);
  const username = process.env.PARENT_E2E_USERNAME ?? selectedParent?.username;

  assert.ok(
    username,
    "No active parent account matched PARENT_E2E_PASSWORD; set PARENT_E2E_USERNAME/PARENT_E2E_PASSWORD"
  );

  const login = await postLegacyLogin(username, password);
  assert.equal(login.status, true, "parent login should succeed");
  assertStringFields(
    login,
    [
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
    ],
    "parent login"
  );
  const usites = requiredString(login, "usites", "parent login");
  const token = requiredString(login, "token", "parent login");
  assert.ok(login.id !== "0", "successful login id must not use failure sentinel");
  assert.ok(usites !== "0", "successful login usites must not use failure sentinel");

  const dailyPayload = assertLegacyListPayload(
    await postLegacyFormRoute("ws/daily.php", dailyPost, usites, token),
    "ws/daily.php",
    assertDailyItem
  );
  const detailedDailyPayload = assertLegacyListPayload(
    await postLegacyFormRoute("ws/newdaily.php", detailedDailyPost, usites, token),
    "ws/newdaily.php",
    assertDetailedDailyItem
  );
  const absencePayload = assertLegacyListPayload(
    await postLegacyFormRoute("ws/absence.php", absencePost, usites, token),
    "ws/absence.php",
    assertAbsenceItem
  );
  const financePayload = assertLegacyListPayload(
    await postLegacyFormRoute("ws/finance.php", financePost, usites, token),
    "ws/finance.php",
    assertFinanceItem
  );
  const foodCalendarPayload = assertLegacyListPayload(
    await postLegacyFormRoute(
      "ws/foodcalendar.php",
      foodCalendarPost,
      usites,
      token
    ),
    "ws/foodcalendar.php",
    assertFoodCalendarItem
  );
  const holidayPayload = assertLegacyListPayload(
    await postLegacyFormRoute(
      "ws/holcalendar.php",
      holidayCalendarPost,
      usites,
      token
    ),
    "ws/holcalendar.php",
    assertHolidayItem
  );
  const oldHolidayPayload = assertLegacyListPayload(
    await postLegacyFormRoute(
      "ws/holcalendarOLD.php",
      oldHolidayCalendarPost,
      usites,
      token
    ),
    "ws/holcalendarOLD.php",
    assertHolidayItem
  );
  const messagesPayload = assertLegacyListPayload(
    await postLegacyFormRoute(
      "ws/messagesList.php",
      messagesListPost,
      usites,
      token
    ),
    "ws/messagesList.php",
    assertMessageListItem
  );

  const feedCounts = {
    daily: legacyListItemCount(dailyPayload),
    newdaily: legacyListItemCount(detailedDailyPayload),
    absence: legacyListItemCount(absencePayload),
    finance: legacyListItemCount(financePayload),
    foodcalendar: legacyListItemCount(foodCalendarPayload),
    holcalendar: legacyListItemCount(holidayPayload),
    holcalendarOLD: legacyListItemCount(oldHolidayPayload),
    messagesList: legacyListItemCount(messagesPayload),
  };
  assert.ok(feedCounts.daily > 0, "credentialed daily feed should cover real rows");
  assert.ok(feedCounts.newdaily > 0, "credentialed newdaily feed should cover real rows");
  assert.ok(feedCounts.absence > 0, "credentialed absence feed should cover real rows");
  assert.ok(feedCounts.finance > 0, "credentialed finance feed should cover real rows");
  assert.ok(
    feedCounts.foodcalendar > 0,
    "credentialed food calendar feed should cover real rows"
  );
  assert.ok(
    feedCounts.holcalendar > 0,
    "credentialed holiday calendar feed should cover real rows"
  );
  assert.equal(
    feedCounts.holcalendarOLD,
    feedCounts.holcalendar,
    "holcalendarOLD.php should alias holcalendar.php"
  );

  const notificationPayload = await postNotificationsMaster(usites, token);
  assertNotificationPayload(notificationPayload, "notifications_master");

  console.log(
    JSON.stringify(
      {
        username,
        selectedCoverage: selectedParent?.coverage ?? null,
        usites,
        childId: login.childId,
        feedCounts,
        notificationGroups: LEGACY_NOTIFICATION_GROUP_COUNT,
        detailCounts: notificationDetailCounts(notificationPayload),
      },
      null,
      2
    )
  );
  console.log("parent credentialed native E2E assertions passed");
}

async function findCredentialedParent(
  password: string
): Promise<ParentCandidate | null> {
  const parents = await db.parentUser.findMany({
    where: { isActive: true },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      childId: true,
      child: { select: { branchId: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 250,
  });

  const candidates: ParentCandidate[] = [];
  for (const parent of parents) {
    if (await matchesParentPassword(password, parent.passwordHash)) {
      const coverage = await parentCoverage(parent);
      candidates.push({
        username: parent.username,
        coverage,
        score: parentCoverageScore(coverage),
      });
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] ?? null;
}

async function parentCoverage(parent: {
  id: string;
  childId: string;
  child: { branchId: string };
}): Promise<CandidateCoverage> {
  const [daily, absence, finance, messages, foodCalendar, holidays] =
    await Promise.all([
      db.dailyReport.count({
        where: { childId: parent.childId, status: "SUBMITTED" },
      }),
      db.absenceReport.count({ where: { childId: parent.childId } }),
      db.payment.count({
        where: { childId: parent.childId, deletedAt: null },
      }),
      db.message.count({
        where: {
          OR: [
            { senderId: parent.id, senderType: "PARENT" },
            { recipientId: parent.id, recipientType: "PARENT" },
          ],
        },
      }),
      db.foodCalendar.count({ where: { branchId: parent.child.branchId } }),
      db.holiday.count({ where: { isActive: true } }),
    ]);

  return { daily, absence, finance, messages, foodCalendar, holidays };
}

function parentCoverageScore(coverage: CandidateCoverage) {
  const presenceScore =
    (coverage.daily > 0 ? 10_000 : 0) +
    (coverage.absence > 0 ? 8_000 : 0) +
    (coverage.finance > 0 ? 8_000 : 0) +
    (coverage.foodCalendar > 0 ? 4_000 : 0) +
    (coverage.holidays > 0 ? 4_000 : 0) +
    (coverage.messages > 0 ? 2_000 : 0);

  return (
    presenceScore +
    Math.min(coverage.daily, 250) +
    Math.min(coverage.absence, 50) +
    Math.min(coverage.finance, 50) +
    Math.min(coverage.foodCalendar, 50) +
    Math.min(coverage.holidays, 50) +
    Math.min(coverage.messages, 50)
  );
}

async function matchesParentPassword(password: string, passwordHash: string) {
  if (await compare(password, passwordHash)) return true;
  const md5 = createHash("md5").update(password).digest("hex");
  return compare(`md5:${md5}`, passwordHash);
}

async function postLegacyLogin(username: string, password: string) {
  const request = new NextRequest("http://localhost/ws/login.php", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": `verify-parent-e2e-${Date.now()}`,
    },
    body: new URLSearchParams({
      name: username,
      pass: password,
    }),
  });

  const response = await parentLoginPost(request);
  assert.ok(response, "ws/login.php should return a response");
  assert.equal(response.status, 200, "ws/login.php should return HTTP 200");
  return asRecord(await response.json(), "ws/login.php response");
}

async function postLegacyFormRoute(
  path: string,
  handler: LegacyRouteHandler,
  usites: string,
  token: string
) {
  assert.ok(token, "login.token must not be empty");

  const request = new NextRequest(`http://localhost/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ usites }),
  });

  const response = await handler(request);
  assert.ok(response, `${path} should return a response`);
  assert.equal(response.status, 200, `${path} should return HTTP 200`);
  return await response.json();
}

async function postNotificationsMaster(usites: string, token: string) {
  assert.ok(token, "login.token must not be empty");

  const request = new NextRequest("http://localhost/ws/notifications_master.php", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ usites }),
  });

  const response = await notificationsPost(request);
  assert.ok(response, "ws/notifications_master.php should return a response");
  assert.equal(
    response.status,
    200,
    "ws/notifications_master.php should return HTTP 200"
  );
  return asRecord(await response.json(), "ws/notifications_master.php response");
}

function assertLegacyListPayload(
  payload: unknown,
  label: string,
  assertItem?: (record: JsonRecord, label: string) => void
) {
  assert.ok(Array.isArray(payload), `${label} response must be an array`);
  const header = asRecord(payload[0], `${label}[0]`);
  assertStringFields(header, ["name"], `${label}[0]`);
  assert.equal(typeof header.status, "boolean", `${label}[0].status must be boolean`);
  assert.equal(typeof header.count, "number", `${label}[0].count must be number`);
  assert.equal(
    header.count,
    payload.length - 1,
    `${label}[0].count must match row count`
  );

  payload.slice(1).forEach((item, index) => {
    assertItem?.(asRecord(item, `${label}[${index + 1}]`), `${label}[${index + 1}]`);
  });

  return payload;
}

function legacyListItemCount(payload: unknown[]) {
  return Math.max(payload.length - 1, 0);
}

function assertDailyItem(record: JsonRecord, label: string) {
  assertStringFields(record, [
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
  ], label);
  assertStringFields(record, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], label);
  assertDateStringFields(record, ["reportdate"], label);
  assertIntegerCoercibleFields(record, [
    "breakf",
    "lunchf",
    "dess_portion",
    "ur_pot",
    "stool_pot",
    "ur_di",
    "stool_di",
    "mcc",
  ], label);
}

function assertDetailedDailyItem(record: JsonRecord, label: string) {
  assertStringFields(record, [
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
  ], label);
  assertDateStringFields(record, ["reportdate"], label);
  assertNumberFields(record, ["breakf", "lunchf", "dess_portion"], label);
  assertArrayFields(record, ["fever", "milk", "takenmeds_Arr"], label);
  assertStringArray(record.takenmeds_Arr, `${label}.takenmeds_Arr`);
  for (const [index, fever] of arrayItems(record.fever, `${label}.fever`).entries()) {
    assertStringFields(asRecord(fever, `${label}.fever[${index}]`), [
      "fvalue",
      "ftime",
    ], `${label}.fever[${index}]`);
  }
  for (const [index, milk] of arrayItems(record.milk, `${label}.milk`).entries()) {
    assertStringFields(asRecord(milk, `${label}.milk[${index}]`), [
      "mcc",
      "mtime",
    ], `${label}.milk[${index}]`);
  }
}

function assertAbsenceItem(record: JsonRecord, label: string) {
  assertStringFields(record, [
    "report_id",
    "reportdate",
    "ab_reason",
    "ab_from",
    "ab_to",
    "attend_hos",
    "hos_name",
    "dr_name",
    "is_rep_draft",
  ], label);
  assertDateStringFields(record, ["reportdate", "ab_from", "ab_to"], label);
}

function assertFinanceItem(record: JsonRecord, label: string) {
  assertStringFields(record, [
    "type",
    "target",
    "for",
    "year",
    "from",
    "to",
    "currency",
    "datetime",
    "amount",
  ], label);
}

function assertFoodCalendarItem(record: JsonRecord, label: string) {
  assertStringFields(record, ["dessert", "date", "bname", "lname"], label);
  assertDateStringFields(record, ["date"], label);
}

function assertHolidayItem(record: JsonRecord, label: string) {
  assertStringFields(record, ["description", "date"], label);
  assertDateStringFields(record, ["date"], label);
}

function assertMessageListItem(record: JsonRecord, label: string) {
  assertStringFields(record, [
    "datetime",
    "thread_id",
    "modern_thread_id",
    "subject",
    "last_message",
    "original_sender",
  ], label);
  assert.ok(
    record.legacy_thread_id === null || typeof record.legacy_thread_id === "number",
    `${label}.legacy_thread_id must be number or null`
  );
}

function assertNotificationPayload(payload: JsonRecord, label: string) {
  const info = asRecord(payload.info, `${label}.info`);
  assertStringFields(info, ["name", "no_notifications"], `${label}.info`);
  assert.equal(typeof info.status, "boolean", `${label}.info.status must be boolean`);

  for (let index = 1; index <= LEGACY_NOTIFICATION_GROUP_COUNT; index++) {
    const group = asRecord(
      payload[`notification${index}`],
      `${label}.notification${index}`
    );
    assertStringFields(group, ["name"], `${label}.notification${index}`);
    assert.ok(
      Array.isArray(group.details),
      `${label}.notification${index}.details must be an array`
    );
    group.details.forEach((detail, detailIndex) => {
      assertStringFields(
        asRecord(detail, `${label}.notification${index}.details[${detailIndex}]`),
        ["subject", "body", "datetime"],
        `${label}.notification${index}.details[${detailIndex}]`
      );
    });
  }
}

function notificationDetailCounts(payload: JsonRecord) {
  return Object.fromEntries(
    Array.from({ length: LEGACY_NOTIFICATION_GROUP_COUNT }, (_, index) => {
      const key = `notification${index + 1}`;
      const group = asRecord(payload[key], key);
      return [key, Array.isArray(group.details) ? group.details.length : 0];
    })
  );
}

function assertStringFields(record: JsonRecord, keys: readonly string[], label: string) {
  for (const key of keys) {
    assert.equal(typeof record[key], "string", `${label}.${key} must be string`);
  }
}

function assertNumberFields(record: JsonRecord, keys: readonly string[], label: string) {
  for (const key of keys) {
    assert.equal(typeof record[key], "number", `${label}.${key} must be number`);
  }
}

function assertArrayFields(record: JsonRecord, keys: readonly string[], label: string) {
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

function assertStringArray(value: unknown, label: string) {
  for (const [index, item] of arrayItems(value, label).entries()) {
    assert.equal(typeof item, "string", `${label}[${index}] must be string`);
  }
}

function arrayItems(value: unknown, label: string) {
  assert.ok(Array.isArray(value), `${label} must be array`);
  return value;
}

function requiredString(record: JsonRecord, key: string, label: string) {
  const value = record[key];
  assert.equal(typeof value, "string", `${label}.${key} must be string`);
  return value as string;
}

function asRecord(value: unknown, label: string): JsonRecord {
  assert.ok(
    value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`
  );
  return value as JsonRecord;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
