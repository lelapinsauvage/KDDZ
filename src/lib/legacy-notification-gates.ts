import { db } from "@/lib/db";

export type LegacyNotificationGateKey =
  | "medicine"
  | "birthdays"
  | "general"
  | "events"
  | "insurance"
  | "vaccinations"
  | "assessments"
  | "medical"
  | "payments";

export type LegacyNotificationGateVisibility = Record<
  LegacyNotificationGateKey,
  boolean
>;

const LEGACY_NOTIFICATION_GATE_INDEX: Record<LegacyNotificationGateKey, number> = {
  medicine: 0,
  birthdays: 1,
  general: 2,
  events: 2,
  insurance: 3,
  vaccinations: 4,
  assessments: 5,
  medical: 7,
  payments: 9,
};

const DEFAULT_LEGACY_NOTIFICATION_GATES: LegacyNotificationGateVisibility = {
  medicine: true,
  birthdays: true,
  general: true,
  events: true,
  insurance: true,
  vaccinations: true,
  assessments: true,
  medical: true,
  payments: true,
};

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function legacySettingRecord(
  row: { legacyData: unknown; settingValue: string | null },
) {
  const data = jsonRecord(row.legacyData);
  if (Object.keys(data).length > 0) return data;

  const settingValue = row.settingValue?.trim();
  if (!settingValue) return {};

  try {
    return jsonRecord(JSON.parse(settingValue));
  } catch {
    return {};
  }
}

function legacyToggleEnabled(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
    if (["0", "-1", "false", "no", "n", "off", ""].includes(normalized)) {
      return false;
    }
  }
  return fallback;
}

function legacyAlarmSettingEnabled(row: {
  legacyData: unknown;
  settingValue: string | null;
}) {
  const record = legacySettingRecord(row);
  return legacyToggleEnabled(
    record.alarms ?? record.status ?? row.settingValue,
    true,
  );
}

type LegacyNotificationSettingRow = {
  sourceDatabase: string;
  legacyId: number;
  settingValue: string | null;
  legacyData: unknown;
};

async function loadOrganizationSourceDatabases(orgId: string) {
  try {
    const branches = await db.branch.findMany({
      where: { organizationId: orgId, sourceDatabase: { not: null } },
      select: { sourceDatabase: true },
    });

    return new Set(
      branches.flatMap((branch) =>
        branch.sourceDatabase ? [branch.sourceDatabase] : [],
      ),
    );
  } catch {
    return new Set<string>();
  }
}

function sortLegacyNotificationRows(rows: LegacyNotificationSettingRow[]) {
  return [...rows].sort((a, b) => {
    const sourceCompare = a.sourceDatabase.localeCompare(b.sourceDatabase);
    if (sourceCompare !== 0) return sourceCompare;
    return a.legacyId - b.legacyId;
  });
}

function chooseLegacyNotificationRows(
  rows: LegacyNotificationSettingRow[],
  sourceDatabases: Set<string>,
) {
  const exactRows = rows.filter((row) => sourceDatabases.has(row.sourceDatabase));
  if (exactRows.length > 0) return sortLegacyNotificationRows(exactRows);

  const rowsBySource = new Map<string, LegacyNotificationSettingRow[]>();
  for (const row of rows) {
    const sourceRows = rowsBySource.get(row.sourceDatabase) ?? [];
    sourceRows.push(row);
    rowsBySource.set(row.sourceDatabase, sourceRows);
  }

  const sources = Array.from(rowsBySource.keys());
  const preferredSource =
    sources.find((source) => source.toLowerCase().includes("users29sept")) ??
    sources.find((source) => source.toLowerCase().includes("29sept")) ??
    sources.find((source) => !source.toLowerCase().includes("2018")) ??
    sources[0];

  return preferredSource
    ? sortLegacyNotificationRows(rowsBySource.get(preferredSource) ?? [])
    : [];
}

export async function getLegacyNotificationGateVisibility(
  orgId: string,
): Promise<LegacyNotificationGateVisibility> {
  try {
    const [sourceDatabases, rows] = await Promise.all([
      loadOrganizationSourceDatabases(orgId),
      db.legacySetting.findMany({
        where: { legacyTable: "t_notification_setting" },
        orderBy: [{ sourceDatabase: "asc" }, { legacyId: "asc" }],
        select: {
          sourceDatabase: true,
          legacyId: true,
          settingValue: true,
          legacyData: true,
        },
      }),
    ]);

    if (rows.length === 0) return DEFAULT_LEGACY_NOTIFICATION_GATES;

    const legacyRows = chooseLegacyNotificationRows(rows, sourceDatabases);
    if (legacyRows.length === 0) return DEFAULT_LEGACY_NOTIFICATION_GATES;

    return Object.fromEntries(
      Object.entries(LEGACY_NOTIFICATION_GATE_INDEX).map(([key, index]) => {
        const row = legacyRows[index];
        return [key, !row || legacyAlarmSettingEnabled(row)];
      }),
    ) as LegacyNotificationGateVisibility;
  } catch {
    return DEFAULT_LEGACY_NOTIFICATION_GATES;
  }
}

export async function isLegacyNotificationGateEnabled(
  orgId: string,
  key: LegacyNotificationGateKey,
) {
  const gates = await getLegacyNotificationGateVisibility(orgId);
  return gates[key] ?? true;
}
