/**
 * Migration: t_form_6 → CallLog
 *
 * Legacy calls are stored as "medical form 6" records. The old call pages read
 * `t_form_6` directly for child calls, branch calls, and global calls.
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
 *
 * Attachments in `t_forms_attachments` with `formtype = 'form6'` do not yet
 * have a modern CallLog attachment model. They remain tracked in
 * `docs/source-data-report.md` and `docs/file-attachment-matrix.md`.
 */

import type { CallDirection, PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool } from "./lib/mysql-client";
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
} from "./lib/utils";

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

export async function migrateCalls(prisma: PrismaClient) {
  log("=== Migrating Call Logs ===");
  const dryRun = isDryRun();

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
