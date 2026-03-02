"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";

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

interface SendMessageData {
  recipientId: string;
  recipientType: RecipientType;
  subject?: string | null;
  body: string;
  threadId?: string | null;
  nature?: string | null;
}

interface SendClassMessageData {
  classId: string;
  subject?: string | null;
  body: string;
  nature?: string | null;
}

interface SendBulkChildMessageData {
  childIds: string[];
  subject?: string | null;
  body: string;
  nature?: string | null;
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
// getSentMessages
// ---------------------------------------------------------------------------

export async function getSentMessages(
  params: MessageListParams = {},
): Promise<ActionResult> {
  try {
    const { userId, organizationId: orgId } = await requireOrg();

    const { search, page = 1, pageSize = 50 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      senderId: userId,
      organizationId: orgId,
    };

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

    // Resolve recipient names
    const recipientEntries = messages.map((m) => ({
      id: m.recipientId,
      type: m.recipientType,
    }));
    const nameMap = await resolveNames(recipientEntries);

    const enriched = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderType: msg.senderType,
      recipientId: msg.recipientId,
      recipientType: msg.recipientType,
      recipientName: nameMap.get(msg.recipientId) ?? "Unknown",
      subject: msg.subject,
      body: msg.body,
      isRead: msg.isRead,
      threadId: msg.threadId,
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
      },
    });

    revalidatePath("/messages");

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
      },
    });

    revalidatePath("/messages");

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

    revalidatePath("/messages");
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

    revalidatePath("/messages");
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

    revalidatePath("/messages");
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk mark as read:", error);
    return { success: false, error: "Failed to mark messages as read" };
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

    revalidatePath("/messages");
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

    revalidatePath("/messages");
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

    // 1. Find all active children in the class
    const children = await db.child.findMany({
      where: {
        classId: data.classId,
        isActive: true,
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

    if (parentUserIds.size === 0) {
      return { success: false, error: "No parent users found for this class" };
    }

    // 3. Create a thread to group all messages
    const thread = await db.messageThread.create({
      data: {
        subject: subjectLine,
        organizationId: ctx.organizationId,
      },
    });

    // 4. Create individual messages for each parent
    const messageCreateData = Array.from(parentUserIds).map((parentId) => ({
      senderId: ctx.userId,
      senderType,
      recipientId: parentId,
      recipientType: "PARENT" as RecipientType,
      subject: subjectLine,
      body: data.body,
      threadId: thread.id,
      organizationId: ctx.organizationId,
    }));

    await db.message.createMany({
      data: messageCreateData,
    });

    revalidatePath("/messages");

    return {
      success: true,
      data: {
        threadId: thread.id,
        recipientCount: parentUserIds.size,
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
    }));

    await db.message.createMany({ data: messageCreateData });

    revalidatePath("/messages");

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
      },
    });

    revalidatePath("/messages");
    return { success: true, data: resent };
  } catch (error) {
    console.error("Failed to resend message:", error);
    return { success: false, error: "Failed to resend message" };
  }
}
