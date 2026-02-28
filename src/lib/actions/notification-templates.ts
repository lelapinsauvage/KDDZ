"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

const TEMPLATE_CATEGORIES = [
  "BIRTHDAY",
  "MISSING_REPORTS",
  "MEDICINE",
  "INSURANCE",
  "ASSESSMENT",
  "VACCINATIONS",
  "EXPIRATION",
  "CONTROL",
] as const;

type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

const CATEGORY_DEFAULTS: Record<
  TemplateCategory,
  { subject: string; body: string }
> = {
  BIRTHDAY: {
    subject: "Happy Birthday!",
    body: "Happy Birthday, [[child_name]]! Wishing you a wonderful day from everyone at [[branch_name]].",
  },
  MISSING_REPORTS: {
    subject: "Missing Daily Report",
    body: "Daily report for [[child_name]] in [[class_name]] on [[date]] has not been submitted yet.",
  },
  MEDICINE: {
    subject: "Medicine Reminder",
    body: "Reminder: [[child_name]] needs medication today. Please check the medical records.",
  },
  INSURANCE: {
    subject: "Insurance Expiring",
    body: "Insurance for [[child_name]] expires on [[date]]. Please notify [[parent_name]] to renew.",
  },
  ASSESSMENT: {
    subject: "Assessment Due",
    body: "Assessment for [[child_name]] is due on [[date]]. Please complete it before the deadline.",
  },
  VACCINATIONS: {
    subject: "Vaccination Due",
    body: "Vaccination for [[child_name]] is due on [[date]]. Please remind [[parent_name]].",
  },
  EXPIRATION: {
    subject: "Document Expiring",
    body: "A document for [[child_name]] at [[branch_name]] expires on [[date]]. Contact [[parent_name]] for renewal.",
  },
  CONTROL: {
    subject: "Control Notification",
    body: "Control check for [[child_name]] at [[branch_name]] on [[date]].",
  },
};

export interface TemplateRow {
  id: string;
  category: string;
  enabled: boolean;
  subject: string;
  body: string;
}

// ---------------------------------------------------------------------------
// getNotificationTemplates
// ---------------------------------------------------------------------------

export async function getNotificationTemplates(): Promise<
  ActionResult<TemplateRow[]>
> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const existing = await db.notificationTemplate.findMany({
      where: { organizationId: orgId },
      orderBy: { category: "asc" },
    });

    const map = new Map(existing.map((t) => [t.category, t]));

    const rows: TemplateRow[] = TEMPLATE_CATEGORIES.map((cat) => {
      const row = map.get(cat);
      const defaults = CATEGORY_DEFAULTS[cat];
      return {
        id: row?.id ?? "",
        category: cat,
        enabled: row?.enabled ?? true,
        subject: row?.subject ?? defaults.subject,
        body: row?.body ?? defaults.body,
      };
    });

    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to fetch notification templates:", error);
    return { success: false, error: "Failed to fetch notification templates" };
  }
}

// ---------------------------------------------------------------------------
// upsertNotificationTemplate
// ---------------------------------------------------------------------------

export async function upsertNotificationTemplate(
  category: string,
  data: { enabled: boolean; subject: string; body: string },
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    await db.notificationTemplate.upsert({
      where: {
        organizationId_category: {
          organizationId: ctx.organizationId,
          category,
        },
      },
      update: {
        enabled: data.enabled,
        subject: data.subject,
        body: data.body,
      },
      create: {
        organizationId: ctx.organizationId,
        category,
        enabled: data.enabled,
        subject: data.subject,
        body: data.body,
        createdById: ctx.userId,
      },
    });

    revalidatePath("/settings/notifications");

    return { success: true };
  } catch (error) {
    console.error("Failed to upsert notification template:", error);
    return { success: false, error: "Failed to save template" };
  }
}

// ---------------------------------------------------------------------------
// getSentNotifications (audit log)
// ---------------------------------------------------------------------------

export interface SentNotificationRow {
  id: string;
  type: string | null;
  category: string | null;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  userName: string | null;
}

export async function getSentNotifications(params: {
  category?: string;
  from?: string;
  to?: string;
}): Promise<ActionResult<SentNotificationRow[]>> {
  try {
    const { organizationId: orgId } = await requireOrg();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      user: { organizationId: orgId },
    };

    if (params.category) {
      where.category = params.category;
    }

    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) {
        const toDate = new Date(params.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const notifications = await db.notification.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const rows: SentNotificationRow[] = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      category: n.category,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      userName: n.user.name,
    }));

    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to fetch sent notifications:", error);
    return { success: false, error: "Failed to fetch sent notifications" };
  }
}

// ---------------------------------------------------------------------------
// resendNotification
// ---------------------------------------------------------------------------

export async function resendNotification(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const existing = await db.notification.findFirst({
      where: { id, user: { organizationId: ctx.organizationId } },
    });

    if (!existing) {
      return { success: false, error: "Notification not found" };
    }

    await db.notification.create({
      data: {
        userId: existing.userId,
        title: existing.title,
        body: existing.body,
        type: existing.type,
        category: existing.category,
        isRead: false,
      },
    });

    revalidatePath("/settings/notifications");

    return { success: true };
  } catch (error) {
    console.error("Failed to resend notification:", error);
    return { success: false, error: "Failed to resend notification" };
  }
}
