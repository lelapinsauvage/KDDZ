"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  channelDeliveryAuditData,
  deliverParentChannelNotification,
  type ChannelDeliverySummary,
} from "@/lib/channel-delivery";
import {
  deliverPushNotification,
  pushDeliveryAuditData,
  type PushDeliverySummary,
} from "@/lib/push-delivery";
import {
  createLegacyBulkMessageSideEffects as createLegacyBulkMessageSideEffectsCore,
  findLegacyMessageSideEffect as findLegacyMessageSideEffectCore,
  legacyMessageSideEffectIntent as legacyMessageSideEffectIntentCore,
  legacySideEffectHasTargets as legacySideEffectHasTargetsCore,
} from "@/lib/legacy-message-side-effects";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";

import type { Prisma } from "@/generated/prisma/client";
import type {
  SenderType,
  RecipientType,
} from "@/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MessageListParams {
  search?: string;
  readStatus?: "all" | "read" | "unread";
  page?: number;
  pageSize?: PageSize;
}

interface SentMessageListParams {
  search?: string;
  id?: string;
  to?: string;
  dateFrom?: string;
  dateTo?: string;
  nature?: string;
  subject?: string;
  message?: string;
  thread?: string;
  page?: number;
  pageSize?: PageSize;
}

interface MessageAlarmListParams extends MessageListParams {
  nature?: string;
}

interface SendMessageData {
  recipientId: string;
  recipientType: RecipientType;
  subject?: string | null;
  body: string;
  threadId?: string | null;
  nature?: string | null;
  delivery?: LegacyMessageDeliveryOptions | null;
}

interface SendClassMessageData {
  classId: string;
  childIds?: string[];
  subject?: string | null;
  body: string;
  nature?: string | null;
  delivery?: LegacyMessageDeliveryOptions | null;
}

interface SendBulkChildMessageData {
  childIds: string[];
  teacherUserIds?: string[];
  subject?: string | null;
  body: string;
  nature?: string | null;
  delivery?: LegacyMessageDeliveryOptions | null;
}

interface LegacyMessageDeliveryOptions {
  web?: boolean;
  mobile?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
  adminOnly?: boolean;
}

type LegacyDeliveryChannel = "Web" | "Mobile" | "SMS" | "WhatsApp";

type PageSize = number | "all";

function numericPageSize(pageSize: PageSize | undefined, fallback: number) {
  return pageSize === "all" ? undefined : Math.max(1, pageSize ?? fallback);
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a UserRole to a SenderType.
 * The SenderType enum only has ADMIN | TEACHER | PARENT,
 * so NURSE / DOCTOR / MANAGER map to ADMIN (staff).
 */
function roleToSenderType(role: string): SenderType {
  switch (role) {
    case "TEACHER":
      return "TEACHER";
    case "ADMIN":
      return "ADMIN";
    default:
      // NURSE, DOCTOR, MANAGER are staff — treat as ADMIN sender type
      return "ADMIN";
  }
}

function revalidateMessagePaths() {
  [
    "/messages",
    "/messages/inbox",
    "/messages/sent",
    "/alarms",
    "/alarms/msg",
    "/alarms/events",
    "/alarms/birthdays",
    "/alarms/insurance",
    "/alarms/medicine",
    "/alarms/requests",
    "/alarms/others",
    "/alarms/assessments",
    "/alarms/payments",
    "/alarms/vaccinations",
    "/settings/events",
    "/settings/holidays",
  ].forEach((path) => revalidatePath(path));
}

function parseSubjectNature(subject: string | null): string | null {
  if (!subject) return null;
  const match = subject.match(/^\[([^\]]+)\]\s*/);
  return match?.[1]?.trim() || null;
}

function parseLegacyNumber(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseLegacyDateBoundary(
  value: string | undefined,
  endOfDay = false,
): Date | null {
  if (!value) return null;
  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
}

const NO_RECIPIENT_MATCH = "00000000-0000-0000-0000-000000000000";

async function findSentMessageRecipientIds(
  search: string | undefined,
  organizationId: string,
) {
  const query = search?.trim();
  if (!query) return [];

  const [users, parentUsers] = await Promise.all([
    db.user.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    }),
    db.parentUser.findMany({
      where: {
        child: { branch: { organizationId } },
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { child: { firstName: { contains: query, mode: "insensitive" } } },
          { child: { lastName: { contains: query, mode: "insensitive" } } },
        ],
      },
      select: { id: true },
    }),
  ]);

  return [...users.map((user) => user.id), ...parentUsers.map((user) => user.id)];
}

function containsText(value: string) {
  return { contains: value, mode: "insensitive" };
}

function normalizeLegacyDelivery(delivery?: LegacyMessageDeliveryOptions | null) {
  return {
    web: delivery?.web !== false,
    mobile: Boolean(delivery?.mobile),
    sms: Boolean(delivery?.sms),
    whatsapp: Boolean(delivery?.whatsapp),
    adminOnly: Boolean(delivery?.adminOnly),
  };
}

function shouldDeliverMobile(delivery?: LegacyMessageDeliveryOptions | null) {
  return Boolean(delivery?.mobile);
}

function shouldDeliverSms(delivery?: LegacyMessageDeliveryOptions | null) {
  return Boolean(delivery?.sms);
}

function shouldDeliverWhatsApp(delivery?: LegacyMessageDeliveryOptions | null) {
  return Boolean(delivery?.whatsapp);
}

function messagePushTitle(subject: string | null) {
  return subject?.trim() || "New message";
}

type MessageChannelDelivery = Partial<
  Record<"sms" | "whatsapp", ChannelDeliverySummary>
>;

type MessageExternalDeliveryResult = {
  pushDelivery: PushDeliverySummary | null;
  channelDelivery: MessageChannelDelivery;
};

function hasExternalDeliveryAudit(audit: MessageExternalDeliveryResult) {
  return Boolean(
    audit.pushDelivery || Object.keys(audit.channelDelivery).length > 0,
  );
}

function externalDeliveryAuditJson(
  audit: MessageExternalDeliveryResult,
): Prisma.InputJsonObject {
  const channelDelivery = {
    ...(audit.channelDelivery.sms
      ? {
          sms: channelDeliveryAuditData(
            audit.channelDelivery.sms,
          ) as Prisma.InputJsonValue,
        }
      : {}),
    ...(audit.channelDelivery.whatsapp
      ? {
          whatsapp: channelDeliveryAuditData(
            audit.channelDelivery.whatsapp,
          ) as Prisma.InputJsonValue,
        }
      : {}),
  };

  return {
    ...(audit.pushDelivery
      ? {
          pushDelivery: pushDeliveryAuditData(
            audit.pushDelivery,
          ) as Prisma.InputJsonValue,
        }
      : {}),
    ...(Object.keys(channelDelivery).length > 0 ? { channelDelivery } : {}),
  };
}

function mergeExternalDeliveryAudit(
  legacyData: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined,
  audit: MessageExternalDeliveryResult,
): Prisma.InputJsonObject {
  const base = isJsonRecord(legacyData)
    ? (Object.fromEntries(Object.entries(legacyData)) as Record<
        string,
        Prisma.InputJsonValue | null
      >)
    : {};
  return {
    ...base,
    ...externalDeliveryAuditJson(audit),
  };
}

async function attemptMessageExternalDelivery(params: {
  delivery?: LegacyMessageDeliveryOptions | null;
  parentUserIds: string[];
  subject: string | null;
  body: string;
  metadata: Record<string, string | number | boolean | null | undefined>;
}): Promise<MessageExternalDeliveryResult> {
  const parentUserIds = Array.from(new Set(params.parentUserIds.filter(Boolean)));
  if (parentUserIds.length === 0) {
    return { pushDelivery: null, channelDelivery: {} };
  }

  const [pushDelivery, smsDelivery, whatsappDelivery] = await Promise.all([
    shouldDeliverMobile(params.delivery)
      ? deliverPushNotification({
          recipientParentUserIds: parentUserIds,
          title: messagePushTitle(params.subject),
          body: params.body,
          category: "MESSAGE",
          metadata: params.metadata,
        })
      : Promise.resolve(null),
    shouldDeliverSms(params.delivery)
      ? deliverParentChannelNotification({
          channel: "sms",
          recipientParentUserIds: parentUserIds,
          subject: params.subject,
          body: params.body,
          category: "MESSAGE",
          metadata: params.metadata,
        })
      : Promise.resolve(null),
    shouldDeliverWhatsApp(params.delivery)
      ? deliverParentChannelNotification({
          channel: "whatsapp",
          recipientParentUserIds: parentUserIds,
          subject: params.subject,
          body: params.body,
          category: "MESSAGE",
          metadata: params.metadata,
        })
      : Promise.resolve(null),
  ]);

  const channelDelivery: MessageChannelDelivery = {};
  if (smsDelivery) channelDelivery.sms = smsDelivery;
  if (whatsappDelivery) channelDelivery.whatsapp = whatsappDelivery;

  return { pushDelivery, channelDelivery };
}

async function updateMessagesExternalDeliveryAudit(params: {
  where: Prisma.MessageWhereInput;
  audit: MessageExternalDeliveryResult;
}) {
  if (!hasExternalDeliveryAudit(params.audit)) return;
  const messages = await db.message.findMany({
    where: params.where,
    select: { id: true, legacyData: true },
  });
  await Promise.all(
    messages.map((message) =>
      db.message.update({
        where: { id: message.id },
        data: {
          legacyData: mergeExternalDeliveryAudit(message.legacyData, params.audit),
        },
      }),
    ),
  );
}

function legacyMessageData(params: {
  sourcePage: string;
  nature?: string | null;
  delivery?: LegacyMessageDeliveryOptions | null;
  classId?: string | null;
  childIds?: string[];
  teacherUserIds?: string[];
  recipientScope?: string;
}): Prisma.InputJsonObject {
  const delivery = normalizeLegacyDelivery(params.delivery);
  const externalDeliveryPending = [
    delivery.mobile ? "mobile" : null,
    delivery.sms ? "sms" : null,
    delivery.whatsapp ? "whatsapp" : null,
  ].filter((channel): channel is string => Boolean(channel));

  return {
    modernParitySource: "legacy-message-portal",
    legacyPage: params.sourcePage,
    delivery,
    externalDeliveryPending,
    sideEffectIntent:
      params.sourcePage === "message_portal.php"
        ? legacyMessageSideEffectIntentCore(params.nature)
        : null,
    classId: params.classId ?? null,
    selectedChildIds: params.childIds ?? [],
    selectedTeacherUserIds: params.teacherUserIds ?? [],
    recipientScope: params.recipientScope ?? "primary",
  };
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function legacyDeliveryAudit(
  legacyData: Prisma.JsonValue | null | undefined,
) {
  const data = isJsonRecord(legacyData) ? legacyData : null;
  const delivery = isJsonRecord(data?.delivery) ? data.delivery : null;

  if (!data || !delivery) {
    return {
      channels: [] as LegacyDeliveryChannel[],
      scope: null,
      pendingExternal: false,
    };
  }

  const channels: LegacyDeliveryChannel[] = [];
  if (delivery.web !== false) channels.push("Web");
  if (delivery.mobile === true) channels.push("Mobile");
  if (delivery.sms === true) channels.push("SMS");
  if (delivery.whatsapp === true) channels.push("WhatsApp");

  const pendingExternal = new Set(
    Array.isArray(data.externalDeliveryPending)
      ? data.externalDeliveryPending.filter(
          (channel): channel is string => typeof channel === "string",
        )
      : [],
  );
  if (isJsonRecord(data.pushDelivery)) {
    pendingExternal.delete("mobile");
  }
  const channelDelivery = isJsonRecord(data.channelDelivery)
    ? data.channelDelivery
    : null;
  if (isJsonRecord(channelDelivery?.sms)) {
    pendingExternal.delete("sms");
  }
  if (isJsonRecord(channelDelivery?.whatsapp)) {
    pendingExternal.delete("whatsapp");
  }

  const recipientScope =
    typeof data.recipientScope === "string" ? data.recipientScope : null;
  const scope =
    delivery.adminOnly === true
      ? "Admin only"
      : recipientScope === "admin-copy"
        ? "Admin copy"
        : recipientScope === "admin"
          ? "Admin"
          : recipientScope === "parent"
            ? "Parent"
            : null;

  return {
    channels,
    scope,
    pendingExternal: pendingExternal.size > 0,
  };
}

function jsonForCreate(value: Prisma.JsonValue | null | undefined) {
  if (value === null || value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

async function adminRecipientIds(organizationId: string, senderId: string) {
  const admins = await db.user.findMany({
    where: {
      organizationId,
      role: "ADMIN",
      id: { not: senderId },
    },
    select: { id: true },
  });

  return admins.map((admin) => admin.id);
}

function isMessageParticipant(
  message: { senderId: string; recipientId: string },
  userId: string,
) {
  return message.senderId === userId || message.recipientId === userId;
}

/**
 * Resolve display names for a set of message rows.
 * Looks up Users (admin/teacher) and ParentUsers (parents) by ID.
 */
async function resolveNames(
  ids: Array<{ id: string; type: string }>,
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  if (ids.length === 0) return nameMap;

  const adminIds = new Set<string>();
  const parentIds = new Set<string>();

  for (const { id, type } of ids) {
    if (type === "PARENT") {
      parentIds.add(id);
    } else {
      adminIds.add(id);
    }
  }

  const [users, parentUsers] = await Promise.all([
    adminIds.size > 0
      ? db.user.findMany({
          where: { id: { in: Array.from(adminIds) } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [],
    parentIds.size > 0
      ? db.parentUser.findMany({
          where: { id: { in: Array.from(parentIds) } },
          select: {
            id: true,
            username: true,
            child: { select: { firstName: true, lastName: true } },
          },
        })
      : [],
  ]);

  for (const u of users) {
    const label = u.name || u.email;
    const roleLabel = u.role === "TEACHER" ? "Teacher" : "Admin";
    nameMap.set(u.id, `${label} (${roleLabel})`);
  }

  for (const pu of parentUsers) {
    nameMap.set(
      pu.id,
      `${pu.username} — Parent of ${pu.child.firstName} ${pu.child.lastName}`,
    );
  }

  return nameMap;
}

// ---------------------------------------------------------------------------
// getUnreadMessageCount — lightweight count for header badge
// ---------------------------------------------------------------------------

export async function getUnreadMessageCount(): Promise<ActionResult> {
  try {
    const { userId, organizationId: orgId } = await requireOrg();

    const count = await db.message.count({
      where: {
        recipientId: userId,
        organizationId: orgId,
        isRead: false,
      },
    });

    return { success: true, data: count };
  } catch (error) {
    console.error("Failed to fetch unread message count:", error);
    return { success: true, data: 0 };
  }
}

// ---------------------------------------------------------------------------
// getInbox
// ---------------------------------------------------------------------------

export async function getInbox(
  params: MessageListParams = {},
): Promise<ActionResult> {
  try {
    const { userId, organizationId: orgId } = await requireOrg();

    const { search, readStatus = "all", page = 1, pageSize = 50 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      recipientId: userId,
      organizationId: orgId,
    };

    if (readStatus === "read") {
      where.isRead = true;
    } else if (readStatus === "unread") {
      where.isRead = false;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const resolvedPageSize = numericPageSize(pageSize, 50);
    const skip = resolvedPageSize ? (page - 1) * resolvedPageSize : undefined;

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(skip !== undefined ? { skip } : {}),
        ...(resolvedPageSize !== undefined ? { take: resolvedPageSize } : {}),
      }),
      db.message.count({ where }),
    ]);

    // Resolve sender names
    const senderEntries = messages.map((m) => ({
      id: m.senderId,
      type: m.senderType,
    }));
    const nameMap = await resolveNames(senderEntries);

    const enriched = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderType: msg.senderType,
      senderName: nameMap.get(msg.senderId) ?? "Unknown",
      recipientId: msg.recipientId,
      recipientType: msg.recipientType,
      subject: msg.subject,
      body: msg.body,
      isRead: msg.isRead,
      threadId: msg.threadId,
      legacyDelivery: legacyDeliveryAudit(msg.legacyData),
      createdAt:
        msg.createdAt instanceof Date
          ? msg.createdAt.toISOString()
          : String(msg.createdAt),
    }));

    return {
      success: true,
      data: {
        messages: enriched,
        total,
        page,
        pageSize,
        totalPages: resolvedPageSize ? Math.ceil(total / resolvedPageSize) : 1,
      },
    };
  } catch (error) {
    console.error("Failed to fetch inbox:", error);
    return { success: false, error: "Failed to fetch inbox" };
  }
}

// ---------------------------------------------------------------------------
// getMessageAlarms — legacy alarmsMsg.php parity
// ---------------------------------------------------------------------------

export async function getMessageAlarms(
  params: MessageAlarmListParams = {},
): Promise<ActionResult> {
  try {
    const { userId, organizationId: orgId } = await requireOrg();

    const {
      search,
      readStatus = "all",
      nature,
      page = 1,
      pageSize = 500,
    } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      recipientId: userId,
      organizationId: orgId,
    };

    if (readStatus === "read") {
      where.isRead = true;
    } else if (readStatus === "unread") {
      where.isRead = false;
    }

    if (nature && nature !== "ALL") {
      where.legacyNature = nature;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { legacyNature: { contains: search, mode: "insensitive" } },
      ];
    }

    const resolvedPageSize = numericPageSize(pageSize, 500);
    const skip = resolvedPageSize ? (page - 1) * resolvedPageSize : undefined;

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(skip !== undefined ? { skip } : {}),
        ...(resolvedPageSize !== undefined ? { take: resolvedPageSize } : {}),
      }),
      db.message.count({ where }),
    ]);

    const senderEntries = messages.map((m) => ({
      id: m.senderId,
      type: m.senderType,
    }));
    const nameMap = await resolveNames(senderEntries);

    const enriched = messages.map((msg) => {
      const fallbackNature = parseSubjectNature(msg.subject);
      return {
        id: msg.id,
        legacyId: msg.legacyId,
        senderId: msg.senderId,
        senderType: msg.senderType,
        senderName: nameMap.get(msg.senderId) ?? "Unknown",
        date: msg.createdAt instanceof Date
          ? msg.createdAt.toISOString()
          : String(msg.createdAt),
        nature: msg.legacyNature ?? fallbackNature ?? "General",
        subject: msg.subject,
        body: msg.body,
        isRead: msg.isRead,
        status: msg.isRead ? "Viewed" : "New",
        threadId: msg.threadId,
        legacyHref: msg.legacyHref,
        searchText: [
          msg.legacyId,
          nameMap.get(msg.senderId) ?? "Unknown",
          msg.legacyNature ?? fallbackNature,
          msg.subject,
          msg.body,
          msg.isRead ? "Viewed" : "New",
        ]
          .filter(Boolean)
          .join(" "),
      };
    });

    return {
      success: true,
      data: {
        messages: enriched,
        total,
        page,
        pageSize,
        totalPages: resolvedPageSize ? Math.ceil(total / resolvedPageSize) : 1,
      },
    };
  } catch (error) {
    console.error("Failed to fetch message notifications:", error);
    return { success: false, error: "Failed to fetch message notifications" };
  }
}

// ---------------------------------------------------------------------------
// getSentMessages
// ---------------------------------------------------------------------------

export async function getSentMessages(
  params: SentMessageListParams = {},
): Promise<ActionResult> {
  try {
    const { userId, organizationId: orgId } = await requireOrg();

    const {
      search,
      id,
      to,
      dateFrom,
      dateTo,
      nature,
      subject,
      message,
      thread,
      page = 1,
      pageSize = 50,
    } = params;
    const normalizedPage = Math.max(1, page);
    const paginated = pageSize !== "all";
    const numericPageSize = paginated ? Math.max(1, pageSize) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      senderId: userId,
      organizationId: orgId,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const andConditions: any[] = [];

    const legacyId = parseLegacyNumber(id);
    if (id) {
      andConditions.push({
        OR: [
          ...(legacyId !== null ? [{ legacyId }] : []),
          { legacyKey: containsText(id) },
        ],
      });
    }

    if (to) {
      const recipientIds = await findSentMessageRecipientIds(to, orgId);
      andConditions.push({
        recipientId: { in: recipientIds.length ? recipientIds : [NO_RECIPIENT_MATCH] },
      });
    }

    const fromDate = parseLegacyDateBoundary(dateFrom);
    const toDate = parseLegacyDateBoundary(dateTo, true);
    if (fromDate || toDate) {
      andConditions.push({
        createdAt: {
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lte: toDate } : {}),
        },
      });
    }

    if (nature) {
      andConditions.push({
        OR: [
          { legacyNature: containsText(nature) },
          { subject: containsText(`[${nature}`) },
          { subject: containsText(nature) },
        ],
      });
    }

    if (subject) {
      andConditions.push({ subject: containsText(subject) });
    }

    if (message) {
      andConditions.push({ body: containsText(message) });
    }

    const legacyThreadId = parseLegacyNumber(thread);
    if (thread) {
      andConditions.push({
        OR: [
          ...(legacyThreadId !== null ? [{ legacyThreadId }] : []),
          ...(isUuid(thread) ? [{ threadId: thread }] : []),
          { legacyHref: containsText(thread) },
        ],
      });
    }

    if (search) {
      const globalRecipientIds = await findSentMessageRecipientIds(search, orgId);
      const globalLegacyId = parseLegacyNumber(search);
      const globalDate = parseLegacyDateBoundary(search);
      andConditions.push({
        OR: [
          { subject: containsText(search) },
          { body: containsText(search) },
          { legacyNature: containsText(search) },
          { legacyHref: containsText(search) },
          { legacyKey: containsText(search) },
          ...(globalLegacyId !== null
            ? [{ legacyId: globalLegacyId }, { legacyThreadId: globalLegacyId }]
            : []),
          ...(isUuid(search) ? [{ threadId: search }] : []),
          ...(globalDate
            ? [
                {
                  createdAt: {
                    gte: globalDate,
                    lte: parseLegacyDateBoundary(search, true) ?? globalDate,
                  },
                },
              ]
            : []),
          ...(globalRecipientIds.length
            ? [{ recipientId: { in: globalRecipientIds } }]
            : []),
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const skip = numericPageSize ? (normalizedPage - 1) * numericPageSize : undefined;

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(skip !== undefined ? { skip } : {}),
        ...(numericPageSize !== undefined ? { take: numericPageSize } : {}),
      }),
      db.message.count({ where }),
    ]);

    // Resolve recipient names
    const recipientEntries = messages.map((m) => ({
      id: m.recipientId,
      type: m.recipientType,
    }));
    const nameMap = await resolveNames(recipientEntries);

    const enriched = messages.map((msg) => ({
      id: msg.id,
      legacyId: msg.legacyId,
      legacyThreadId: msg.legacyThreadId,
      legacyNature: msg.legacyNature,
      legacyHref: msg.legacyHref,
      senderId: msg.senderId,
      senderType: msg.senderType,
      recipientId: msg.recipientId,
      recipientType: msg.recipientType,
      recipientName: nameMap.get(msg.recipientId) ?? "Unknown",
      nature: msg.legacyNature ?? parseSubjectNature(msg.subject) ?? "General",
      subject: msg.subject,
      body: msg.body,
      isRead: msg.isRead,
      threadId: msg.threadId,
      legacyDelivery: legacyDeliveryAudit(msg.legacyData),
      createdAt:
        msg.createdAt instanceof Date
          ? msg.createdAt.toISOString()
          : String(msg.createdAt),
    }));

    return {
      success: true,
      data: {
        messages: enriched,
        total,
        page: normalizedPage,
        pageSize,
        totalPages: numericPageSize ? Math.ceil(total / numericPageSize) : 1,
      },
    };
  } catch (error) {
    console.error("Failed to fetch sent messages:", error);
    return { success: false, error: "Failed to fetch sent messages" };
  }
}

// ---------------------------------------------------------------------------
// getMessageById — single message + thread messages
// ---------------------------------------------------------------------------

export async function getMessageById(id: string): Promise<ActionResult> {
  try {
    const { userId, organizationId: orgId } = await requireOrg();

    const message = await db.message.findUnique({
      where: { id },
    });

    if (!message || message.organizationId !== orgId) {
      return { success: false, error: "Message not found" };
    }

    // If the message belongs to a thread, get all messages in that thread
    let threadMessages: typeof message[] = [];
    if (message.threadId) {
      threadMessages = await db.message.findMany({
        where: { threadId: message.threadId },
        orderBy: { createdAt: "asc" },
      });
    } else {
      threadMessages = [message];
    }

    const canViewThread = threadMessages.some(
      (threadMessage) =>
        threadMessage.senderId === userId || threadMessage.recipientId === userId,
    );
    if (!canViewThread) {
      return { success: false, error: "Forbidden" };
    }

    // Resolve all sender and recipient names
    const allIds: Array<{ id: string; type: string }> = [];
    for (const m of threadMessages) {
      allIds.push({ id: m.senderId, type: m.senderType });
      allIds.push({ id: m.recipientId, type: m.recipientType });
    }
    const nameMap = await resolveNames(allIds);

    // Mark as read if recipient is the current user
    if (
      message.recipientId === userId &&
      !message.isRead
    ) {
      await db.message.update({
        where: { id },
        data: { isRead: true },
      });
      revalidateMessagePaths();
    }

    const enriched = threadMessages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderType: m.senderType,
      senderName: nameMap.get(m.senderId) ?? "Unknown",
      recipientId: m.recipientId,
      recipientType: m.recipientType,
      recipientName: nameMap.get(m.recipientId) ?? "Unknown",
      subject: m.subject,
      body: m.body,
      isRead: m.isRead,
      threadId: m.threadId,
      legacyDelivery: legacyDeliveryAudit(m.legacyData),
      createdAt:
        m.createdAt instanceof Date
          ? m.createdAt.toISOString()
          : String(m.createdAt),
    }));

    return {
      success: true,
      data: {
        message: enriched.find((m) => m.id === id),
        threadMessages: enriched,
      },
    };
  } catch (error) {
    console.error("Failed to fetch message:", error);
    return { success: false, error: "Failed to fetch message" };
  }
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

export async function sendMessage(
  data: SendMessageData,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const senderType = roleToSenderType(ctx.role);

    // Prefix subject with nature tag if provided
    const subjectLine = data.nature && data.subject
      ? `[${data.nature}] ${data.subject}`
      : data.subject ?? null;

    // Create or reuse a thread
    let threadId = data.threadId ?? null;
    if (!threadId) {
      const thread = await db.messageThread.create({
        data: { subject: subjectLine, organizationId: ctx.organizationId },
      });
      threadId = thread.id;
    }

    const messageLegacyData = legacyMessageData({
      sourcePage: "message_portal_single.php",
      nature: data.nature,
      delivery: data.delivery,
    });
    const message = await db.message.create({
      data: {
        senderId: ctx.userId,
        senderType,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        subject: subjectLine,
        body: data.body,
        threadId,
        organizationId: ctx.organizationId,
        legacyNature: data.nature ?? null,
        legacyData: messageLegacyData,
      },
    });
    let returnedMessage = message;

    if (data.recipientType === "PARENT") {
      const adminIds = await adminRecipientIds(ctx.organizationId, ctx.userId);
      if (adminIds.length > 0) {
        await db.message.createMany({
          data: adminIds.map((adminId) => ({
            senderId: ctx.userId,
            senderType,
            recipientId: adminId,
            recipientType: "ADMIN" as RecipientType,
            subject: subjectLine,
            body: data.body,
            threadId,
            organizationId: ctx.organizationId,
            legacyNature: data.nature ?? null,
            legacyData: legacyMessageData({
              sourcePage: "message_portal_single.php",
              nature: data.nature,
              delivery: data.delivery,
              recipientScope: "admin-copy",
            }),
          })),
        });
      }
      const externalDelivery = await attemptMessageExternalDelivery({
        delivery: data.delivery,
        parentUserIds: [data.recipientId],
        subject: subjectLine,
        body: data.body,
        metadata: {
          source: "legacy_message_portal_single",
          messageId: message.id,
          threadId,
          nature: data.nature ?? null,
        },
      });
      if (hasExternalDeliveryAudit(externalDelivery)) {
        returnedMessage = await db.message.update({
          where: { id: message.id },
          data: {
            legacyData: mergeExternalDeliveryAudit(
              messageLegacyData,
              externalDelivery,
            ),
          },
        });
      }
    }

    revalidateMessagePaths();

    return { success: true, data: returnedMessage };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

// ---------------------------------------------------------------------------
// replyToMessage
// ---------------------------------------------------------------------------

export async function replyToMessage(
  originalMessageId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const original = await db.message.findUnique({
      where: { id: originalMessageId },
    });

    if (!original || original.organizationId !== ctx.organizationId) {
      return { success: false, error: "Original message not found" };
    }
    if (!isMessageParticipant(original, ctx.userId)) {
      return { success: false, error: "Forbidden" };
    }

    const senderType = roleToSenderType(ctx.role);
    const replyRecipient =
      original.senderId === ctx.userId
        ? {
            id: original.recipientId,
            type: original.recipientType,
          }
        : {
            id: original.senderId,
            type: original.senderType as RecipientType,
          };

    // Create thread if none exists
    let threadId = original.threadId;
    if (!threadId) {
      const thread = await db.messageThread.create({
        data: { subject: original.subject, organizationId: ctx.organizationId },
      });
      threadId = thread.id;
      // Link original message to thread
      await db.message.update({
        where: { id: original.id },
        data: { threadId },
      });
    }

    const replyLegacyData = jsonForCreate(original.legacyData);
    const reply = await db.message.create({
      data: {
        senderId: ctx.userId,
        senderType,
        recipientId: replyRecipient.id,
        recipientType: replyRecipient.type,
        subject: original.subject ? `Re: ${original.subject}` : null,
        body,
        threadId,
        organizationId: ctx.organizationId,
        legacyNature: original.legacyNature,
        legacyData: replyLegacyData,
      },
    });
    const originalDelivery = legacyDeliveryAudit(original.legacyData);
    const replyDelivery: LegacyMessageDeliveryOptions = {
      mobile: originalDelivery.channels.includes("Mobile"),
      sms: originalDelivery.channels.includes("SMS"),
      whatsapp: originalDelivery.channels.includes("WhatsApp"),
    };
    const externalDelivery =
      replyRecipient.type === "PARENT"
        ? await attemptMessageExternalDelivery({
            delivery: replyDelivery,
            parentUserIds: [replyRecipient.id],
            subject: reply.subject,
            body,
            metadata: {
              source: "legacy_message_reply",
              messageId: reply.id,
              threadId,
              nature: original.legacyNature ?? null,
            },
          })
        : { pushDelivery: null, channelDelivery: {} };
    const returnedReply = hasExternalDeliveryAudit(externalDelivery)
      ? await db.message.update({
          where: { id: reply.id },
          data: {
            legacyData: mergeExternalDeliveryAudit(
              replyLegacyData,
              externalDelivery,
            ),
          },
        })
      : reply;

    revalidateMessagePaths();

    return { success: true, data: returnedReply };
  } catch (error) {
    console.error("Failed to reply to message:", error);
    return { success: false, error: "Failed to reply" };
  }
}

// ---------------------------------------------------------------------------
// markAsRead / markAsUnread
// ---------------------------------------------------------------------------

export async function markAsRead(id: string): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const message = await db.message.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        recipientId: ctx.userId,
      },
      select: { id: true },
    });
    if (!message) {
      return { success: false, error: "Message not found" };
    }

    await db.message.update({
      where: { id },
      data: { isRead: true },
    });

    revalidateMessagePaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    return { success: false, error: "Failed to mark message as read" };
  }
}

export async function markAsUnread(id: string): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const message = await db.message.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        recipientId: ctx.userId,
      },
      select: { id: true },
    });
    if (!message) {
      return { success: false, error: "Message not found" };
    }

    await db.message.update({
      where: { id },
      data: { isRead: false },
    });

    revalidateMessagePaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to mark message as unread:", error);
    return { success: false, error: "Failed to mark message as unread" };
  }
}

// ---------------------------------------------------------------------------
// bulkMarkAsRead
// ---------------------------------------------------------------------------

export async function bulkMarkAsRead(ids: string[]): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    await db.message.updateMany({
      where: { id: { in: ids }, recipientId: ctx.userId, organizationId: ctx.organizationId },
      data: { isRead: true },
    });

    revalidateMessagePaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk mark as read:", error);
    return { success: false, error: "Failed to mark messages as read" };
  }
}

// ---------------------------------------------------------------------------
// markAllMessageNotificationsAsRead — legacy "Set All As Viewed"
// ---------------------------------------------------------------------------

export async function markAllMessageNotificationsAsRead(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const result = await db.message.updateMany({
      where: {
        recipientId: ctx.userId,
        organizationId: ctx.organizationId,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidateMessagePaths();
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error("Failed to mark all message notifications as read:", error);
    return {
      success: false,
      error: "Failed to mark all message notifications as read",
    };
  }
}

// ---------------------------------------------------------------------------
// deleteMessage / bulkDelete
// ---------------------------------------------------------------------------

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const message = await db.message.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        OR: [{ recipientId: ctx.userId }, { senderId: ctx.userId }],
      },
      select: { id: true },
    });
    if (!message) {
      return { success: false, error: "Message not found" };
    }

    await db.message.delete({ where: { id } });

    revalidateMessagePaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function bulkDeleteMessages(
  ids: string[],
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    await db.message.deleteMany({
      where: {
        id: { in: ids },
        organizationId: ctx.organizationId,
        OR: [
          { recipientId: ctx.userId },
          { senderId: ctx.userId },
        ],
      },
    });

    revalidateMessagePaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk delete messages:", error);
    return { success: false, error: "Failed to delete messages" };
  }
}

// ---------------------------------------------------------------------------
// sendClassMessage
// ---------------------------------------------------------------------------

export async function sendClassMessage(
  data: SendClassMessageData,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const senderType = roleToSenderType(ctx.role);

    // Prefix subject with nature tag if provided
    const subjectLine = data.nature && data.subject
      ? `[${data.nature}] ${data.subject}`
      : data.subject ?? null;

    // Verify class belongs to org
    const classRecord = await db.class.findUnique({
      where: { id: data.classId },
      include: { branch: { select: { organizationId: true } } },
    });
    if (!classRecord || classRecord.branch.organizationId !== ctx.organizationId) {
      return { success: false, error: "Class not found" };
    }

    const selectedChildIds = data.childIds?.filter(Boolean) ?? [];
    const adminOnly = Boolean(data.delivery?.adminOnly);
    if (!adminOnly && selectedChildIds.length === 0 && data.childIds) {
      return { success: false, error: "Select at least one child or Admin Only" };
    }

    // 1. Find active children in the class, narrowed to the legacy selection table when provided.
    const children = await db.child.findMany({
      where: {
        classId: data.classId,
        ...(selectedChildIds.length > 0
          ? { id: { in: selectedChildIds } }
          : { isActive: true }),
      },
      include: {
        parentUsers: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    // 2. Collect unique parent user IDs
    const parentUserIds = new Set<string>();
    for (const child of children) {
      for (const pu of child.parentUsers) {
        parentUserIds.add(pu.id);
      }
    }

    const adminIds = await adminRecipientIds(ctx.organizationId, ctx.userId);
    if (adminOnly && adminIds.length === 0) {
      return { success: false, error: "No admin users found" };
    }
    if (!adminOnly && parentUserIds.size === 0) {
      return { success: false, error: "No parent users found for this class" };
    }

    // 3. Create a thread to group all messages
    const thread = await db.messageThread.create({
      data: {
        subject: subjectLine,
        organizationId: ctx.organizationId,
      },
    });

    // 4. Create individual messages for admins and selected children's parents.
    const adminMessageData = adminIds.map((adminId) => ({
      senderId: ctx.userId,
      senderType,
      recipientId: adminId,
      recipientType: "ADMIN" as RecipientType,
      subject: subjectLine,
      body: data.body,
      threadId: thread.id,
      organizationId: ctx.organizationId,
      legacyNature: data.nature ?? null,
      legacyData: legacyMessageData({
        sourcePage: "message_portal_class.php",
        nature: data.nature,
        delivery: data.delivery,
        classId: data.classId,
        childIds: selectedChildIds,
        recipientScope: "admin",
      }),
    }));
    const parentMessageData = adminOnly
      ? []
      : Array.from(parentUserIds).map((parentId) => ({
          senderId: ctx.userId,
          senderType,
          recipientId: parentId,
          recipientType: "PARENT" as RecipientType,
          subject: subjectLine,
          body: data.body,
          threadId: thread.id,
          organizationId: ctx.organizationId,
          legacyNature: data.nature ?? null,
          legacyData: legacyMessageData({
            sourcePage: "message_portal_class.php",
            nature: data.nature,
            delivery: data.delivery,
            classId: data.classId,
            childIds: selectedChildIds,
            recipientScope: "parent",
          }),
        }));

    const messageCreateData = [...adminMessageData, ...parentMessageData];

    await db.message.createMany({
      data: messageCreateData,
    });
    const parentIds = Array.from(parentUserIds);
    const externalDelivery = !adminOnly
      ? await attemptMessageExternalDelivery({
          delivery: data.delivery,
          parentUserIds: parentIds,
          subject: subjectLine,
          body: data.body,
          metadata: {
            source: "legacy_message_portal_class",
            threadId: thread.id,
            classId: data.classId,
            nature: data.nature ?? null,
          },
        })
      : { pushDelivery: null, channelDelivery: {} };
    await updateMessagesExternalDeliveryAudit({
      where: {
        threadId: thread.id,
        senderId: ctx.userId,
        recipientType: "PARENT",
        recipientId: { in: parentIds },
        organizationId: ctx.organizationId,
      },
      audit: externalDelivery,
    });

    revalidateMessagePaths();

    return {
      success: true,
      data: {
        threadId: thread.id,
        recipientCount: parentUserIds.size,
        adminRecipientCount: adminIds.length,
        selectedChildCount: selectedChildIds.length || children.length,
        adminOnly,
        pushDelivery: externalDelivery.pushDelivery,
        channelDelivery: externalDelivery.channelDelivery,
      },
    };
  } catch (error) {
    console.error("Failed to send class message:", error);
    return { success: false, error: "Failed to send class message" };
  }
}

// ---------------------------------------------------------------------------
// sendBulkChildMessage — send to parents of selected children
// ---------------------------------------------------------------------------

export async function sendBulkChildMessage(
  data: SendBulkChildMessageData,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const selectedChildIds = Array.from(new Set(data.childIds.filter(Boolean)));
    const selectedTeacherUserIds = Array.from(
      new Set((data.teacherUserIds ?? []).filter(Boolean)),
    );

    if (selectedChildIds.length === 0 && selectedTeacherUserIds.length === 0) {
      return { success: false, error: "Select at least one child or teacher" };
    }

    const senderType = roleToSenderType(ctx.role);

    // Find all parent users for the selected children within the org
    const [children, selectedTeachers] = await Promise.all([
      selectedChildIds.length > 0
        ? db.child.findMany({
            where: {
              id: { in: selectedChildIds },
              branch: { organizationId: ctx.organizationId },
            },
            include: {
              parentUsers: {
                where: { isActive: true },
                select: { id: true, legacyId: true, legacyChildId: true },
              },
            },
          })
        : Promise.resolve([]),
      selectedTeacherUserIds.length > 0
        ? db.user.findMany({
            where: {
              id: { in: selectedTeacherUserIds },
              organizationId: ctx.organizationId,
              isActive: true,
              role: "TEACHER",
            },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);
    const validTeacherUserIds = selectedTeachers.map((teacher) => teacher.id);
    if (selectedChildIds.length === 0 && validTeacherUserIds.length === 0) {
      return { success: false, error: "No active teachers found for selection" };
    }

    const sideEffectConfig = findLegacyMessageSideEffectCore(data.nature);
    const hasSideEffectTargets = legacySideEffectHasTargetsCore(
      sideEffectConfig,
      children.length,
      validTeacherUserIds.length,
    );

    const parentUserIds = new Set<string>();
    for (const child of children) {
      for (const pu of child.parentUsers) {
        parentUserIds.add(pu.id);
      }
    }

    if (parentUserIds.size === 0 && !hasSideEffectTargets) {
      return {
        success: false,
        error: "No eligible parent or legacy notification recipients found",
      };
    }

    // Prefix subject with nature tag if provided
    const subjectLine = data.nature && data.subject
      ? `[${data.nature}] ${data.subject}`
      : data.subject ?? null;

    const messageCreateData = Array.from(parentUserIds).map((parentId) => ({
      senderId: ctx.userId,
      senderType,
      recipientId: parentId,
      recipientType: "PARENT" as RecipientType,
      subject: subjectLine,
      body: data.body,
      threadId: null as string | null,
      organizationId: ctx.organizationId,
      legacyNature: data.nature ?? null,
      legacyData: legacyMessageData({
        sourcePage: "message_portal.php",
        nature: data.nature,
        delivery: data.delivery,
        childIds: selectedChildIds,
        teacherUserIds: validTeacherUserIds,
      }),
    }));

    const writeResult = await db.$transaction(async (tx) => {
      const thread = await tx.messageThread.create({
        data: {
          subject: subjectLine,
          organizationId: ctx.organizationId,
        },
      });

      if (messageCreateData.length > 0) {
        await tx.message.createMany({
          data: messageCreateData.map((message) => ({
            ...message,
            threadId: thread.id,
          })),
        });
      }

      const sideEffectSummary = await createLegacyBulkMessageSideEffectsCore({
        tx,
        organizationId: ctx.organizationId,
        senderId: ctx.userId,
        threadId: thread.id,
        nature: data.nature,
        subject: data.subject ?? subjectLine,
        body: data.body,
        teacherUserIds: validTeacherUserIds,
        children,
      });

      return { threadId: thread.id, sideEffectSummary };
    });
    const parentIds = Array.from(parentUserIds);
    const externalDelivery = await attemptMessageExternalDelivery({
      delivery: data.delivery,
      parentUserIds: parentIds,
      subject: subjectLine,
      body: data.body,
      metadata: {
        source: "legacy_message_portal_bulk",
        threadId: writeResult.threadId,
        nature: data.nature ?? null,
      },
    });
    await updateMessagesExternalDeliveryAudit({
      where: {
        threadId: writeResult.threadId,
        senderId: ctx.userId,
        recipientType: "PARENT",
        recipientId: { in: parentIds },
        organizationId: ctx.organizationId,
      },
      audit: externalDelivery,
    });

    revalidateMessagePaths();

    return {
      success: true,
      data: {
        threadId: writeResult.threadId,
        recipientCount: parentUserIds.size,
        childCount: children.length,
        teacherCount: validTeacherUserIds.length,
        sideEffectSummary: writeResult.sideEffectSummary,
        pushDelivery: externalDelivery.pushDelivery,
        channelDelivery: externalDelivery.channelDelivery,
      },
    };
  } catch (error) {
    console.error("Failed to send bulk child message:", error);
    return { success: false, error: "Failed to send bulk message" };
  }
}

// ---------------------------------------------------------------------------
// resendMessage — resend an existing message
// ---------------------------------------------------------------------------

export async function resendMessage(id: string): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { ctx } = res;

    const original = await db.message.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        senderId: ctx.userId,
      },
    });
    if (!original) {
      return { success: false, error: "Message not found" };
    }

    const senderType = roleToSenderType(ctx.role);
    const originalDelivery = legacyDeliveryAudit(original.legacyData);
    const resendDelivery: LegacyMessageDeliveryOptions = {
      mobile: originalDelivery.channels.includes("Mobile"),
      sms: originalDelivery.channels.includes("SMS"),
      whatsapp: originalDelivery.channels.includes("WhatsApp"),
    };

    const resent = await db.message.create({
      data: {
        senderId: ctx.userId,
        senderType,
        recipientId: original.recipientId,
        recipientType: original.recipientType,
        subject: original.subject,
        body: original.body,
        threadId: original.threadId,
        organizationId: ctx.organizationId,
        legacyNature: original.legacyNature,
        legacyData: jsonForCreate(original.legacyData),
      },
    });
    const externalDelivery =
      original.recipientType === "PARENT"
        ? await attemptMessageExternalDelivery({
            delivery: resendDelivery,
            parentUserIds: [original.recipientId],
            subject: original.subject,
            body: original.body,
            metadata: {
              source: "legacy_message_resend",
              messageId: resent.id,
              threadId: original.threadId ?? null,
              nature: original.legacyNature ?? null,
            },
          })
        : { pushDelivery: null, channelDelivery: {} };
    const returnedMessage = hasExternalDeliveryAudit(externalDelivery)
      ? await db.message.update({
          where: { id: resent.id },
          data: {
            legacyData: mergeExternalDeliveryAudit(
              resent.legacyData,
              externalDelivery,
            ),
          },
        })
      : resent;

    revalidateMessagePaths();
    return { success: true, data: returnedMessage };
  } catch (error) {
    console.error("Failed to resend message:", error);
    return { success: false, error: "Failed to resend message" };
  }
}
