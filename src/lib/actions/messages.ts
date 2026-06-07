"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";

import type { Prisma } from "@/generated/prisma/client";
import type { SenderType, RecipientType } from "@/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MessageListParams {
  search?: string;
  readStatus?: "all" | "read" | "unread";
  page?: number;
  pageSize?: number;
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
  pageSize?: number | "all";
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
  revalidatePath("/messages");
  revalidatePath("/messages/inbox");
  revalidatePath("/messages/sent");
  revalidatePath("/alarms");
  revalidatePath("/alarms/msg");
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

function legacyMessageData(params: {
  sourcePage: string;
  delivery?: LegacyMessageDeliveryOptions | null;
  classId?: string | null;
  childIds?: string[];
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
    classId: params.classId ?? null,
    selectedChildIds: params.childIds ?? [],
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
    pendingExternal:
      Array.isArray(data.externalDeliveryPending) &&
      data.externalDeliveryPending.some(Boolean),
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

    const skip = (page - 1) * pageSize;

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
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
        totalPages: Math.ceil(total / pageSize),
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

    const skip = (page - 1) * pageSize;

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
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
        totalPages: Math.ceil(total / pageSize),
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
        legacyData: legacyMessageData({
          sourcePage: "message_portal_single.php",
          delivery: data.delivery,
        }),
      },
    });

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
              delivery: data.delivery,
              recipientScope: "admin-copy",
            }),
          })),
        });
      }
    }

    revalidateMessagePaths();

    return { success: true, data: message };
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

    const senderType = roleToSenderType(ctx.role);

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

    const reply = await db.message.create({
      data: {
        senderId: ctx.userId,
        senderType,
        recipientId: original.senderId,
        recipientType: original.senderType as RecipientType,
        subject: original.subject ? `Re: ${original.subject}` : null,
        body,
        threadId,
        organizationId: ctx.organizationId,
        legacyNature: original.legacyNature,
        legacyData: jsonForCreate(original.legacyData),
      },
    });

    revalidateMessagePaths();

    return { success: true, data: reply };
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

    const message = await db.message.findUnique({ where: { id } });
    if (!message || message.organizationId !== ctx.organizationId) {
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

    const message = await db.message.findUnique({ where: { id } });
    if (!message || message.organizationId !== ctx.organizationId) {
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

    const message = await db.message.findUnique({ where: { id } });
    if (!message || message.organizationId !== ctx.organizationId) {
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

    revalidateMessagePaths();

    return {
      success: true,
      data: {
        threadId: thread.id,
        recipientCount: parentUserIds.size,
        adminRecipientCount: adminIds.length,
        selectedChildCount: selectedChildIds.length || children.length,
        adminOnly,
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

    if (data.childIds.length === 0) {
      return { success: false, error: "No children selected" };
    }

    const senderType = roleToSenderType(ctx.role);

    // Find all parent users for the selected children within the org
    const children = await db.child.findMany({
      where: {
        id: { in: data.childIds },
        branch: { organizationId: ctx.organizationId },
      },
      include: {
        parentUsers: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    const parentUserIds = new Set<string>();
    for (const child of children) {
      for (const pu of child.parentUsers) {
        parentUserIds.add(pu.id);
      }
    }

    if (parentUserIds.size === 0) {
      return { success: false, error: "No parent users found for the selected children" };
    }

    // Prefix subject with nature tag if provided
    const subjectLine = data.nature && data.subject
      ? `[${data.nature}] ${data.subject}`
      : data.subject ?? null;

    const thread = await db.messageThread.create({
      data: {
        subject: subjectLine,
        organizationId: ctx.organizationId,
      },
    });

    const messageCreateData = Array.from(parentUserIds).map((parentId) => ({
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
        sourcePage: "message_portal.php",
        delivery: data.delivery,
        childIds: data.childIds,
      }),
    }));

    await db.message.createMany({ data: messageCreateData });

    revalidateMessagePaths();

    return {
      success: true,
      data: {
        threadId: thread.id,
        recipientCount: parentUserIds.size,
        childCount: children.length,
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

    const original = await db.message.findUnique({ where: { id } });
    if (!original || original.organizationId !== ctx.organizationId) {
      return { success: false, error: "Message not found" };
    }

    const senderType = roleToSenderType(ctx.role);

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

    revalidateMessagePaths();
    return { success: true, data: resent };
  } catch (error) {
    console.error("Failed to resend message:", error);
    return { success: false, error: "Failed to resend message" };
  }
}
