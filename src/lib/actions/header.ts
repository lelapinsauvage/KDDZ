"use server";

import { getHeaderAlarmCounts, getNotifications } from "./alarms";
import { getUnreadMessageCount } from "./messages";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import type { AlarmType } from "@/generated/prisma/enums";

export interface HeaderNotification {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface HeaderMessage {
  id: string;
  subject: string | null;
  body: string;
  senderName: string;
  isRead: boolean;
  createdAt: string;
}

export interface HeaderAlarm {
  id: string;
  type: string;
  message: string;
  dueDate: string | null;
  isOverdue: boolean;
  createdAt: string;
  isCritical: boolean;
}

export interface HeaderLegacyBadgeItem {
  id: string;
  text: string;
  datetime: string;
  href: string;
}

export interface HeaderLegacyBadgeFamily {
  key: "messages" | "medicine" | "birthdays" | "assessments" | "medical" | "general";
  label: string;
  emptyLabel: string;
  seeAllLabel: string;
  href: string;
  count: number;
  items: HeaderLegacyBadgeItem[];
}

export interface HeaderData {
  alarmCounts: {
    birthdays: number;
    assessments: number;
    medical: number;
    totalAlarms: number;
  };
  notifications: HeaderNotification[];
  unreadNotificationCount: number;
  unreadMessageCount: number;
  recentMessages: HeaderMessage[];
  recentAlarms: HeaderAlarm[];
  hasCriticalAlarms: boolean;
  legacyBadges: HeaderLegacyBadgeFamily[];
}

const CRITICAL_TYPES = new Set(["VACCINATION", "MEDICAL", "MEDICINE", "PAYMENT"]);

interface LegacyReceiptFamilyConfig {
  key: HeaderLegacyBadgeFamily["key"];
  label: string;
  emptyLabel: string;
  seeAllLabel: string;
  href: string;
  sourceTable: string;
  alarmType?: AlarmType;
}

const LEGACY_RECEIPT_FAMILIES: LegacyReceiptFamilyConfig[] = [
  {
    key: "medicine",
    label: "Medication",
    emptyLabel: "No New Alarms",
    seeAllLabel: "See All Medication Alarms",
    href: "/alarms/medicine",
    sourceTable: "custom_notifications_medicine",
    alarmType: "MEDICINE",
  },
  {
    key: "birthdays",
    label: "Birthdays",
    emptyLabel: "No New Alarms",
    seeAllLabel: "See All Birthdays Alarms",
    href: "/alarms/birthdays",
    sourceTable: "custom_notifications_birthday",
    alarmType: "BIRTHDAY",
  },
  {
    key: "assessments",
    label: "Assessment",
    emptyLabel: "No New Alarms",
    seeAllLabel: "See All Assessment Alarms",
    href: "/alarms/assessments",
    sourceTable: "custom_notifications_assessment",
    alarmType: "ASSESSMENT",
  },
  {
    key: "medical",
    label: "Medical",
    emptyLabel: "No New Alarms",
    seeAllLabel: "See All Reports Reminders",
    href: "/alarms/medical",
    sourceTable: "custom_notifications_medical",
    alarmType: "MEDICAL",
  },
  {
    key: "general",
    label: "General",
    emptyLabel: "No New Alarms",
    seeAllLabel: "See All",
    href: "/alarms",
    sourceTable: "custom_notifications",
  },
];

function emptyLegacyBadges(): HeaderLegacyBadgeFamily[] {
  return [
    {
      key: "messages",
      label: "Messages",
      emptyLabel: "No New Messages",
      seeAllLabel: "See All Messages",
      href: "/alarms/msg",
      count: 0,
      items: [],
    },
    ...LEGACY_RECEIPT_FAMILIES.map((family) => ({
      key: family.key,
      label: family.label,
      emptyLabel: family.emptyLabel,
      seeAllLabel: family.seeAllLabel,
      href: family.href,
      count: 0,
      items: [],
    })),
  ];
}

const EMPTY_HEADER: HeaderData = {
  alarmCounts: { birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 },
  notifications: [],
  unreadNotificationCount: 0,
  unreadMessageCount: 0,
  recentMessages: [],
  recentAlarms: [],
  hasCriticalAlarms: false,
  legacyBadges: emptyLegacyBadges(),
};

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function jsonString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function legacyAlarmHref(defaultHref: string, legacyData: unknown) {
  const href = jsonString(jsonRecord(legacyData).href);
  return href?.startsWith("/") ? href : defaultHref;
}

async function loadLegacyMessageBadge(userId: string, orgId: string) {
  const [count, messages] = await Promise.all([
    db.message.count({
      where: {
        recipientId: userId,
        organizationId: orgId,
        isRead: false,
      },
    }),
    db.message.findMany({
      where: {
        recipientId: userId,
        organizationId: orgId,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        subject: true,
        body: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    key: "messages",
    label: "Messages",
    emptyLabel: "No New Messages",
    seeAllLabel: "See All Messages",
    href: "/alarms/msg",
    count,
    items: messages.map((message) => ({
      id: message.id,
      text: message.subject || message.body || "Message",
      datetime: message.createdAt.toISOString(),
      href: `/messages/inbox?id=${encodeURIComponent(message.id)}`,
    })),
  } satisfies HeaderLegacyBadgeFamily;
}

async function loadLegacyReceiptBadge(
  config: LegacyReceiptFamilyConfig,
  userId: string,
  orgId: string,
) {
  const alarmFilter = {
    ...(config.alarmType ? { type: config.alarmType } : {}),
    OR: [{ branch: { organizationId: orgId } }, { branchId: null }],
  };
  const where = {
    sourceTable: config.sourceTable,
    recipientId: userId,
    recipientType: "USER",
    isRead: false,
    alarm: { is: alarmFilter },
  };

  const [count, receipts] = await Promise.all([
    db.notificationReceipt.count({ where }),
    db.notificationReceipt.findMany({
      where,
      include: { alarm: true },
      orderBy: { legacyNotificationId: "desc" },
      take: 4,
    }),
  ]);

  return {
    key: config.key,
    label: config.label,
    emptyLabel: config.emptyLabel,
    seeAllLabel: config.seeAllLabel,
    href: config.href,
    count,
    items: receipts.flatMap((receipt) => {
      if (!receipt.alarm) return [];
      return [{
        id: receipt.id,
        text: receipt.alarm.message ?? config.label,
        datetime: receipt.alarm.createdAt.toISOString(),
        href: legacyAlarmHref(config.href, receipt.alarm.legacyData),
      }];
    }),
  } satisfies HeaderLegacyBadgeFamily;
}

async function loadLegacyBadges(userId: string, orgId: string) {
  const [messages, ...families] = await Promise.all([
    loadLegacyMessageBadge(userId, orgId),
    ...LEGACY_RECEIPT_FAMILIES.map((family) =>
      loadLegacyReceiptBadge(family, userId, orgId),
    ),
  ]);

  return [messages, ...families];
}

export async function getHeaderData(): Promise<HeaderData> {
  let userId: string;
  let orgId: string;
  try {
    const ctx = await requireOrg();
    userId = ctx.userId;
    orgId = ctx.organizationId;
  } catch {
    return EMPTY_HEADER;
  }

  const [
    alarmCountsResult,
    notificationsResult,
    messageCountResult,
    recentDbAlarms,
    legacyBadges,
  ] =
    await Promise.all([
      getHeaderAlarmCounts(),
      getNotifications({ limit: 8 }),
      getUnreadMessageCount().catch(() => ({ success: true, data: 0 })),
      db.alarm.findMany({
        where: { isActive: true, branch: { organizationId: orgId } },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 5,
      }),
      loadLegacyBadges(userId, orgId),
    ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentAlarms: HeaderAlarm[] = recentDbAlarms.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message ?? a.type,
    dueDate: a.dueDate?.toISOString().slice(0, 10) ?? null,
    isOverdue: a.dueDate ? a.dueDate < today : false,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    isCritical: CRITICAL_TYPES.has(a.type),
  }));

  const hasCriticalAlarms = recentAlarms.some((a) => a.isCritical);

  const alarmCounts = (alarmCountsResult.data as {
    birthdays: number;
    assessments: number;
    medical: number;
    totalAlarms: number;
  }) ?? { birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 };

  const notificationData = (notificationsResult.success
    ? notificationsResult.data
    : { notifications: [], unreadCount: 0 }) as {
    notifications: Array<{
      id: string;
      title: string;
      body: string | null;
      isRead: boolean;
      createdAt: Date;
    }>;
    unreadCount: number;
  };

  const messageCount =
    typeof messageCountResult.data === "number" ? messageCountResult.data : 0;

  const serializedNotifications = notificationData.notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
  }));

  // Fetch recent messages for the inbox tray
  let recentMessages: HeaderMessage[] = [];
  try {
    const messages = await db.message.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    // Resolve sender names
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const [users, parentUsers] = await Promise.all([
      senderIds.length > 0
        ? db.user.findMany({
            where: { id: { in: senderIds } },
            select: { id: true, name: true, email: true },
          })
        : [],
      senderIds.length > 0
        ? db.parentUser.findMany({
            where: { id: { in: senderIds } },
            select: { id: true, username: true },
          })
        : [],
    ]);

    const nameMap = new Map<string, string>();
    for (const u of users) nameMap.set(u.id, u.name || u.email);
    for (const pu of parentUsers) nameMap.set(pu.id, pu.username);

    recentMessages = messages.map((m) => ({
      id: m.id,
      subject: m.subject,
      body: m.body,
      senderName: nameMap.get(m.senderId) ?? "Unknown",
      isRead: m.isRead,
      createdAt:
        m.createdAt instanceof Date
          ? m.createdAt.toISOString()
          : String(m.createdAt),
    }));
  } catch {
    // If message fetch fails, continue with empty list
  }

  return {
    alarmCounts,
    notifications: serializedNotifications,
    unreadNotificationCount: notificationData.unreadCount,
    unreadMessageCount: messageCount,
    recentMessages,
    recentAlarms,
    hasCriticalAlarms,
    legacyBadges,
  };
}
