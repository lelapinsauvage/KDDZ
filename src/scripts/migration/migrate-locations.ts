/**
 * Migration: t_mouhafaza -> Province
 *            t_quadaa    -> District
 *            t_region    -> Region
 *
 * Legacy location tables store Lebanon administrative divisions. They are
 * migrated before child/address data so old location IDs can be mapped to the
 * modern UUID hierarchy.
 */

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
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
} from "./lib/utils";

interface OldProvince {
  m_id: number;
  m_name: string;
  m_ref_num: number | string;
  m_datetime: string | Date;
  active: number | string;
  [key: string]: unknown;
}

interface OldDistrict {
  qid: number;
  qname: string;
  ref_nb: string;
  datetime: string | Date;
  active: number | string;
  q_mid: number;
  [key: string]: unknown;
}

interface OldRegion {
  rid: number;
  rname: string;
  ref_nb: string;
  datetime: string | Date;
  active: number | string;
  r_qid: number;
  [key: string]: unknown;
}

function legacyKey(sourceDatabase: string, table: string, legacyId: number) {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

function legacyLocationData(
  sourceDatabase: string,
  sourceTable: string,
  legacyId: number,
  row: Record<string, unknown>
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      sourceDatabase,
      sourceTable,
      legacyId,
      row,
    })
  ) as Prisma.InputJsonValue;
}

function legacyDate(value: string | Date | null | undefined): Date {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "string") return parseDate(value) ?? new Date();
  return new Date();
}

function setLocationMapping(table: string, oldId: number, newId: string) {
  setMapping(table, oldId, newId);
}

async function migrateProvinces(
  prisma: PrismaClient,
  dryRun: boolean,
  sourceDatabase: string
) {
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

    const key = legacyKey(sourceDatabase, "t_mouhafaza", row.m_id);
    const referenceNumber = cleanString(row.m_ref_num);
    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId: row.m_id,
      legacyTable: "t_mouhafaza",
      name,
      referenceNumber,
      legacyData: legacyLocationData(
        sourceDatabase,
        "t_mouhafaza",
        row.m_id,
        row
      ),
      createdAt: legacyDate(row.m_datetime),
    };
    const existingByKey = await prisma.province.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.province.findFirst({
        where: referenceNumber
          ? { legacyKey: null, OR: [{ name }, { referenceNumber }] }
          : { legacyKey: null, name },
      }));

    if (existing) {
      if (!dryRun) {
        await prisma.province.update({
          where: { id: existing.id },
          data,
        });
      }
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
          ...data,
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

async function migrateDistricts(
  prisma: PrismaClient,
  dryRun: boolean,
  sourceDatabase: string
) {
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

    const key = legacyKey(sourceDatabase, "t_quadaa", row.qid);
    const referenceNumber = cleanString(row.ref_nb);
    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId: row.qid,
      legacyTable: "t_quadaa",
      legacyProvinceId: row.q_mid,
      name,
      referenceNumber,
      provinceId,
      legacyData: legacyLocationData(
        sourceDatabase,
        "t_quadaa",
        row.qid,
        row
      ),
      createdAt: legacyDate(row.datetime),
    };
    const existingByKey = await prisma.district.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.district.findFirst({
        where: referenceNumber
          ? { provinceId, legacyKey: null, OR: [{ name }, { referenceNumber }] }
          : { provinceId, legacyKey: null, name },
      }));

    if (existing) {
      if (!dryRun) {
        await prisma.district.update({
          where: { id: existing.id },
          data,
        });
      }
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
          ...data,
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

async function migrateRegions(
  prisma: PrismaClient,
  dryRun: boolean,
  sourceDatabase: string
) {
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

    const key = legacyKey(sourceDatabase, "t_region", row.rid);
    const referenceNumber = cleanString(row.ref_nb);
    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId: row.rid,
      legacyTable: "t_region",
      legacyDistrictId: row.r_qid,
      name,
      referenceNumber,
      districtId,
      legacyData: legacyLocationData(
        sourceDatabase,
        "t_region",
        row.rid,
        row
      ),
      createdAt: legacyDate(row.datetime),
    };
    const existingByKey = await prisma.region.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.region.findFirst({
        where: referenceNumber
          ? { districtId, legacyKey: null, OR: [{ name }, { referenceNumber }] }
          : { districtId, legacyKey: null, name },
      }));

    if (existing) {
      if (!dryRun) {
        await prisma.region.update({
          where: { id: existing.id },
          data,
        });
      }
      setLocationMapping("region", row.rid, existing.id);
      existingCount++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.region.create({
        data: {
          id,
          ...data,
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
  const sourceDatabase = getMysqlConfig().database || "unknown";

  await migrateProvinces(prisma, dryRun, sourceDatabase);
  await migrateDistricts(prisma, dryRun, sourceDatabase);
  await migrateRegions(prisma, dryRun, sourceDatabase);

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
