import "dotenv/config";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  buildEmptyNotificationPayload,
  LEGACY_NOTIFICATION_GROUP_COUNT,
} from "@/lib/parent-notification-contract";

process.env.AUTH_SECRET ??= "parent-notification-runtime-fallback-test-secret";

type JsonRecord = Record<string, unknown>;

async function main() {
  const { GET: apiGet, POST: apiPost } = await import(
    "@/app/api/parent/notifications/[childId]/route"
  );
  const { GET: wsMasterGet, POST: wsMasterPost } = await import(
    "@/app/ws/notifications_master.php/route"
  );
  const { POST: wsAliasPost } = await import("@/app/ws/notifications.php/route");

  const cases: Array<{ label: string; payload: unknown }> = [
    {
      label: "api POST malformed JSON",
      payload: await json(
        await apiPost(
          new NextRequest("http://localhost/api/parent/notifications/legacy", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{",
          }),
          { params: Promise.resolve({ childId: "legacy" }) },
        ),
      ),
    },
    {
      label: "api GET missing child",
      payload: await json(
        await apiGet(new NextRequest("http://localhost/api/parent/notifications/0"), {
          params: Promise.resolve({ childId: "0" }),
        }),
      ),
    },
    {
      label: "ws master POST no usites",
      payload: await json(
        await wsMasterPost(
          new NextRequest("http://localhost/ws/notifications_master.php", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "",
          }),
        ),
      ),
    },
    {
      label: "ws master GET bad usites",
      payload: await json(
        await wsMasterGet(
          new NextRequest(
            "http://localhost/ws/notifications_master.php?usites=not-a-child",
          ),
        ),
      ),
    },
    {
      label: "ws notifications alias bad usites",
      payload: await json(
        await wsAliasPost(
          new NextRequest("http://localhost/ws/notifications.php", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ usites: "not-a-child" }),
          }),
        ),
      ),
    },
  ];

  for (const item of cases) {
    assertEmptyNotificationPayload(item.payload, item.label);
  }

  const canonical = buildEmptyNotificationPayload();
  assert.deepEqual(
    Object.keys(canonical).sort(),
    Object.keys(cases[0].payload as JsonRecord).sort(),
    "runtime fallback must keep the same top-level keys as the canonical empty payload",
  );

  console.log("parent notification runtime fallbacks verified.");
}

async function json(response: Response | undefined) {
  assert.ok(response, "route should return a response");
  assert.equal(response.status, 200, "fallback route should return HTTP 200");
  return (await response.json()) as unknown;
}

function assertEmptyNotificationPayload(payload: unknown, label: string) {
  const record = asRecord(payload, label);
  const info = asRecord(record.info, `${label}.info`);
  assert.equal(info.name, "", `${label}.info.name`);
  assert.equal(info.status, false, `${label}.info.status`);
  assert.equal(
    info.no_notifications,
    "No New Notifications",
    `${label}.info.no_notifications`,
  );

  for (let index = 1; index <= LEGACY_NOTIFICATION_GROUP_COUNT; index++) {
    const key = `notification${index}`;
    const group = asRecord(record[key], `${label}.${key}`);
    assert.equal(typeof group.name, "string", `${label}.${key}.name`);
    assert.ok(Array.isArray(group.details), `${label}.${key}.details`);
    assert.equal(group.details.length, 0, `${label}.${key}.details length`);
  }
}

function asRecord(value: unknown, label: string): JsonRecord {
  assert.ok(
    value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`,
  );
  return value as JsonRecord;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
