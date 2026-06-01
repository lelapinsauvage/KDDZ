/**
 * Migration: legacy settings tables -> LegacySetting
 *
 * These tables contain old PHP login library options, nursery toggles, message
 * templates, provider credentials, and notification switches. They are
 * preserved as legacy data instead of being written into active branch settings.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import {
  queryMysql,
  closeMysqlPool,
  getMysqlConfig,
} from "./lib/mysql-client";
import {
  generateUUID,
  isDryRun,
  log,
  logError,
  logProgress,
  toInt,
} from "./lib/utils";

interface LegacySettingsTableConfig {
  table: string;
  scope: string;
  keyColumns: string[];
  valueColumns: string[];
  descriptionColumn?: string;
}

const LEGACY_SETTINGS_TABLES: LegacySettingsTableConfig[] = [
  {
    table: "login_settings",
    scope: "login",
    keyColumns: ["option_name"],
    valueColumns: ["option_value"],
  },
  {
    table: "parent_login_settings",
    scope: "parent_login",
    keyColumns: ["option_name"],
    valueColumns: ["option_value"],
  },
  {
    table: "login_settings_man",
    scope: "manager_login",
    keyColumns: ["option_name"],
    valueColumns: ["option_value"],
  },
  {
    table: "t_settings",
    scope: "nursery",
    keyColumns: ["type"],
    valueColumns: ["value"],
    descriptionColumn: "descr",
  },
  {
    table: "t_notification_setting",
    scope: "notification",
    keyColumns: ["name", "mtype", "id"],
    valueColumns: ["status"],
  },
];

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe MySQL identifier: ${identifier}`);
  }
  return `\`${identifier}\``;
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

function textValue(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function firstColumnValue(
  row: Record<string, unknown>,
  columns: string[]
): string | null {
  for (const column of columns) {
    if (Object.prototype.hasOwnProperty.call(row, column)) {
      return textValue(row[column]);
    }
  }
  return null;
}

function legacyData(row: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(row));
}

function fallbackValue(row: Record<string, unknown>): string {
  return JSON.stringify(legacyData(row));
}

async function migrateSettingsTable(
  prisma: PrismaClient,
  sourceDatabase: string,
  config: LegacySettingsTableConfig,
  dryRun: boolean
) {
  if (!(await tableExists(config.table))) {
    log(`${config.table}: table not present in ${sourceDatabase}, skipping`);
    return;
  }

  const rows = await queryMysql<Record<string, unknown>>(
    `SELECT * FROM ${quoteIdentifier(config.table)} ORDER BY id`
  );
  log(`Found ${rows.length} rows in ${config.table}`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id);
    const rawKey = firstColumnValue(row, config.keyColumns);
    const settingKey = rawKey?.trim() || `id:${legacyId}`;
    const settingValue =
      firstColumnValue(row, config.valueColumns) ?? fallbackValue(row);
    const description = config.descriptionColumn
      ? textValue(row[config.descriptionColumn])
      : null;

    if (!legacyId || !settingKey) {
      skipped++;
      continue;
    }

    const existing = await prisma.legacySetting.findUnique({
      where: {
        sourceDatabase_legacyTable_legacyId: {
          sourceDatabase,
          legacyTable: config.table,
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
          legacyTable: config.table,
          legacyId,
          scope: config.scope,
          settingKey,
          settingValue,
          description,
          legacyData: legacyData(row),
        },
      });
    }

    migrated++;
    logProgress(migrated, rows.length, config.table);
  }

  log(`${config.table}: ${migrated} migrated, ${skipped} skipped`);
}

export async function migrateLegacySettings(prisma: PrismaClient) {
  log("=== Migrating Legacy Settings ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  for (const config of LEGACY_SETTINGS_TABLES) {
    await migrateSettingsTable(prisma, sourceDatabase, config, dryRun);
  }

  log(`=== Legacy settings migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateLegacySettings(prisma);
    } catch (err) {
      logError("Legacy settings migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
