/**
 * Migration: t_absent_report       → AbsenceReport
 *            t_absent_attachments  → AbsenceAttachment
 *
 * Field mapping:
 *   report_id     → (old ID, mapped to UUID)
 *   child_id      → childId (FK via child mapping)
 *   reportdate    → date
 *   ab_reason     → reason
 *   ab_from       → absentFrom
 *   ab_to         → absentTo
 *   attend_hos    → hospitalized
 *   hos_name      → hospitalName
 *   dr_name       → doctorName
 *   is_rep_draft  → status (1 → PENDING, 0 → APPROVED)
 *   uby           → createdById (if user mapping exists)
 *   datetime      → createdAt
 *
 * t_absent_attachments:
 *   formid    → absenceReportId
 *   att_title → filename
 *   url       → fileUrl
 *
 * Prerequisites: Children and Users must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  cleanString,
  cleanLegacyFileName,
  generateUUID,
  getMapping,
  isDryRun,
  log,
  logError,
  logProgress,
  parseDate,
  setMapping,
  toBool,
} from "./lib/utils";

interface OldAbsenceReport {
  report_id: number;
  reportdate: string;
  child_id: string;
  ab_reason: string;
  ab_from: string;
  ab_to: string;
  attend_hos: string;
  hos_name: string;
  dr_name: string;
  is_rep_draft: number;
  datetime: string;
  active: number;
  uby: number;
}

interface OldAbsenceAttachment {
  rattid: number;
  att_title: string;
  url: string;
  formid: string;
  datetime: string;
  active: number;
}

function legacyKey(sourceDatabase: string, table: string, legacyId: number) {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

export async function migrateAbsences(prisma: PrismaClient) {
  log("=== Migrating Absence Reports ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  const oldRows = await queryMysql<OldAbsenceReport>(
    "SELECT * FROM t_absent_report WHERE active = 1 ORDER BY report_id"
  );
  log(`Found ${oldRows.length} absence reports in old DB`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of oldRows) {
    const childId = getMapping("child", row.child_id);
    if (!childId) {
      errors++;
      continue;
    }

    const date = parseDate(row.reportdate) ?? parseDate(row.ab_from);
    if (!date) {
      logError(`AbsenceReport ${row.report_id} — invalid date "${row.reportdate}"`);
      errors++;
      continue;
    }

    const existing = await prisma.absenceReport.findFirst({
      where: {
        childId,
        date,
        reason: cleanString(row.ab_reason),
      },
    });
    if (existing) {
      if (!dryRun && !existing.legacyData) {
        await prisma.absenceReport.update({
          where: { id: existing.id },
          data: {
            sourceDatabase,
            legacyKey: legacyKey(sourceDatabase, "t_absent_report", row.report_id),
            legacyId: row.report_id,
            legacyChildId: Number.parseInt(String(row.child_id), 10) || null,
            legacyData: {
              sourceDatabase,
              sourceTable: "t_absent_report",
              ...row,
            },
          },
        });
      }
      setMapping("absence_report", row.report_id, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();
    const createdById = getMapping("user", row.uby);

    if (!dryRun) {
      await prisma.absenceReport.create({
        data: {
          id: newId,
          childId,
          sourceDatabase,
          legacyKey: legacyKey(sourceDatabase, "t_absent_report", row.report_id),
          legacyId: row.report_id,
          legacyChildId: Number.parseInt(String(row.child_id), 10) || null,
          date,
          reason: cleanString(row.ab_reason),
          absentFrom: parseDate(row.ab_from),
          absentTo: parseDate(row.ab_to),
          hospitalized: toBool(row.attend_hos),
          hospitalName: cleanString(row.hos_name),
          doctorName: cleanString(row.dr_name),
          status: toBool(row.is_rep_draft) ? "PENDING" : "APPROVED",
          legacyData: {
            sourceDatabase,
            sourceTable: "t_absent_report",
            ...row,
          },
          createdById,
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }

    setMapping("absence_report", row.report_id, newId);
    migrated++;
    logProgress(migrated, oldRows.length, "Absence Reports");
  }

  log(`Absence Reports: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);

  const attachments = await queryMysql<OldAbsenceAttachment>(
    "SELECT * FROM t_absent_attachments WHERE active = 1 ORDER BY rattid"
  );
  let attCount = 0;
  let attSkipped = 0;

  for (const a of attachments) {
    const legacyId = Number.parseInt(String(a.rattid), 10);
    const legacyAbsenceReportId = Number.parseInt(String(a.formid), 10);
    const absenceReportId = getMapping("absence_report", legacyAbsenceReportId);
    if (!absenceReportId || !Number.isFinite(legacyId)) {
      attSkipped++;
      continue;
    }
    const fileUrl = cleanLegacyFileName(a.url);
    if (!fileUrl) {
      attSkipped++;
      continue;
    }
    const filename = cleanString(a.att_title) ?? fileUrl;

    const key = legacyKey(sourceDatabase, "t_absent_attachments", legacyId);
    const existing = await prisma.absenceAttachment.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      if (!dryRun) {
        await prisma.absenceAttachment.update({
          where: { id: existing.id },
          data: {
            sourceDatabase,
            legacyKey: key,
            legacyId,
            legacyTable: "t_absent_attachments",
            legacyAbsenceReportId,
            filename,
            fileUrl,
            createdAt: parseDate(a.datetime) ?? new Date(),
          },
        });
      }
      attSkipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.absenceAttachment.create({
        data: {
          id: generateUUID(),
          absenceReportId,
          sourceDatabase,
          legacyKey: key,
          legacyId,
          legacyTable: "t_absent_attachments",
          legacyAbsenceReportId,
          filename,
          fileUrl,
          createdAt: parseDate(a.datetime) ?? new Date(),
        },
      });
    }
    attCount++;
  }

  log(`Absence Attachments: ${attCount} migrated, ${attSkipped} skipped`);
  log(`=== Absence migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateAbsences(prisma);
    } catch (err) {
      logError("Absence migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
