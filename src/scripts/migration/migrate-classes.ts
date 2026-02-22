/**
 * Migration: t_class → Class
 *
 * Field mapping:
 *   t_class.clid            → (old ID, mapped to UUID)
 *   t_class.classname       → Class.name
 *   t_class.branch_id       → Class.branchId (FK via branch mapping)
 *   t_class.max_students    → Class.capacity
 *   t_class.age_from/age_to → Class.ageGroup (combined as "from-to months/years")
 *   t_class.active          → Class.isActive
 *   t_class.datetime        → Class.createdAt
 *
 * Not migrated (computed/UI-only):
 *   branch_name, class_language, radiofrom, radioto, camera_number,
 *   current_students, males_num, females_num, teacher_id, helper_id,
 *   clfloor, uby, image
 *
 * Prerequisites: Branches must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  getMapping,
  isDryRun,
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
  active: number;
  datetime: string;
}

export async function migrateClasses(prisma: PrismaClient) {
  log("=== Migrating Classes ===");
  const dryRun = isDryRun();

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

    // Idempotency: check by name + branch
    const existing = await prisma.class.findFirst({
      where: { branchId, name: row.classname },
    });

    if (existing) {
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
          branchId,
          name: row.classname,
          capacity: toInt(row.max_students, 0),
          ageGroup,
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
