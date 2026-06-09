import type { Prisma } from "@/generated/prisma/client";
import type { AlarmType } from "@/generated/prisma/enums";

interface LegacyMessageSideEffectConfig {
  legacyNatureId: number;
  names: string[];
  family: string;
  category: string;
  alarmType: AlarmType;
  legacyMethod: string;
  contentTable: string;
  parentDeliveryTable: string | null;
  staffDeliveryTable: string | null;
  href: string;
  createsHoliday?: boolean;
  createsEvent?: boolean;
}

type LegacyBulkSideEffectChild = {
  id: string;
  legacyId: number | null;
  branchId: string;
  classId: string | null;
  parentUsers: Array<{
    id: string;
    legacyId: number | null;
    legacyChildId: number | null;
  }>;
};

const LEGACY_MESSAGE_SIDE_EFFECTS: LegacyMessageSideEffectConfig[] = [
  {
    legacyNatureId: 1,
    names: ["birthday", "birthdays"],
    family: "Birthdays",
    category: "birthday",
    alarmType: "BIRTHDAY",
    legacyMethod: "addToBirthdays",
    contentTable: "t_alarms_birthday",
    parentDeliveryTable: "custom_notifications_birthday_parents",
    staffDeliveryTable: "custom_notifications_birthday",
    href: "alarmsBirthday.php",
  },
  {
    legacyNatureId: 2,
    names: [
      "general",
      "closure",
      "holiday",
      "strike",
      "day off",
      "outside activities",
      "inside activities",
    ],
    family: "General",
    category: "general",
    alarmType: "EVENT",
    legacyMethod: "addToGeneral",
    contentTable: "t_alarms",
    parentDeliveryTable: "custom_notifications_parents",
    staffDeliveryTable: "custom_notifications",
    href: "alarms.php",
    createsHoliday: true,
  },
  {
    legacyNatureId: 3,
    names: ["assessment", "assessments"],
    family: "Assessments",
    category: "assessment",
    alarmType: "ASSESSMENT",
    legacyMethod: "addToAssessments",
    contentTable: "t_alarms_assessment",
    parentDeliveryTable: "t_alarms_assessment_parents",
    staffDeliveryTable: "custom_notifications_assessment",
    href: "alarmsAssessment.php",
  },
  {
    legacyNatureId: 4,
    names: ["event", "events", "show", "celebration"],
    family: "Events",
    category: "event",
    alarmType: "EVENT",
    legacyMethod: "addToEvents",
    contentTable: "t_events",
    parentDeliveryTable: "custom_notifications_events_parents",
    staffDeliveryTable: "custom_notifications_events",
    href: "events.php",
    createsEvent: true,
  },
  {
    legacyNatureId: 5,
    names: ["reports reminder", "reports reminders", "medical", "medical report"],
    family: "Reports Reminders",
    category: "medical",
    alarmType: "MEDICAL",
    legacyMethod: "addToReportsReminders",
    contentTable: "t_alarms_medical",
    parentDeliveryTable: "custom_notifications_medical_parents",
    staffDeliveryTable: "custom_notifications_medical",
    href: "alarmsMedical.php",
  },
  {
    legacyNatureId: 6,
    names: ["vaccination", "vaccinations"],
    family: "Vaccinations",
    category: "vaccination",
    alarmType: "VACCINATION",
    legacyMethod: "addToVaccinations",
    contentTable: "t_alarms_vaccinations",
    parentDeliveryTable: "custom_notifications_vaccinations",
    staffDeliveryTable: null,
    href: "AlarmsVaccinations.php",
  },
  {
    legacyNatureId: 7,
    names: ["medicine", "reports medicine"],
    family: "Medicine",
    category: "medicine",
    alarmType: "MEDICINE",
    legacyMethod: "addToMedicine",
    contentTable: "t_alarms_medicine",
    parentDeliveryTable: "custom_notifications_medicine_parents",
    staffDeliveryTable: "custom_notifications_medicine",
    href: "alarmsMedicine.php",
  },
  {
    legacyNatureId: 8,
    names: ["insurance"],
    family: "Insurance",
    category: "insurance",
    alarmType: "INSURANCE",
    legacyMethod: "addToInsurance",
    contentTable: "t_alarms_insurance",
    parentDeliveryTable: "custom_notifications_insurance_parents",
    staffDeliveryTable: "custom_notifications_insurance",
    href: "alarmsInsurance.php",
  },
  {
    legacyNatureId: 9,
    names: ["payment", "payments"],
    family: "Payments",
    category: "payment",
    alarmType: "PAYMENT",
    legacyMethod: "addToPayments",
    contentTable: "t_alarms_payments",
    parentDeliveryTable: "custom_notifications_payments",
    staffDeliveryTable: null,
    href: "alarmsPayments.php",
  },
  {
    legacyNatureId: 10,
    names: ["other", "others", "red day"],
    family: "Others",
    category: "other",
    alarmType: "OTHER",
    legacyMethod: "addToOthers",
    contentTable: "t_alarms_others",
    parentDeliveryTable: "custom_notifications_others_parents",
    staffDeliveryTable: "custom_notifications_others",
    href: "alarmsInsurance.php",
  },
  {
    legacyNatureId: 11,
    names: ["request", "requests"],
    family: "Requests",
    category: "request",
    alarmType: "REQUEST",
    legacyMethod: "addToRequests",
    contentTable: "t_alarms_requests",
    parentDeliveryTable: "custom_notifications_requests_parents",
    staffDeliveryTable: "custom_notifications_requests",
    href: "alarmsInsurance.php",
  },
];

export function legacyMessageSideEffectIntent(
  nature?: string | null,
): Prisma.InputJsonObject | null {
  const config = findLegacyMessageSideEffect(nature);
  if (!config) return null;

  return {
    status: "writes-created-on-send",
    legacyNatureId: config.legacyNatureId,
    family: config.family,
    alarmType: config.alarmType,
    legacyMethod: config.legacyMethod,
    contentTable: config.contentTable,
    parentDeliveryTable: config.parentDeliveryTable,
    staffDeliveryTable: config.staffDeliveryTable,
    href: config.href,
    createsHoliday: Boolean(config.createsHoliday),
    createsEvent: Boolean(config.createsEvent),
  };
}

export function findLegacyMessageSideEffect(nature?: string | null) {
  const normalized = nature?.trim().toLowerCase();
  if (!normalized) return null;

  const numericNature = /^\d+$/.test(normalized) ? Number(normalized) : null;
  return (
    LEGACY_MESSAGE_SIDE_EFFECTS.find(
      (config) =>
        config.legacyNatureId === numericNature ||
        config.names.includes(normalized),
    ) ?? null
  );
}

export function legacySideEffectHasTargets(
  config: LegacyMessageSideEffectConfig | null | undefined,
  childCount: number,
  teacherUserCount: number,
) {
  if (!config) return false;
  if (config.createsEvent || config.createsHoliday) {
    return childCount > 0 || teacherUserCount > 0;
  }
  return childCount > 0 || (teacherUserCount > 0 && Boolean(config.staffDeliveryTable));
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function sqlDateTime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function nextLegacySideEffectId(
  tx: Prisma.TransactionClient,
  sourceTables: string[],
) {
  const [receiptMax, eventMax] = await Promise.all([
    tx.notificationReceipt.aggregate({
      where: { sourceTable: { in: sourceTables } },
      _max: { legacyNotificationId: true },
    }),
    tx.event.aggregate({ _max: { legacyId: true } }),
  ]);

  return Math.max(
    receiptMax._max.legacyNotificationId ?? 0,
    eventMax._max.legacyId ?? 0,
  ) + 1;
}

function sideEffectReceiptTables(config: LegacyMessageSideEffectConfig) {
  return [
    config.parentDeliveryTable,
    config.staffDeliveryTable,
  ].filter((table): table is string => Boolean(table));
}

async function selectedStaffUsersForSideEffects(params: {
  tx: Prisma.TransactionClient;
  organizationId: string;
  teacherUserIds: string[];
}) {
  const selectedIds = Array.from(
    new Set(params.teacherUserIds.filter(Boolean)),
  );
  if (selectedIds.length === 0) {
    return [] as Array<{
      id: string;
      branchId: string | null;
      legacyRecipientId: number | null;
    }>;
  }

  const users = await params.tx.user.findMany({
    where: {
      id: { in: selectedIds },
      organizationId: params.organizationId,
      isActive: true,
      role: "TEACHER",
    },
    select: { id: true, branchId: true },
  });
  if (users.length === 0) return [];

  const legacyRows = await params.tx.legacyAuthRecord.findMany({
    where: {
      userId: { in: users.map((user) => user.id) },
      legacyTable: { in: ["login_users", "login_users_man"] },
    },
    select: { userId: true, legacyUserId: true, legacyId: true },
    orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
  });
  const legacyByUser = new Map<string, number>();
  for (const row of legacyRows) {
    if (!row.userId || legacyByUser.has(row.userId)) continue;
    legacyByUser.set(row.userId, row.legacyUserId ?? row.legacyId);
  }

  return users.map((user) => ({
    ...user,
    legacyRecipientId: legacyByUser.get(user.id) ?? null,
  }));
}

export async function createLegacyBulkMessageSideEffects(params: {
  tx: Prisma.TransactionClient;
  organizationId: string;
  senderId: string;
  threadId: string;
  nature?: string | null;
  subject: string | null;
  body: string;
  teacherUserIds?: string[];
  children: LegacyBulkSideEffectChild[];
}) {
  const config = findLegacyMessageSideEffect(params.nature);
  if (!config) return null;

  const sourceTables = sideEffectReceiptTables(config);
  if (sourceTables.length === 0) return null;

  const now = new Date();
  const today = startOfToday();
  const branchIds = Array.from(new Set(params.children.map((child) => child.branchId)));
  const staffUsers = config.staffDeliveryTable
    ? await selectedStaffUsersForSideEffects({
        tx: params.tx,
        organizationId: params.organizationId,
        teacherUserIds: params.teacherUserIds ?? [],
      })
    : [];

  let nextLegacyId = await nextLegacySideEffectId(params.tx, sourceTables);
  const summary = {
    family: config.family,
    alarmsCreated: 0,
    eventsCreated: 0,
    holidaysCreated: 0,
    receiptsCreated: 0,
  };

  if (config.createsEvent) {
    const legacyNotificationId = nextLegacyId++;
    const event = await params.tx.event.create({
      data: {
        legacyId: legacyNotificationId,
        organizationId: params.organizationId,
        title: params.subject || config.family,
        description: params.body,
        customSubject: params.subject || config.family,
        customBody: params.body,
        date: today,
        notificationBranchIds: branchIds,
        notificationDaysBefore: [],
        isActive: true,
        legacyData: {
          sourceTable: config.contentTable,
          sourceDeliveryTable: config.staffDeliveryTable,
          parentDeliveryTable: config.parentDeliveryTable,
          modernGenerator: "sendBulkChildMessage",
          legacyMethod: "Data::saveNewEvents",
          legacyFollowupMethod: config.legacyMethod,
          legacyNature: params.nature,
          messageThreadId: params.threadId,
          senderId: params.senderId,
          eventType: 0,
          Message: 1,
          EventDate: today.toISOString().split("T")[0],
          submit_time: sqlDateTime(now),
        },
      },
    });
    summary.eventsCreated += 1;

    const receiptData = [
      ...parentSideEffectReceipts({
        config,
        children: params.children,
        legacyNotificationId,
        alarmId: null,
        metadata: {
          modernTargetType: "Event",
          modernTargetId: event.id,
          datetime: sqlDateTime(now),
          ntype: 1,
        },
      }),
      ...staffSideEffectReceipts({
        config,
        users: staffUsers,
        legacyNotificationId,
        alarmId: null,
        metadata: {
          modernTargetType: "Event",
          modernTargetId: event.id,
          submit_time: sqlDateTime(now),
          ntype: 1,
        },
      }),
    ];
    if (receiptData.length > 0) {
      const receipts = await params.tx.notificationReceipt.createMany({
        data: receiptData,
        skipDuplicates: true,
      });
      summary.receiptsCreated += receipts.count;
    }

    return summary;
  }

  const holiday = config.createsHoliday
    ? await params.tx.holiday.create({
        data: {
          name: params.subject || config.family,
          description: params.body,
          date: today,
          type: params.nature?.toLowerCase().includes("strike")
            ? "STRIKE"
            : "HOLIDAY",
          isActive: true,
          notificationTitle: params.subject || config.family,
          notificationMessage: params.body,
          branchId: branchIds.length === 1 ? branchIds[0] : null,
        },
      })
    : null;
  if (holiday) summary.holidaysCreated += 1;

  if (holiday) {
    const legacyNotificationId = nextLegacyId++;
    const alarm = await params.tx.alarm.create({
      data: {
        type: config.alarmType,
        referenceId: holiday.id,
        referenceType: "Holiday",
        message: params.body,
        dueDate: today,
        branchId: branchIds.length === 1 ? branchIds[0] : null,
        isActive: true,
        legacyData: {
          aid: legacyNotificationId,
          child_id: holiday.id,
          sourceTable: config.contentTable,
          sourceDeliveryTable: config.staffDeliveryTable,
          parentDeliveryTable: config.parentDeliveryTable,
          modernGenerator: "sendBulkChildMessage",
          legacyMethod: config.legacyMethod,
          legacyNature: params.nature,
          legacyNatureId: config.legacyNatureId,
          messageThreadId: params.threadId,
          senderId: params.senderId,
          selectedTeacherUserIds: staffUsers.map((user) => user.id),
          selectedLegacyTeacherUserIds: staffUsers.map(
            (user) => user.legacyRecipientId,
          ),
          type: params.subject || config.family,
          details: params.body,
          href: config.href,
          level: 0,
          ntype: 1,
          datetime: sqlDateTime(now),
        },
      },
    });
    summary.alarmsCreated += 1;

    const receiptData = [
      ...parentSideEffectReceipts({
        config,
        children: params.children,
        legacyNotificationId,
        alarmId: alarm.id,
        metadata: {
          modernTargetType: "Holiday",
          modernTargetId: holiday.id,
          datetime: sqlDateTime(now),
          ntype: 1,
        },
      }),
      ...staffSideEffectReceipts({
        config,
        users: staffUsers,
        legacyNotificationId,
        alarmId: alarm.id,
        metadata: {
          modernTargetType: "Holiday",
          modernTargetId: holiday.id,
          submit_time: sqlDateTime(now),
          ntype: 1,
        },
      }),
    ];
    if (receiptData.length > 0) {
      const receipts = await params.tx.notificationReceipt.createMany({
        data: receiptData,
        skipDuplicates: true,
      });
      summary.receiptsCreated += receipts.count;
    }

    return summary;
  }

  if (staffUsers.length > 0) {
    const legacyNotificationId = nextLegacyId++;
    const alarm = await params.tx.alarm.create({
      data: {
        type: config.alarmType,
        referenceId: null,
        referenceType: "SelectedTeachers",
        message: params.body,
        dueDate: today,
        branchId: branchIds.length === 1 ? branchIds[0] : null,
        isActive: true,
        legacyData: {
          aid: legacyNotificationId,
          child_id: 0,
          sourceTable: config.contentTable,
          sourceDeliveryTable: config.staffDeliveryTable,
          parentDeliveryTable: config.parentDeliveryTable,
          modernGenerator: "sendBulkChildMessage",
          legacyMethod: config.legacyMethod,
          legacyNature: params.nature,
          legacyNatureId: config.legacyNatureId,
          messageThreadId: params.threadId,
          senderId: params.senderId,
          selectedTeacherUserIds: staffUsers.map((user) => user.id),
          selectedLegacyTeacherUserIds: staffUsers.map(
            (user) => user.legacyRecipientId,
          ),
          type: params.subject || config.family,
          details: params.body,
          href: config.href,
          level: config.legacyNatureId === 1 ? 0 : undefined,
          ntype: 1,
          datetime: sqlDateTime(now),
        },
      },
    });
    summary.alarmsCreated += 1;

    const receiptData = staffSideEffectReceipts({
      config,
      users: staffUsers,
      legacyNotificationId,
      alarmId: alarm.id,
      metadata: {
        modernTargetType: "Alarm",
        modernTargetId: alarm.id,
        submit_time: sqlDateTime(now),
        ntype: 1,
      },
    });
    if (receiptData.length > 0) {
      const receipts = await params.tx.notificationReceipt.createMany({
        data: receiptData,
        skipDuplicates: true,
      });
      summary.receiptsCreated += receipts.count;
    }
  }

  for (const child of params.children) {
    const legacyNotificationId = nextLegacyId++;
    const alarm = await params.tx.alarm.create({
      data: {
        type: config.alarmType,
        referenceId: child.id,
        referenceType: "Child",
        message: params.body,
        dueDate: today,
        branchId: child.branchId,
        isActive: true,
        legacyData: {
          aid: legacyNotificationId,
          sourceTable: config.contentTable,
          sourceDeliveryTable: config.staffDeliveryTable,
          parentDeliveryTable: config.parentDeliveryTable,
          modernGenerator: "sendBulkChildMessage",
          legacyMethod: config.legacyMethod,
          legacyNature: params.nature,
          legacyNatureId: config.legacyNatureId,
          messageThreadId: params.threadId,
          senderId: params.senderId,
          childId: child.id,
          legacyChildId: child.legacyId,
          classId: child.classId,
          type: params.subject || config.family,
          details: params.body,
          href: config.href,
          level: config.legacyNatureId === 1 ? 0 : undefined,
          ntype: 1,
          datetime: sqlDateTime(now),
        },
      },
    });
    summary.alarmsCreated += 1;

    const receiptData = parentSideEffectReceipts({
      config,
      children: [child],
      legacyNotificationId,
      alarmId: alarm.id,
      metadata: {
        modernTargetType: "Alarm",
        modernTargetId: alarm.id,
        datetime: sqlDateTime(now),
        ntype: 1,
      },
    });
    if (receiptData.length > 0) {
      const receipts = await params.tx.notificationReceipt.createMany({
        data: receiptData,
        skipDuplicates: true,
      });
      summary.receiptsCreated += receipts.count;
    }
  }

  return summary;
}

function parentSideEffectReceipts(params: {
  config: LegacyMessageSideEffectConfig;
  children: Array<{
    id: string;
    legacyId: number | null;
    parentUsers: Array<{ legacyId: number | null; legacyChildId: number | null }>;
  }>;
  legacyNotificationId: number;
  alarmId: string | null;
  metadata: Prisma.InputJsonObject;
}) {
  if (!params.config.parentDeliveryTable) return [];

  return params.children.map((child, index) => ({
    sourceTable: params.config.parentDeliveryTable!,
    category: params.config.category,
    legacyNotificationId: params.legacyNotificationId,
    legacyRecipientId:
      child.legacyId ??
      child.parentUsers[0]?.legacyChildId ??
      child.parentUsers[0]?.legacyId ??
      -(index + 1),
    recipientType: "CHILD",
    recipientId: child.id,
    alarmId: params.alarmId,
    isRead: false,
    metadata: {
      ...params.metadata,
      legacyMethod: params.config.legacyMethod,
      legacyNatureId: params.config.legacyNatureId,
    },
  }));
}

function staffSideEffectReceipts(params: {
  config: LegacyMessageSideEffectConfig;
  users: Array<{ id: string; legacyRecipientId?: number | null }>;
  legacyNotificationId: number;
  alarmId: string | null;
  metadata: Prisma.InputJsonObject;
}) {
  if (!params.config.staffDeliveryTable) return [];

  return params.users.map((user, index) => ({
    sourceTable: params.config.staffDeliveryTable!,
    category: params.config.category,
    legacyNotificationId: params.legacyNotificationId,
    legacyRecipientId: user.legacyRecipientId ?? -(index + 1),
    recipientType: "USER",
    recipientId: user.id,
    alarmId: params.alarmId,
    isRead: false,
    metadata: {
      ...params.metadata,
      legacyMethod: params.config.legacyMethod,
      legacyNatureId: params.config.legacyNatureId,
    },
  }));
}
