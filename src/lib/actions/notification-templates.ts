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
type TemplateVariables = Record<string, string | number | null | undefined>;

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

const TEST_VARIABLES: TemplateVariables = {
  child_name: "Sample Child",
  parent_name: "Sample Parent",
  class_name: "Sample Class",
  branch_name: "Sample Branch",
  date: new Date().toISOString().slice(0, 10),
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

function isTemplateCategory(category: string): category is TemplateCategory {
  return TEMPLATE_CATEGORIES.includes(category as TemplateCategory);
}

function renderNotificationText(text: string, variables: TemplateVariables) {
  return text.replace(
    /(\[\[([a-zA-Z0-9_]+)\]\]|\{\{\s*([a-zA-Z0-9_]+)\s*\}\})/g,
    (match, _token, squareKey: string | undefined, braceKey: string | undefined) => {
      const key = squareKey ?? braceKey;
      const value = key ? variables[key] : undefined;
      return value === null || typeof value === "undefined" ? match : String(value);
    },
  );
}

async function createInAppNotifications(params: {
  userIds: string[];
  title: string;
  body: string;
  type: string;
  category: string;
}) {
  if (params.userIds.length === 0) return 0;

  const result = await db.notification.createMany({
    data: params.userIds.map((userId) => ({
      userId,
      title: params.title,
      body: params.body,
      type: params.type,
      category: params.category,
      isRead: false,
    })),
  });

  return result.count;
}

// ---------------------------------------------------------------------------
// sendTestNotification
// ---------------------------------------------------------------------------

export async function sendTestNotification(
  category: string,
  template: { enabled: boolean; subject: string; body: string },
): Promise<ActionResult<{ sentCount: number }>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (!isTemplateCategory(category)) {
      return { success: false, error: "Unknown notification category" };
    }

    if (!template.enabled) {
      return { success: false, error: "Template is disabled" };
    }

    const branch = ctx.branchId
      ? await db.branch.findUnique({
          where: { id: ctx.branchId },
          select: { name: true },
        })
      : null;
    const organization = await db.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { name: true },
    });

    const defaults = CATEGORY_DEFAULTS[category];
    const variables = {
      ...TEST_VARIABLES,
      branch_name: branch?.name ?? organization?.name ?? TEST_VARIABLES.branch_name,
    };

    const sentCount = await createInAppNotifications({
      userIds: [ctx.userId],
      title: renderNotificationText(template.subject || defaults.subject, variables),
      body: renderNotificationText(template.body || defaults.body, variables),
      type: "TEST",
      category,
    });

    revalidatePath("/");
    revalidatePath("/settings/notifications");

    return { success: true, data: { sentCount } };
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return { success: false, error: "Failed to send test notification" };
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

export interface LegacyNotificationSettingRow {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  scope: string | null;
  settingKey: string;
  settingValue: string | null;
  description: string | null;
}

export interface LegacyNotificationNatureRow {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  name: string;
  description: string | null;
  contentTable: string | null;
  deliveryTable: string | null;
  parentDeliveryTable: string | null;
  displayOrder: number | null;
  isActive: boolean;
}

export interface LegacyNotificationLogRow {
  id: string;
  legacyId: number;
  name: string | null;
  status: number | null;
  expiryDate: string | null;
  createdAt: string;
  childId: string | null;
  legacyChildId: number | null;
  childName: string | null;
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
// getLegacyNotificationSettings
// ---------------------------------------------------------------------------

export async function getLegacyNotificationSettings(): Promise<
  ActionResult<LegacyNotificationSettingRow[]>
> {
  try {
    await requireOrg();

    const settings = await db.legacySetting.findMany({
      where: {
        OR: [
          { legacyTable: "t_notification_setting" },
          { settingKey: { startsWith: "email-" } },
          { scope: "notification" },
        ],
      },
      orderBy: [
        { sourceDatabase: "asc" },
        { legacyTable: "asc" },
        { settingKey: "asc" },
      ],
      take: 500,
    });

    return {
      success: true,
      data: settings.map((setting) => ({
        id: setting.id,
        sourceDatabase: setting.sourceDatabase,
        legacyTable: setting.legacyTable,
        legacyId: setting.legacyId,
        scope: setting.scope,
        settingKey: setting.settingKey,
        settingValue: setting.settingValue,
        description: setting.description,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch legacy notification settings:", error);
    return {
      success: false,
      error: "Failed to fetch legacy notification settings",
    };
  }
}

// ---------------------------------------------------------------------------
// getLegacyNotificationNatures
// ---------------------------------------------------------------------------

export async function getLegacyNotificationNatures(): Promise<
  ActionResult<LegacyNotificationNatureRow[]>
> {
  try {
    await requireOrg();

    const natures = await db.legacyNotificationNature.findMany({
      orderBy: [
        { sourceDatabase: "asc" },
        { displayOrder: "asc" },
        { name: "asc" },
      ],
      take: 300,
    });

    return {
      success: true,
      data: natures.map((nature) => ({
        id: nature.id,
        sourceDatabase: nature.sourceDatabase,
        legacyId: nature.legacyId,
        name: nature.name,
        description: nature.description,
        contentTable: nature.contentTable,
        deliveryTable: nature.deliveryTable,
        parentDeliveryTable: nature.parentDeliveryTable,
        displayOrder: nature.displayOrder,
        isActive: nature.isActive,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch legacy notification natures:", error);
    return {
      success: false,
      error: "Failed to fetch legacy notification natures",
    };
  }
}

// ---------------------------------------------------------------------------
// getLegacyNotificationLogs
// ---------------------------------------------------------------------------

export async function getLegacyNotificationLogs(): Promise<
  ActionResult<LegacyNotificationLogRow[]>
> {
  try {
    await requireOrg();

    const logs = await db.legacyNotificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const childIds = [...new Set(logs.map((log) => log.childId).filter(Boolean))] as string[];
    const children = childIds.length
      ? await db.child.findMany({
          where: { id: { in: childIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const childNameById = new Map(
      children.map((child) => [child.id, `${child.firstName} ${child.lastName}`])
    );

    return {
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        legacyId: log.legacyId,
        name: log.name,
        status: log.status,
        expiryDate: log.expiryDate,
        createdAt: log.createdAt.toISOString(),
        childId: log.childId,
        legacyChildId: log.legacyChildId,
        childName: log.childId ? childNameById.get(log.childId) ?? null : null,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch legacy notification logs:", error);
    return { success: false, error: "Failed to fetch legacy notification logs" };
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
