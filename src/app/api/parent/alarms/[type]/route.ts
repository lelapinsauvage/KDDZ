import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { AlarmType, Prisma } from "@/generated/prisma/client";
import {
  formatChildName,
  formatDate,
  formatDateTimeLong,
  makeHeader,
  jsonError,
  jsonSuccess,
  verifyParentToken,
} from "@/lib/parent-auth";

const VALID_ALARM_TYPES: Record<string, AlarmType> = {
  birthdays: "BIRTHDAY",
  vaccinations: "VACCINATION",
  medicine: "MEDICINE",
  insurance: "INSURANCE",
  payments: "PAYMENT",
  medical: "MEDICAL",
  general: "OTHER",
  assessments: "ASSESSMENT",
  events: "EVENT",
  contracts: "CONTRACT",
  requests: "REQUEST",
};

const ASSESSMENT_MESSAGE_SETTING_KEY = "email-assessment-msg";
const DEFAULT_LEGACY_ASSESSMENT_MESSAGE =
  "Dear Parents, The assessment report of {{child_name}} is done. you can read it on his account. Regards, The Administration";

type ParentAlarmChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  branchId: string;
};

type ParentAlarmUser = {
  id: string;
  childId: string;
  legacyChildId: number | null;
  child: ParentAlarmChild;
};

type ParentAlarm = {
  id: string;
  message: string | null;
  dueDate: Date | null;
  isActive: boolean;
  referenceId: string | null;
  legacyData: Prisma.JsonValue | null;
  createdAt: Date;
};

type ParentEvent = {
  title: string;
  description: string | null;
  customSubject: string | null;
  customBody: string | null;
  date: Date;
  branchId: string | null;
  notificationBranchIds: Prisma.JsonValue | null;
  isActive: boolean;
  legacyData: Prisma.JsonValue | null;
  createdAt: Date;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  return handleRequest(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  return handleRequest(request, { params });
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  const alarmType = VALID_ALARM_TYPES[type];
  if (!alarmType) {
    return jsonError("Invalid alarm type", 400);
  }

  const body = request.method === "POST" ? await readRequestBody(request) : null;
  const postedChildId = readString(body, ["pid", "usites", "child_id", "childId"]);
  const auth = await optionalAuthenticateParent(request);
  if (auth && "error" in auth) return auth.error;

  let child = auth?.parentUser.child ?? null;

  if (type !== "general") {
    if (!postedChildId) {
      if (request.method === "POST") {
        return jsonSuccess([makeHeader("", false, 0)]);
      }
      if (!child) return jsonError("Unauthorized", 401);
    }

    const requestedChildId = postedChildId ?? child?.id ?? "";
    if (auth?.parentUser) {
      if (!matchesChildId(auth.parentUser, requestedChildId)) {
        return jsonError("Access denied", 403);
      }
    } else {
      child = await resolveLegacyAlarmChild(requestedChildId);
      if (!child) {
        return jsonSuccess([makeHeader("", false, 0)]);
      }
    }
  }

  try {
    if (type === "general") {
      return await handleGeneralAlarms();
    }

    if (!child) {
      return jsonError("Unauthorized", 401);
    }

    // Events have special handling — filter by branch
    if (type === "events") {
      return await handleEvents(child);
    }

    // Assessments have special handling — different response shape
    if (type === "assessments") {
      return await handleAssessments(child);
    }

    // Standard child-specific alarms
    const alarms = await db.alarm.findMany({
      where: {
        type: alarmType,
        referenceId: child.id,
        referenceType: "Child",
      },
      orderBy: { createdAt: "desc" },
    });

    const header = makeHeader(
      formatChildName(child),
      true,
      alarms.length
    );

    const items = filterByLegacyType(type, alarms).map((alarm) =>
      mapChildAlarm(alarm, child, type)
    );

    return jsonSuccess([{ ...header, count: items.length }, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function handleEvents(child: ParentAlarmChild) {
  const now = new Date();
  const events = await db.event.findMany({
    where: {
      isActive: true,
      date: { lte: now },
    },
    orderBy: { date: "desc" },
  });

  const filteredEvents = events.filter((event) =>
    eventMatchesChildBranch(event, child.branchId)
  );

  const header = makeHeader(formatChildName(child), true, filteredEvents.length);
  const items = filteredEvents.map(mapEventAlarm);

  return jsonSuccess([header, ...items]);
}

async function handleAssessments(child: ParentAlarmChild) {
  const [assessments, messageTemplate] = await Promise.all([
    db.assessment.findMany({
      where: { childId: child.id },
      select: { id: true, data: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    loadLegacyAssessmentMessageTemplate(),
  ]);

  const assessmentMarkers = assessments
    .flatMap((assessment) =>
      extractAssessmentMarkers(assessment.data).map((marker) => ({
        assessment,
        marker,
      }))
    )
    .sort(
      (a, b) =>
        assessmentMarkerTime(b.marker, b.assessment.createdAt) -
        assessmentMarkerTime(a.marker, a.assessment.createdAt)
    );

  const header = makeHeader(
    formatChildName(child),
    true,
    assessmentMarkers.length
  );

  const childName = formatLegacyAssessmentChildName(child);
  const items = assessmentMarkers.map(({ assessment, marker }) => ({
    id: readValue(marker, ["id"]) ?? assessment.id,
    child_id:
      readValue(marker, ["childId", "child_id"]) ?? child.legacyId ?? child.id,
    message: renderLegacyAssessmentMessage(messageTemplate, childName),
    datetime: formatLegacyAssessmentDatetime(marker, assessment.createdAt),
  }));

  return jsonSuccess([header, ...items]);
}

async function loadLegacyAssessmentMessageTemplate() {
  const settings = await db.legacySetting.findMany({
    where: {
      legacyTable: "login_settings",
      settingKey: ASSESSMENT_MESSAGE_SETTING_KEY,
      settingValue: { not: null },
    },
    select: { sourceDatabase: true, settingValue: true },
    orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
  });

  return (
    chooseLegacySettingValue(settings) ??
    DEFAULT_LEGACY_ASSESSMENT_MESSAGE
  );
}

async function handleGeneralAlarms() {
  const alarms = await db.alarm.findMany({
    where: {
      type: "EVENT",
    },
    orderBy: { createdAt: "desc" },
  });

  const generalAlarms = alarms.filter((alarm) => {
    const legacy = asRecord(alarm.legacyData);
    return readString(legacy, ["sourceTable"]) === "t_alarms";
  });

  const header = makeHeader("", false, generalAlarms.length);
  const items = generalAlarms.map(mapGeneralAlarm);

  return jsonSuccess([header, ...items]);
}

function filterByLegacyType(type: string, alarms: ParentAlarm[]) {
  if (type !== "birthdays") return alarms;

  return alarms.filter((alarm) => {
    const legacy = asRecord(alarm.legacyData);
    const level = readString(legacy, ["level"]);
    return level === null || level === "0";
  });
}

function mapChildAlarm(
  alarm: ParentAlarm,
  child: ParentAlarmChild,
  type: string
) {
  const legacy = asRecord(alarm.legacyData);
  const href = readString(legacy, ["href"]) ?? "";
  const item: Record<string, unknown> = {
    aid: readValue(legacy, ["aid"]) ?? alarm.id,
    child_id: readValue(legacy, ["child_id"]) ?? child.legacyId ?? child.id,
    daysbefore: readValue(legacy, ["level", "daysBefore"]) ?? "",
    details: cleanLegacyLine(readString(legacy, ["details"]) ?? alarm.message ?? ""),
    datetime:
      readString(legacy, ["datetime"]) ??
      formatDateTimeLong(alarm.createdAt) ??
      formatDate(alarm.dueDate),
    status: readValue(legacy, ["status"]) ?? (alarm.isActive ? "1" : "0"),
    href,
    "href ": href,
  };

  if (type === "insurance") {
    item.date = readValue(legacy, ["curr_date", "date"]) ?? formatDate(alarm.dueDate);
  }

  if (type === "medical") {
    delete item.status;
    delete item.href;
    delete item["href "];
  }

  return item;
}

function mapGeneralAlarm(alarm: ParentAlarm) {
  const legacy = asRecord(alarm.legacyData);
  const href = readString(legacy, ["href"]) ?? "";
  return {
    aid: readValue(legacy, ["aid"]) ?? alarm.id,
    hid: readValue(legacy, ["child_id"]) ?? alarm.referenceId ?? "",
    daysbefore: readValue(legacy, ["level", "daysBefore"]) ?? "",
    details: cleanLegacyLine(readString(legacy, ["details"]) ?? alarm.message ?? ""),
    datetime:
      readString(legacy, ["datetime"]) ??
      formatDateTimeLong(alarm.createdAt) ??
      formatDate(alarm.dueDate),
    status: readValue(legacy, ["status"]) ?? (alarm.isActive ? "1" : "0"),
    href,
    "href ": href,
  };
}

function mapEventAlarm(event: ParentEvent) {
  const legacy = asRecord(event.legacyData);
  const active = readValue(legacy, ["active"]) ?? (event.isActive ? "1" : "0");

  return {
    subject: readString(legacy, ["custom_subject"]) ?? event.customSubject ?? event.title,
    eventdate: readString(legacy, ["edate"]) ?? formatDate(event.date),
    custom_body: readString(legacy, ["custom_body"]) ?? event.customBody ?? event.description ?? "",
    submit_time: readString(legacy, ["submit_time"]) ?? formatDateTimeLong(event.createdAt),
    active,
    "active ": active,
  };
}

function eventMatchesChildBranch(event: ParentEvent, childBranchId: string) {
  const configuredBranchIds = jsonStringArray(event.notificationBranchIds);
  if (configuredBranchIds.length > 0) {
    return configuredBranchIds.includes(childBranchId);
  }

  return event.branchId === childBranchId || event.branchId === null;
}

async function readRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return asRecord(body);
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData().catch(() => null);
    if (!form) return null;
    return Object.fromEntries(
      [...form.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ])
    );
  }

  const text = await request.text().catch(() => "");
  if (!text.trim()) return null;
  return Object.fromEntries(new URLSearchParams(text).entries());
}

async function optionalAuthenticateParent(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const hasBearer = authHeader?.startsWith("Bearer ");
  const payload = await verifyParentToken(request);

  if (hasBearer && !payload) {
    return { error: jsonError("Unauthorized", 401) };
  }
  if (!payload) return null;

  const parentUser = await db.parentUser.findUnique({
    where: { id: payload.sub, isActive: true },
    include: { child: true },
  });

  if (!parentUser) {
    return { error: jsonError("Unauthorized", 401) };
  }

  return { parentUser: parentUser as ParentAlarmUser };
}

async function resolveLegacyAlarmChild(childId: string) {
  const legacyChildId = parseLegacyInt(childId);
  const childWhere = [];

  if (UUID_RE.test(childId)) {
    childWhere.push({ id: childId });
  }
  if (legacyChildId !== null) {
    childWhere.push({ legacyId: legacyChildId });
  }

  if (childWhere.length === 0) return null;

  return db.child.findFirst({
    where: { OR: childWhere },
    select: {
      id: true,
      legacyId: true,
      firstName: true,
      middleName: true,
      lastName: true,
      branchId: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

function matchesChildId(parentUser: ParentAlarmUser, postedChildId: string) {
  return (
    postedChildId === parentUser.childId ||
    postedChildId === parentUser.child.id ||
    postedChildId === String(parentUser.legacyChildId ?? "") ||
    postedChildId === String(parentUser.child.legacyId ?? "")
  );
}

function chooseLegacySettingValue(
  rows: Array<{ sourceDatabase: string; settingValue: string | null }>
) {
  const candidates = rows.filter((row) => row.settingValue?.trim());
  if (candidates.length === 0) return null;

  return (
    candidates.find((row) => row.sourceDatabase.toLowerCase().includes("29sept")) ??
    candidates.find((row) => !row.sourceDatabase.toLowerCase().includes("2018")) ??
    candidates[0]
  ).settingValue!.trim();
}

function extractAssessmentMarkers(data: Prisma.JsonValue | null) {
  const record = asRecord(data);
  const markers: Record<string, unknown>[] = [];
  const singleMarker = asRecord(record?._legacyNewAssessmentOnly);
  if (singleMarker) markers.push(singleMarker);

  const markerList = record?._legacyNewAssessmentMarkers;
  if (Array.isArray(markerList)) {
    markers.push(
      ...markerList
        .map(asRecord)
        .filter((marker): marker is Record<string, unknown> => marker !== null)
    );
  }

  return markers;
}

function renderLegacyAssessmentMessage(template: string, childName: string) {
  return cleanLegacyLine(template.replaceAll("{{child_name}}", childName));
}

function formatLegacyAssessmentChildName(child: ParentAlarmChild) {
  return [legacyUcFirst(child.firstName), legacyUcFirst(child.lastName)]
    .filter(Boolean)
    .join(" ");
}

function legacyUcFirst(value: string | null | undefined) {
  if (!value) return "";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatLegacyAssessmentDatetime(
  marker: Record<string, unknown>,
  fallback: Date
) {
  const value = readValue(marker, ["datetime"]);
  if (value instanceof Date) return formatSqlDateTime(value);
  if (value !== null) {
    const raw = String(value).trim();
    if (raw) {
      const sqlLike = raw.match(
        /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/
      );
      if (sqlLike) return `${sqlLike[1]} ${sqlLike[2]}`;
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return formatSqlDateTime(parsed);
      return raw;
    }
  }
  return formatSqlDateTime(fallback);
}

function assessmentMarkerTime(marker: Record<string, unknown>, fallback: Date) {
  const value = readValue(marker, ["datetime"]);
  const parsed = value instanceof Date ? value : new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? fallback.getTime() : parsed.getTime();
}

function formatSqlDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`,
  ].join(" ");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readValue(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  const value = readValue(data, keys);
  if (value === null) return null;
  const stringValue = String(value);
  return stringValue.length > 0 ? stringValue : null;
}

function parseLegacyInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function jsonStringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function cleanLegacyLine(value: string) {
  return value.replace(/\r|\n/g, "");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
