/**
 * Migration: t_mouhafaza -> Province
 *            t_quadaa    -> District
 *            t_region    -> Region
 *
 * Legacy location tables store Lebanon administrative divisions. They are
 * migrated before child/address data so old location IDs can be mapped to the
 * modern UUID hierarchy.
 */

import type { PrismaClient } from "@/generated/prisma/client";
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
  setMapping,
  toBool,
} from "./lib/utils";

interface OldProvince {
  m_id: number;
  m_name: string;
  m_ref_num: number | string;
  m_datetime: string | Date;
  active: number | string;
}

interface OldDistrict {
  qid: number;
  qname: string;
  ref_nb: string;
  datetime: string | Date;
  active: number | string;
  q_mid: number;
}

interface OldRegion {
  rid: number;
  rname: string;
  ref_nb: string;
  datetime: string | Date;
  active: number | string;
  r_qid: number;
}

function legacyDate(value: string | Date | null | undefined): Date {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "string") return parseDate(value) ?? new Date();
  return new Date();
}

function setLocationMapping(table: string, oldId: number, newId: string) {
  setMapping(table, oldId, newId);
}

async function migrateProvinces(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldProvince>("SELECT * FROM t_mouhafaza ORDER BY m_id");
  log(`Found ${rows.length} provinces in old DB`);

  let migrated = 0;
  let existingCount = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!toBool(row.active)) {
      skipped++;
      continue;
    }

    const name = cleanString(row.m_name);
    if (!name) {
      skipped++;
      continue;
    }

    const referenceNumber = cleanString(row.m_ref_num);
    const existing = await prisma.province.findFirst({
      where: referenceNumber
        ? { OR: [{ name }, { referenceNumber }] }
        : { name },
    });

    if (existing) {
      setLocationMapping("province", row.m_id, existing.id);
      setLocationMapping("mouhafaza", row.m_id, existing.id);
      existingCount++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.province.create({
        data: {
          id,
          name,
          referenceNumber,
          createdAt: legacyDate(row.m_datetime),
        },
      });
    }

    setLocationMapping("province", row.m_id, id);
    setLocationMapping("mouhafaza", row.m_id, id);
    migrated++;
    logProgress(migrated, rows.length, "Provinces");
  }

  log(`Provinces: ${migrated} migrated, ${existingCount} existing, ${skipped} skipped`);
}

async function migrateDistricts(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldDistrict>("SELECT * FROM t_quadaa ORDER BY qid");
  log(`Found ${rows.length} districts in old DB`);

  let migrated = 0;
  let existingCount = 0;
  let skipped = 0;
  let missingParent = 0;

  for (const row of rows) {
    if (!toBool(row.active)) {
      skipped++;
      continue;
    }

    const name = cleanString(row.qname);
    if (!name) {
      skipped++;
      continue;
    }

    const provinceId = getMapping("province", row.q_mid);
    if (!provinceId) {
      missingParent++;
      continue;
    }

    const referenceNumber = cleanString(row.ref_nb);
    const existing = await prisma.district.findFirst({
      where: referenceNumber
        ? { provinceId, OR: [{ name }, { referenceNumber }] }
        : { provinceId, name },
    });

    if (existing) {
      setLocationMapping("district", row.qid, existing.id);
      setLocationMapping("quadaa", row.qid, existing.id);
      existingCount++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.district.create({
        data: {
          id,
          name,
          referenceNumber,
          provinceId,
          createdAt: legacyDate(row.datetime),
        },
      });
    }

    setLocationMapping("district", row.qid, id);
    setLocationMapping("quadaa", row.qid, id);
    migrated++;
    logProgress(migrated, rows.length, "Districts");
  }

  log(
    `Districts: ${migrated} migrated, ${existingCount} existing, ${skipped} skipped, ${missingParent} missing province`
  );
}

async function migrateRegions(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldRegion>("SELECT * FROM t_region ORDER BY rid");
  log(`Found ${rows.length} regions in old DB`);

  let migrated = 0;
  let existingCount = 0;
  let skipped = 0;
  let missingParent = 0;

  for (const row of rows) {
    if (!toBool(row.active)) {
      skipped++;
      continue;
    }

    const name = cleanString(row.rname);
    if (!name) {
      skipped++;
      continue;
    }

    const districtId = getMapping("district", row.r_qid);
    if (!districtId) {
      missingParent++;
      continue;
    }

    const referenceNumber = cleanString(row.ref_nb);
    const existing = await prisma.region.findFirst({
      where: referenceNumber
        ? { districtId, OR: [{ name }, { referenceNumber }] }
        : { districtId, name },
    });

    if (existing) {
      setLocationMapping("region", row.rid, existing.id);
      existingCount++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.region.create({
        data: {
          id,
          name,
          referenceNumber,
          districtId,
          createdAt: legacyDate(row.datetime),
        },
      });
    }

    setLocationMapping("region", row.rid, id);
    migrated++;
    logProgress(migrated, rows.length, "Regions");
  }

  log(
    `Regions: ${migrated} migrated, ${existingCount} existing, ${skipped} skipped, ${missingParent} missing district`
  );
}

export async function migrateLocations(prisma: PrismaClient) {
  log("=== Migrating Locations ===");
  const dryRun = isDryRun();

  await migrateProvinces(prisma, dryRun);
  await migrateDistricts(prisma, dryRun);
  await migrateRegions(prisma, dryRun);

  log(`Locations migration complete${dryRun ? " [DRY RUN]" : ""}`);
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateLocations(prisma);
    } catch (err) {
      logError("Locations migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
