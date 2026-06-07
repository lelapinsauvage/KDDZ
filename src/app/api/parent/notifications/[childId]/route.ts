import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { AlarmType, Prisma } from "@/generated/prisma/client";
import {
  formatChildName,
  formatDateTimeLong,
  jsonError,
  jsonSuccess,
  verifyParentToken,
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
  branchId: string | null;
};

type ParentNotificationUser = {
  id: string;
  childId: string;
  legacyChildId: number | null;
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
  custom_notifications_birthday_parents: "BIRTHDAY",
  t_alarms_birthday: "BIRTHDAY",
  t_alarms_vaccinations: "VACCINATION",
  t_alarms_medicine: "MEDICINE",
  t_alarms_insurance: "INSURANCE",
  t_alarms_payments: "PAYMENT",
  t_alarms_medical: "MEDICAL",
  t_alarms_assessment: "ASSESSMENT",
  t_alarms_assessment_parents: "ASSESSMENT",
  t_alarms: "EVENT",
  t_alarms_requests: "REQUEST",
  t_alarms_others: "OTHER",
};

const DEFAULT_NATURES: NotificationNature[] = [
  nature(1, "Birthdays", "custom_notifications_birthday_parents", null, "", "cusntf_notification_text"),
  nature(2, "Closure", "t_alarms", "custom_notifications_parents", "type", "details"),
  nature(4, "Events", "t_events", "custom_notifications_events_parents", "custom_subject", "custom_body"),
  nature(7, "Medicine", "t_alarms_medicine", "custom_notifications_medicine_parents", "", "details"),
  nature(3, "Assessments", "t_alarms_assessment_parents", null, "", "details"),
  nature(5, "Report Reminders", "t_alarms_medical", "custom_notifications_medical_parents", "", "details"),
  nature(6, "Vaccinations", "t_alarms_vaccinations", "custom_notifications_vaccinations", "", "details"),
  nature(8, "Insurance", "t_alarms_insurance", "custom_notifications_insurance_parents", "", "details"),
  nature(9, "Payments", "t_alarms_payments", "custom_notifications_payments", "", "details"),
  nature(10, "Other", "t_alarms_others", "custom_notifications_others_parents", "", "details"),
  nature(11, "Requests", "t_alarms_requests", "custom_notifications_requests_parents", "", "details"),
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const { childId: routeChildId } = await params;

  const body = request.method === "POST" ? await readRequestBody(request) : null;
  const postedChildId = readString(body, ["usites", "pid", "child_id", "childId"]);
  const auth = await optionalAuthenticateParent(request);
  if (auth && "error" in auth) return auth.error;
  if (request.method === "POST" && !postedChildId) return jsonSuccess({});

  const requestedChildId = postedChildId ?? routeChildId;
  let parentUser = auth?.parentUser ?? null;
  let child = parentUser?.child ?? null;

  if (parentUser) {
    if (!matchesChildId(parentUser, requestedChildId)) {
      return jsonError("Access denied", 403);
    }
  } else {
    const context = await resolveLegacyNotificationContext(requestedChildId);
    parentUser = context.parentUser;
    child = context.child;
  }

  try {
    const result: Record<string, unknown> = {
      info: {
        name: child ? formatChildName(child) : "",
        status: Boolean(child),
        no_notifications: "No New Notifications",
      },
    };

    const natures = await loadNotificationNatures();

    for (let index = 0; index < natures.length; index++) {
      const item = natures[index];
      result[`notification${index + 1}`] = buildNotificationGroup(
        item.name,
        child && item.isActive
          ? await loadNatureDetails(item, child, parentUser)
          : []
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

  return natures.length > 0 ? withDefaultNotificationNatures(natures) : DEFAULT_NATURES;
}

function withDefaultNotificationNatures(natures: NotificationNature[]) {
  if (natures.length >= DEFAULT_NATURES.length) return natures;

  const existingKeys = new Set(
    natures.map((item) => `${item.legacyId}:${item.name.toLowerCase()}`)
  );
  const missing = DEFAULT_NATURES.filter(
    (item) => !existingKeys.has(`${item.legacyId}:${item.name.toLowerCase()}`)
  );

  return [...natures, ...missing].sort(
    (a, b) =>
      (a.displayOrder ?? a.legacyId) - (b.displayOrder ?? b.legacyId)
  );
}

async function loadNatureDetails(
  nature: NotificationNature,
  child: ParentNotificationChild,
  parentUser: ParentNotificationUser | null
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
  });

  return alarms
    .filter((alarm) => alarmMatchesContentTable(alarm, contentTable))
    .map((alarm) => mapAlarmDetail(alarm, nature));
}

async function loadAlarmReceiptDetails(
  nature: NotificationNature,
  child: ParentNotificationChild,
  parentUser: ParentNotificationUser | null
) {
  if (!nature.parentDeliveryTable) return [];

  const receipts = await db.notificationReceipt.findMany({
    where: {
      sourceTable: nature.parentDeliveryTable,
      OR: recipientFilters(child, parentUser),
    },
    include: { alarm: true },
    orderBy: { createdAt: "desc" },
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
  const branchFilters = eventBranchCandidateFilters(child.branchId);
  if (branchFilters.length === 0) return [];

  const now = new Date();
  const events = await db.event.findMany({
    where: {
      isActive: true,
      date: { lte: now },
      OR: branchFilters,
    },
    orderBy: { date: "desc" },
  });

  return events
    .filter((event) => eventMatchesChildBranch(event, child.branchId))
    .map((event) => mapEventDetail(event, nature));
}

async function loadEventReceiptDetails(
  nature: NotificationNature,
  child: ParentNotificationChild,
  parentUser: ParentNotificationUser | null
) {
  if (!nature.parentDeliveryTable) return [];

  const receipts = await db.notificationReceipt.findMany({
    where: {
      sourceTable: nature.parentDeliveryTable,
      OR: recipientFilters(child, parentUser),
    },
    orderBy: { createdAt: "desc" },
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
  parentUser: ParentNotificationUser | null
) {
  if (!parentUser) return [];

  const messages = await db.message.findMany({
    where: {
      recipientId: parentUser.id,
      recipientType: "PARENT",
    },
    orderBy: { createdAt: "desc" },
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
  parentUser: ParentNotificationUser | null
): Prisma.NotificationReceiptWhereInput[] {
  const filters: Prisma.NotificationReceiptWhereInput[] = [
    { recipientId: child.id },
  ];

  if (parentUser) {
    filters.push({ recipientId: parentUser.id });
  }

  if (child.legacyId !== null) {
    filters.push({ legacyRecipientId: child.legacyId });
  }

  return filters;
}

function alarmMatchesContentTable(alarm: AlarmRow, contentTable: string) {
  const sourceTable = readString(asRecord(alarm.legacyData), ["sourceTable"]);
  return !sourceTable || sourceTable === contentTable;
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

  return { parentUser: parentUser as ParentNotificationUser };
}

async function resolveLegacyNotificationContext(childId: string): Promise<{
  child: ParentNotificationChild | null;
  parentUser: ParentNotificationUser | null;
}> {
  const legacyChildId = parseLegacyInt(childId);
  const childWhere = [];

  if (UUID_RE.test(childId)) {
    childWhere.push({ id: childId });
  }
  if (legacyChildId !== null) {
    childWhere.push({ legacyId: legacyChildId });
  }

  const child = childWhere.length
    ? await db.child.findFirst({
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
      })
    : null;

  if (!child) return { child: null, parentUser: null };

  const parentUser = await db.parentUser.findFirst({
    where: {
      OR: [
        { childId: child.id },
        ...(child.legacyId !== null ? [{ legacyChildId: child.legacyId }] : []),
      ],
    },
    include: { child: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    child,
    parentUser: parentUser ? (parentUser as ParentNotificationUser) : null,
  };
}

function eventMatchesChildBranch(event: EventRow, childBranchId: string | null) {
  if (!childBranchId) return false;
  const branchIds = jsonStringArray(event.notificationBranchIds);
  if (branchIds.length > 0) return branchIds.includes(childBranchId);
  return event.branchId === childBranchId || event.branchId === null;
}

function eventBranchCandidateFilters(
  childBranchId: string | null
): Prisma.EventWhereInput[] {
  if (!childBranchId) return [];

  return [
    { branchId: childBranchId },
    {
      notificationBranchIds: { array_contains: [childBranchId] },
    } as Prisma.EventWhereInput,
    {
      branchId: null,
      notificationBranchIds: { equals: [] },
    } as Prisma.EventWhereInput,
  ];
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

function matchesChildId(parentUser: ParentNotificationUser, postedChildId: string) {
  return (
    postedChildId === parentUser.childId ||
    postedChildId === parentUser.child.id ||
    postedChildId === String(parentUser.legacyChildId ?? "") ||
    postedChildId === String(parentUser.child.legacyId ?? "")
  );
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

function parseLegacyInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
