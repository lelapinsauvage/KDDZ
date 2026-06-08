import "dotenv/config";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { compare } from "bcryptjs";
import { NextRequest } from "next/server";
import { POST as parentLoginPost } from "@/app/ws/login.php/route";
import { POST as notificationsPost } from "@/app/ws/notifications_master.php/route";
import { db } from "@/lib/db";
import { LEGACY_NOTIFICATION_GROUP_COUNT } from "@/lib/parent-notification-contract";

type JsonRecord = Record<string, unknown>;

const DEFAULT_PARENT_E2E_PASSWORD = "changeme123";

async function main() {
  const password = process.env.PARENT_E2E_PASSWORD ?? DEFAULT_PARENT_E2E_PASSWORD;
  const username =
    process.env.PARENT_E2E_USERNAME ?? (await findCredentialedParentUsername(password));

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
  assert.ok(login.id !== "0", "successful login id must not use failure sentinel");
  assert.ok(login.usites !== "0", "successful login usites must not use failure sentinel");

  const notificationPayload = await postNotificationsMaster(login.usites, login.token);
  assertNotificationPayload(notificationPayload, "notifications_master");

  console.log(
    JSON.stringify(
      {
        username,
        usites: login.usites,
        childId: login.childId,
        notificationGroups: LEGACY_NOTIFICATION_GROUP_COUNT,
        detailCounts: notificationDetailCounts(notificationPayload),
      },
      null,
      2
    )
  );
  console.log("parent credentialed native E2E assertions passed");
}

async function findCredentialedParentUsername(password: string) {
  const parents = await db.parentUser.findMany({
    where: { isActive: true },
    select: { username: true, passwordHash: true },
    orderBy: { createdAt: "asc" },
    take: 250,
  });

  for (const parent of parents) {
    if (await matchesParentPassword(password, parent.passwordHash)) {
      return parent.username;
    }
  }

  return null;
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

async function postNotificationsMaster(usites: unknown, token: unknown) {
  if (typeof usites !== "string") {
    throw new TypeError("login.usites must be a string");
  }
  if (typeof token !== "string") {
    throw new TypeError("login.token must be a string");
  }
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
