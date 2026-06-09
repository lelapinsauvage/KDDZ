/**
 * Migration: t_child + t_child_draft → Child + ChildAddress + Relative + ChildAttachment
 *
 * Field mapping (t_child → Child):
 *   cid              → (old ID, mapped to UUID)
 *   cname            → firstName
 *   cmname           → middleName
 *   clname           → lastName
 *   dob              → dateOfBirth (varchar → Date)
 *   pob              → placeOfBirth
 *   gender           → gender (enum mapping)
 *   nationality      → nationality
 *   blood_type       → bloodType
 *   allergy          → allergies
 *   image            → photo
 *   branch_id        → branchId (FK via mapping)
 *   class_id         → classId (FK via mapping)
 *   sel_year         → schoolYearId (FK via school-year mapping)
 *   joining_date     → enrollmentDate
 *   bus              → busAttendance (Yes/No → bool)
 *   diapers          → diaperType
 *   milk_name        → milkType
 *   milk_portion     → milkPortions
 *   milk_scoop       → milkScoop
 *   milktime1        → milkTime1 (varchar → Time)
 *   milktime2        → milkTime2
 *   has_lunch        → lunchIncluded
 *   sleep_from       → sleepFrom
 *   sleep_to         → sleepTo
 *   remarks          → remarks
 *   language         → language
 *   has_old_garderie → previousGarderie
 *   active           → isActive
 *   is_draft         → isDraft
 *   datetime         → createdAt
 *
 * t_child_draft → Child (isDraft = true)
 *   Same mapping with fewer fields available.
 *
 * Sub-tables also migrated:
 *   t_child_h    → ChildHistory
 *   t_address    → ChildAddress
 *   t_authorized → Relative (isAuthorized = true)
 *   t_relatives  → Relative
 *   t_attachments → ChildAttachment
 *
 * Prerequisites: Branches, Classes, Locations, and School Years must be migrated first.
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
  mapGender,
  toBool,
  toInt,
  cleanString,
  cleanLegacyFileName,
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldChild {
  cid: number;
  d_cid?: number;
  joining_date: string;
  child_num: string;
  cname: string;
  cmname: string;
  clname: string;
  image: string;
  dob: string;
  pob: string;
  nationality: string;
  gender: string;
  mother_name: string;
  mother_nationality: string;
  branch_id: number;
  language: string;
  sel_year: number;
  class_id: number;
  remarks: string;
  blood_type: string;
  allergy: string;
  bus: string;
  diapers: string;
  milk_name: string;
  milk_portion: number;
  milk_scoop: number;
  milk_time: string;
  milktime1: string;
  milktime2: string;
  remarks_food: string;
  sleep_from: string;
  sleep_to: string;
  has_old_garderie: string;
  has_lunch: string;
  active: number;
  deleted: number;
  is_draft: number;
  datetime: string;
}

interface OldAddress {
  aid: number;
  child_id: string;
  atype: string;
  muhafaza: string;
  country: string;
  quadaa: string;
  region: string;
  city: string;
  street: string;
  building: string;
  floor: string;
  tel: string;
  remarks: string;
  datetime?: string;
  active: number;
  [key: string]: unknown;
}

interface OldAuthorized {
  authid: number;
  relation: string;
  fname: string;
  lname: string;
  tel: string;
  mobile: string;
  emergence: string;
  child_id: string;
  datettime?: string;
  active: number;
  [key: string]: unknown;
}

interface OldRelative {
  rid: number;
  relation: string;
  fname: string;
  dob: string;
  medical_case: string;
  place_in_family: string;
  relative_phone: string;
  can_pick: string;
  child_id: string;
  datetime?: string;
  active: number;
  [key: string]: unknown;
}

interface OldChildHistory {
  cid: number;
  datetime: string;
  uby: number;
  [key: string]: unknown;
}

function legacyKey(sourceDatabase: string, table: string, legacyId: number) {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

function legacyRowData(
  sourceDatabase: string,
  sourceTable: string,
  legacyId: number,
  legacyChildId: number | null,
  row: Record<string, unknown>
): Prisma.InputJsonObject {
  return JSON.parse(
    JSON.stringify({
      sourceDatabase,
      sourceTable,
      legacyId,
      legacyChildId,
      row,
    })
  ) as Prisma.InputJsonObject;
}

export async function migrateChildren(prisma: PrismaClient) {
  log("=== Migrating Children ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  // --- Migrate t_child ---
  const oldChildren = await queryMysql<OldChild>(
    "SELECT * FROM t_child WHERE deleted = 0 ORDER BY cid"
  );
  log(`Found ${oldChildren.length} children (non-deleted) in t_child`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of oldChildren) {
    const branchId = getMapping("branch", row.branch_id);
    if (!branchId) {
      logError(`Child ${row.cid} — branch ${row.branch_id} not found`);
      errors++;
      continue;
    }

    const classId = getMapping("class", row.class_id);
    const schoolYearId = getMapping("school_year", row.sel_year);

    // Idempotency check by first+last name + branch + dob
    const dob = parseDate(row.dob);
    const photo = cleanLegacyFileName(row.image);
    const key = legacyKey(sourceDatabase, "t_child", row.cid);
    const existingByKey = await prisma.child.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.child.findFirst({
        where: {
          firstName: row.cname,
          lastName: row.clname,
          branchId,
          dateOfBirth: dob,
        },
      }));

    if (existing) {
      const updateData: {
        sourceDatabase?: string;
        legacyKey?: string;
        legacyId?: number;
        legacyTable?: string;
        schoolYearId?: string;
        photo?: string;
      } = {
        sourceDatabase,
        legacyKey: key,
        legacyId: row.cid,
        legacyTable: "t_child",
      };
      if (schoolYearId && existing.schoolYearId !== schoolYearId) {
        updateData.schoolYearId = schoolYearId;
      }
      if (photo && existing.photo !== photo) {
        updateData.photo = photo;
      }
      if (!dryRun && Object.keys(updateData).length > 0) {
        await prisma.child.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      setMapping("child", row.cid, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();

    if (!dryRun) {
      await prisma.child.create({
        data: {
          id: newId,
          sourceDatabase,
          legacyKey: key,
          legacyId: row.cid,
          legacyTable: "t_child",
          firstName: row.cname || "",
          middleName: cleanString(row.cmname),
          lastName: row.clname || "",
          dateOfBirth: dob,
          placeOfBirth: cleanString(row.pob),
          gender: mapGender(row.gender),
          nationality: cleanString(row.nationality),
          bloodType: cleanString(row.blood_type),
          allergies: cleanString(row.allergy),
          photo,
          branchId,
          classId,
          schoolYearId,
          enrollmentDate: parseDate(row.joining_date),
          busAttendance: row.bus?.toLowerCase() === "yes" ? "morning" : "false",
          diaperType: cleanString(row.diapers),
          milkType: cleanString(row.milk_name),
          milkPortions: toInt(row.milk_portion, 0) || null,
          milkScoop: toInt(row.milk_scoop, 0) || null,
          milkTime1: parseTime(row.milktime1),
          milkTime2: parseTime(row.milktime2),
          lunchIncluded: row.has_lunch?.toLowerCase() !== "no",
          sleepFrom: parseTime(row.sleep_from),
          sleepTo: parseTime(row.sleep_to),
          remarks: cleanString(row.remarks),
          language: cleanString(row.language),
          previousGarderie:
            row.has_old_garderie?.toLowerCase() === "yes" ||
            row.has_old_garderie === "1",
          isActive: toBool(row.active),
          isDraft: toBool(row.is_draft),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }

    setMapping("child", row.cid, newId);
    migrated++;
    logProgress(migrated, oldChildren.length, "Children");
  }

  log(
    `Children (t_child): ${migrated} migrated, ${skipped} skipped, ${errors} errors`
  );

  // --- Migrate t_child_draft ---
  const oldDrafts = await queryMysql<OldChild>(
    "SELECT * FROM t_child_draft WHERE deleted = 0 ORDER BY d_cid"
  );
  log(`Found ${oldDrafts.length} draft children in t_child_draft`);

  let draftMigrated = 0;
  let draftSkipped = 0;
  for (const row of oldDrafts) {
    const draftLegacyId = toInt(row.d_cid, 0);
    if (!draftLegacyId) continue;
    const draftMappingKey = `d${draftLegacyId}`;
    const key = legacyKey(sourceDatabase, "t_child_draft", draftLegacyId);
    const branchId = getMapping("branch", row.branch_id);
    if (!branchId) continue;

    const classId = getMapping("class", row.class_id);
    const schoolYearId = getMapping("school_year", row.sel_year);
    const existing = await prisma.child.findUnique({
      where: { legacyKey: key },
    });

    if (existing) {
      if (!dryRun) {
        await prisma.child.update({
          where: { id: existing.id },
          data: {
            sourceDatabase,
            legacyKey: key,
            legacyId: draftLegacyId,
            legacyTable: "t_child_draft",
            photo: cleanLegacyFileName(row.image),
            schoolYearId,
          },
        });
      }
      setMapping("child_draft", draftMappingKey, existing.id);
      draftSkipped++;
      continue;
    }

    const newId = generateUUID();

    if (!dryRun) {
      await prisma.child.create({
        data: {
          id: newId,
          sourceDatabase,
          legacyKey: key,
          legacyId: draftLegacyId,
          legacyTable: "t_child_draft",
          firstName: row.cname || "",
          middleName: cleanString(row.cmname),
          lastName: row.clname || "",
          dateOfBirth: parseDate(row.dob),
          placeOfBirth: cleanString(row.pob),
          gender: mapGender(row.gender),
          nationality: cleanString(row.nationality),
          bloodType: cleanString(row.blood_type),
          allergies: cleanString(row.allergy),
          photo: cleanLegacyFileName(row.image),
          branchId,
          classId,
          schoolYearId,
          isDraft: true,
          isActive: toBool(row.active),
          language: cleanString(row.language),
          remarks: cleanString(row.remarks),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }

    setMapping("child_draft", draftMappingKey, newId);
    draftMigrated++;
  }

  log(`Children (drafts): ${draftMigrated} migrated, ${draftSkipped} skipped`);

  // --- Migrate t_child_h → ChildHistory ---
  await migrateChildHistory(prisma, dryRun);

  // --- Migrate t_address → ChildAddress ---
  await migrateAddresses(prisma, dryRun, sourceDatabase);

  // --- Migrate t_authorized → Relative (isAuthorized = true) ---
  await migrateAuthorized(prisma, dryRun, sourceDatabase);

  // --- Migrate t_relatives → Relative ---
  await migrateRelatives(prisma, dryRun, sourceDatabase);

  log(`=== Children migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

async function migrateChildHistory(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldChildHistory>(
    "SELECT * FROM t_child_h ORDER BY datetime, cid"
  );
  log(`Found ${rows.length} child history snapshots in t_child_h`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const childId = getMapping("child", row.cid);
    if (!childId) {
      skipped++;
      continue;
    }

    const createdAt = parseDate(row.datetime) ?? new Date();
    const existing = await prisma.childHistory.findFirst({
      where: {
        childId,
        createdAt,
        changeNote: "Legacy t_child_h snapshot",
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.childHistory.create({
        data: {
          id: generateUUID(),
          childId,
          snapshot: JSON.parse(
            JSON.stringify({
              sourceTable: "t_child_h",
              ...row,
            })
          ),
          changedBy: cleanString(row.uby) ?? null,
          changeNote: "Legacy t_child_h snapshot",
          createdAt,
        },
      });
    }

    migrated++;
    logProgress(migrated, rows.length, "Child History");
  }

  log(`Child History: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateAddresses(
  prisma: PrismaClient,
  dryRun: boolean,
  sourceDatabase: string
) {
  const rows = await queryMysql<OldAddress>(
    "SELECT * FROM t_address WHERE active = 1 ORDER BY aid"
  );
  log(`Found ${rows.length} addresses in t_address`);

  let migrated = 0;
  let backfilled = 0;
  let skipped = 0;
  for (const row of rows) {
    const childId = getMapping("child", row.child_id);
    const legacyId = toInt(row.aid, 0);
    if (!childId || !legacyId) {
      skipped++;
      continue;
    }

    const legacyChildId = toInt(row.child_id, 0) || null;
    const key = legacyKey(sourceDatabase, "t_address", legacyId);
    const street = cleanString(row.street);
    const building = cleanString(row.building);
    const floor = cleanString(row.floor);
    const city = cleanString(row.city);
    const regionId = getMapping("region", row.region);
    const createdAt = parseDate(row.datetime ?? "");

    const existingByKey = await prisma.childAddress.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.childAddress.findFirst({
        where: {
          childId,
          legacyKey: null,
          street,
          building,
          floor,
          city,
        },
      }));

    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyTable: "t_address",
      legacyChildId,
      addressType: cleanString(row.atype),
      country: cleanString(row.country) ?? "Lebanon",
      street,
      building,
      floor,
      city,
      telephone: cleanString(row.tel),
      regionId,
      legacyData: legacyRowData(
        sourceDatabase,
        "t_address",
        legacyId,
        legacyChildId,
        row
      ),
      ...(createdAt ? { createdAt } : {}),
    };

    if (existing) {
      if (!dryRun) {
        await prisma.childAddress.update({
          where: { id: existing.id },
          data,
        });
      }
      setMapping("child_address", legacyId, existing.id);
      backfilled++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.childAddress.create({
        data: {
          id,
          childId,
          ...data,
        },
      });
    }
    setMapping("child_address", legacyId, id);
    migrated++;
  }
  log(
    `Addresses: ${migrated} migrated, ${backfilled} existing/backfilled, ${skipped} skipped`
  );
}

async function migrateAuthorized(
  prisma: PrismaClient,
  dryRun: boolean,
  sourceDatabase: string
) {
  const rows = await queryMysql<OldAuthorized>(
    "SELECT * FROM t_authorized WHERE active = 1 ORDER BY authid"
  );
  log(`Found ${rows.length} authorized persons in t_authorized`);

  let migrated = 0;
  let backfilled = 0;
  let skipped = 0;
  for (const row of rows) {
    const childId = getMapping("child", row.child_id);
    const legacyId = toInt(row.authid, 0);
    const firstName = cleanString(row.fname);
    const lastName = cleanString(row.lname);
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!childId || !legacyId || !fullName) {
      skipped++;
      continue;
    }

    const legacyChildId = toInt(row.child_id, 0) || null;
    const key = legacyKey(sourceDatabase, "t_authorized", legacyId);
    const phone = cleanString(row.tel);
    const mobile = cleanString(row.mobile);
    const relation = cleanString(row.relation);
    const createdAt = parseDate(row.datettime ?? "");

    const existingByKey = await prisma.relative.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.relative.findFirst({
        where: {
          childId,
          legacyKey: null,
          relation,
          OR: [
            {
              name: firstName ?? fullName,
              lastName,
            },
            {
              name: fullName,
            },
          ],
        },
      }));

    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyTable: "t_authorized",
      legacyChildId,
      name: firstName ?? fullName,
      lastName,
      relation,
      phone,
      mobile,
      isAuthorized: true,
      isEmergencyContact: toBool(row.emergence),
      legacyData: legacyRowData(
        sourceDatabase,
        "t_authorized",
        legacyId,
        legacyChildId,
        row
      ),
      ...(createdAt ? { createdAt } : {}),
    };

    if (existing) {
      if (!dryRun) {
        await prisma.relative.update({
          where: { id: existing.id },
          data,
        });
      }
      setMapping("authorized_relative", legacyId, existing.id);
      backfilled++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.relative.create({
        data: {
          id,
          childId,
          ...data,
        },
      });
    }
    setMapping("authorized_relative", legacyId, id);
    migrated++;
  }
  log(
    `Authorized persons → Relatives: ${migrated} migrated, ${backfilled} existing/backfilled, ${skipped} skipped`
  );
}

async function migrateRelatives(
  prisma: PrismaClient,
  dryRun: boolean,
  sourceDatabase: string
) {
  const rows = await queryMysql<OldRelative>(
    "SELECT * FROM t_relatives WHERE active = 1 ORDER BY rid"
  );
  log(`Found ${rows.length} relatives in t_relatives`);

  let migrated = 0;
  let backfilled = 0;
  let skipped = 0;
  for (const row of rows) {
    const childId = getMapping("child", row.child_id);
    const legacyId = toInt(row.rid, 0);
    const name = cleanString(row.fname);
    if (!childId || !legacyId || !name) {
      skipped++;
      continue;
    }

    const legacyChildId = toInt(row.child_id, 0) || null;
    const key = legacyKey(sourceDatabase, "t_relatives", legacyId);
    const relation = cleanString(row.relation);
    const phone = cleanString(row.relative_phone);
    const isAuthorized =
      row.can_pick?.toLowerCase() === "yes" || row.can_pick === "1";
    const createdAt = parseDate(row.datetime ?? "");

    const existingByKey = await prisma.relative.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.relative.findFirst({
        where: {
          childId,
          legacyKey: null,
          name,
          relation,
          phone,
        },
      }));

    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyTable: "t_relatives",
      legacyChildId,
      name,
      relation,
      phone,
      isAuthorized,
      legacyData: legacyRowData(
        sourceDatabase,
        "t_relatives",
        legacyId,
        legacyChildId,
        row
      ),
      ...(createdAt ? { createdAt } : {}),
    };

    if (existing) {
      if (!dryRun) {
        await prisma.relative.update({
          where: { id: existing.id },
          data,
        });
      }
      setMapping("relative", legacyId, existing.id);
      backfilled++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.relative.create({
        data: {
          id,
          childId,
          ...data,
        },
      });
    }
    setMapping("relative", legacyId, id);
    migrated++;
  }
  log(
    `Relatives: ${migrated} migrated, ${backfilled} existing/backfilled, ${skipped} skipped`
  );
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateChildren(prisma);
    } catch (err) {
      logError("Children migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
