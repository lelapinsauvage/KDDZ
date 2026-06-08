import assert from "node:assert/strict";
import {
  buildEmptyLegacyPushShowResult,
  buildLegacyPushResult,
  LEGACY_PUSH_RESULTS,
  mapLegacyPushPlatform,
  mapLegacyPushToken,
} from "@/lib/parent-push-token-contracts";

assert.deepEqual(
  buildLegacyPushResult(LEGACY_PUSH_RESULTS.inserted),
  { result: "Values inserted Successfully" }
);
assert.deepEqual(
  buildLegacyPushResult(LEGACY_PUSH_RESULTS.missingParameters),
  { result: "Missing Paramaters" }
);
assert.deepEqual(
  buildLegacyPushResult(LEGACY_PUSH_RESULTS.noToken),
  { result: "No Such Token Exists" }
);
assert.deepEqual(
  buildLegacyPushResult(LEGACY_PUSH_RESULTS.deleted),
  { result: "Token Deleted Successfully" }
);

const emptyShow = buildEmptyLegacyPushShowResult();
assert.equal(Array.isArray(emptyShow.result), true, "show result must be array");
assert.equal(emptyShow.result.length, 0, "empty show result must be empty array");

assert.equal(mapLegacyPushPlatform("1"), "ANDROID");
assert.equal(mapLegacyPushPlatform("2"), "IOS");
assert.equal(mapLegacyPushPlatform("0"), "WEB");
assert.equal(mapLegacyPushPlatform("3"), "WEB");

const mapped = mapLegacyPushToken({
  id: "modern-token-id",
  parentUserId: null,
  token: "player-token",
  platform: "IOS",
  isActive: true,
  createdAt: new Date("2026-06-08T10:20:30.000Z"),
  updatedAt: new Date("2026-06-08T10:21:30.000Z"),
  legacyData: {
    id: 12,
    cid: 42,
    os: 2,
    datetime: "2026-06-08 09:00:00",
  },
});

for (const key of [
  "id",
  "datetime",
  "child_id",
  "token",
  "os",
  "active",
  "modern_id",
  "parent_user_id",
  "platform",
] as const) {
  assert.equal(typeof mapped[key], "string", `${key} must be string`);
}

assert.deepEqual(mapped, {
  id: "12",
  datetime: "2026-06-08 09:00:00",
  child_id: "42",
  token: "player-token",
  os: "2",
  active: "1",
  modern_id: "modern-token-id",
  parent_user_id: "",
  platform: "IOS",
});

const fallback = mapLegacyPushToken({
  id: "modern-token-id",
  parentUserId: "parent-user-id",
  token: "web-token",
  platform: "WEB",
  isActive: false,
  createdAt: new Date("2026-06-08T10:20:30.000Z"),
  updatedAt: new Date("2026-06-08T10:21:30.000Z"),
  legacyData: null,
});

assert.equal(fallback.id, "modern-token-id");
assert.equal(fallback.datetime, "2026-06-08 10:20:30");
assert.equal(fallback.child_id, "");
assert.equal(fallback.os, "0");
assert.equal(fallback.active, "0");
assert.equal(fallback.parent_user_id, "parent-user-id");

console.log("parent push-token legacy contract assertions passed");
