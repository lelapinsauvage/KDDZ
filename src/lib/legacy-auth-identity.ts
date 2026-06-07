import type { Prisma } from "@/generated/prisma/client";

type AppDb = typeof import("./db").db;

const STAFF_LOGIN_RECORD_TYPES = ["login_user", "manager_login_user"] as const;

const loginUserInclude = {
  branch: { select: { organizationId: true } },
} satisfies Prisma.UserInclude;

const legacyLoginRecordSelect = {
  id: true,
  sourceDatabase: true,
  legacyTable: true,
  legacyKey: true,
  legacyId: true,
  recordType: true,
  userId: true,
  legacyUserId: true,
  username: true,
  email: true,
  recordKey: true,
  recordValue: true,
  isDisabled: true,
  redirect: true,
  legacyData: true,
} satisfies Prisma.LegacyAuthRecordSelect;

export type LegacyLoginRecord = Prisma.LegacyAuthRecordGetPayload<{
  select: typeof legacyLoginRecordSelect;
}>;

export type ResolvedStaffLoginIdentity = {
  user: Prisma.UserGetPayload<{ include: typeof loginUserInclude }> | null;
  legacy: LegacyLoginRecord | null;
};

export type LegacyLoginDisabledStatus =
  | { isDisabled: false; reason: null; levelName?: null }
  | {
      isDisabled: true;
      reason: "modern_user_inactive" | "legacy_user_restricted" | "legacy_level_disabled";
      levelName?: string | null;
    };

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function legacyObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function legacyString(value: unknown, key: string) {
  const raw = legacyObject(value)[key];
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
}

export function parsePhpLevelIds(serialized: string | null | undefined) {
  if (!serialized?.trim()) return [];

  const values = new Set<number>();
  for (const match of serialized.matchAll(/s:\d+:"(\d+)"/g)) {
    values.add(Number.parseInt(match[1], 10));
  }
  for (const match of serialized.matchAll(/i:(\d+)/g)) {
    values.add(Number.parseInt(match[1], 10));
  }

  if (values.size === 0 && !serialized.includes("a:")) {
    for (const match of serialized.matchAll(/\b(\d+)\b/g)) {
      values.add(Number.parseInt(match[1], 10));
    }
  }

  return Array.from(values).filter((value) => Number.isFinite(value));
}

function recordMatchesCredential(record: LegacyLoginRecord, credential: string) {
  const target = normalize(credential);
  const data = record.legacyData;
  const candidates = [
    record.email,
    record.username,
    record.recordKey,
    legacyString(data, "email"),
    legacyString(data, "username"),
  ];
  return candidates.some((candidate) => normalize(candidate) === target);
}

async function findUserByEmail(db: AppDb, email: string) {
  if (!email.trim()) return null;
  return db.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    include: loginUserInclude,
  });
}

async function findUserForLegacyRecord(db: AppDb, record: LegacyLoginRecord) {
  if (record.userId) {
    const user = await db.user.findUnique({
      where: { id: record.userId },
      include: loginUserInclude,
    });
    if (user) return user;
  }

  return (
    (await findUserByEmail(db, record.email ?? "")) ??
    (await findUserByEmail(db, legacyString(record.legacyData, "email")))
  );
}

export async function findStaffLoginRecordByCredential(
  db: AppDb,
  credential: string,
) {
  const identifier = credential.trim();
  if (!identifier) return null;

  const records = await db.legacyAuthRecord.findMany({
    where: {
      recordType: { in: [...STAFF_LOGIN_RECORD_TYPES] },
      OR: [
        { email: { equals: identifier, mode: "insensitive" } },
        { username: { equals: identifier, mode: "insensitive" } },
        { recordKey: { equals: identifier, mode: "insensitive" } },
      ],
    },
    orderBy: [
      { recordType: "asc" },
      { sourceDatabase: "asc" },
      { legacyId: "asc" },
    ],
    select: legacyLoginRecordSelect,
  });

  return (
    records.find((record) => recordMatchesCredential(record, identifier)) ?? null
  );
}

export async function resolveStaffLoginIdentity(
  db: AppDb,
  credential: string,
): Promise<ResolvedStaffLoginIdentity | null> {
  const identifier = credential.trim();
  if (!identifier) return null;

  const legacy = await findStaffLoginRecordByCredential(db, identifier);
  if (legacy) {
    const user = await findUserForLegacyRecord(db, legacy);
    if (user) return { user, legacy };
  }

  const directUser = await findUserByEmail(db, identifier);
  if (directUser) return { user: directUser, legacy };

  return legacy ? { user: null, legacy } : null;
}

async function hasPendingLegacyActivation(
  db: AppDb,
  identity: ResolvedStaffLoginIdentity,
) {
  const user = identity.user;
  const legacy = identity.legacy;
  const email = user?.email ?? legacy?.email ?? legacyString(legacy?.legacyData, "email");
  const username = legacy?.username ?? legacy?.recordKey;
  const orFilters: Prisma.LegacyAuthRecordWhereInput[] = [];
  if (user?.id) orFilters.push({ userId: user.id });
  if (email) orFilters.push({ email: { equals: email, mode: "insensitive" } });
  if (username) {
    orFilters.push({ username: { equals: username, mode: "insensitive" } });
  }

  if (orFilters.length === 0) return false;

  const pending = await db.legacyAuthRecord.findFirst({
    where: {
      legacyTable: { in: ["login_confirm", "login_confirm_man"] },
      recordType: "new_user",
      OR: orFilters,
    },
    select: { id: true },
  });

  return Boolean(pending);
}

export async function getLegacyLoginDisabledStatus(
  db: AppDb,
  identity: ResolvedStaffLoginIdentity | null,
): Promise<LegacyLoginDisabledStatus> {
  if (!identity) return { isDisabled: false, reason: null };

  const pendingActivation = await hasPendingLegacyActivation(db, identity);
  if (pendingActivation) return { isDisabled: false, reason: null };

  if (identity.user && !identity.user.isActive) {
    return { isDisabled: true, reason: "modern_user_inactive" };
  }

  const legacy = identity.legacy;
  if (!legacy) return { isDisabled: false, reason: null };

  if (legacy.isDisabled) {
    return { isDisabled: true, reason: "legacy_user_restricted" };
  }

  const primaryLevelId = parsePhpLevelIds(legacy.recordValue)[0];
  if (!primaryLevelId) return { isDisabled: false, reason: null };

  const levelRecordType =
    legacy.recordType === "manager_login_user"
      ? "manager_login_level"
      : "login_level";
  const level = await db.legacyAuthRecord.findFirst({
    where: {
      sourceDatabase: legacy.sourceDatabase,
      recordType: levelRecordType,
      legacyId: primaryLevelId,
      isDisabled: true,
    },
    select: {
      recordKey: true,
      legacyData: true,
    },
  });

  if (!level) return { isDisabled: false, reason: null };

  return {
    isDisabled: true,
    reason: "legacy_level_disabled",
    levelName: level.recordKey ?? legacyString(level.legacyData, "level_name"),
  };
}
