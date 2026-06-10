/**
 * Migration: final small garderie-db tables with active source rows.
 *
 * Covers:
 *   t_attachments                  -> ChildAttachment
 *   t_events_types                 -> EventType
 *   t_events                       -> Event
 *   t_garderie_doctor              -> Doctor
 *   t_garderie_doctor_attachments  -> DoctorAttachment
 *   t_manager_attachments          -> ManagerAttachment
 *
 * Prerequisites: Branches, Children, and Employees must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  cleanLegacyFileName,
  cleanString,
  generateUUID,
  getMapping,
  isDryRun,
  log,
  logError,
  logProgress,
  mapGender,
  parseDate,
  setMapping,
  toBool,
  toInt,
} from "./lib/utils";

interface OldChildAttachment {
  attid: number;
  att_title: string;
  url: string;
  child_id: string;
  datetime: string | Date;
  active: number;
}

interface OldEventType {
  id: number;
  event_name: string;
  default_subject: string;
  default_message: string;
}

interface OldEvent {
  id: number;
  submit_time: string | Date;
  eventType: number;
  edate: string;
  custom_subject: string;
  custom_body: string;
  daysbefore: string;
  uby: number;
  branches: string;
  active: number;
}

interface OldGarderieDoctor {
  teacher_id: number;
  image: string;
  reg_num: string;
  f_name: string;
  m_name: string;
  l_name: string;
  f_name_ar: string;
  m_name_ar: string;
  l_name_ar: string;
  dob: string;
  pob: string;
  nationality: string;
  sel_gender: string;
  mobile: string;
  email: string;
  uni_degree: string;
  uni_degree_ar: string;
  sel_branch: number;
  active: number;
  deleted: number;
  datetime: string | Date;
  uby: number;
}

interface OldStaffAttachment {
  tattid: number;
  att_title: string;
  url: string;
  teacher_id: string;
  type: string;
  exp_date: string;
  datetime: string | Date;
  active: number;
}

function legacyData(row: object) {
  return JSON.parse(JSON.stringify(row));
}

function legacyKey(
  sourceDatabase: string,
  table: string,
  legacyId: number
): string {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  return parseDate(cleanString(value));
}

function parseJsonArray(value: string | null | undefined): unknown[] {
  const cleaned = cleanString(value);
  if (!cleaned) return [];
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseLegacyNumberList(value: string | null | undefined): number[] {
  return Array.from(
    new Set(
      parseJsonArray(value)
        .map((item) => toInt(item, 0))
        .filter((item) => item > 0),
    ),
  );
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

async function migrateChildAttachments(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_attachments"))) {
    log("t_attachments: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldChildAttachment>(
    "SELECT * FROM t_attachments ORDER BY attid"
  );
  log(`Found ${rows.length} rows in t_attachments`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const legacyId = toInt(row.attid, 0);
    const childId = getMapping("child", row.child_id);
    if (!legacyId || !childId) {
      errors++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_attachments", legacyId);
    const existing = await prisma.childAttachment.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const title = cleanString(row.att_title);
    const fileUrl = cleanLegacyFileName(row.url);
    if (!fileUrl) {
      skipped++;
      logProgress(migrated + skipped, rows.length, "Child Attachments");
      continue;
    }

    if (!dryRun) {
      await prisma.childAttachment.create({
        data: {
          id: generateUUID(),
          childId,
          sourceDatabase,
          legacyKey: key,
          legacyId,
          legacyChildId: toInt(row.child_id, 0) || null,
          title,
          filename: title ?? fileUrl,
          fileUrl,
          isActive: toBool(row.active),
          legacyData: legacyData(row),
          createdAt: asDate(row.datetime) ?? new Date(),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, "Child Attachments");
  }

  log(
    `t_attachments: ${migrated} migrated, ${skipped} skipped, ${errors} errors`
  );
}

async function migrateEventTypes(
  prisma: PrismaClient,
  sourceDatabase: string,
  organizationId: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_events_types"))) {
    log("t_events_types: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldEventType>(
    "SELECT * FROM t_events_types ORDER BY id"
  );
  log(`Found ${rows.length} rows in t_events_types`);

  let migrated = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id, 0);
    const name = cleanString(row.event_name);
    if (!legacyId || !name) {
      skipped++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_events_types", legacyId);
    const existingByKey = await prisma.eventType.findUnique({
      where: { legacyKey: key },
    });
    if (existingByKey) {
      setMapping("event_type", legacyId, existingByKey.id);
      skipped++;
      continue;
    }

    const existingByName = await prisma.eventType.findFirst({
      where: { organizationId, name },
    });
    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      name,
      defaultSubject: cleanString(row.default_subject),
      defaultMessage: cleanString(row.default_message),
      organizationId,
      legacyData: legacyData(row),
    };

    if (!dryRun) {
      if (existingByName) {
        await prisma.eventType.update({
          where: { id: existingByName.id },
          data,
        });
        setMapping("event_type", legacyId, existingByName.id);
        updated++;
      } else {
        const id = generateUUID();
        await prisma.eventType.create({
          data: {
            id,
            ...data,
          },
        });
        setMapping("event_type", legacyId, id);
        migrated++;
      }
    } else if (existingByName) {
      updated++;
    } else {
      migrated++;
    }

    logProgress(migrated + updated + skipped, rows.length, "Event Types");
  }

  log(
    `t_events_types: ${migrated} migrated, ${updated} updated, ${skipped} skipped`
  );
}

async function migrateEvents(
  prisma: PrismaClient,
  sourceDatabase: string,
  organizationId: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_events"))) {
    log("t_events: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldEvent>("SELECT * FROM t_events ORDER BY id");
  log(`Found ${rows.length} rows in t_events`);

  let migrated = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const eventTypeId = getMapping("event_type", toInt(row.eventType, 0)) ?? null;
    const eventType = eventTypeId
      ? await prisma.eventType.findUnique({
          where: { id: eventTypeId },
          select: { name: true },
        })
      : null;
    const legacyBranchIds = parseLegacyNumberList(row.branches);
    const notificationBranchIds = legacyBranchIds
      .map((legacyBranchId) => getMapping("branch", legacyBranchId))
      .filter((branchId): branchId is string => Boolean(branchId));
    const notificationDaysBefore = parseLegacyNumberList(row.daysbefore).filter(
      (days) => days >= 1 && days <= 10
    );
    const customSubject = cleanString(row.custom_subject);
    const customBody = cleanString(row.custom_body);
    const eventDate = asDate(row.edate);
    if (!eventDate) {
      skipped++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_events", legacyId);
    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      organizationId,
      title: eventType?.name ?? customSubject ?? `Event ${legacyId}`,
      description: customBody,
      customSubject,
      customBody,
      date: eventDate,
      endDate: null,
      eventTypeId,
      branchId: notificationBranchIds.length === 1 ? notificationBranchIds[0] : null,
      notificationBranchIds,
      notificationDaysBefore,
      isActive: toBool(row.active),
      legacyData: legacyData({
        ...row,
        legacyBranchIds,
        modernBranchIds: notificationBranchIds,
        modernEventTypeId: eventTypeId,
      }),
      createdAt: asDate(row.submit_time) ?? new Date(),
    };

    const existingByKey = await prisma.event.findUnique({
      where: { legacyKey: key },
    });

    if (!dryRun) {
      if (existingByKey) {
        await prisma.event.update({
          where: { id: existingByKey.id },
          data,
        });
        updated++;
      } else {
        const id = generateUUID();
        await prisma.event.create({
          data: { id, ...data },
        });
        setMapping("event", legacyId, id);
        migrated++;
      }
    } else if (existingByKey) {
      updated++;
    } else {
      migrated++;
    }

    if (existingByKey) setMapping("event", legacyId, existingByKey.id);
    logProgress(migrated + updated + skipped, rows.length, "Events");
  }

  log(`t_events: ${migrated} migrated, ${updated} updated, ${skipped} skipped`);
}

async function migrateGarderieDoctors(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_garderie_doctor"))) {
    log("t_garderie_doctor: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldGarderieDoctor>(
    "SELECT * FROM t_garderie_doctor WHERE deleted = 0 ORDER BY teacher_id"
  );
  log(`Found ${rows.length} rows in t_garderie_doctor`);

  let migrated = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const legacyId = toInt(row.teacher_id, 0);
    const branchId = getMapping("branch", row.sel_branch);
    if (!legacyId || !branchId) {
      errors++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_garderie_doctor", legacyId);
    const existingByKey = await prisma.doctor.findUnique({
      where: { legacyKey: key },
    });
    if (existingByKey) {
      setMapping("garderie_doctor", legacyId, existingByKey.id);
      skipped++;
      continue;
    }

    const existingByName = await prisma.doctor.findFirst({
      where: {
        firstName: row.f_name,
        lastName: row.l_name,
        branchId,
      },
    });
    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyTable: "t_garderie_doctor",
      legacyUserId: toInt(row.uby, 0) || null,
      firstName: row.f_name || "",
      firstNameAr: cleanString(row.f_name_ar),
      middleName: cleanString(row.m_name),
      middleNameAr: cleanString(row.m_name_ar),
      lastName: row.l_name || "",
      lastNameAr: cleanString(row.l_name_ar),
      dateOfBirth: parseDate(row.dob),
      placeOfBirth: cleanString(row.pob),
      registerNumber: cleanString(row.reg_num),
      nationality: cleanString(row.nationality),
      gender: mapGender(row.sel_gender),
      mobile: cleanString(row.mobile),
      email: cleanString(row.email),
      universityDegree: cleanString(row.uni_degree),
      specialization: cleanString(row.uni_degree),
      specializationAr: cleanString(row.uni_degree_ar),
      licenseNumber: cleanString(row.reg_num),
      imageUrl: cleanLegacyFileName(row.image),
      branchId,
      isActive: toBool(row.active),
      legacyData: legacyData(row),
      createdAt: asDate(row.datetime) ?? new Date(),
    };

    if (!dryRun) {
      if (existingByName) {
        await prisma.doctor.update({
          where: { id: existingByName.id },
          data,
        });
        setMapping("garderie_doctor", legacyId, existingByName.id);
        updated++;
      } else {
        const id = generateUUID();
        await prisma.doctor.create({
          data: {
            id,
            ...data,
          },
        });
        setMapping("garderie_doctor", legacyId, id);
        migrated++;
      }
    } else if (existingByName) {
      updated++;
    } else {
      migrated++;
    }

    logProgress(migrated + updated + skipped, rows.length, "Garderie Doctors");
  }

  log(
    `t_garderie_doctor: ${migrated} migrated, ${updated} updated, ${skipped} skipped, ${errors} errors`
  );
}

async function migrateGarderieDoctorAttachments(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_garderie_doctor_attachments"))) {
    log("t_garderie_doctor_attachments: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldStaffAttachment>(
    "SELECT * FROM t_garderie_doctor_attachments ORDER BY tattid"
  );
  log(`Found ${rows.length} rows in t_garderie_doctor_attachments`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const legacyId = toInt(row.tattid, 0);
    const legacyDoctorId = toInt(row.teacher_id, 0);
    const doctorId = getMapping("garderie_doctor", legacyDoctorId);
    if (!legacyId || !doctorId) {
      errors++;
      continue;
    }

    const key = legacyKey(
      sourceDatabase,
      "t_garderie_doctor_attachments",
      legacyId
    );
    const existing = await prisma.doctorAttachment.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const title = cleanString(row.att_title);
    const fileUrl = cleanLegacyFileName(row.url);
    if (!fileUrl) {
      skipped++;
      logProgress(
        migrated + skipped,
        rows.length,
        "Garderie Doctor Attachments"
      );
      continue;
    }

    if (!dryRun) {
      await prisma.doctorAttachment.create({
        data: {
          id: generateUUID(),
          doctorId,
          sourceDatabase,
          legacyKey: key,
          legacyId,
          legacyDoctorId,
          title,
          filename: title ?? fileUrl,
          fileUrl,
          type: cleanString(row.type),
          expiryDate: parseDate(row.exp_date),
          isActive: toBool(row.active),
          legacyData: legacyData(row),
          createdAt: asDate(row.datetime) ?? new Date(),
        },
      });
    }

    migrated++;
    logProgress(
      migrated + skipped,
      rows.length,
      "Garderie Doctor Attachments"
    );
  }

  log(
    `t_garderie_doctor_attachments: ${migrated} migrated, ${skipped} skipped, ${errors} errors`
  );
}

async function migrateManagerAttachments(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_manager_attachments"))) {
    log("t_manager_attachments: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldStaffAttachment>(
    "SELECT * FROM t_manager_attachments ORDER BY tattid"
  );
  log(`Found ${rows.length} rows in t_manager_attachments`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const legacyId = toInt(row.tattid, 0);
    const legacyManagerId = toInt(row.teacher_id, 0);
    const managerId = getMapping("manager", legacyManagerId);
    if (!legacyId || !managerId) {
      errors++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_manager_attachments", legacyId);
    const existing = await prisma.managerAttachment.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const title = cleanString(row.att_title);
    const fileUrl = cleanLegacyFileName(row.url);
    if (!fileUrl) {
      skipped++;
      logProgress(migrated + skipped, rows.length, "Manager Attachments");
      continue;
    }

    if (!dryRun) {
      await prisma.managerAttachment.create({
        data: {
          id: generateUUID(),
          managerId,
          sourceDatabase,
          legacyKey: key,
          legacyId,
          legacyManagerId,
          title,
          filename: title ?? fileUrl,
          fileUrl,
          type: cleanString(row.type),
          expiryDate: parseDate(row.exp_date),
          isActive: toBool(row.active),
          legacyData: legacyData(row),
          createdAt: asDate(row.datetime) ?? new Date(),
        },
      });
    }

    migrated++;
    logProgress(migrated + skipped, rows.length, "Manager Attachments");
  }

  log(
    `t_manager_attachments: ${migrated} migrated, ${skipped} skipped, ${errors} errors`
  );
}

export async function migrateGarderieMisc(
  prisma: PrismaClient,
  organizationId: string
) {
  log("=== Migrating Garderie Misc Tables ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  await migrateChildAttachments(prisma, sourceDatabase, dryRun);
  await migrateEventTypes(prisma, sourceDatabase, organizationId, dryRun);
  await migrateEvents(prisma, sourceDatabase, organizationId, dryRun);
  await migrateGarderieDoctors(prisma, sourceDatabase, dryRun);
  await migrateGarderieDoctorAttachments(prisma, sourceDatabase, dryRun);
  await migrateManagerAttachments(prisma, sourceDatabase, dryRun);

  log(`=== Garderie misc migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
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
      await migrateGarderieMisc(prisma, org.id);
    } catch (err) {
      logError("Garderie misc migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
