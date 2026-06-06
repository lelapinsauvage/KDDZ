import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { AlarmType, Prisma } from "@/generated/prisma/client";
import {
  authenticateParent,
  formatChildName,
  formatDate,
  formatDateTimeLong,
  makeHeader,
  jsonError,
  jsonSuccess,
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

type ParentAlarmChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  branchId: string;
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

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  const alarmType = VALID_ALARM_TYPES[type];
  if (!alarmType) {
    return jsonError("Invalid alarm type", 400);
  }

  const child = parentUser.child;
  if (request.method === "POST" && type !== "general") {
    const body = await readRequestBody(request);
    const postedChildId = readString(body, ["pid", "usites", "child_id", "childId"]);
    if (!postedChildId) {
      return jsonSuccess([makeHeader("", false, 0)]);
    }
    if (!matchesChildId(child, postedChildId)) {
      return jsonError("Access denied", 403);
    }
  }

  try {
    // Events have special handling — filter by branch
    if (type === "events") {
      return await handleEvents(child);
    }

    // Assessments have special handling — different response shape
    if (type === "assessments") {
      return await handleAssessments(child);
    }

    // General alarms — all alarms of type OTHER, optionally filtered by branch
    if (type === "general") {
      return await handleGeneralAlarms(child);
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
  const assessments = await db.assessment.findMany({
    where: { childId: child.id },
    orderBy: { createdAt: "desc" },
  });

  const header = makeHeader(
    formatChildName(child),
    true,
    assessments.length
  );

  const childName = formatChildName(child);
  const items = assessments.map((a) => ({
    id: a.id,
    child_id: child.legacyId ?? child.id,
    message: `New assessment available for ${childName}`,
    datetime: formatDateTimeLong(a.createdAt),
  }));

  return jsonSuccess([header, ...items]);
}

async function handleGeneralAlarms(_child: ParentAlarmChild) {
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
    const form = await request.formData();
    return Object.fromEntries(
      [...form.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ])
    );
  }

  return null;
}

function matchesChildId(child: ParentAlarmChild, postedChildId: string) {
  return postedChildId === child.id || postedChildId === String(child.legacyId ?? "");
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

function jsonStringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function cleanLegacyLine(value: string) {
  return value.replace(/\r|\n/g, "");
}
