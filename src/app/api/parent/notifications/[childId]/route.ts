import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { AlarmType, Prisma } from "@/generated/prisma/client";
import {
  authenticateParent,
  verifyChildAccess,
  formatChildName,
  formatDateTimeLong,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

interface NotificationGroup {
  name: string;
  details: NotificationDetail[];
}

type NotificationDetail = { datetime: string; subject: string; body: string };

type ParentNotificationChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  branchId: string;
};

type ParentNotificationUser = {
  id: string;
  childId: string;
  child: ParentNotificationChild;
};

type NotificationNature = {
  legacyId: number;
  name: string;
  contentTable: string | null;
  parentDeliveryTable: string | null;
  subjectColumn: string | null;
  bodyColumn: string | null;
  displayOrder: number | null;
  isActive: boolean;
};

type AlarmRow = {
  id: string;
  type: AlarmType;
  message: string | null;
  dueDate: Date | null;
  referenceId: string | null;
  referenceType: string | null;
  legacyData: Prisma.JsonValue | null;
  createdAt: Date;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  customSubject: string | null;
  customBody: string | null;
  date: Date;
  branchId: string | null;
  notificationBranchIds: Prisma.JsonValue | null;
  legacyData: Prisma.JsonValue | null;
  createdAt: Date;
};

type AssessmentRow = {
  id: string;
  assessmentType: number;
  data: Prisma.JsonValue | null;
  createdAt: Date;
};

type MessageRow = {
  subject: string | null;
  body: string;
  legacyData: Prisma.JsonValue | null;
  createdAt: Date;
};

const ALARM_TABLE_TYPES: Record<string, AlarmType> = {
  t_alarms_birthday: "BIRTHDAY",
  t_alarms_vaccinations: "VACCINATION",
  t_alarms_medicine: "MEDICINE",
  t_alarms_insurance: "INSURANCE",
  t_alarms_payments: "PAYMENT",
  t_alarms_medical: "MEDICAL",
  t_alarms: "EVENT",
  t_alarms_requests: "REQUEST",
  t_alarms_others: "OTHER",
};

const DEFAULT_NATURES: NotificationNature[] = [
  nature(1, "Birthday", "t_alarms_birthday", "custom_notifications_birthday_parents", "", "details"),
  nature(2, "Vaccinations", "t_alarms_vaccinations", "custom_notifications_vaccinations", "", "details"),
  nature(3, "Medicine", "t_alarms_medicine", "custom_notifications_medicine_parents", "", "details"),
  nature(4, "Events", "t_events", "custom_notifications_events_parents", "custom_subject", "custom_body"),
  nature(5, "Insurance", "t_alarms_insurance", "custom_notifications_insurance_parents", "", "details"),
  nature(6, "Payments", "t_alarms_payments", "custom_notifications_payments", "", "details"),
  nature(7, "Messages", "t_alarms_msg", "custom_notifications_msg", "subject", "message"),
  nature(8, "Assessments", "new_assessment", null, "", ""),
  nature(9, "Medical Reports", "t_alarms_medical", "custom_notifications_medical_parents", "", "details"),
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  return handleRequest(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  return handleRequest(request, { params });
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const parentUser = auth.parentUser as ParentNotificationUser;

  if (!verifyChildAccess(parentUser, childId)) {
    return jsonError("Access denied", 403);
  }

  if (request.method === "POST") {
    const body = await readRequestBody(request);
    const postedChildId = readString(body, ["usites", "pid", "child_id", "childId"]);
    if (!postedChildId) return jsonSuccess({});
    if (!matchesChildId(parentUser.child, postedChildId)) {
      return jsonError("Access denied", 403);
    }
  }

  try {
    const child = parentUser.child;
    const result: Record<string, unknown> = {
      info: {
        name: formatChildName(child),
        status: true,
        no_notifications: "No New Notifications",
      },
    };

    const natures = await loadNotificationNatures();

    for (let index = 0; index < natures.length; index++) {
      const item = natures[index];
      result[`notification${index + 1}`] = buildNotificationGroup(
        item.name,
        item.isActive ? await loadNatureDetails(item, child, parentUser) : []
      );
    }

    return jsonSuccess(result);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function loadNotificationNatures(): Promise<NotificationNature[]> {
  const natures = await db.legacyNotificationNature.findMany({
    orderBy: [{ displayOrder: "asc" }, { legacyId: "asc" }],
    select: {
      legacyId: true,
      name: true,
      contentTable: true,
      parentDeliveryTable: true,
      subjectColumn: true,
      bodyColumn: true,
      displayOrder: true,
      isActive: true,
    },
  });

  return natures.length > 0 ? natures : DEFAULT_NATURES;
}

async function loadNatureDetails(
  nature: NotificationNature,
  child: ParentNotificationChild,
  parentUser: ParentNotificationUser
): Promise<NotificationDetail[]> {
  const contentTable = nature.contentTable ?? "";

  if (contentTable === "t_events") {
    const receiptDetails = nature.parentDeliveryTable
      ? await loadEventReceiptDetails(nature, child, parentUser)
      : [];
    return receiptDetails.length > 0
      ? receiptDetails
      : loadEventDetails(nature, child);
  }

  if (contentTable === "t_alarms_msg") {
    return loadMessageDetails(nature, parentUser);
  }

  if (contentTable === "new_assessment") {
    return loadAssessmentDetails(nature, child);
  }

  if (contentTable in ALARM_TABLE_TYPES) {
    const receiptDetails = nature.parentDeliveryTable
      ? await loadAlarmReceiptDetails(nature, child, parentUser)
      : [];
    return receiptDetails.length > 0
      ? receiptDetails
      : loadAlarmDetails(nature, child);
  }

  return [];
}

async function loadAlarmDetails(
  nature: NotificationNature,
  child: ParentNotificationChild
) {
  const contentTable = nature.contentTable ?? "";
  const type = ALARM_TABLE_TYPES[contentTable];
  if (!type) return [];

  const alarms = await db.alarm.findMany({
    where: {
      type,
      referenceId: child.id,
      referenceType: "Child",
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return alarms
    .filter((alarm) => alarmMatchesContentTable(alarm, contentTable))
    .map((alarm) => mapAlarmDetail(alarm, nature));
}

async function loadAlarmReceiptDetails(
  nature: NotificationNature,
  child: ParentNotificationChild,
  parentUser: ParentNotificationUser
) {
  if (!nature.parentDeliveryTable) return [];

  const receipts = await db.notificationReceipt.findMany({
    where: {
      sourceTable: nature.parentDeliveryTable,
      OR: recipientFilters(child, parentUser),
    },
    include: { alarm: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return receipts.flatMap((receipt) => {
    const alarm = receipt.alarm;
    if (!alarm) return [];
    if (nature.contentTable && !alarmMatchesContentTable(alarm, nature.contentTable)) {
      return [];
    }
    return [mapAlarmDetail(alarm, nature)];
  });
}

async function loadEventDetails(
  nature: NotificationNature,
  child: ParentNotificationChild
) {
  const now = new Date();
  const events = await db.event.findMany({
    where: {
      isActive: true,
      date: { lte: now },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return events
    .filter((event) => eventMatchesChildBranch(event, child.branchId))
    .map((event) => mapEventDetail(event, nature));
}

async function loadEventReceiptDetails(
  nature: NotificationNature,
  child: ParentNotificationChild,
  parentUser: ParentNotificationUser
) {
  if (!nature.parentDeliveryTable) return [];

  const receipts = await db.notificationReceipt.findMany({
    where: {
      sourceTable: nature.parentDeliveryTable,
      OR: recipientFilters(child, parentUser),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const eventIds = receipts
    .map((receipt) => readString(asRecord(receipt.metadata), ["modernTargetId"]))
    .filter((id): id is string => Boolean(id));

  if (eventIds.length === 0) return [];

  const events = await db.event.findMany({
    where: { id: { in: [...new Set(eventIds)] } },
  });
  const eventById = new Map(events.map((event) => [event.id, event]));

  return eventIds.flatMap((id) => {
    const event = eventById.get(id);
    return event ? [mapEventDetail(event, nature)] : [];
  });
}

async function loadMessageDetails(
  nature: NotificationNature,
  parentUser: ParentNotificationUser
) {
  const messages = await db.message.findMany({
    where: {
      recipientId: parentUser.id,
      recipientType: "PARENT",
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return messages.map((message) => mapMessageDetail(message, nature));
}

async function loadAssessmentDetails(
  nature: NotificationNature,
  child: ParentNotificationChild
) {
  const assessments = await db.assessment.findMany({
    where: { childId: child.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const childName = formatChildName(child);
  return assessments.map((assessment) =>
    mapAssessmentDetail(assessment, nature, childName)
  );
}

function mapAlarmDetail(
  alarm: AlarmRow,
  nature: NotificationNature
): NotificationDetail {
  const legacy = asRecord(alarm.legacyData);

  return {
    datetime: formatLegacyDate(readString(legacy, ["datetime"]), alarm.dueDate ?? alarm.createdAt),
    subject: readSubject(legacy, nature, legacyFallbackSubject(alarm.type)),
    body: cleanLegacyBody(
      readBody(legacy, nature, alarm.message ?? legacyFallbackSubject(alarm.type))
    ),
  };
}

function mapEventDetail(
  event: EventRow,
  nature: NotificationNature
): NotificationDetail {
  const legacy = asRecord(event.legacyData);

  return {
    datetime: formatLegacyDate(
      readString(legacy, ["datetime", "submit_time", "edate"]),
      event.date
    ),
    subject: readSubject(legacy, nature, event.customSubject ?? event.title),
    body: cleanLegacyBody(
      readBody(legacy, nature, event.customBody ?? event.description ?? "")
    ),
  };
}

function mapMessageDetail(
  message: MessageRow,
  nature: NotificationNature
): NotificationDetail {
  const legacy = asRecord(message.legacyData);
  const legacyMessage = asRecord(legacy?.message);

  return {
    datetime: formatLegacyDate(
      readString(legacyMessage, ["datetime", "curr_date"]),
      message.createdAt
    ),
    subject: readSubject(legacyMessage, nature, message.subject ?? ""),
    body: cleanLegacyBody(readBody(legacyMessage, nature, message.body)),
  };
}

function mapAssessmentDetail(
  assessment: AssessmentRow,
  nature: NotificationNature,
  childName: string
): NotificationDetail {
  const data = asRecord(assessment.data);
  const marker =
    asRecord(data?._legacyNewAssessmentOnly) ??
    firstRecord(data?._legacyNewAssessmentMarkers);
  const fallbackMessage = `New assessment available for ${childName}`;

  return {
    datetime: formatLegacyDate(readString(marker, ["datetime"]), assessment.createdAt),
    subject: readSubject(marker, nature, `Assessment Type ${assessment.assessmentType}`),
    body: cleanLegacyBody(readBody(marker, nature, fallbackMessage)),
  };
}

function buildNotificationGroup(
  name: string,
  details: NotificationDetail[]
): NotificationGroup {
  return { name, details };
}

function recipientFilters(
  child: ParentNotificationChild,
  parentUser: ParentNotificationUser
): Prisma.NotificationReceiptWhereInput[] {
  const filters: Prisma.NotificationReceiptWhereInput[] = [
    { recipientId: parentUser.id },
    { recipientId: child.id },
  ];

  if (child.legacyId !== null) {
    filters.push({ legacyRecipientId: child.legacyId });
  }

  return filters;
}

function alarmMatchesContentTable(alarm: AlarmRow, contentTable: string) {
  const sourceTable = readString(asRecord(alarm.legacyData), ["sourceTable"]);
  return !sourceTable || sourceTable === contentTable;
}

function eventMatchesChildBranch(event: EventRow, childBranchId: string) {
  const branchIds = jsonStringArray(event.notificationBranchIds);
  if (branchIds.length > 0) return branchIds.includes(childBranchId);
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

function matchesChildId(child: ParentNotificationChild, postedChildId: string) {
  return postedChildId === child.id || postedChildId === String(child.legacyId ?? "");
}

function nature(
  legacyId: number,
  name: string,
  contentTable: string,
  parentDeliveryTable: string | null,
  subjectColumn: string,
  bodyColumn: string
): NotificationNature {
  return {
    legacyId,
    name,
    contentTable,
    parentDeliveryTable,
    subjectColumn,
    bodyColumn,
    displayOrder: legacyId,
    isActive: true,
  };
}

function readSubject(
  data: Record<string, unknown> | null,
  nature: NotificationNature,
  fallback: string
) {
  return nature.subjectColumn
    ? readString(data, [nature.subjectColumn]) ?? fallback
    : "";
}

function readBody(
  data: Record<string, unknown> | null,
  nature: NotificationNature,
  fallback: string
) {
  return nature.bodyColumn
    ? readString(data, [nature.bodyColumn]) ?? fallback
    : fallback;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) {
      const stringValue = String(value);
      if (stringValue.length > 0) return stringValue;
    }
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstRecord(value: unknown) {
  return Array.isArray(value) ? asRecord(value[0]) : null;
}

function jsonStringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function cleanLegacyBody(value: string) {
  return value.replace(/"/g, "");
}

function formatLegacyDate(value: string | null, fallback: Date) {
  const parsed = value ? new Date(value) : fallback;
  if (!Number.isNaN(parsed.getTime())) return formatDateTimeLong(parsed);
  return value ?? formatDateTimeLong(fallback);
}

function legacyFallbackSubject(type: AlarmType) {
  const labels: Record<AlarmType, string> = {
    BIRTHDAY: "Birthday Reminder",
    ASSESSMENT: "Assessment Reminder",
    VACCINATION: "Vaccination Reminder",
    MEDICAL: "Medical Report Reminder",
    MEDICINE: "Medicine Reminder",
    EVENT: "Event",
    INSURANCE: "Insurance Reminder",
    PAYMENT: "Payment Reminder",
    REQUEST: "Request",
    CONTRACT: "Contract Reminder",
    OTHER: "Notification",
  };
  return labels[type];
}
