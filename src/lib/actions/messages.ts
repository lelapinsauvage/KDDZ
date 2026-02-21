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

    const { search, page = 1, pageSize = 20 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      recipientId: session.user.id,
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
        include: {
          thread: {
            include: {
              messages: {
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  senderId: true,
                  senderType: true,
                  subject: true,
                  createdAt: true,
                  isRead: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.message.count({ where }),
    ]);

    return {
      success: true,
      data: {
        messages,
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

    const { search, page = 1, pageSize = 20 } = params;

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
        include: {
          thread: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.message.count({ where }),
    ]);

    return {
      success: true,
      data: {
        messages,
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

    const userRole = (session.user as any).role as string;
    const senderType = roleToSenderType(userRole);

    const message = await db.message.create({
      data: {
        senderId: session.user.id,
        senderType,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        subject: data.subject ?? null,
        body: data.body,
        threadId: data.threadId ?? null,
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
// markAsRead
// ---------------------------------------------------------------------------

export async function markAsRead(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const message = await db.message.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath("/messages");

    return { success: true, data: message };
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    return { success: false, error: "Failed to mark message as read" };
  }
}

// ---------------------------------------------------------------------------
// deleteMessage
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
