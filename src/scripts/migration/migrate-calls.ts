/**
 * Migration: callcauses -> CallCause
 *            t_form_6    -> CallLog
 *
 * Legacy calls are stored as "medical form 6" records. The old call pages read
 * `t_form_6` directly for child calls, branch calls, and global calls.
 * `callcauses` provides the parent/child call reason lookup used by the call
 * form dropdown before the chosen child label is stored on `t_form_6`.
 *
 * Field mapping (callcauses -> CallCause):
 *   id     -> legacyId
 *   parent -> parentLabel
 *   child  -> childLabel
 *
 * Field mapping:
 *   form_id       → (old ID, mapped to UUID as call_log)
 *   child_id      → childId
 *   calltype      → direction (Incoming/Outgoing)
 *   accident_date → date
 *   accident_time → time
 *   causeofcall   → reason
 *   subject       → subject
 *   remarks       → remarks
 *   teacher_id    → staffId when teacher mapping exists
 *   uby           → createdById when user mapping exists
 *   datetime      → createdAt
 */

import type { CallDirection, PrismaClient } from "@/generated/prisma/client";
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
  parseTime,
  setMapping,
  toInt,
} from "./lib/utils";

interface OldCallCause {
  id: number;
  parent: string;
  child: string;
}

interface OldCall {
  form_id: number;
  child_id: string;
  calltype: string;
  accident_date: string;
  accident_time: string;
  causeofcall: string;
  subject: string;
  remarks: string;
  teacher_id: number;
  datetime: string;
  active: number;
  is_rep_draft: number;
  uby: number;
}

function mapDirection(value: string): CallDirection {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("out")) return "OUTGOING";
  if (normalized.includes("miss")) return "MISSED";
  return "INCOMING";
}

async function migrateCallCauses(prisma: PrismaClient, dryRun: boolean) {
  const oldRows = await queryMysql<OldCallCause>(
    "SELECT * FROM callcauses ORDER BY id"
  );
  log(`Found ${oldRows.length} call cause rows in callcauses`);

  const sourceDatabase = getMysqlConfig().database || "unknown";
  let migrated = 0;
  let skipped = 0;

  for (const row of oldRows) {
    const legacyId = toInt(row.id);
    const legacyKey = `${sourceDatabase}:callcauses:${legacyId}`;
    const existing = await prisma.callCause.findUnique({
      where: { legacyKey },
    });
    if (existing) {
      setMapping("callcause", legacyId, existing.id);
      skipped++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.callCause.create({
        data: {
          id,
          sourceDatabase,
          legacyKey,
          legacyId,
          parentLabel: cleanString(row.parent),
          childLabel: cleanString(row.child),
          legacyData: JSON.parse(JSON.stringify(row)),
        },
      });
    }

    setMapping("callcause", legacyId, id);
    migrated++;
    logProgress(migrated, oldRows.length, "Call Causes");
  }

  log(`Call Causes: ${migrated} migrated, ${skipped} skipped`);
}

export async function migrateCalls(prisma: PrismaClient) {
  log("=== Migrating Call Logs ===");
  const dryRun = isDryRun();

  await migrateCallCauses(prisma, dryRun);

  const oldRows = await queryMysql<OldCall>(
    "SELECT * FROM t_form_6 WHERE active = 1 AND is_rep_draft = 0 ORDER BY form_id"
  );
  log(`Found ${oldRows.length} call logs in old DB`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of oldRows) {
    const childId = getMapping("child", row.child_id);
    const date = parseDate(row.accident_date);

    if (!childId || !date) {
      errors++;
      continue;
    }

    const direction = mapDirection(row.calltype);
    const existing = await prisma.callLog.findFirst({
      where: {
        childId,
        date,
        direction,
        subject: cleanString(row.subject),
      },
    });
    if (existing) {
      setMapping("call_log", row.form_id, existing.id);
      skipped++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.callLog.create({
        data: {
          id,
          childId,
          direction,
          date,
          time: parseTime(row.accident_time),
          subject: cleanString(row.subject),
          reason: cleanString(row.causeofcall),
          remarks: cleanString(row.remarks),
          staffId: getMapping("teacher", row.teacher_id),
          createdById: getMapping("user", row.uby),
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }

    setMapping("call_log", row.form_id, id);
    migrated++;
    logProgress(migrated, oldRows.length, "Call Logs");
  }

  log(`Call Logs: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
  log(`=== Call Log migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateCalls(prisma);
    } catch (err) {
      logError("Call migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
