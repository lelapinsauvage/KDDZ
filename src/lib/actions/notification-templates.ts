"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { deliverEmail, type EmailDeliverySummary } from "@/lib/email-delivery";
import type { Prisma } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";

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
  "PAYMENT",
  "PAYMENT_BEFORE",
  "PAYMENT_AFTER",
  "CONTRACT",
  "CONTROL",
  "WELCOME",
  "NEW_USER_NOTIFICATION",
  "FORGOT_REQUEST",
  "FORGOT_SUCCESS",
  "ADD_USER",
  "ACCOUNT_UPDATE_VERIFY",
  "ACCOUNT_UPDATE_SUCCESS",
  "ACTIVATION_RESEND",
  "ACTIVATION_ACTIVATED",
] as const;

type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
type TemplateVariables = Record<string, string | number | null | undefined>;

const CATEGORY_DEFAULTS: Record<
  TemplateCategory,
  { subject: string; body: string }
> = {
  BIRTHDAY: {
    subject: "Happy Birthday",
    body: "The sweetest greetings to {{child_name}} the most adorable child ! May your special day be filled with the moments of endless joy and fun!",
  },
  MISSING_REPORTS: {
    subject: "Missing Report",
    body: "Dear Parents, The {{report_name}} of your child {{child_name}} is missing . we need to be provided with that report. Regards, The Administration",
  },
  MEDICINE: {
    subject: "Medication",
    body: "Dear Parents, Don't forget to follow up with {{child_name}} medication {{med_name}} on time {{med_time}}. Regards, The administration.",
  },
  INSURANCE: {
    subject: "Insurance",
    body: "Dear Parents, The Insurance of  {{child_name}} will expire on {{expiry_date}}. Please do not forget to renew it on time. Regards, The Administration",
  },
  ASSESSMENT: {
    subject: "Assessment",
    body: "Dear Parents, The assessment report of {{child_name}} is done. you can read it on his account. Regards, The Administration",
  },
  VACCINATIONS: {
    subject: "Vaccination",
    body: "Dear Parents, Please do not forget to do the following vaccine {{vaccination_name}} to  {{child_name}} within {{x_days}} Day(s). The Administration",
  },
  PAYMENT: {
    subject: "Payment Due Date",
    body: "Dear Mr and Mrs {{family_name}}, Thank you for your payment for ({{fees}}) fees!",
  },
  PAYMENT_BEFORE: {
    subject: "Payment Due Date",
    body: "Dear Mr and Mrs  {{family_name}}, A Kind reminder .Please note that your Barbar Payment ({{fees}}) is due on {{payment_date}}.",
  },
  PAYMENT_AFTER: {
    subject: "Payment Due Date",
    body: "Dear Mr and Mrs {{family_name}}, Your Barbar {{fees}} Payment was due on {{payment_date}}.",
  },
  CONTRACT: {
    subject: "Expiring Documents",
    body: "Dear {{person_name}}, Your document of {{document_name}} will expire on {{expiry_date}}. please renew it as soon as possible. Regards, The Administration",
  },
  CONTROL: {
    subject: "Control Notification",
    body: "Control check for {{child_name}} at {{branch_name}} on {{date}}.",
  },
  WELCOME: {
    subject: "Thanks for signing up with Jigowatt :)",
    body: "Hello {{full_name}} !\n\nThanks for registering at {{site_address}}. Here are your account details:\n\nName: {{full_name}}\nUsername: {{username}}\nEmail: {{email}}\nPassword: *hidden*\n\nYou will first have to activate your account by clicking on the following link:\n\n{{activate}}",
  },
  NEW_USER_NOTIFICATION: {
    subject: "New user registration",
    body: "A new user has registered at {{site_address}}.\n\nName: {{full_name}}\nUsername: {{username}}\nEmail: {{email}}",
  },
  FORGOT_REQUEST: {
    subject: "Lost your password at Jigowatt?",
    body: "Hi {{full_name}},\n\nYour username is <strong>{{username}}</strong>.\n\nTo reset your password at Jigowatt, please click the following password reset link:\n{{reset}}\n\nSee you soon!",
  },
  FORGOT_SUCCESS: {
    subject: "Your password has been reset at Jigowatt",
    body: "Welcome back, {{full_name}} !\n\nI'm just letting you know your password at {{site_address}} has been successfully changed.\n\nHopefully you were the one that requested this password reset !\n\nCheers",
  },
  ADD_USER: {
    subject: "You're registered with Jigowatt !",
    body: "Hello {{full_name}} !\n\nYou're now registered at {{site_address}}. Here are your account details:\n\nName: {{full_name}}\nUsername: {{username}}\nEmail: {{email}}\nPassword: {{password}}",
  },
  ACCOUNT_UPDATE_VERIFY: {
    subject: "Confirm your account changes",
    body: "Hi {{full_name}} !\n\nYou ( {{username}} ) requested a change to update your password or email. Click the link below to confirm this change.\n\n{{confirm}}\n\nThanks!\n{{site_address}}",
  },
  ACCOUNT_UPDATE_SUCCESS: {
    subject: "Your account has been updated",
    body: "Hello {{full_name}},\n\nYour account details at {{site_address}} has been updated.\n\nYour username: {{username}}\n\nSee you around!",
  },
  ACTIVATION_RESEND: {
    subject: "Activation Link",
    body: "Hello {{full_name}}, please activate your account: {{activate}}",
  },
  ACTIVATION_ACTIVATED: {
    subject: "Account Activated",
    body: "Hello {{full_name}}, your account at {{site_address}} has been activated.",
  },
};

const TEST_VARIABLES: TemplateVariables = {
  child_name: "Sample Child",
  parent_name: "Sample Parent",
  class_name: "Sample Class",
  branch_name: "Sample Branch",
  med_name: "Sample Medicine",
  med_time: "09:30",
  date: new Date().toISOString().slice(0, 10),
  expiry_date: new Date().toISOString().slice(0, 10),
  days_until: 7,
  insurance_type: "Sample Insurance",
  vaccination_name: "Sample Vaccine",
  x_days: 7,
  report_name: "Daily Report",
  family_name: "Sample Family",
  fees: "Monthly, Bus",
  payment_date: new Date().toISOString().slice(0, 10),
  amount: "100.00",
  currency: "USD",
  person_name: "Sample Staff",
  document_name: "Contract",
  site_address: process.env.NEXT_PUBLIC_SITE_URL ?? "https://kiddzonline.com/",
  full_name: "Sample User",
  username: "sampleuser",
  email: "sample@example.com",
  password: "sample-password",
  reset: "https://kiddzonline.com/forgot?key=sample",
  confirm: "https://kiddzonline.com/profile?confirm=sample",
  activate: "https://kiddzonline.com/activate.php?key=sample",
};

const LEGACY_TEMPLATE_KEYS: Partial<
  Record<TemplateCategory, { subject: string; body: string }>
> = {
  BIRTHDAY: {
    subject: "email-birthday-subj",
    body: "email-birthday-msg",
  },
  MISSING_REPORTS: {
    subject: "email-missingReport-subj",
    body: "email-missingReport-msg",
  },
  MEDICINE: {
    subject: "email-medication-subject",
    body: "email-medication-msg",
  },
  INSURANCE: {
    subject: "email-insurance-subj",
    body: "email-insurance-msg",
  },
  ASSESSMENT: {
    subject: "email-assessment-subj",
    body: "email-assessment-msg",
  },
  VACCINATIONS: {
    subject: "email-vaccinations-subj",
    body: "email-vaccinations-msg",
  },
  PAYMENT: {
    subject: "email-accounting-subj",
    body: "email-accounting-msg-paid",
  },
  PAYMENT_BEFORE: {
    subject: "email-accounting-subj",
    body: "email-accounting-msg-before",
  },
  PAYMENT_AFTER: {
    subject: "email-accounting-subj",
    body: "email-accounting-msg-after",
  },
  CONTRACT: {
    subject: "email-expiring-subj",
    body: "email-expiring-msg",
  },
  WELCOME: {
    subject: "email-welcome-subj",
    body: "email-welcome-msg",
  },
  NEW_USER_NOTIFICATION: {
    subject: "email-new-user-subj",
    body: "email-new-user-msg",
  },
  FORGOT_REQUEST: {
    subject: "email-forgot-subj",
    body: "email-forgot-msg",
  },
  FORGOT_SUCCESS: {
    subject: "email-forgot-success-subj",
    body: "email-forgot-success-msg",
  },
  ADD_USER: {
    subject: "email-add-user-subj",
    body: "email-add-user-msg",
  },
  ACCOUNT_UPDATE_VERIFY: {
    subject: "email-acct-update-subj",
    body: "email-acct-update-msg",
  },
  ACCOUNT_UPDATE_SUCCESS: {
    subject: "email-acct-update-success-subj",
    body: "email-acct-update-success-msg",
  },
  ACTIVATION_RESEND: {
    subject: "email-activate-resend-subj",
    body: "email-activate-resend-msg",
  },
  ACTIVATION_ACTIVATED: {
    subject: "email-activate-subj",
    body: "email-activate-msg",
  },
};

const LEGACY_TEMPLATE_SETTING_KEYS = Array.from(
  new Set(
    Object.values(LEGACY_TEMPLATE_KEYS).flatMap((keys) => [
      keys.subject,
      keys.body,
    ]),
  ),
);

function chooseLegacySettingValue(
  rows: Array<{
    sourceDatabase: string;
    settingKey: string;
    settingValue: string | null;
  }>,
  key: string,
) {
  const candidates = rows.filter(
    (row) => row.settingKey === key && row.settingValue?.trim(),
  );
  if (candidates.length === 0) return null;

  return (
    candidates.find((row) =>
      row.sourceDatabase.toLowerCase().includes("users29sept"),
    ) ??
    candidates.find((row) => row.sourceDatabase.toLowerCase().includes("29sept")) ??
    candidates.find((row) => !row.sourceDatabase.toLowerCase().includes("2018")) ??
    candidates[0]
  ).settingValue;
}

function existingTemplateForCategory(
  map: Map<string, TemplateRow>,
  category: TemplateCategory,
) {
  if (category === "CONTRACT") {
    return map.get("CONTRACT") ?? map.get("EXPIRATION");
  }
  return map.get(category);
}

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

    const legacyTemplateRows = await db.legacySetting.findMany({
      where: {
        legacyTable: { in: ["login_settings", "login_settings_man"] },
        settingKey: {
          in: LEGACY_TEMPLATE_SETTING_KEYS,
        },
      },
      orderBy: [
        { sourceDatabase: "desc" },
        { updatedAt: "desc" },
      ],
    });

    const map = new Map(existing.map((t) => [t.category, t]));

    const rows: TemplateRow[] = TEMPLATE_CATEGORIES.map((cat) => {
      const row = existingTemplateForCategory(map, cat);
      const legacyKeys = LEGACY_TEMPLATE_KEYS[cat];
      const defaults = legacyKeys
        ? {
            subject:
              chooseLegacySettingValue(legacyTemplateRows, legacyKeys.subject) ??
              CATEGORY_DEFAULTS[cat].subject,
            body:
              chooseLegacySettingValue(legacyTemplateRows, legacyKeys.body) ??
              CATEGORY_DEFAULTS[cat].body,
          }
        : CATEGORY_DEFAULTS[cat];
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
): Promise<ActionResult<{ sentCount: number; emailDelivery: EmailDeliverySummary }>> {
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
    const renderedSubject = renderNotificationText(
      template.subject || defaults.subject,
      variables,
    );
    const renderedBody = renderNotificationText(
      template.body || defaults.body,
      variables,
    );

    const sentCount = await createInAppNotifications({
      userIds: [ctx.userId],
      title: renderedSubject,
      body: renderedBody,
      type: "TEST",
      category,
    });
    const currentUser = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true, name: true },
    });
    const emailDelivery = await deliverEmail({
      recipients: currentUser?.email
        ? [{ email: currentUser.email, name: currentUser.name }]
        : [],
      subject: renderedSubject,
      body: renderedBody,
      category,
      metadata: { source: "notification_test", userId: ctx.userId },
    });

    revalidatePath("/");
    revalidatePath("/settings/notifications");

    return { success: true, data: { sentCount, emailDelivery } };
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

export interface LegacyEmailLevelRow {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  label: string;
  isDisabled: boolean;
}

export interface LegacyBulkEmailResult {
  selectedLevels: number;
  matchedRecipients: number;
  sentCount: number;
  skippedNoModernUser: number;
  emailDelivery: EmailDeliverySummary;
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
  legacyData: unknown;
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
// getLegacyEmailLevels
// ---------------------------------------------------------------------------

export async function getLegacyEmailLevels(): Promise<
  ActionResult<LegacyEmailLevelRow[]>
> {
  try {
    await requireOrg();

    const levels = await db.legacyAuthRecord.findMany({
      where: {
        recordType: { in: ["login_level", "manager_login_level"] },
      },
      orderBy: [
        { sourceDatabase: "asc" },
        { legacyTable: "asc" },
        { legacyId: "asc" },
      ],
      take: 200,
    });

    return {
      success: true,
      data: levels.map((level) => ({
        id: level.id,
        sourceDatabase: level.sourceDatabase,
        legacyTable: level.legacyTable,
        legacyId: level.legacyId,
        label: level.recordKey ?? `Level ${level.legacyId}`,
        isDisabled: level.isDisabled ?? false,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch legacy email levels:", error);
    return { success: false, error: "Failed to fetch legacy email levels" };
  }
}

function parsePhpLevelIds(serialized: string | null) {
  if (!serialized) return [];
  return Array.from(serialized.matchAll(/s:\d+:"(\d+)"/g))
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value));
}

function rolesForLegacyLevel(level: LegacyEmailLevelRow) {
  const normalizedLabel = level.label.toLowerCase();
  const roles = new Set<UserRole>();

  if (
    level.legacyId === 1 ||
    level.legacyId === 4 ||
    normalizedLabel.includes("admin") ||
    normalizedLabel.includes("owner")
  ) {
    roles.add("ADMIN");
  }
  if (level.legacyId === 5 || normalizedLabel.includes("manager")) {
    roles.add("MANAGER");
  }
  if (level.legacyId === 6 || normalizedLabel.includes("teacher")) {
    roles.add("TEACHER");
  }
  if (normalizedLabel.includes("nurse")) roles.add("NURSE");
  if (normalizedLabel.includes("doctor")) roles.add("DOCTOR");
  if (
    normalizedLabel.includes("accounting") ||
    normalizedLabel.includes("operator")
  ) {
    roles.add("ADMIN");
  }

  return Array.from(roles);
}

export async function sendLegacyBulkEmail(params: {
  levelIds: string[];
  subject: string;
  message: string;
}): Promise<ActionResult<LegacyBulkEmailResult>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const levelIds = Array.from(new Set(params.levelIds.filter(Boolean)));
    const subject = params.subject.trim();
    const message = params.message.trim();

    if (levelIds.length === 0) {
      return { success: false, error: "Please select a user group" };
    }
    if (!subject) return { success: false, error: "Subject is required" };
    if (!message) return { success: false, error: "Message is required" };

    const levels = await db.legacyAuthRecord.findMany({
      where: {
        id: { in: levelIds },
        recordType: { in: ["login_level", "manager_login_level"] },
        OR: [{ isDisabled: false }, { isDisabled: null }],
      },
    });

    if (levels.length === 0) {
      return { success: false, error: "No active legacy user groups found" };
    }

    const selectedRegularLevels = levels.filter(
      (level) => level.recordType === "login_level",
    );
    const selectedManagerLevels = levels.filter(
      (level) => level.recordType === "manager_login_level",
    );

    const regularRows = selectedRegularLevels.length
      ? await db.legacyAuthRecord.findMany({
          where: {
            recordType: "login_user",
            sourceDatabase: {
              in: Array.from(
                new Set(selectedRegularLevels.map((level) => level.sourceDatabase)),
              ),
            },
            OR: [{ isDisabled: false }, { isDisabled: null }],
          },
        })
      : [];
    const managerRows = selectedManagerLevels.length
      ? await db.legacyAuthRecord.findMany({
          where: {
            recordType: "manager_login_user",
            sourceDatabase: {
              in: Array.from(
                new Set(selectedManagerLevels.map((level) => level.sourceDatabase)),
              ),
            },
            OR: [{ isDisabled: false }, { isDisabled: null }],
          },
        })
      : [];

    const exactUserIds = new Set<string>();
    const managerLevelKeys = new Set(
      selectedManagerLevels.map(
        (level) => `${level.sourceDatabase}:${level.legacyId}`,
      ),
    );
    const regularLevelKeys = new Set(
      selectedRegularLevels.map(
        (level) => `${level.sourceDatabase}:${level.legacyId}`,
      ),
    );
    const exactRegularSources = new Set(
      regularRows.map((row) => row.sourceDatabase),
    );
    const exactManagerSources = new Set(
      managerRows.map((row) => row.sourceDatabase),
    );
    const matchedEmails = new Set<string>();
    const deliverBulkEmail = () =>
      deliverEmail({
        recipients: Array.from(matchedEmails).map((email) => ({ email })),
        subject,
        body: message,
        category: "BULK_EMAIL",
        metadata: { source: "legacy_bulk_email" },
        mode: "bcc",
      });

    for (const row of regularRows) {
      const levelsForUser = parsePhpLevelIds(row.recordValue);
      const matchesSelected = levelsForUser.some((levelId) =>
        regularLevelKeys.has(`${row.sourceDatabase}:${levelId}`),
      );
      if (!matchesSelected) continue;
      if (row.email) matchedEmails.add(row.email.toLowerCase());
      if (row.userId) exactUserIds.add(row.userId);
    }

    for (const row of managerRows) {
      const levelsForUser = parsePhpLevelIds(row.recordValue);
      const matchesSelected = levelsForUser.some((levelId) =>
        managerLevelKeys.has(`${row.sourceDatabase}:${levelId}`),
      );
      if (!matchesSelected) continue;
      if (row.email) matchedEmails.add(row.email.toLowerCase());
      if (row.userId) exactUserIds.add(row.userId);
    }

    const fallbackLevels = levels.filter((level) => {
      if (
        level.recordType === "login_level" &&
        exactRegularSources.has(level.sourceDatabase)
      ) {
        return false;
      }
      if (
        level.recordType === "manager_login_level" &&
        exactManagerSources.has(level.sourceDatabase)
      ) {
        return false;
      }
      return true;
    });

    const roleTargets = new Set<UserRole>();
    for (const level of fallbackLevels) {
      for (const role of rolesForLegacyLevel({
        id: level.id,
        sourceDatabase: level.sourceDatabase,
        legacyTable: level.legacyTable,
        legacyId: level.legacyId,
        label: level.recordKey ?? `Level ${level.legacyId}`,
        isDisabled: level.isDisabled ?? false,
      })) {
        roleTargets.add(role);
      }
    }

    if (roleTargets.size === 0 && exactUserIds.size === 0) {
      return {
        success: true,
        data: {
          selectedLevels: levels.length,
          matchedRecipients: matchedEmails.size,
          sentCount: 0,
          skippedNoModernUser: matchedEmails.size,
          emailDelivery: await deliverBulkEmail(),
        },
      };
    }

    const users = await db.user.findMany({
      where: {
        isActive: true,
        OR: [
          ...(roleTargets.size ? [{ role: { in: Array.from(roleTargets) } }] : []),
          ...(exactUserIds.size ? [{ id: { in: Array.from(exactUserIds) } }] : []),
        ],
        AND: [
          {
            OR: [
              { organizationId: ctx.organizationId },
              { organizationId: null },
            ],
          },
        ],
      },
      select: { id: true, email: true, name: true },
    });

    const userIds = Array.from(new Set(users.map((user) => user.id)));
    for (const user of users) {
      if (user.email) matchedEmails.add(user.email.toLowerCase());
    }

    if (userIds.length === 0) {
      return {
        success: true,
        data: {
          selectedLevels: levels.length,
          matchedRecipients: matchedEmails.size,
          sentCount: 0,
          skippedNoModernUser: matchedEmails.size,
          emailDelivery: await deliverBulkEmail(),
        },
      };
    }

    const created = await createInAppNotifications({
      userIds,
      title: subject,
      body: message,
      type: "BULK_EMAIL",
      category: "BULK_EMAIL",
    });
    const recipientsByEmail = new Map<string, { email: string; name?: string | null }>(
      Array.from(matchedEmails).map((email) => [email, { email }]),
    );
    for (const user of users) {
      if (user.email) {
        recipientsByEmail.set(user.email.toLowerCase(), {
          email: user.email,
          name: user.name,
        });
      }
    }
    const emailDelivery = await deliverEmail({
      recipients: Array.from(recipientsByEmail.values()),
      subject,
      body: message,
      category: "BULK_EMAIL",
      metadata: {
        source: "legacy_bulk_email",
        selectedLevels: levels.length,
      },
      mode: "bcc",
    });

    revalidatePath("/");
    revalidatePath("/settings/notifications");

    return {
      success: true,
      data: {
        selectedLevels: levels.length,
        matchedRecipients: matchedEmails.size || userIds.length,
        sentCount: created,
        skippedNoModernUser: Math.max(0, matchedEmails.size - userIds.length),
        emailDelivery,
      },
    };
  } catch (error) {
    console.error("Failed to send legacy bulk email:", error);
    return { success: false, error: "Failed to send bulk email" };
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
          { legacyTable: { in: ["login_settings", "login_settings_man"] } },
          { settingKey: { startsWith: "email-" } },
          { settingKey: { startsWith: "account-remind-" } },
          { scope: "notification" },
        ],
      },
      orderBy: [
        { sourceDatabase: "asc" },
        { legacyTable: "asc" },
        { settingKey: "asc" },
      ],
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
        legacyData: setting.legacyData,
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
// updateLegacyNotificationChannelSetting
// ---------------------------------------------------------------------------

type LegacyNotificationChannel = "alarms" | "email" | "whatsapp" | "sms";

const LEGACY_NOTIFICATION_CHANNELS = new Set<string>([
  "alarms",
  "email",
  "whatsapp",
  "sms",
]);

function isLegacyNotificationChannel(
  value: string,
): value is LegacyNotificationChannel {
  return LEGACY_NOTIFICATION_CHANNELS.has(value);
}

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function parseLegacySettingValue(value: string | null): Record<string, unknown> {
  if (!value?.trim()) return {};
  try {
    return jsonRecord(JSON.parse(value));
  } catch {
    return {};
  }
}

function legacyRecord(
  legacyData: unknown,
  settingValue: string | null,
): Record<string, unknown> {
  return {
    ...parseLegacySettingValue(settingValue),
    ...jsonRecord(legacyData),
  };
}

function legacyMtypeChannel(
  data: Record<string, unknown>,
): LegacyNotificationChannel | null {
  const mtype = Number(data.mtype);
  if (mtype === 1) return "whatsapp";
  if (mtype === 2) return "sms";
  return null;
}

export async function updateLegacyNotificationChannelSetting(
  id: string,
  channel: string,
  enabled: boolean,
): Promise<ActionResult<LegacyNotificationSettingRow>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    if (!isLegacyNotificationChannel(channel)) {
      return { success: false, error: "Unknown notification channel" };
    }

    const setting = await db.legacySetting.findUnique({ where: { id } });
    if (!setting || setting.legacyTable !== "t_notification_setting") {
      return { success: false, error: "Legacy notification setting not found" };
    }

    const currentData = legacyRecord(setting.legacyData, setting.settingValue);
    let targetKey: LegacyNotificationChannel | "status" = channel;
    let currentValue = Number(currentData[channel]);

    if (!Number.isFinite(currentValue) && legacyMtypeChannel(currentData) === channel) {
      targetKey = "status";
      currentValue = Number(currentData.status);
    }

    if (!Number.isFinite(currentValue)) {
      return { success: false, error: "Legacy channel is not present on this row" };
    }
    if (currentValue === -1) {
      return { success: false, error: "Legacy channel is locked for this row" };
    }

    const nextData = {
      ...currentData,
      [targetKey]: enabled ? 1 : 0,
    };

    const updated = await db.legacySetting.update({
      where: { id },
      data: {
        legacyData: nextData as Prisma.InputJsonValue,
        settingValue: JSON.stringify(nextData),
      },
    });

    revalidatePath("/settings/notifications");

    return {
      success: true,
      data: {
        id: updated.id,
        sourceDatabase: updated.sourceDatabase,
        legacyTable: updated.legacyTable,
        legacyId: updated.legacyId,
        scope: updated.scope,
        settingKey: updated.settingKey,
        settingValue: updated.settingValue,
        description: updated.description,
        legacyData: updated.legacyData,
      },
    };
  } catch (error) {
    console.error("Failed to update legacy notification channel:", error);
    return {
      success: false,
      error: "Failed to update legacy notification channel",
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
      include: { user: { select: { email: true, name: true } } },
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
    await deliverEmail({
      recipients: existing.user.email
        ? [{ email: existing.user.email, name: existing.user.name }]
        : [],
      subject: existing.title,
      body: existing.body ?? "",
      category: existing.category ?? undefined,
      metadata: {
        source: "notification_resend",
        notificationId: existing.id,
      },
    });

    revalidatePath("/settings/notifications");

    return { success: true };
  } catch (error) {
    console.error("Failed to resend notification:", error);
    return { success: false, error: "Failed to resend notification" };
  }
}
