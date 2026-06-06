/**
 * Migration: legacy alarm/notification tables → Alarm, PushToken,
 * NotificationReceipt, LegacyNotificationLog, and LegacyNotificationNature.
 *
 * Legacy splits notifications into content tables (`t_alarms_*`) and delivery
 * tables (`custom_notifications_*`). The modern `Alarm` table restores the
 * notification content; `NotificationReceipt` preserves the per-recipient read
 * state so those rows are not flattened away.
 */

import type {
  AlarmType,
  PrismaClient,
  PushPlatform,
} from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  cleanString,
  generateUUID,
  getMapping,
  isDryRun,
  log,
  logError,
  logProgress,
  parseDate,
  setMapping,
  toBool,
  toInt,
} from "./lib/utils";

type ReferenceKind = "child" | "teacher" | "none";
type RecipientKind = "USER" | "CHILD";

interface AlarmConfig {
  table: string;
  category: string;
  type: AlarmType;
  referenceKind: ReferenceKind;
  referenceColumn?: string;
  customTable?: string;
}

interface ReceiptConfig {
  table: string;
  alarmTable?: string;
  category: string;
  recipientKind: RecipientKind;
  targetMappingTable?: string;
}

interface OldPushToken {
  id: number;
  datetime: string;
  child_id: number;
  token: string;
  os: number;
  active: number;
}

interface OldNotificationLog {
  id: number;
  date: string;
  name: string | null;
  status: number;
  childId: number;
  expiryDate: string;
}

interface OldNotificationNature {
  id: number;
  n_name: string;
  descr: string;
  table1: string;
  table2: string;
  table3: string;
  table1_column: string;
  table3_column: string;
  child_column: string;
  subject_col: string;
  body_col: string;
  n_order: number;
  active: number;
}

const ALARM_CONFIGS: AlarmConfig[] = [
  {
    table: "t_alarms",
    category: "general",
    type: "EVENT",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications",
  },
  {
    table: "t_alarms_birthday",
    category: "birthday",
    type: "BIRTHDAY",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_birthday",
  },
  {
    table: "t_alarms_medical",
    category: "medical",
    type: "MEDICAL",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_medical",
  },
  {
    table: "t_alarms_insurance",
    category: "insurance",
    type: "INSURANCE",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_insurance",
  },
  {
    table: "t_alarms_medicine",
    category: "medicine",
    type: "MEDICINE",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_medicine",
  },
  {
    table: "t_alarms_payments",
    category: "payments",
    type: "PAYMENT",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_payments",
  },
  {
    table: "t_alarms_vaccinations",
    category: "vaccinations",
    type: "VACCINATION",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_vaccinations",
  },
  {
    table: "t_alarms_contracts",
    category: "contracts",
    type: "CONTRACT",
    referenceKind: "teacher",
    referenceColumn: "person_id",
    customTable: "custom_notifications_contracts",
  },
  {
    table: "t_alarms_assessment",
    category: "assessment",
    type: "ASSESSMENT",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_assessment",
  },
  {
    table: "t_alarms_assessment_parents",
    category: "assessment_parents",
    type: "ASSESSMENT",
    referenceKind: "child",
    referenceColumn: "child_id",
  },
  {
    table: "t_alarms_others",
    category: "others",
    type: "OTHER",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_others",
  },
  {
    table: "t_alarms_parents",
    category: "parents",
    type: "OTHER",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_parents",
  },
  {
    table: "t_alarms_requests",
    category: "requests",
    type: "REQUEST",
    referenceKind: "child",
    referenceColumn: "child_id",
    customTable: "custom_notifications_requests",
  },
];

const RECEIPT_CONFIGS: ReceiptConfig[] = [
  { table: "custom_notifications", alarmTable: "t_alarms", category: "general", recipientKind: "USER" },
  { table: "custom_notifications_birthday", alarmTable: "t_alarms_birthday", category: "birthday", recipientKind: "USER" },
  { table: "custom_notifications_contracts", alarmTable: "t_alarms_contracts", category: "contracts", recipientKind: "USER" },
  { table: "custom_notifications_insurance", alarmTable: "t_alarms_insurance", category: "insurance", recipientKind: "USER" },
  { table: "custom_notifications_insurance_parents", alarmTable: "t_alarms_insurance", category: "insurance_parents", recipientKind: "CHILD" },
  { table: "custom_notifications_medical", alarmTable: "t_alarms_medical", category: "medical", recipientKind: "USER" },
  { table: "custom_notifications_medical_parents", alarmTable: "t_alarms_medical", category: "medical_parents", recipientKind: "CHILD" },
  { table: "custom_notifications_medicine", alarmTable: "t_alarms_medicine", category: "medicine", recipientKind: "USER" },
  { table: "custom_notifications_medicine_parents", alarmTable: "t_alarms_medicine", category: "medicine_parents", recipientKind: "CHILD" },
  { table: "custom_notifications_assessment", alarmTable: "t_alarms_assessment", category: "assessment", recipientKind: "USER" },
  { table: "custom_notifications_payments", alarmTable: "t_alarms_payments", category: "payments", recipientKind: "CHILD" },
  { table: "custom_notifications_vaccinations", alarmTable: "t_alarms_vaccinations", category: "vaccinations", recipientKind: "CHILD" },
  { table: "custom_notifications_requests", alarmTable: "t_alarms_requests", category: "requests", recipientKind: "USER" },
  { table: "custom_notifications_requests_parents", alarmTable: "t_alarms_requests", category: "requests_parents", recipientKind: "CHILD" },
  { table: "custom_notifications_others", alarmTable: "t_alarms_others", category: "others", recipientKind: "USER" },
  { table: "custom_notifications_others_parents", alarmTable: "t_alarms_others", category: "others_parents", recipientKind: "CHILD" },
  { table: "custom_notifications_parents", alarmTable: "t_alarms", category: "general_parents", recipientKind: "CHILD" },
  { table: "custom_notifications_events", category: "events", recipientKind: "USER", targetMappingTable: "event" },
  { table: "custom_notifications_events_parents", category: "events_parents", recipientKind: "CHILD", targetMappingTable: "event" },
  { table: "custom_notifications_holiday", category: "holiday", recipientKind: "USER", targetMappingTable: "holiday" },
];

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

function platformFromLegacy(os: number): PushPlatform {
  if (os === 1) return "ANDROID";
  if (os === 2) return "IOS";
  return "WEB";
}

function resolveReference(row: Record<string, unknown>, config: AlarmConfig) {
  if (config.referenceKind === "none" || !config.referenceColumn) {
    return { referenceId: null, referenceType: null };
  }

  const legacyId = row[config.referenceColumn];
  if (config.referenceKind === "teacher") {
    return {
      referenceId: getMapping("teacher", legacyId as number),
      referenceType: "Teacher",
    };
  }

  return {
    referenceId: getMapping("child", legacyId as number),
    referenceType: "Child",
  };
}

async function resolveBranchId(
  prisma: PrismaClient,
  referenceId: string | null,
  referenceType: string | null
): Promise<string | null> {
  if (!referenceId || referenceType !== "Child") return null;
  const child = await prisma.child.findUnique({
    where: { id: referenceId },
    select: { branchId: true },
  });
  return child?.branchId ?? null;
}

async function migrateAlarmTable(
  prisma: PrismaClient,
  config: AlarmConfig,
  dryRun: boolean
) {
  const rows = await queryMysql<Record<string, unknown>>(
    `SELECT * FROM ${config.table} ORDER BY aid`
  );
  log(`Found ${rows.length} rows in ${config.table}`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const oldId = toInt(row.aid);
    const { referenceId, referenceType } = resolveReference(row, config);
    const createdAt = parseDate(row.datetime as string) ?? new Date();
    const message = cleanString(row.details);

    const existing = await prisma.alarm.findFirst({
      where: {
        type: config.type,
        referenceId,
        referenceType,
        message,
        createdAt,
      },
    });
    if (existing) {
      setMapping(config.table, oldId, existing.id);
      skipped++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.alarm.create({
        data: {
          id,
          type: config.type,
          referenceId,
          referenceType,
          message,
          dueDate:
            parseDate(row.curr_date as string) ??
            parseDate(row.datetime as string),
          isActive: true,
          branchId: await resolveBranchId(prisma, referenceId, referenceType),
          legacyData: JSON.parse(
            JSON.stringify({
              sourceTable: config.table,
              category: config.category,
              ...row,
            })
          ),
          createdAt,
        },
      });
    }

    setMapping(config.table, oldId, id);
    migrated++;
    logProgress(migrated, rows.length, config.table);
  }

  log(`${config.table}: ${migrated} migrated, ${skipped} skipped`);
}

async function resolveReceiptRecipient(
  prisma: PrismaClient,
  kind: RecipientKind,
  legacyRecipientId: number
) {
  if (kind === "USER") {
    return {
      recipientType: "USER",
      recipientId: getMapping("user", legacyRecipientId),
    };
  }

  const childId = getMapping("child", legacyRecipientId);
  if (!childId) {
    return { recipientType: "CHILD", recipientId: null };
  }

  const parentUser = await prisma.parentUser.findFirst({
    where: { childId },
    select: { id: true },
  });
  return {
    recipientType: parentUser ? "PARENT_USER" : "CHILD",
    recipientId: parentUser?.id ?? childId,
  };
}

async function migrateNotificationReceipts(
  prisma: PrismaClient,
  dryRun: boolean
) {
  log("=== Migrating Notification Receipts ===");

  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const config of RECEIPT_CONFIGS) {
    if (!(await tableExists(config.table))) {
      log(`${config.table}: table not present, skipping receipts`);
      continue;
    }

    const rows = await queryMysql<Record<string, unknown>>(
      `SELECT * FROM ${config.table}`
    );
    log(`Found ${rows.length} rows in ${config.table}`);

    for (const row of rows) {
      const legacyNotificationId = toInt(row.cusntf_notification_id);
      const legacyRecipientId = toInt(row.cusntf_user_id);
      if (!legacyNotificationId || !legacyRecipientId) {
        totalSkipped++;
        continue;
      }

      const { recipientType, recipientId } = await resolveReceiptRecipient(
        prisma,
        config.recipientKind,
        legacyRecipientId
      );

      const existing = await prisma.notificationReceipt.findUnique({
        where: {
          sourceTable_legacyNotificationId_legacyRecipientId_recipientType: {
            sourceTable: config.table,
            legacyNotificationId,
            legacyRecipientId,
            recipientType,
          },
        },
      });
      if (existing) {
        totalSkipped++;
        continue;
      }

      const alarmId = config.alarmTable
        ? getMapping(config.alarmTable, legacyNotificationId)
        : null;
      const targetMappingId = config.targetMappingTable
        ? getMapping(config.targetMappingTable, legacyNotificationId)
        : null;
      const createdAt =
        parseDate(row.submit_time as string) ??
        parseDate(row.datetime as string) ??
        null;
      const metadata = {
        ...row,
        ...(targetMappingId
          ? {
              modernTargetId: targetMappingId,
              modernTargetTable: config.targetMappingTable,
            }
          : {}),
      };

      if (!dryRun) {
        await prisma.notificationReceipt.create({
          data: {
            id: generateUUID(),
            sourceTable: config.table,
            category: config.category,
            legacyNotificationId,
            legacyRecipientId,
            recipientType,
            recipientId,
            alarmId,
            isRead: toBool(row.cusntf_is_viewed),
            metadata: JSON.parse(JSON.stringify(metadata)),
            ...(createdAt ? { createdAt } : {}),
          },
        });
      }
      totalMigrated++;
    }
  }

  log(
    `Notification receipts: ${totalMigrated} migrated, ${totalSkipped} skipped`
  );
}

async function migratePushTokens(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldPushToken>(
    "SELECT * FROM notifications_tokens ORDER BY id"
  );
  log(`Found ${rows.length} push tokens`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const token = cleanString(row.token);
    if (!token) {
      skipped++;
      continue;
    }

    const existing = await prisma.pushToken.findUnique({ where: { token } });
    if (existing) {
      setMapping("notifications_tokens", row.id, existing.id);
      skipped++;
      continue;
    }

    const childId = getMapping("child", row.child_id);
    const parentUser = childId
      ? await prisma.parentUser.findFirst({
          where: { childId },
          select: { id: true },
        })
      : null;

    const id = generateUUID();
    if (!dryRun) {
      await prisma.pushToken.create({
        data: {
          id,
          parentUserId: parentUser?.id ?? null,
          token,
          platform: platformFromLegacy(row.os),
          isActive: toBool(row.active),
          legacyData: JSON.parse(JSON.stringify(row)),
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }

    setMapping("notifications_tokens", row.id, id);
    migrated++;
  }

  log(`Push tokens: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateNotificationLogs(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldNotificationLog>(
    "SELECT * FROM t_notifications_log ORDER BY id"
  );
  log(`Found ${rows.length} legacy notification log rows`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id);
    const existing = await prisma.legacyNotificationLog.findUnique({
      where: { legacyId },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacyNotificationLog.create({
        data: {
          id: generateUUID(),
          legacyId,
          childId: getMapping("child", row.childId),
          legacyChildId: toInt(row.childId, 0) || null,
          name: cleanString(row.name),
          status: toInt(row.status, 0),
          expiryDate: cleanString(row.expiryDate),
          legacyData: JSON.parse(JSON.stringify(row)),
          createdAt: parseDate(row.date) ?? new Date(),
        },
      });
    }
    migrated++;
  }

  log(`Notification logs: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateNotificationNatures(
  prisma: PrismaClient,
  dryRun: boolean
) {
  const rows = await queryMysql<OldNotificationNature>(
    "SELECT * FROM notifications_nature ORDER BY id"
  );
  log(`Found ${rows.length} notification nature rows`);

  const sourceDatabase = getMysqlConfig().database || "unknown";
  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id);
    const name = cleanString(row.n_name);
    if (!legacyId || !name) {
      skipped++;
      continue;
    }

    const legacyKey = `${sourceDatabase}:notifications_nature:${legacyId}`;
    const existing = await prisma.legacyNotificationNature.findUnique({
      where: { legacyKey },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacyNotificationNature.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyKey,
          legacyId,
          name,
          description: cleanString(row.descr),
          contentTable: cleanString(row.table1),
          deliveryTable: cleanString(row.table2),
          parentDeliveryTable: cleanString(row.table3),
          contentIdColumn: cleanString(row.table1_column),
          deliveryIdColumn: cleanString(row.table3_column),
          recipientColumn: cleanString(row.child_column),
          subjectColumn: cleanString(row.subject_col),
          bodyColumn: cleanString(row.body_col),
          displayOrder: toInt(row.n_order, 0) || null,
          isActive: toBool(row.active),
          legacyData: JSON.parse(JSON.stringify(row)),
        },
      });
    }

    migrated++;
    logProgress(migrated, rows.length, "Notification Natures");
  }

  log(`Notification natures: ${migrated} migrated, ${skipped} skipped`);
}

export async function migrateAlarms(prisma: PrismaClient) {
  log("=== Migrating Alarms & Notifications ===");
  const dryRun = isDryRun();

  await migrateNotificationNatures(prisma, dryRun);

  for (const config of ALARM_CONFIGS) {
    await migrateAlarmTable(prisma, config, dryRun);
  }

  await migrateNotificationReceipts(prisma, dryRun);
  await migratePushTokens(prisma, dryRun);
  await migrateNotificationLogs(prisma, dryRun);

  log(`=== Alarm/notification migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateAlarms(prisma);
    } catch (err) {
      logError("Alarm/notification migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
