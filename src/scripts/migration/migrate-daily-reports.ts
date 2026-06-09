/**
 * Migration: t_daily_report → DailyReport
 *            t_daily_fever  → DailyReportFever
 *            t_daily_milk   → DailyReportMilk
 *            t_daily_attachments → DailyReportAttachment
 *
 * Field mapping (t_daily_report → DailyReport):
 *   report_id     → (old ID, mapped to UUID)
 *   child_id      → childId (FK via child mapping)
 *   reportdate    → reportDate (varchar → Date)
 *   status        → status (present → SUBMITTED, absent creates AbsenceReport)
 *   breakfast_id  → breakfastFoodId (FK via food mapping, may be null if foods not migrated)
 *   bftime        → breakfastTime
 *   breakf        → breakfastPortion (portion string → PortionSize enum)
 *   lunch_id      → lunchFoodId
 *   lntime        → lunchTime
 *   lunchf        → lunchPortion
 *   dessert       → dessert
 *   dess_portion  → dessertPortion
 *   desstime      → dessertTime
 *   is_sleep      → isSleep
 *   sleep_from    → sleepFrom
 *   sleep_to      → sleepTo
 *   diahria       → diarrhea
 *   ur_pot        → urinePotty
 *   stool_pot     → stoolPotty
 *   ur_di         → urineDiaper
 *   stool_di      → stoolDiaper
 *   remarks       → remarks
 *   is_rep_draft  → status (1 → DRAFT, 0 → SUBMITTED)
 *   datetime      → createdAt
 *
 * t_daily_fever → DailyReportFever:
 *   report_id → dailyReportId
 *   fvalue    → temperature
 *   ftime     → time
 *
 * t_daily_milk → DailyReportMilk:
 *   report_id → dailyReportId
 *   mcc       → amountCc
 *   mtime     → time
 *
 * t_daily_attachments → DailyReportAttachment:
 *   formid    → dailyReportId
 *   att_title → filename
 *   url       → fileUrl
 *
 * Prerequisites: Children must be migrated first.
 */

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  getMapping,
  isDryRun,
  parseDate,
  parseTime,
  mapPortionSize,
  toBool,
  toInt,
  toFloat,
  cleanLegacyFileName,
  cleanString,
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldDailyReport {
  report_id: number;
  reportdate: string;
  status: string;
  child_id: string;
  breakfast_id: string;
  bftime: string;
  breakf: string;
  lunch_id: string;
  lntime: string;
  lunchf: string;
  dessert: string;
  has_dess: number;
  dess_portion: string;
  desstime: string;
  is_sleep: number;
  sleep_from: string;
  sleep_to: string;
  diahria: number;
  ur_pot: number;
  stool_pot: number;
  ur_di: number;
  stool_di: number;
  remarks: string;
  class_id: string;
  teacher_id: string;
  is_rep_draft: number;
  datetime: string;
  active: number;
  uby: number;
  taken_meds?: string;
  mood?: string;
  mood2?: string;
  constipation?: string | number;
  sleep_from1?: string;
  sleep_to1?: string;
  sleep_from2?: string;
  sleep_to2?: string;
  cough?: string | number;
  rnose?: string | number;
  vomit?: string | number;
  pantchecked?: string | number;
  shirtchecked?: string | number;
  tshirthecked?: string | number;
  boxerchecked?: string | number;
  sockschecked?: string | number;
  brushchecked?: string | number;
  towelchecked?: string | number;
  diaperschecked?: string | number;
  babybottlechecked?: string | number;
  milkchecked?: string | number;
  wipeschecked?: string | number;
}

interface OldFever {
  dfid: number;
  fvalue: number;
  ftime: string;
  report_id: number;
  active: number;
}

interface OldMilk {
  dmid: number;
  mtype: string;
  mcc: string;
  mtime: string;
  report_id: number;
  active: number;
}

interface OldDailyAttachment {
  rattid: number;
  att_title: string;
  url: string;
  formid: string;
  active: number;
}

function legacyKey(sourceDatabase: string, table: string, legacyId: number) {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

function legacyRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function dailyReportLegacyData(
  row: OldDailyReport,
  sourceDatabase: string,
  current?: unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      ...legacyRecord(current),
      ...row,
      sourceDatabase,
      sourceTable: "t_daily_report",
    })
  ) as Prisma.InputJsonValue;
}

function shouldBackfillDailyReportLegacyData(
  current: unknown,
  sourceDatabase: string
) {
  const legacyData = legacyRecord(current);
  return (
    legacyData.sourceDatabase !== sourceDatabase ||
    legacyData.sourceTable !== "t_daily_report"
  );
}

export async function migrateDailyReports(prisma: PrismaClient) {
  log("=== Migrating Daily Reports ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  const oldRows = await queryMysql<OldDailyReport>(
    "SELECT * FROM t_daily_report WHERE active = 1 ORDER BY report_id"
  );
  log(`Found ${oldRows.length} daily reports in old DB`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of oldRows) {
    const childId = getMapping("child", row.child_id);
    if (!childId) {
      errors++;
      continue;
    }

    const reportDate = parseDate(row.reportdate);
    if (!reportDate) {
      logError(`DailyReport ${row.report_id} — invalid date "${row.reportdate}"`);
      errors++;
      continue;
    }

    // Idempotency: unique on [childId, reportDate]
    const existing = await prisma.dailyReport.findFirst({
      where: { childId, reportDate },
    });
    if (existing) {
      if (
        !dryRun &&
        shouldBackfillDailyReportLegacyData(existing.legacyData, sourceDatabase)
      ) {
        await prisma.dailyReport.update({
          where: { id: existing.id },
          data: {
            legacyData: dailyReportLegacyData(
              row,
              sourceDatabase,
              existing.legacyData
            ),
          },
        });
      }
      setMapping("daily_report", row.report_id, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();
    const reportStatus = toBool(row.is_rep_draft) ? "DRAFT" : "SUBMITTED";

    if (!dryRun) {
      await prisma.dailyReport.create({
        data: {
          id: newId,
          childId,
          reportDate,
          status: reportStatus as "DRAFT" | "SUBMITTED",
          breakfastTime: parseTime(row.bftime),
          breakfastPortion: mapPortionSize(row.breakf),
          lunchTime: parseTime(row.lntime),
          lunchPortion: mapPortionSize(row.lunchf),
          dessert: cleanString(row.dessert),
          dessertPortion: mapPortionSize(row.dess_portion),
          dessertTime: parseTime(row.desstime),
          isSleep: toBool(row.is_sleep),
          sleepFrom: parseTime(row.sleep_from),
          sleepTo: parseTime(row.sleep_to),
          diarrhea: toBool(row.diahria),
          urinePotty: toInt(row.ur_pot),
          stoolPotty: toInt(row.stool_pot),
          urineDiaper: toInt(row.ur_di),
          stoolDiaper: toInt(row.stool_di),
          mood: cleanString(row.mood),
          cough: toBool(row.cough ?? 0),
          runnyNose: toBool(row.rnose ?? 0),
          vomit: toBool(row.vomit ?? 0),
          remarks: cleanString(row.remarks),
          legacyData: dailyReportLegacyData(row, sourceDatabase),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }

    setMapping("daily_report", row.report_id, newId);
    migrated++;
    logProgress(migrated, oldRows.length, "Daily Reports");
  }

  log(
    `Daily Reports: ${migrated} migrated, ${skipped} skipped, ${errors} errors`
  );

  // --- Fever sub-records ---
  const fevers = await queryMysql<OldFever>(
    "SELECT * FROM t_daily_fever WHERE active = 1"
  );
  let feverCount = 0;
  for (const f of fevers) {
    const dailyReportId = getMapping("daily_report", f.report_id);
    if (!dailyReportId) continue;

    const time = parseTime(f.ftime);
    if (!time) continue;

    if (!dryRun) {
      await prisma.dailyReportFever.create({
        data: {
          id: generateUUID(),
          dailyReportId,
          temperature: toFloat(f.fvalue),
          time,
        },
      });
    }
    feverCount++;
  }
  log(`Daily Report Fevers: ${feverCount} migrated`);

  // --- Milk sub-records ---
  const milks = await queryMysql<OldMilk>(
    "SELECT * FROM t_daily_milk WHERE active = 1"
  );
  let milkCount = 0;
  for (const m of milks) {
    const dailyReportId = getMapping("daily_report", m.report_id);
    if (!dailyReportId) continue;

    const time = parseTime(m.mtime);
    if (!time) continue;

    if (!dryRun) {
      await prisma.dailyReportMilk.create({
        data: {
          id: generateUUID(),
          dailyReportId,
          amountCc: toInt(m.mcc),
          time,
        },
      });
    }
    milkCount++;
  }
  log(`Daily Report Milks: ${milkCount} migrated`);

  // --- Attachments ---
  const attachments = await queryMysql<OldDailyAttachment>(
    "SELECT * FROM t_daily_attachments WHERE active = 1"
  );
  let attCount = 0;
  let attSkipped = 0;
  for (const a of attachments) {
    const legacyId = toInt(a.rattid);
    const legacyDailyReportId = toInt(a.formid);
    const dailyReportId = getMapping("daily_report", legacyDailyReportId);
    if (!dailyReportId || !legacyId) continue;
    const fileUrl = cleanLegacyFileName(a.url);
    if (!fileUrl) {
      attSkipped++;
      continue;
    }
    const filename = cleanString(a.att_title) ?? fileUrl;

    const key = legacyKey(sourceDatabase, "t_daily_attachments", legacyId);
    const existing = await prisma.dailyReportAttachment.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      if (!dryRun) {
        await prisma.dailyReportAttachment.update({
          where: { id: existing.id },
          data: {
            sourceDatabase,
            legacyKey: key,
            legacyId,
            legacyTable: "t_daily_attachments",
            legacyDailyReportId,
            filename,
            fileUrl,
          },
        });
      }
      attSkipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.dailyReportAttachment.create({
        data: {
          id: generateUUID(),
          dailyReportId,
          sourceDatabase,
          legacyKey: key,
          legacyId,
          legacyTable: "t_daily_attachments",
          legacyDailyReportId,
          filename,
          fileUrl,
        },
      });
    }
    attCount++;
  }
  log(`Daily Report Attachments: ${attCount} migrated, ${attSkipped} skipped`);

  log(
    `=== Daily Reports migration complete ===${dryRun ? " [DRY RUN]" : ""}`
  );
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateDailyReports(prisma);
    } catch (err) {
      logError("Daily Reports migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
