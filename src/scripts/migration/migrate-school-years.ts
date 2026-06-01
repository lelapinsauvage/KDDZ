/**
 * Migration: t_school_year -> SchoolYear
 *
 * Legacy children reference school years through t_child.sel_year (for example
 * 2019), while t_school_year stores the source date for each school year.
 *
 * Prerequisites: Organization must exist in the new DB.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  cleanString,
  generateUUID,
  isDryRun,
  log,
  logError,
  logProgress,
  parseDate,
  setMapping,
  toInt,
} from "./lib/utils";

interface OldSchoolYear {
  id: number;
  sid: number;
  sdate: string;
}

function legacyData(row: object) {
  return JSON.parse(JSON.stringify(row));
}

function legacyKey(sourceDatabase: string, legacyId: number): string {
  return `${sourceDatabase}:t_school_year:${legacyId}`;
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

function yearFromDate(value: string): number | null {
  const parsed = parseDate(value);
  if (!parsed) return null;
  return parsed.getFullYear();
}

function schoolYearDates(startYear: number, legacyDate: Date | null) {
  return {
    startDate: legacyDate ?? new Date(`${startYear}-09-01T00:00:00.000Z`),
    endDate: new Date(`${startYear + 1}-06-30T00:00:00.000Z`),
  };
}

export async function migrateSchoolYears(
  prisma: PrismaClient,
  organizationId: string
) {
  log("=== Migrating School Years ===");
  const dryRun = isDryRun();

  if (!(await tableExists("t_school_year"))) {
    log("t_school_year: table not present, skipping");
    return;
  }

  const sourceDatabase = getMysqlConfig().database || "unknown";
  const rows = await queryMysql<OldSchoolYear>(
    "SELECT * FROM t_school_year ORDER BY id"
  );
  log(`Found ${rows.length} rows in t_school_year`);

  const activeLegacyId = rows.reduce(
    (max, row) => Math.max(max, toInt(row.id, 0)),
    0
  );
  let migrated = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id, 0);
    const rawDate = cleanString(row.sdate);
    const startYear = rawDate ? yearFromDate(rawDate) : null;
    if (!legacyId || !startYear) {
      skipped++;
      continue;
    }

    const key = legacyKey(sourceDatabase, legacyId);
    const legacyDate = parseDate(rawDate);
    const label = `${startYear}-${startYear + 1}`;
    const { startDate, endDate } = schoolYearDates(startYear, legacyDate);

    const existingByKey = await prisma.schoolYear.findUnique({
      where: { legacyKey: key },
    });
    if (existingByKey) {
      setMapping("school_year", startYear, existingByKey.id);
      setMapping("school_year_legacy_id", legacyId, existingByKey.id);
      setMapping("school_year_sid", row.sid, existingByKey.id);
      skipped++;
      continue;
    }

    const existingByLabel = await prisma.schoolYear.findFirst({
      where: { organizationId, label },
    });

    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacySid: toInt(row.sid, 0) || null,
      legacyDate,
      label,
      startDate,
      endDate,
      isActive: legacyId === activeLegacyId,
      organizationId,
      legacyData: legacyData(row),
    };

    if (!dryRun) {
      if (existingByLabel) {
        await prisma.schoolYear.update({
          where: { id: existingByLabel.id },
          data,
        });
        setMapping("school_year", startYear, existingByLabel.id);
        setMapping("school_year_legacy_id", legacyId, existingByLabel.id);
        setMapping("school_year_sid", row.sid, existingByLabel.id);
        updated++;
      } else {
        const id = generateUUID();
        await prisma.schoolYear.create({
          data: {
            id,
            ...data,
          },
        });
        setMapping("school_year", startYear, id);
        setMapping("school_year_legacy_id", legacyId, id);
        setMapping("school_year_sid", row.sid, id);
        migrated++;
      }
    } else if (existingByLabel) {
      updated++;
    } else {
      migrated++;
    }

    logProgress(migrated + updated + skipped, rows.length, "School Years");
  }

  log(
    `School Years: ${migrated} migrated, ${updated} updated, ${skipped} skipped${dryRun ? " [DRY RUN]" : ""}`
  );
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      let org = await prisma.organization.findFirst();
      if (!org) {
        if (isDryRun()) {
          log("[DRY RUN] Would create default organization");
          return;
        }
        org = await prisma.organization.create({
          data: { name: "Kiddz Online", slug: "kiddz-online" },
        });
      }
      await migrateSchoolYears(prisma, org.id);
    } catch (err) {
      logError("School year migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
