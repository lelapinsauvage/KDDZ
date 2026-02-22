import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { AlarmType } from "@/generated/prisma/client";
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

export async function GET(
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

  try {
    const child = parentUser.child;

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
        isActive: true,
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

    const items = alarms.map((a) => ({
      aid: a.id,
      child_id: child.id,
      daysbefore: "",
      details: a.message?.replace(/\r\n/g, " ") ?? "",
      datetime: formatDate(a.dueDate) || formatDate(a.createdAt),
      status: a.isActive ? "1" : "0",
      href: "",
    }));

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function handleEvents(child: {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  branchId: string;
}) {
  const now = new Date();
  const events = await db.event.findMany({
    where: {
      isActive: true,
      date: { lte: now },
      OR: [{ branchId: child.branchId }, { branchId: null }],
    },
    orderBy: { date: "desc" },
  });

  const header = makeHeader(formatChildName(child), true, events.length);

  const items = events.map((e) => ({
    subject: e.title,
    eventdate: formatDate(e.date),
    custom_body: e.description ?? "",
    submit_time: formatDateTimeLong(e.createdAt),
    active: e.isActive ? "1" : "0",
  }));

  return jsonSuccess([header, ...items]);
}

async function handleAssessments(child: {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
}) {
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
    child_id: child.id,
    message: `New assessment available for ${childName}`,
    datetime: formatDateTimeLong(a.createdAt),
  }));

  return jsonSuccess([header, ...items]);
}

async function handleGeneralAlarms(child: {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  branchId: string;
}) {
  const alarms = await db.alarm.findMany({
    where: {
      type: "OTHER",
      isActive: true,
      OR: [{ branchId: child.branchId }, { branchId: null }],
    },
    orderBy: { createdAt: "desc" },
  });

  const header = makeHeader("", true, alarms.length);

  const items = alarms.map((a) => ({
    aid: a.id,
    hid: a.referenceId ?? "",
    daysbefore: "",
    details: a.message?.replace(/\r\n/g, " ") ?? "",
    datetime: formatDate(a.dueDate) || formatDate(a.createdAt),
    status: a.isActive ? "1" : "0",
    href: "",
  }));

  return jsonSuccess([header, ...items]);
}
