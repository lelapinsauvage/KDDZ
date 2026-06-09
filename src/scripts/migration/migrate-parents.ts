/**
 * Migration: t_parents → Parent
 *
 * Field mapping:
 *   t_parents.pid            → (old ID, mapped to UUID)
 *   t_parents.relation       → Parent.type (MOTHER/FATHER enum mapping)
 *   t_parents.pname          → Parent.firstName
 *   t_parents.plname         → Parent.lastName
 *   t_parents.profession     → Parent.profession
 *   t_parents.work_tel       → Parent.workPhone
 *   t_parents.parent_mobile  → Parent.mobile
 *   t_parents.martial_status → Parent.maritalStatus
 *   t_parents.divorce_status → Parent.divorceSituation
 *   t_parents.medical_case   → Parent.medicalCase
 *   t_parents.parent_email   → Parent.email
 *   t_parents.can_pick       → Parent.canPickUp
 *   t_parents.child_id       → Parent.childId (FK via child mapping)
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
  cleanString,
  parseDate,
  toBool,
  toInt,
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldParent {
  pid: number;
  relation: string;
  pname: string;
  plname: string;
  profession: string;
  work_tel: string;
  parent_mobile: string;
  martial_status: string;
  divorce_status: string;
  medical_case: string;
  parent_email: string;
  can_pick: string;
  child_id: string;
  active: number;
  datetime: string;
  [key: string]: unknown;
}

function legacyKey(sourceDatabase: string, table: string, legacyId: number) {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

function legacyRowData(
  sourceDatabase: string,
  legacyId: number,
  legacyChildId: number | null,
  row: Record<string, unknown>
): Prisma.InputJsonObject {
  return JSON.parse(
    JSON.stringify({
      sourceDatabase,
      sourceTable: "t_parents",
      legacyId,
      legacyChildId,
      row,
    })
  ) as Prisma.InputJsonObject;
}

function mapParentType(
  relation: string | null | undefined
): "MOTHER" | "FATHER" {
  if (!relation) return "FATHER";
  const v = relation.toLowerCase().trim();
  if (
    v === "mother" ||
    v === "mom" ||
    v === "mère" ||
    v === "mama" ||
    v === "أم"
  )
    return "MOTHER";
  return "FATHER";
}

export async function migrateParents(prisma: PrismaClient) {
  log("=== Migrating Parents ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  const oldRows = await queryMysql<OldParent>(
    "SELECT * FROM t_parents WHERE active = 1 ORDER BY pid"
  );
  log(`Found ${oldRows.length} parents in old DB`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of oldRows) {
    const childId = getMapping("child", row.child_id);
    const legacyId = toInt(row.pid, 0);
    if (!childId || !legacyId) {
      logError(`Parent ${row.pid} — child ${row.child_id} not found`);
      errors++;
      continue;
    }

    const parentType = mapParentType(row.relation);
    const legacyChildId = toInt(row.child_id, 0) || null;
    const key = legacyKey(sourceDatabase, "t_parents", legacyId);
    const createdAt = parseDate(row.datetime);

    const existingByKey = await prisma.parent.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.parent.findFirst({
        where: {
          childId,
          type: parentType,
          legacyKey: null,
        },
      }));

    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyTable: "t_parents",
      legacyChildId,
      type: parentType,
      firstName: cleanString(row.pname),
      lastName: cleanString(row.plname),
      phone: null,
      mobile: cleanString(row.parent_mobile),
      email: cleanString(row.parent_email),
      profession: cleanString(row.profession),
      workPhone: cleanString(row.work_tel),
      maritalStatus: cleanString(row.martial_status),
      divorceSituation: cleanString(row.divorce_status),
      medicalCase: cleanString(row.medical_case),
      canPickUp: toBool(row.can_pick),
      legacyData: legacyRowData(sourceDatabase, legacyId, legacyChildId, row),
      ...(createdAt ? { createdAt } : {}),
    };

    if (existing) {
      if (!dryRun) {
        await prisma.parent.update({
          where: { id: existing.id },
          data,
        });
      }
      setMapping("parent", row.pid, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();

    if (!dryRun) {
      await prisma.parent.create({
        data: {
          id: newId,
          childId,
          ...data,
        },
      });
    }

    setMapping("parent", row.pid, newId);
    migrated++;
    logProgress(migrated, oldRows.length, "Parents");
  }

  log(
    `Parents: ${migrated} migrated, ${skipped} skipped, ${errors} errors${dryRun ? " [DRY RUN]" : ""}`
  );
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateParents(prisma);
    } catch (err) {
      logError("Parent migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
