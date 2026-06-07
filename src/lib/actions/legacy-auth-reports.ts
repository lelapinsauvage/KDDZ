"use server";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type LegacyAuthReportRecordType = "login_user" | "manager_login_user";
export type LegacyAuthReportProvider =
  | "facebook"
  | "twitter"
  | "google"
  | "yahoo";

export type LegacyAuthReportGroup = {
  key: string;
  sourceDatabase: string;
  recordType: LegacyAuthReportRecordType;
  label: string;
};

export type LegacyAuthReportProviderSummary = {
  key: LegacyAuthReportProvider;
  label: string;
  color: string;
  total: number;
  range: number;
};

export type LegacyAuthReportPoint = {
  date: string;
  label: string;
  timestamp: number;
  newUsers: number;
} & Record<LegacyAuthReportProvider, number>;

export type LegacyAuthTopUser = {
  legacyUserId: number;
  username: string;
  loginCount: number;
};

export type LegacyAuthReportsData = {
  groups: LegacyAuthReportGroup[];
  selectedGroupKey: string | null;
  startDate: string;
  endDate: string;
  totals: {
    registered: number;
    rangeRegistered: number;
    loginEvents: number;
  };
  providers: LegacyAuthReportProviderSummary[];
  series: LegacyAuthReportPoint[];
  topUsers: LegacyAuthTopUser[];
};

export type LegacyAuthReportsInput = {
  groupKey?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

const PROVIDERS: Array<{
  key: LegacyAuthReportProvider;
  label: string;
  color: string;
}> = [
  { key: "facebook", label: "Facebook", color: "#3B5998" },
  { key: "twitter", label: "Twitter", color: "#0088CC" },
  { key: "google", label: "Google", color: "#F23437" },
  { key: "yahoo", label: "Yahoo", color: "#670D6D" },
];

function groupKey(sourceDatabase: string, recordType: LegacyAuthReportRecordType) {
  return `${sourceDatabase}:${recordType}`;
}

function groupLabel(recordType: LegacyAuthReportRecordType) {
  return recordType === "manager_login_user" ? "Manager Users" : "Staff Users";
}

function legacyObject(value: unknown): Prisma.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }
  return {};
}

function legacyString(value: unknown, key: string) {
  const raw = legacyObject(value)[key];
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
}

function legacyBool(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return Boolean(
    normalized && !["0", "false", "no", "off", "null"].includes(normalized),
  );
}

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseInputDate(value: string | null | undefined, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function compareDateKey(date: Date | null) {
  return date ? dateInput(date) : null;
}

function parseLegacyDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("0000-00-00")) return null;

  const isoLike = trimmed.includes("T")
    ? trimmed
    : `${trimmed.replace(" ", "T")}Z`;
  const parsed = new Date(isoLike);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function registeredAt(record: { legacyData: Prisma.JsonValue | null }) {
  return parseLegacyDate(
    legacyString(record.legacyData, "timestamp") ||
      legacyString(record.legacyData, "created_at"),
  );
}

function emptyPoint(date: Date): LegacyAuthReportPoint {
  return {
    date: dateInput(date),
    label: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    timestamp: date.getTime(),
    newUsers: 0,
    facebook: 0,
    twitter: 0,
    google: 0,
    yahoo: 0,
  };
}

function buildSeries(startDate: Date, endDate: Date) {
  const points = new Map<string, LegacyAuthReportPoint>();
  for (
    let cursor = new Date(startDate);
    cursor <= endDate;
    cursor = addDays(cursor, 1)
  ) {
    const point = emptyPoint(cursor);
    points.set(point.date, point);
  }
  return points;
}

function providerValue(record: { legacyData: Prisma.JsonValue | null }, provider: string) {
  return legacyString(record.legacyData, provider).trim();
}

function providerTimestamp(record: { legacyData: Prisma.JsonValue | null }) {
  return parseLegacyDate(legacyString(record.legacyData, "timestamp"));
}

function legacyDisplayName(record: {
  username: string | null;
  recordKey: string | null;
  legacyData: Prisma.JsonValue | null;
  legacyId: number;
}) {
  return (
    record.username?.trim() ||
    record.recordKey?.trim() ||
    legacyString(record.legacyData, "username").trim() ||
    `User ${record.legacyId}`
  );
}

async function getGroups() {
  const records = await db.legacyAuthRecord.findMany({
    where: {
      recordType: { in: ["login_user", "manager_login_user"] },
    },
    orderBy: [
      { sourceDatabase: "asc" },
      { recordType: "asc" },
      { legacyId: "asc" },
    ],
    select: {
      sourceDatabase: true,
      recordType: true,
    },
  });

  const groups = new Map<string, LegacyAuthReportGroup>();
  for (const record of records) {
    const recordType = record.recordType as LegacyAuthReportRecordType;
    if (recordType !== "login_user" && recordType !== "manager_login_user") {
      continue;
    }
    const key = groupKey(record.sourceDatabase, recordType);
    groups.set(key, {
      key,
      sourceDatabase: record.sourceDatabase,
      recordType,
      label: groupLabel(recordType),
    });
  }

  return Array.from(groups.values());
}

async function getEnabledProviders(
  sourceDatabase: string,
  recordType: LegacyAuthReportRecordType,
) {
  const legacyTable =
    recordType === "manager_login_user" ? "login_settings_man" : "login_settings";
  const settings = await db.legacySetting.findMany({
    where: {
      sourceDatabase,
      legacyTable,
      settingKey: {
        in: PROVIDERS.map((provider) => `integration-${provider.key}-enable`),
      },
    },
    select: {
      settingKey: true,
      settingValue: true,
    },
  });

  const enabledByKey = new Map(
    settings.map((setting) => [setting.settingKey, legacyBool(setting.settingValue)]),
  );

  return PROVIDERS.filter((provider) =>
    enabledByKey.get(`integration-${provider.key}-enable`),
  );
}

export async function getLegacyAuthReports(
  input: LegacyAuthReportsInput = {},
): Promise<ActionResult<LegacyAuthReportsData>> {
  try {
    await requireRole("ADMIN");

    const now = new Date();
    const defaultStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const defaultEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    let startDate = parseInputDate(input.startDate, defaultStart);
    let endDate = parseInputDate(input.endDate, defaultEnd);
    if (startDate > endDate) {
      [startDate, endDate] = [endDate, startDate];
    }

    const groups = await getGroups();
    const selectedGroup =
      groups.find((group) => group.key === input.groupKey) ?? groups[0] ?? null;

    if (!selectedGroup) {
      return {
        success: true,
        data: {
          groups,
          selectedGroupKey: null,
          startDate: dateInput(startDate),
          endDate: dateInput(endDate),
          totals: { registered: 0, rangeRegistered: 0, loginEvents: 0 },
          providers: [],
          series: Array.from(buildSeries(startDate, endDate).values()),
          topUsers: [],
        },
      };
    }

    const principalType =
      selectedGroup.recordType === "manager_login_user" ? "MANAGER_USER" : "USER";
    const [enabledProviders, userRecords, integrationRecords, loginRows] =
      await Promise.all([
        getEnabledProviders(selectedGroup.sourceDatabase, selectedGroup.recordType),
        db.legacyAuthRecord.findMany({
          where: {
            sourceDatabase: selectedGroup.sourceDatabase,
            recordType: selectedGroup.recordType,
          },
          orderBy: [{ legacyId: "asc" }],
          select: {
            legacyId: true,
            legacyUserId: true,
            username: true,
            recordKey: true,
            legacyData: true,
          },
        }),
        selectedGroup.recordType === "login_user"
          ? db.legacyAuthRecord.findMany({
              where: {
                sourceDatabase: selectedGroup.sourceDatabase,
                recordType: "social_integration",
              },
              select: {
                legacyUserId: true,
                legacyData: true,
              },
            })
          : Promise.resolve([]),
        db.legacyLoginTimestamp.findMany({
          where: {
            sourceDatabase: selectedGroup.sourceDatabase,
            principalType,
          },
          select: {
            legacyUserId: true,
          },
        }),
      ]);

    const startKey = dateInput(startDate);
    const endKey = dateInput(endDate);
    const series = buildSeries(startDate, endDate);
    const userNameByLegacyId = new Map<number, string>();
    let registered = 0;
    let rangeRegistered = 0;

    for (const user of userRecords) {
      const legacyUserId = user.legacyUserId ?? user.legacyId;
      userNameByLegacyId.set(legacyUserId, legacyDisplayName(user));

      const registeredDate = registeredAt(user);
      const key = compareDateKey(registeredDate);
      if (!key) continue;

      registered += 1;
      if (key >= startKey && key <= endKey) {
        rangeRegistered += 1;
        const point = series.get(key);
        if (point) point.newUsers += 1;
      }
    }

    const providerSummaries = new Map<
      LegacyAuthReportProvider,
      LegacyAuthReportProviderSummary
    >();
    for (const provider of enabledProviders) {
      providerSummaries.set(provider.key, {
        ...provider,
        total: 0,
        range: 0,
      });
    }

    for (const integration of integrationRecords) {
      for (const provider of enabledProviders) {
        if (!providerValue(integration, provider.key)) continue;

        const summary = providerSummaries.get(provider.key);
        if (!summary) continue;
        summary.total += 1;

        const key = compareDateKey(providerTimestamp(integration));
        if (key && key >= startKey && key <= endKey) {
          summary.range += 1;
          const point = series.get(key);
          if (point) point[provider.key] += 1;
        }
      }
    }

    const loginCounts = new Map<number, number>();
    for (const row of loginRows) {
      loginCounts.set(row.legacyUserId, (loginCounts.get(row.legacyUserId) ?? 0) + 1);
    }

    const topUsers = Array.from(loginCounts.entries())
      .map(([legacyUserId, loginCount]) => ({
        legacyUserId,
        username: userNameByLegacyId.get(legacyUserId) ?? `User ${legacyUserId}`,
        loginCount,
      }))
      .sort((a, b) => b.loginCount - a.loginCount || a.username.localeCompare(b.username))
      .slice(0, 10);

    return {
      success: true,
      data: {
        groups,
        selectedGroupKey: selectedGroup.key,
        startDate: dateInput(startDate),
        endDate: dateInput(endDate),
        totals: {
          registered,
          rangeRegistered,
          loginEvents: loginRows.length,
        },
        providers: Array.from(providerSummaries.values()),
        series: Array.from(series.values()),
        topUsers,
      },
    };
  } catch (error) {
    console.error("Failed to build legacy auth reports:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to build legacy auth reports",
    };
  }
}
