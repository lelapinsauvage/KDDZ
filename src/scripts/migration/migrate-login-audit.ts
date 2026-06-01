/**
 * Migration: login_timestamps        -> LegacyLoginTimestamp
 *            login_timestamps_man    -> LegacyLoginTimestamp
 *            parent_login_timestamps -> LegacyLoginTimestamp
 *
 * These legacy tables are audit trails, not active sessions. The modern app
 * keeps them in a dedicated preservation table so historical login IP/time
 * evidence is not lost.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import {
  queryMysql,
  closeMysqlPool,
  getMysqlConfig,
} from "./lib/mysql-client";
import {
  cleanString,
  generateUUID,
  getMapping,
  isDryRun,
  log,
  logError,
  logProgress,
  parseDate,
  toInt,
} from "./lib/utils";

interface OldLoginTimestamp {
  id: number | string;
  user_id: number | string;
  ip: string;
  timestamp: string | Date;
}

interface LoginAuditTableConfig {
  table: string;
  mappingTable: "user" | "parent_user";
  principalType: "USER" | "MANAGER_USER" | "PARENT_USER";
}

const LOGIN_AUDIT_TABLES: LoginAuditTableConfig[] = [
  {
    table: "login_timestamps",
    mappingTable: "user",
    principalType: "USER",
  },
  {
    table: "login_timestamps_man",
    mappingTable: "user",
    principalType: "MANAGER_USER",
  },
  {
    table: "parent_login_timestamps",
    mappingTable: "parent_user",
    principalType: "PARENT_USER",
  },
];

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe MySQL identifier: ${identifier}`);
  }
  return `\`${identifier}\``;
}

function legacyTimestamp(value: string | Date | null | undefined): Date | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "string") return parseDate(value);
  return null;
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

async function migrateLoginAuditTable(
  prisma: PrismaClient,
  sourceDatabase: string,
  config: LoginAuditTableConfig,
  dryRun: boolean
) {
  if (!(await tableExists(config.table))) {
    log(`${config.table}: table not present in ${sourceDatabase}, skipping`);
    return;
  }

  const rows = await queryMysql<OldLoginTimestamp>(
    `SELECT * FROM ${quoteIdentifier(config.table)} ORDER BY id`
  );
  log(`Found ${rows.length} rows in ${config.table}`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id);
    const legacyUserId = toInt(row.user_id);
    if (!legacyId || !legacyUserId) {
      skipped++;
      continue;
    }

    const existing = await prisma.legacyLoginTimestamp.findUnique({
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

    const mappedUserId = getMapping(config.mappingTable, legacyUserId);
    if (!dryRun) {
      await prisma.legacyLoginTimestamp.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyTable: config.table,
          legacyId,
          legacyUserId,
          userId: config.mappingTable === "user" ? mappedUserId : null,
          parentUserId:
            config.mappingTable === "parent_user" ? mappedUserId : null,
          principalType: config.principalType,
          ipAddress: cleanString(row.ip),
          occurredAt: legacyTimestamp(row.timestamp),
          legacyData: JSON.parse(JSON.stringify(row)),
        },
      });
    }

    migrated++;
    logProgress(migrated, rows.length, config.table);
  }

  log(`${config.table}: ${migrated} migrated, ${skipped} skipped`);
}

export async function migrateLoginAudit(prisma: PrismaClient) {
  log("=== Migrating Login Audit Timestamps ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  for (const config of LOGIN_AUDIT_TABLES) {
    await migrateLoginAuditTable(prisma, sourceDatabase, config, dryRun);
  }

  log(`Login audit migration complete${dryRun ? " [DRY RUN]" : ""}`);
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateLoginAudit(prisma);
    } catch (err) {
      logError("Login audit migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
