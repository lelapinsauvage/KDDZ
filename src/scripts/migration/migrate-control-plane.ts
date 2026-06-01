/**
 * Migration: legacy master/users control-plane metadata.
 *
 * These rows define the old PHP permission catalogue, level grants, per-user
 * grants, nursery registry, selected school-year databases, and master
 * notification-channel switches. They are preserved for audit and parity work;
 * they are not enforced as active modern RBAC yet.
 */

import type { PrismaClient } from "@/generated/prisma/client";
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
  toBool,
  toInt,
} from "./lib/utils";

interface OldSystemAction {
  sysaction_id: number;
  sysaction_group_id: number;
  sysaction_name: string;
  sysaction_type: string;
  sysaction_descr: string;
  sysaction_is_active: number;
}

interface OldActionGrant {
  actioncon_level_id: number;
  actioncon_sysact_id: number;
}

interface OldUserGrant {
  usercon_user_id: number;
  usercon_sysact_id: number;
}

interface OldGarderieRegistry {
  gid: number;
  garderie_name: string;
  garderie_alias: string;
  user_manage_db: string;
  current_db: string;
  path: string;
  active: number;
}

interface OldMasterNotification {
  id: number;
  email: number;
  whatsapp: number;
  sms: number;
  gid: number;
}

interface OldYearSelect {
  yid: number;
  sel_year: string;
}

interface OldYearDatabase {
  dbid: number;
  db_yid: number;
  dbname: string;
  selected: number;
  datetime: string | Date;
}

function legacyData(row: object) {
  return JSON.parse(JSON.stringify(row));
}

function legacyKey(
  sourceDatabase: string,
  table: string,
  discriminator: string | number
): string {
  return `${sourceDatabase}:${table}:${discriminator}`;
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  return parseDate(cleanString(value));
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

async function migrateSystemActions(
  prisma: PrismaClient,
  sourceDatabase: string,
  table: "system_actions" | "system_actions_man",
  dryRun: boolean
) {
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldSystemAction>(
    `SELECT * FROM ${table} ORDER BY sysaction_id`
  );
  log(`Found ${rows.length} rows in ${table}`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.sysaction_id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const key = legacyKey(sourceDatabase, table, legacyId);
    const existing = await prisma.legacyAccessControlRecord.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacyAccessControlRecord.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyTable: table,
          legacyKey: key,
          legacyId,
          recordType:
            table === "system_actions_man"
              ? "manager_system_action"
              : "system_action",
          legacyActionId: legacyId,
          actionGroupId: toInt(row.sysaction_group_id, 0) || null,
          actionName: cleanString(row.sysaction_name),
          actionType: cleanString(row.sysaction_type),
          description: cleanString(row.sysaction_descr),
          isActive: toBool(row.sysaction_is_active),
          legacyData: legacyData(row),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateActionGrants(
  prisma: PrismaClient,
  sourceDatabase: string,
  table: "actions_control" | "actions_control_man",
  dryRun: boolean
) {
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldActionGrant>(
    `SELECT * FROM ${table} ORDER BY actioncon_level_id, actioncon_sysact_id`
  );
  log(`Found ${rows.length} rows in ${table}`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyLevelId = toInt(row.actioncon_level_id, 0);
    const legacyActionId = toInt(row.actioncon_sysact_id, 0);
    if (!legacyLevelId || !legacyActionId) {
      skipped++;
      continue;
    }

    const key = legacyKey(
      sourceDatabase,
      table,
      `${legacyLevelId}:${legacyActionId}`
    );
    const existing = await prisma.legacyAccessControlRecord.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacyAccessControlRecord.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyTable: table,
          legacyKey: key,
          recordType:
            table === "actions_control_man"
              ? "manager_level_action_grant"
              : "level_action_grant",
          legacyLevelId,
          legacyActionId,
          isActive: true,
          legacyData: legacyData(row),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateUserGrants(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  const table = "users_control";
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldUserGrant>(
    "SELECT * FROM users_control ORDER BY usercon_user_id, usercon_sysact_id"
  );
  log(`Found ${rows.length} rows in users_control`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyUserId = toInt(row.usercon_user_id, 0);
    const legacyActionId = toInt(row.usercon_sysact_id, 0);
    if (!legacyUserId || !legacyActionId) {
      skipped++;
      continue;
    }

    const key = legacyKey(
      sourceDatabase,
      table,
      `${legacyUserId}:${legacyActionId}`
    );
    const existing = await prisma.legacyAccessControlRecord.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacyAccessControlRecord.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyTable: table,
          legacyKey: key,
          recordType: "user_action_grant",
          legacyUserId,
          userId: getMapping("user", legacyUserId),
          legacyActionId,
          isActive: true,
          legacyData: legacyData(row),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateGarderieRegistry(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  const table = "t_garderies";
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldGarderieRegistry>(
    "SELECT * FROM t_garderies ORDER BY gid"
  );
  log(`Found ${rows.length} rows in t_garderies`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.gid, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const key = legacyKey(sourceDatabase, table, legacyId);
    const existing = await prisma.legacyGarderieRegistry.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacyGarderieRegistry.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyKey: key,
          legacyId,
          name: cleanString(row.garderie_name),
          alias: cleanString(row.garderie_alias),
          userManageDatabase: cleanString(row.user_manage_db),
          currentDatabase: cleanString(row.current_db),
          path: cleanString(row.path),
          isActive: toBool(row.active),
          legacyData: legacyData(row),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateMasterNotifications(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  const table = "notifications";
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldMasterNotification>(
    "SELECT * FROM notifications ORDER BY id"
  );
  log(`Found ${rows.length} rows in notifications`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const existing = await prisma.legacySetting.findUnique({
      where: {
        sourceDatabase_legacyTable_legacyId: {
          sourceDatabase,
          legacyTable: table,
          legacyId,
        },
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacySetting.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyTable: table,
          legacyId,
          scope: "master_notification_channels",
          settingKey: `garderie:${toInt(row.gid, 0) || "unknown"}`,
          settingValue: JSON.stringify({
            email: toBool(row.email),
            whatsapp: toBool(row.whatsapp),
            sms: toBool(row.sms),
          }),
          legacyData: legacyData(row),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateYearSelect(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  const table = "year_select";
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldYearSelect>(
    "SELECT * FROM year_select ORDER BY yid"
  );
  log(`Found ${rows.length} rows in year_select`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.yid, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const key = legacyKey(sourceDatabase, table, legacyId);
    const existing = await prisma.legacyYearDatabase.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacyYearDatabase.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyTable: table,
          legacyKey: key,
          legacyId,
          legacyYearId: legacyId,
          selectedYear: cleanString(row.sel_year),
          legacyData: legacyData(row),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateYearDatabases(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  const table = "year_db";
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldYearDatabase>(
    "SELECT * FROM year_db ORDER BY dbid"
  );
  log(`Found ${rows.length} rows in year_db`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.dbid, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const key = legacyKey(sourceDatabase, table, legacyId);
    const existing = await prisma.legacyYearDatabase.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.legacyYearDatabase.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyTable: table,
          legacyKey: key,
          legacyId,
          legacyYearId: toInt(row.db_yid, 0) || null,
          databaseName: cleanString(row.dbname),
          isSelected: toBool(row.selected),
          sourceCreatedAt: asDate(row.datetime),
          legacyData: legacyData(row),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

export async function migrateControlPlane(prisma: PrismaClient) {
  log("=== Migrating Legacy Control Plane Metadata ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  await migrateSystemActions(prisma, sourceDatabase, "system_actions", dryRun);
  await migrateActionGrants(prisma, sourceDatabase, "actions_control", dryRun);
  await migrateSystemActions(
    prisma,
    sourceDatabase,
    "system_actions_man",
    dryRun
  );
  await migrateActionGrants(
    prisma,
    sourceDatabase,
    "actions_control_man",
    dryRun
  );
  await migrateUserGrants(prisma, sourceDatabase, dryRun);
  await migrateGarderieRegistry(prisma, sourceDatabase, dryRun);
  await migrateMasterNotifications(prisma, sourceDatabase, dryRun);
  await migrateYearSelect(prisma, sourceDatabase, dryRun);
  await migrateYearDatabases(prisma, sourceDatabase, dryRun);

  log(
    `=== Legacy control-plane migration complete ===${dryRun ? " [DRY RUN]" : ""}`
  );
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateControlPlane(prisma);
    } catch (err) {
      logError("Legacy control-plane migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
