/**
 * Migration: t_class → Class
 *
 * Field mapping:
 *   t_class.clid            → (old ID, mapped to UUID)
 *   t_class.classname       → Class.name
 *   t_class.branch_id       → Class.branchId (FK via branch mapping)
 *   t_class.max_students    → Class.capacity
 *   t_class.age_from/age_to → Class.ageGroup (combined as "from-to months/years")
 *   t_class.image           → Class.imageUrl (legacy filename until storage import)
 *   t_class.active          → Class.isActive
 *   t_class.datetime        → Class.createdAt
 *
 * Not migrated (computed/UI-only):
 *   branch_name, class_language, radiofrom, radioto, camera_number,
 *   current_students, males_num, females_num, teacher_id, helper_id,
 *   clfloor, uby
 *
 * Prerequisites: Branches must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  getMapping,
  isDryRun,
  cleanLegacyFileName,
  toBool,
  toInt,
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldClass {
  clid: number;
  classname: string;
  branch_id: number;
  branch_name: string;
  class_language: string;
  age_from: number;
  age_to: number;
  radiofrom: string;
  radioto: string;
  max_students: number;
  current_students: number;
  teacher_id: number;
  helper_id: number;
  image: string;
  active: number;
  datetime: string;
}

function legacyKey(sourceDatabase: string, table: string, legacyId: number) {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

export async function migrateClasses(prisma: PrismaClient) {
  log("=== Migrating Classes ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  const oldRows = await queryMysql<OldClass>(
    "SELECT * FROM t_class ORDER BY clid"
  );
  log(`Found ${oldRows.length} classes in old DB`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of oldRows) {
    const branchId = getMapping("branch", row.branch_id);
    if (!branchId) {
      logError(
        `Class ${row.clid} "${row.classname}" — branch ${row.branch_id} not found in mapping`
      );
      errors++;
      continue;
    }

    const imageUrl = cleanLegacyFileName(row.image);
    const key = legacyKey(sourceDatabase, "t_class", row.clid);
    const existingByKey = await prisma.class.findUnique({
      where: { legacyKey: key },
    });
    // Idempotency fallback for rows migrated before provenance fields existed.
    const existing =
      existingByKey ??
      (await prisma.class.findFirst({
        where: { branchId, name: row.classname },
      }));

    if (existing) {
      const updateData: {
        sourceDatabase?: string;
        legacyKey?: string;
        legacyId?: number;
        legacyTable?: string;
        imageUrl?: string;
      } = {
        sourceDatabase,
        legacyKey: key,
        legacyId: row.clid,
        legacyTable: "t_class",
      };
      if (imageUrl && existing.imageUrl !== imageUrl) {
        updateData.imageUrl = imageUrl;
      }
      if (!dryRun) {
        await prisma.class.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      setMapping("class", row.clid, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();
    const ageGroup =
      row.age_from || row.age_to
        ? `${row.age_from}-${row.age_to} ${row.radiofrom || "months"}`
        : null;

    if (!dryRun) {
      await prisma.class.create({
        data: {
          id: newId,
          sourceDatabase,
          legacyKey: key,
          legacyId: row.clid,
          legacyTable: "t_class",
          branchId,
          name: row.classname,
          capacity: toInt(row.max_students, 0),
          ageGroup,
          imageUrl,
          isActive: toBool(row.active),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }

    setMapping("class", row.clid, newId);
    migrated++;
    logProgress(migrated, oldRows.length, "Classes");
  }

  log(
    `Classes: ${migrated} migrated, ${skipped} skipped, ${errors} errors${dryRun ? " [DRY RUN]" : ""}`
  );
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateClasses(prisma);
    } catch (err) {
      logError("Class migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
