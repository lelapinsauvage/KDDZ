import type { Prisma, PushPlatform } from "@/generated/prisma/client";

export const LEGACY_PUSH_RESULTS = {
  inserted: "Values inserted Successfully",
  missingParameters: "Missing Paramaters",
  noToken: "No Such Token Exists",
  deleted: "Token Deleted Successfully",
} as const;

export type LegacyPushResult =
  (typeof LEGACY_PUSH_RESULTS)[keyof typeof LEGACY_PUSH_RESULTS];

export type LegacyPushTokenResponse =
  | { result: LegacyPushResult }
  | { result: LegacyPushTokenItem[] };

export type LegacyPushTokenRow = {
  id: string;
  parentUserId: string | null;
  token: string;
  platform: PushPlatform;
  isActive: boolean;
  legacyData: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LegacyPushTokenItem = {
  id: string;
  datetime: string;
  child_id: string;
  token: string;
  os: string;
  active: string;
  modern_id: string;
  parent_user_id: string;
  platform: string;
};

export function buildLegacyPushResult(result: LegacyPushResult) {
  return { result };
}

export function buildEmptyLegacyPushShowResult() {
  return { result: [] as LegacyPushTokenItem[] };
}

export function mapLegacyPushToken(token: LegacyPushTokenRow): LegacyPushTokenItem {
  const legacy = asRecord(token.legacyData);

  return {
    id: readString(legacy, ["legacyId", "id"]) ?? token.id,
    datetime:
      readString(legacy, ["datetime"]) ?? formatSqlDateTime(token.createdAt),
    child_id:
      readString(legacy, ["cid", "child_id", "legacyChildId"]) ?? "",
    token: token.token,
    os: readString(legacy, ["os"]) ?? platformToLegacyOs(token.platform),
    active: token.isActive ? "1" : "0",
    modern_id: token.id,
    parent_user_id: token.parentUserId ?? "",
    platform: token.platform,
  };
}

export function mapLegacyPushPlatform(os: string) {
  // Legacy `notifications_tokens.os`: 1 = Android, 2 = iOS, 3/empty = other.
  if (os === "1") return "ANDROID" as const;
  if (os === "2") return "IOS" as const;
  return "WEB" as const;
}

function platformToLegacyOs(platform: PushPlatform) {
  if (platform === "ANDROID") return "1";
  if (platform === "IOS") return "2";
  return "0";
}

function formatSqlDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return null;
}
