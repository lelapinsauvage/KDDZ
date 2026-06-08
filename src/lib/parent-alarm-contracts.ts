import type { Prisma } from "@/generated/prisma/client";

export type LegacyParentAlarmHeader = {
  name: string;
  status: boolean;
  count: number;
};

export type LegacyParentAlarmPayload = [
  LegacyParentAlarmHeader,
  ...Record<string, string>[],
];

export type LegacyAlarmSource = {
  id: string;
  message: string | null;
  dueDate: Date | null;
  isActive: boolean;
  referenceId?: string | null;
  legacyData: Prisma.JsonValue | null;
  createdAt: Date;
};

export type LegacyAlarmChild = {
  id: string;
  legacyId: number | null;
};

export type LegacyParentAlarmFamily =
  | "birthdays"
  | "vaccinations"
  | "medicine"
  | "insurance"
  | "payments"
  | "medical"
  | "general"
  | "assessments"
  | "events"
  | "contracts"
  | "requests";

export function buildLegacyParentAlarmHeader(
  name: unknown,
  status: boolean,
  count: unknown
): LegacyParentAlarmHeader {
  return {
    name: toLegacyString(name),
    status,
    count: toLegacyCount(count),
  };
}

export function buildEmptyLegacyParentAlarmPayload(): LegacyParentAlarmPayload {
  return [buildLegacyParentAlarmHeader("", false, 0)];
}

export function buildLegacyChildAlarmItem(params: {
  alarm: LegacyAlarmSource;
  child: LegacyAlarmChild;
  family: LegacyParentAlarmFamily;
  detailsOverride?: string | null;
}) {
  const { alarm, child, family, detailsOverride } = params;
  const legacy = asRecord(alarm.legacyData);
  const href = readLegacyString(legacy, ["href"]) ?? "";

  const item: Record<string, string> = {
    aid: toLegacyString(readLegacyValue(legacy, ["aid"]) ?? alarm.id),
    child_id: toLegacyString(
      readLegacyValue(legacy, ["child_id"]) ?? child.legacyId ?? child.id
    ),
    daysbefore: toLegacyString(
      readLegacyValue(legacy, ["level", "daysBefore"]) ?? ""
    ),
    details: cleanLegacyLine(
      detailsOverride ??
        readLegacyString(legacy, ["details"]) ??
        alarm.message ??
        ""
    ),
    datetime: legacyAlarmDateTime(
      readLegacyValue(legacy, ["datetime"]) ?? alarm.createdAt ?? alarm.dueDate
    ),
    status: toLegacyString(
      readLegacyValue(legacy, ["status"]) ?? (alarm.isActive ? "1" : "0")
    ),
    href,
    "href ": href,
  };

  if (family === "insurance") {
    item.date = legacyAlarmDate(
      readLegacyValue(legacy, ["curr_date", "date"]) ?? alarm.dueDate
    );
  }

  if (family === "medical") {
    delete item.status;
    delete item.href;
    delete item["href "];
  }

  return item;
}

export function buildLegacyGeneralAlarmItem(alarm: LegacyAlarmSource) {
  const legacy = asRecord(alarm.legacyData);
  const href = readLegacyString(legacy, ["href"]) ?? "";

  return {
    aid: toLegacyString(readLegacyValue(legacy, ["aid"]) ?? alarm.id),
    hid: toLegacyString(
      readLegacyValue(legacy, ["child_id"]) ?? alarm.referenceId ?? ""
    ),
    daysbefore: toLegacyString(
      readLegacyValue(legacy, ["level", "daysBefore"]) ?? ""
    ),
    details: cleanLegacyLine(
      readLegacyString(legacy, ["details"]) ?? alarm.message ?? ""
    ),
    datetime: legacyAlarmDateTime(
      readLegacyValue(legacy, ["datetime"]) ?? alarm.createdAt ?? alarm.dueDate
    ),
    status: toLegacyString(
      readLegacyValue(legacy, ["status"]) ?? (alarm.isActive ? "1" : "0")
    ),
    href,
    "href ": href,
  };
}

export function buildLegacyEventAlarmItem(event: {
  title: string;
  description: string | null;
  customSubject: string | null;
  customBody: string | null;
  date: Date;
  isActive: boolean;
  legacyData: Prisma.JsonValue | null;
  createdAt: Date;
}) {
  const legacy = asRecord(event.legacyData);
  const active = toLegacyString(
    readLegacyValue(legacy, ["active"]) ?? (event.isActive ? "1" : "0")
  );

  return {
    subject: toLegacyString(
      readLegacyString(legacy, ["custom_subject"]) ??
        event.customSubject ??
        event.title
    ),
    eventdate: legacyAlarmDate(readLegacyValue(legacy, ["edate"]) ?? event.date),
    custom_body: toLegacyString(
      readLegacyString(legacy, ["custom_body"]) ??
        event.customBody ??
        event.description ??
        ""
    ),
    submit_time: legacyAlarmDateTime(
      readLegacyValue(legacy, ["submit_time"]) ?? event.createdAt
    ),
    active,
    "active ": active,
  };
}

export function buildLegacyAssessmentAlarmItem(params: {
  id: unknown;
  childId: unknown;
  message: unknown;
  datetime: unknown;
}) {
  return {
    id: toLegacyString(params.id),
    child_id: toLegacyString(params.childId),
    message: cleanLegacyLine(toLegacyString(params.message)),
    datetime: legacyAlarmDateTime(params.datetime),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readLegacyValue(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function readLegacyString(data: Record<string, unknown> | null, keys: string[]) {
  const value = readLegacyValue(data, keys);
  if (value === null) return null;
  const stringValue = toLegacyString(value);
  return stringValue.length > 0 ? stringValue : null;
}

function legacyAlarmDateTime(value: unknown) {
  if (value instanceof Date) return formatSqlDateTime(value);
  const raw = toLegacyString(value).trim();
  if (!raw) return "";

  const sqlLike = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (sqlLike) return `${sqlLike[1]} ${sqlLike[2]}`;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return formatSqlDateTime(parsed);

  return cleanLegacyLine(raw);
}

function legacyAlarmDate(value: unknown) {
  if (value instanceof Date) return formatSqlDate(value);
  const raw = toLegacyString(value).trim();
  if (!raw) return "";

  const dateLike = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateLike) return dateLike[1];

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return formatSqlDate(parsed);

  return cleanLegacyLine(raw);
}

function formatSqlDateTime(date: Date) {
  return `${formatSqlDate(date)} ${pad(date.getUTCHours())}:${pad(
    date.getUTCMinutes()
  )}:${pad(date.getUTCSeconds())}`;
}

function formatSqlDate(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLegacyString(value: unknown) {
  if (value === undefined || value === null) return "";
  return String(value);
}

function toLegacyCount(value: unknown) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function cleanLegacyLine(value: string) {
  return value.replace(/\r|\n/g, "");
}
