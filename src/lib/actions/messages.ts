"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
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
}

interface SendClassMessageData {
  classId: string;
  subject?: string | null;
  body: string;
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
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, data: 0 };
    }

    const count = await db.message.count({
      where: {
        recipientId: session.user.id,
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { search, readStatus = "all", page = 1, pageSize = 50 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      recipientId: session.user.id,
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { search, page = 1, pageSize = 50 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      senderId: session.user.id,
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const message = await db.message.findUnique({
      where: { id },
    });

    if (!message) {
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
      message.recipientId === session.user.id &&
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any).role as string;
    const senderType = roleToSenderType(userRole);

    // Create or reuse a thread
    let threadId = data.threadId ?? null;
    if (!threadId) {
      const thread = await db.messageThread.create({
        data: { subject: data.subject ?? null },
      });
      threadId = thread.id;
    }

    const message = await db.message.create({
      data: {
        senderId: session.user.id,
        senderType,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        subject: data.subject ?? null,
        body: data.body,
        threadId,
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const original = await db.message.findUnique({
      where: { id: originalMessageId },
    });

    if (!original) {
      return { success: false, error: "Original message not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any).role as string;
    const senderType = roleToSenderType(userRole);

    // Create thread if none exists
    let threadId = original.threadId;
    if (!threadId) {
      const thread = await db.messageThread.create({
        data: { subject: original.subject },
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
        senderId: session.user.id,
        senderType,
        recipientId: original.senderId,
        recipientType: original.senderType as RecipientType,
        subject: original.subject ? `Re: ${original.subject}` : null,
        body,
        threadId,
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.message.updateMany({
      where: { id: { in: ids }, recipientId: session.user.id },
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.message.deleteMany({
      where: {
        id: { in: ids },
        OR: [
          { recipientId: session.user.id },
          { senderId: session.user.id },
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any).role as string;
    const senderType = roleToSenderType(userRole);

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
        subject: data.subject ?? null,
      },
    });

    // 4. Create individual messages for each parent
    const messageCreateData = Array.from(parentUserIds).map((parentId) => ({
      senderId: session.user!.id,
      senderType,
      recipientId: parentId,
      recipientType: "PARENT" as RecipientType,
      subject: data.subject ?? null,
      body: data.body,
      threadId: thread.id,
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
