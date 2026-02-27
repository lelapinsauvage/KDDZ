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
 *   t_address    → ChildAddress
 *   t_authorized → Relative (isAuthorized = true)
 *   t_relatives  → Relative
 *   t_attachments → ChildAttachment
 *
 * Prerequisites: Branches and Classes must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool } from "./lib/mysql-client";
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
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldChild {
  cid: number;
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
  active: number;
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
  active: number;
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
  active: number;
}

export async function migrateChildren(prisma: PrismaClient) {
  log("=== Migrating Children ===");
  const dryRun = isDryRun();

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

    // Idempotency check by first+last name + branch + dob
    const dob = parseDate(row.dob);
    const existing = await prisma.child.findFirst({
      where: {
        firstName: row.cname,
        lastName: row.clname,
        branchId,
        dateOfBirth: dob,
      },
    });

    if (existing) {
      setMapping("child", row.cid, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();

    if (!dryRun) {
      await prisma.child.create({
        data: {
          id: newId,
          firstName: row.cname || "",
          middleName: cleanString(row.cmname),
          lastName: row.clname || "",
          dateOfBirth: dob,
          placeOfBirth: cleanString(row.pob),
          gender: mapGender(row.gender),
          nationality: cleanString(row.nationality),
          bloodType: cleanString(row.blood_type),
          allergies: cleanString(row.allergy),
          photo: row.image !== "default.jpg" ? row.image : null,
          branchId,
          classId,
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
  for (const row of oldDrafts) {
    // Use d_cid as the old ID — prefix with "d" to avoid collision
    const draftKey = `d${(row as unknown as Record<string, unknown>).d_cid}`;
    const branchId = getMapping("branch", row.branch_id);
    if (!branchId) continue;

    const classId = getMapping("class", row.class_id);
    const newId = generateUUID();

    if (!dryRun) {
      await prisma.child.create({
        data: {
          id: newId,
          firstName: row.cname || "",
          middleName: cleanString(row.cmname),
          lastName: row.clname || "",
          dateOfBirth: parseDate(row.dob),
          placeOfBirth: cleanString(row.pob),
          gender: mapGender(row.gender),
          nationality: cleanString(row.nationality),
          bloodType: cleanString(row.blood_type),
          allergies: cleanString(row.allergy),
          photo: row.image !== "default.jpg" ? row.image : null,
          branchId,
          classId,
          isDraft: true,
          isActive: toBool(row.active),
          language: cleanString(row.language),
          remarks: cleanString(row.remarks),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }

    setMapping("child_draft", draftKey, newId);
    draftMigrated++;
  }

  log(`Children (drafts): ${draftMigrated} migrated`);

  // --- Migrate t_address → ChildAddress ---
  await migrateAddresses(prisma, dryRun);

  // --- Migrate t_authorized → Relative (isAuthorized = true) ---
  await migrateAuthorized(prisma, dryRun);

  // --- Migrate t_relatives → Relative ---
  await migrateRelatives(prisma, dryRun);

  log(`=== Children migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

async function migrateAddresses(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldAddress>(
    "SELECT * FROM t_address WHERE active = 1 ORDER BY aid"
  );
  log(`Found ${rows.length} addresses in t_address`);

  let count = 0;
  for (const row of rows) {
    const childId = getMapping("child", row.child_id);
    if (!childId) continue;

    // Idempotency
    const existing = await prisma.childAddress.findFirst({
      where: { childId },
    });
    if (existing) continue;

    if (!dryRun) {
      await prisma.childAddress.create({
        data: {
          id: generateUUID(),
          childId,
          street: cleanString(row.street),
          building: cleanString(row.building),
          floor: cleanString(row.floor),
          city: cleanString(row.city),
        },
      });
    }
    count++;
  }
  log(`Addresses: ${count} migrated`);
}

async function migrateAuthorized(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldAuthorized>(
    "SELECT * FROM t_authorized WHERE active = 1 ORDER BY authid"
  );
  log(`Found ${rows.length} authorized persons in t_authorized`);

  let count = 0;
  for (const row of rows) {
    const childId = getMapping("child", row.child_id);
    if (!childId) continue;

    const fullName = [row.fname, row.lname].filter(Boolean).join(" ").trim();
    if (!fullName) continue;

    if (!dryRun) {
      await prisma.relative.create({
        data: {
          id: generateUUID(),
          childId,
          name: fullName,
          relation: cleanString(row.relation),
          phone: cleanString(row.mobile) || cleanString(row.tel),
          isAuthorized: true,
        },
      });
    }
    count++;
  }
  log(`Authorized persons → Relatives: ${count} migrated`);
}

async function migrateRelatives(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldRelative>(
    "SELECT * FROM t_relatives WHERE active = 1 ORDER BY rid"
  );
  log(`Found ${rows.length} relatives in t_relatives`);

  let count = 0;
  for (const row of rows) {
    const childId = getMapping("child", row.child_id);
    if (!childId) continue;

    if (!row.fname?.trim()) continue;

    if (!dryRun) {
      await prisma.relative.create({
        data: {
          id: generateUUID(),
          childId,
          name: row.fname.trim(),
          relation: cleanString(row.relation),
          phone: cleanString(row.relative_phone),
          isAuthorized:
            row.can_pick?.toLowerCase() === "yes" ||
            row.can_pick === "1",
        },
      });
    }
    count++;
  }
  log(`Relatives: ${count} migrated`);
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
