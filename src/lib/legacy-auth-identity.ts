import type { Prisma } from "@/generated/prisma/client";

type AppDb = typeof import("./db").db;

const STAFF_LOGIN_RECORD_TYPES = ["login_user", "manager_login_user"] as const;
const LEGACY_LOGIN_SETTINGS_TABLES = [
  "login_settings",
  "login_settings_man",
] as const;

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

export type LegacyLoginSessionContext = {
  sourceDatabase: string;
  legacyTable: string;
  legacyUserId: number | null;
  legacyDbId: number | null;
  legacyDatabaseName: string | null;
  legacySelectedYear: string | null;
};

export type LegacyLoginDisabledStatus =
  | { isDisabled: false; reason: null; levelName?: null }
  | {
      isDisabled: true;
      reason:
        | "legacy_logins_disabled"
        | "modern_user_inactive"
        | "legacy_user_restricted"
        | "legacy_level_disabled";
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

function legacyBool(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return Boolean(
    normalized && !["0", "false", "no", "off", "null"].includes(normalized),
  );
}

function loginSettingsTableForRecord(record: LegacyLoginRecord) {
  return record.recordType === "manager_login_user"
    ? "login_settings_man"
    : "login_settings";
}

export function legacyString(value: unknown, key: string) {
  const raw = legacyObject(value)[key];
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
}

function legacyNumber(value: unknown, key: string) {
  const parsed = Number.parseInt(legacyString(value, key), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

export async function getLegacyLoginSessionContext(
  db: AppDb,
  identity: ResolvedStaffLoginIdentity | null,
): Promise<LegacyLoginSessionContext | null> {
  if (!identity) return null;
  const record =
    identity.legacy ??
    (identity.user
      ? await findLinkedLegacyLoginRecordForUser(db, identity.user.id)
      : null);
  if (!record) return null;

  const legacyDbId = legacyNumber(record.legacyData, "db_id");
  const yearDatabase = legacyDbId
    ? await db.legacyYearDatabase.findFirst({
        where: {
          sourceDatabase: record.sourceDatabase,
          legacyTable: "year_db",
          legacyId: legacyDbId,
        },
        select: {
          databaseName: true,
          selectedYear: true,
        },
      })
    : null;

  return {
    sourceDatabase: record.sourceDatabase,
    legacyTable: record.legacyTable,
    legacyUserId: record.legacyUserId ?? record.legacyId,
    legacyDbId,
    legacyDatabaseName:
      yearDatabase?.databaseName ||
      legacyString(record.legacyData, "dbname") ||
      null,
    legacySelectedYear:
      yearDatabase?.selectedYear ||
      legacyString(record.legacyData, "sel_year") ||
      null,
  };
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

async function findLinkedLegacyLoginRecordForUser(db: AppDb, userId: string) {
  return db.legacyAuthRecord.findFirst({
    where: {
      userId,
      recordType: { in: [...STAFF_LOGIN_RECORD_TYPES] },
    },
    orderBy: [
      { recordType: "asc" },
      { sourceDatabase: "asc" },
      { legacyId: "asc" },
    ],
    select: legacyLoginRecordSelect,
  });
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

async function legacyLoginsDisabledForRecord(
  db: AppDb,
  record: LegacyLoginRecord | null,
) {
  const where: Prisma.LegacySettingWhereInput = {
    settingKey: "disable-logins-enable",
    legacyTable: { in: [...LEGACY_LOGIN_SETTINGS_TABLES] },
  };

  if (record) {
    where.sourceDatabase = record.sourceDatabase;
    where.legacyTable = loginSettingsTableForRecord(record);
  }

  const settings = await db.legacySetting.findMany({
    where,
    orderBy: [
      { legacyTable: "asc" },
      { sourceDatabase: "asc" },
      { legacyId: "desc" },
    ],
    select: {
      sourceDatabase: true,
      legacyTable: true,
      settingValue: true,
    },
  });
  const latestSettings = new Map<string, string | null>();
  for (const setting of settings) {
    const key = `${setting.sourceDatabase}:${setting.legacyTable}`;
    if (!latestSettings.has(key)) {
      latestSettings.set(key, setting.settingValue);
    }
  }

  return Array.from(latestSettings.values()).some((value) =>
    legacyBool(value),
  );
}

export async function getLegacyLoginDisabledStatus(
  db: AppDb,
  identity: ResolvedStaffLoginIdentity | null,
): Promise<LegacyLoginDisabledStatus> {
  if (!identity) {
    const loginsDisabled = await legacyLoginsDisabledForRecord(db, null);
    return loginsDisabled
      ? { isDisabled: true, reason: "legacy_logins_disabled" }
      : { isDisabled: false, reason: null };
  }

  const legacyLoginRecord =
    identity.legacy ??
    (identity.user
      ? await findLinkedLegacyLoginRecordForUser(db, identity.user.id)
      : null);
  if (await legacyLoginsDisabledForRecord(db, legacyLoginRecord)) {
    return { isDisabled: true, reason: "legacy_logins_disabled" };
  }

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
