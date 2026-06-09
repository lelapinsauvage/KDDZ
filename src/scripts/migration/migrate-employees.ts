/**
 * Migration: t_teacher, t_nurse, t_doctor, t_manager → Teacher, Nurse, Doctor, Manager
 *            + address and attachment sub-tables
 *
 * === Teacher (t_teacher → Teacher) ===
 *   teacher_id   → (old ID, mapped to UUID)
 *   f_name       → firstName
 *   l_name       → lastName
 *   regnum       → registerNumber
 *   tel          → phone
 *   mobile       → mobile
 *   email        → email
 *   nationality  → nationality
 *   dob          → dateOfBirth
 *   sel_branch   → branchId (FK via mapping)
 *   active       → isActive
 *   datetime     → createdAt
 *   Not migrated: m_name, martial, noc, sel_gender, has_medcase,
 *     medcase, cnss, cnssnum, sec_degree, sec_degree_y, uni_degree,
 *     uni_degree_y, language skills (eng/fr/ar), remarks, classid,
 *     contract, medtest, firstaid, t_user_id, uby
 *
 * === Nurse (t_nurse → Nurse) ===
 *   teacher_id   → (old ID, mapped to UUID)
 *   f_name       → firstName
 *   l_name       → lastName
 *   mobile       → mobile
 *   email        → email
 *   nationality  → nationality
 *   dob          → dateOfBirth
 *   sel_branch   → branchId (FK via mapping)
 *   image        → imageUrl (legacy filename until storage import)
 *   active       → isActive
 *
 * === Doctor (t_doctor → Doctor) ===
 *   did          → (old ID, mapped to UUID)
 *   dfname       → firstName
 *   dlname       → lastName
 *   tel          → phone
 *   (no mobile)  → mobile = null
 *   (no email)   → email = null
 *   active       → isActive
 *   Note: Doctors in old schema have no branch_id — assign to first branch.
 *
 * === Manager (t_manager → Manager) ===
 *   teacher_id   → (old ID, mapped to UUID)
 *   f_name       → firstName
 *   l_name       → lastName
 *   mobile       → mobile
 *   email        → email
 *   nationality  → nationality
 *   dob          → dateOfBirth
 *   sel_branch   → branchId (FK via mapping)
 *   active       → isActive
 *
 * Sub-tables:
 *   t_teacher_address → TeacherAddress
 *   t_teacher_attachments → TeacherAttachment
 *   t_teacher_info → TeacherExperience
 *   t_nurse_attachments → NurseAttachment
 *   t_manager_address → ManagerAddress
 *
 * Prerequisites: Branches must be migrated first.
 */

import type {
  AttendanceLogStatus,
  EmployeeEventStatus,
  ExperienceType,
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  getMapping,
  isDryRun,
  parseDate,
  cleanString,
  cleanLegacyFileName,
  toBool,
  toInt,
  log,
  logError,
  logProgress,
} from "./lib/utils";

function legacyKey(sourceDatabase: string, table: string, legacyId: number) {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

function legacyRowData(
  sourceDatabase: string,
  sourceTable: string,
  legacyId: number,
  row: Record<string, unknown>
): Prisma.InputJsonObject {
  return JSON.parse(
    JSON.stringify({
      sourceDatabase,
      sourceTable,
      legacyId,
      row,
    })
  ) as Prisma.InputJsonObject;
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------
interface OldTeacher {
  teacher_id: number;
  f_name: string;
  l_name: string;
  m_name: string;
  dob: string;
  pob: string;
  regnum: string;
  nationality: string;
  sel_gender: string;
  tel: string;
  mobile: string;
  email: string;
  image: string;
  sel_branch: number;
  active: number;
  deleted: number;
  datetime: string;
  t_user_id: number;
}

async function migrateTeachers(prisma: PrismaClient, dryRun: boolean) {
  const sourceDatabase = getMysqlConfig().database || "unknown";
  const rows = await queryMysql<OldTeacher>(
    "SELECT * FROM t_teacher WHERE deleted = 0 ORDER BY teacher_id"
  );
  log(`Found ${rows.length} teachers in t_teacher`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const branchId = getMapping("branch", row.sel_branch);
    if (!branchId) {
      logError(`Teacher ${row.teacher_id} — branch ${row.sel_branch} not found`);
      continue;
    }

    const imageUrl = cleanLegacyFileName(row.image);
    const registerNumber = cleanString(row.regnum);
    const key = legacyKey(sourceDatabase, "t_teacher", row.teacher_id);
    const existingByKey = await prisma.teacher.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.teacher.findFirst({
        where: { firstName: row.f_name, lastName: row.l_name, branchId },
      }));
    if (existing) {
      const updateData: {
        sourceDatabase?: string;
        legacyKey?: string;
        legacyId?: number;
        legacyTable?: string;
        imageUrl?: string;
        registerNumber?: string | null;
      } = {
        sourceDatabase,
        legacyKey: key,
        legacyId: row.teacher_id,
        legacyTable: "t_teacher",
      };
      if (imageUrl && existing.imageUrl !== imageUrl) {
        updateData.imageUrl = imageUrl;
      }
      if (existing.registerNumber !== registerNumber) {
        updateData.registerNumber = registerNumber;
      }
      if (!dryRun) {
        await prisma.teacher.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      setMapping("teacher", row.teacher_id, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();
    if (!dryRun) {
      await prisma.teacher.create({
        data: {
          id: newId,
          sourceDatabase,
          legacyKey: key,
          legacyId: row.teacher_id,
          legacyTable: "t_teacher",
          firstName: row.f_name || "",
          lastName: row.l_name || "",
          registerNumber,
          phone: cleanString(row.tel),
          mobile: cleanString(row.mobile),
          email: cleanString(row.email),
          nationality: cleanString(row.nationality),
          dateOfBirth: parseDate(row.dob),
          imageUrl,
          branchId,
          isActive: toBool(row.active),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }
    setMapping("teacher", row.teacher_id, newId);
    migrated++;
    logProgress(migrated, rows.length, "Teachers");
  }
  log(`Teachers: ${migrated} migrated, ${skipped} skipped`);

  // Teacher addresses
  await migrateTeacherAddresses(prisma, dryRun, sourceDatabase);
  // Teacher attachments
  await migrateTeacherAttachments(prisma, dryRun);
  // Teacher experience/stage/workshop rows
  await migrateTeacherExperiences(prisma, dryRun);
  // Teacher calendar status rows
  await migrateTeacherEmployeeEvents(prisma, dryRun);
  // Teacher biometric/scanner attendance logs
  await migrateTeacherAttendance(prisma, dryRun);
}

interface OldTeacherAddress {
  taid: number;
  teacher_id: string;
  muhafaza: string;
  quadaa: string;
  region: string;
  city: string;
  street: string;
  building: string;
  datetime?: string;
  active: number;
  [key: string]: unknown;
}

async function migrateTeacherAddresses(
  prisma: PrismaClient,
  dryRun: boolean,
  sourceDatabase: string
) {
  const rows = await queryMysql<OldTeacherAddress>(
    "SELECT * FROM t_teacher_address WHERE active = 1"
  );
  let migrated = 0;
  let backfilled = 0;
  let skipped = 0;
  for (const row of rows) {
    const teacherId = getMapping("teacher", row.teacher_id);
    const legacyId = toInt(row.taid, 0);
    if (!teacherId || !legacyId) {
      skipped++;
      continue;
    }

    const legacyTeacherId = toInt(row.teacher_id, 0) || null;
    const key = legacyKey(sourceDatabase, "t_teacher_address", legacyId);
    const street = cleanString(row.street);
    const city = cleanString(row.city);
    const region = cleanString(row.region);
    const building = cleanString(row.building);
    const createdAt = parseDate(row.datetime ?? "");

    const existingByKey = await prisma.teacherAddress.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.teacherAddress.findFirst({
        where: {
          teacherId,
          legacyKey: null,
          street,
          city,
          region,
          building,
        },
      }));

    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyTable: "t_teacher_address",
      legacyTeacherId,
      governorate: cleanString(row.muhafaza),
      district: cleanString(row.quadaa),
      region,
      city,
      street,
      building,
      legacyData: legacyRowData(
        sourceDatabase,
        "t_teacher_address",
        legacyId,
        row
      ),
      ...(createdAt ? { createdAt } : {}),
    };

    if (existing) {
      if (!dryRun) {
        await prisma.teacherAddress.update({
          where: { id: existing.id },
          data,
        });
      }
      setMapping("teacher_address", legacyId, existing.id);
      backfilled++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.teacherAddress.create({
        data: {
          id,
          teacherId,
          ...data,
        },
      });
    }
    setMapping("teacher_address", legacyId, id);
    migrated++;
  }
  log(
    `Teacher addresses: ${migrated} migrated, ${backfilled} existing/backfilled, ${skipped} skipped`
  );
}

interface OldTeacherAttachment {
  tattid: number;
  att_title: string;
  url: string;
  teacher_id: string;
  type: string;
  exp_date: string;
  active: number;
}

interface OldTeacherInfo {
  tinfid: number;
  info_type: string;
  place: string;
  kindofjob: string;
  wfrom: string;
  wto: string;
  teacher_id: string;
  datetime: string;
  active: number;
}

function mapExperienceType(value: string): ExperienceType {
  const normalized = value.toLowerCase().trim();
  if (normalized === "stage") return "STAGE";
  if (normalized === "shop") return "WORKSHOP";
  return "WORK";
}

async function migrateTeacherAttachments(
  prisma: PrismaClient,
  dryRun: boolean
) {
  const sourceDatabase = getMysqlConfig().database || "unknown";
  const rows = await queryMysql<OldTeacherAttachment>(
    "SELECT * FROM t_teacher_attachments WHERE active = 1"
  );
  let count = 0;
  let skipped = 0;
  for (const row of rows) {
    const legacyId = toInt(row.tattid);
    const legacyTeacherId = toInt(row.teacher_id);
    const teacherId = getMapping("teacher", legacyTeacherId);
    if (!teacherId || !legacyId) continue;
    const fileUrl = cleanLegacyFileName(row.url);
    if (!fileUrl) {
      skipped++;
      continue;
    }
    const filename = cleanString(row.att_title) ?? fileUrl;

    const key = legacyKey(sourceDatabase, "t_teacher_attachments", legacyId);
    const existing = await prisma.teacherAttachment.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      if (!dryRun) {
        await prisma.teacherAttachment.update({
          where: { id: existing.id },
          data: {
            sourceDatabase,
            legacyKey: key,
            legacyId,
            legacyTable: "t_teacher_attachments",
            legacyTeacherId,
            filename,
            fileUrl,
            type: cleanString(row.type),
            expiryDate: parseDate(row.exp_date),
          },
        });
      }
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.teacherAttachment.create({
        data: {
          id: generateUUID(),
          teacherId,
          sourceDatabase,
          legacyKey: key,
          legacyId,
          legacyTable: "t_teacher_attachments",
          legacyTeacherId,
          filename,
          fileUrl,
          type: cleanString(row.type),
          expiryDate: parseDate(row.exp_date),
        },
      });
    }
    count++;
  }
  log(`Teacher attachments: ${count} migrated, ${skipped} skipped`);
}

async function migrateTeacherExperiences(
  prisma: PrismaClient,
  dryRun: boolean
) {
  const rows = await queryMysql<OldTeacherInfo>(
    "SELECT * FROM t_teacher_info ORDER BY tinfid"
  );
  log(`Found ${rows.length} teacher info rows in t_teacher_info`);

  const sourceDatabase = getMysqlConfig().database || "unknown";
  let migrated = 0;
  let skipped = 0;
  let orphaned = 0;

  for (const row of rows) {
    const legacyId = toInt(row.tinfid);
    const legacyTeacherId = toInt(row.teacher_id);
    const teacherId = getMapping("teacher", legacyTeacherId);
    if (!teacherId || !legacyId) {
      orphaned++;
      continue;
    }

    const legacyKey = `${sourceDatabase}:t_teacher_info:${legacyId}`;
    const existing = await prisma.teacherExperience.findUnique({
      where: { legacyKey },
    });
    if (existing) {
      setMapping("teacher_info", legacyId, existing.id);
      skipped++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.teacherExperience.create({
        data: {
          id,
          sourceDatabase,
          legacyKey,
          legacyId,
          legacyTeacherId,
          teacherId,
          type: mapExperienceType(row.info_type),
          company: cleanString(row.place),
          position: cleanString(row.kindofjob),
          fromDate: parseDate(row.wfrom),
          toDate: parseDate(row.wto),
          isActive: toBool(row.active),
          legacyData: JSON.parse(JSON.stringify(row)),
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }

    setMapping("teacher_info", legacyId, id);
    migrated++;
    logProgress(migrated, rows.length, "Teacher Experiences");
  }

  log(
    `Teacher experiences: ${migrated} migrated, ${skipped} skipped, ${orphaned} orphaned`
  );
}

interface OldTeacherEmployeeEvent {
  id: number;
  emp_id: number;
  date: string;
  status: string;
  ref_nb: string;
  datetime: string;
  uby: number;
  active: number;
  dateto: string;
}

function mapEmployeeEventStatus(value: string): EmployeeEventStatus | null {
  const normalized = value.toLowerCase().trim();
  if (normalized === "sick") return "SICK";
  if (normalized === "absent") return "ABSENT";
  if (normalized === "day_off") return "DAY_OFF";
  if (normalized === "warning") return "WARNING";
  return null;
}

async function migrateTeacherEmployeeEvents(
  prisma: PrismaClient,
  dryRun: boolean
) {
  const rows = await queryMysql<OldTeacherEmployeeEvent>(
    "SELECT * FROM t_emp_status WHERE active = 1 ORDER BY id"
  );
  log(`Found ${rows.length} teacher status rows in t_emp_status`);

  const sourceDatabase = getMysqlConfig().database || "unknown";
  let migrated = 0;
  let skipped = 0;
  let orphaned = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id);
    const legacyTeacherId = toInt(row.emp_id);
    const teacherId = getMapping("teacher", legacyTeacherId);
    const status = mapEmployeeEventStatus(row.status);
    const date = parseDate(row.date);

    if (!legacyId || !teacherId || !status || !date) {
      orphaned++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_emp_status", legacyId);
    const existingByKey = await prisma.employeeEvent.findFirst({
      where: {
        notes: {
          contains: key,
        },
      },
    });
    const existing =
      existingByKey ??
      (await prisma.employeeEvent.findUnique({
        where: {
          employeeId_employeeType_date: {
            employeeId: teacherId,
            employeeType: "teacher",
            date,
          },
        },
      }));
    if (existing) {
      skipped++;
      continue;
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { branchId: true },
    });

    if (!dryRun) {
      await prisma.employeeEvent.create({
        data: {
          id: generateUUID(),
          employeeId: teacherId,
          employeeType: "teacher",
          status,
          date,
          referenceNumber: cleanString(row.ref_nb),
          notes: JSON.stringify({
            legacyKey: key,
            sourceDatabase,
            sourceTable: "t_emp_status",
            legacyId,
            legacyTeacherId,
            legacyStatus: row.status,
            legacyCreatedBy: row.uby,
            legacyData: row,
          }),
          branchId: teacher?.branchId ?? null,
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }

    migrated++;
    logProgress(migrated, rows.length, "Teacher Employee Events");
  }

  log(
    `Teacher employee events: ${migrated} migrated, ${skipped} skipped, ${orphaned} orphaned`
  );
}

interface OldTeacherAttendance {
  atid: number;
  readerid: string;
  readername: string;
  tdate: string;
  ttime: string;
  status: string;
  cardid: string;
  teacher_id: string;
  tdefault: string;
  datetime: string;
  uby: number;
  active: number;
}

type AttendanceTeacherMatch = {
  id: string;
  firstName: string;
  lastName: string;
  branchId: string;
};

function normalizeAttendanceName(value: string | null | undefined): string {
  const cleaned = cleanString(value);
  if (!cleaned) return "";
  return cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeAttendanceCard(value: string | null | undefined): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const withoutLeadingZeroes = cleaned.replace(/^0+/, "");
  return withoutLeadingZeroes || "0";
}

function parseAttendanceDate(value: string | null | undefined): Date | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const compact = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    const date = new Date(
      `${compact[1]}-${compact[2]}-${compact[3]}T00:00:00.000Z`
    );
    return isNaN(date.getTime()) ? null : date;
  }
  return parseDate(cleaned);
}

function parseAttendanceTime(value: string | null | undefined): Date | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  if (/^\d{1,4}$/.test(cleaned)) {
    const padded = cleaned.padStart(4, "0");
    const hours = Number(padded.slice(0, 2));
    const minutes = Number(padded.slice(2, 4));
    if (hours > 23 || minutes > 59) return null;
    return new Date(
      `1970-01-01T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`
    );
  }
  const time = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!time) return null;
  const hours = Number(time[1]);
  const minutes = Number(time[2]);
  const seconds = time[3] ? Number(time[3]) : 0;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return new Date(
    `1970-01-01T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.000Z`
  );
}

function mapAttendanceStatus(
  value: string | null | undefined,
  time: Date | null
): AttendanceLogStatus | null {
  const normalized = cleanString(value)?.toLowerCase().trim() ?? "";
  if (normalized === "out" || normalized === "exit" || normalized === "check_out") {
    return "CHECK_OUT";
  }
  if (
    normalized === "entry" ||
    normalized === "in" ||
    normalized === "check_in"
  ) {
    return time && time.getUTCHours() >= 12 ? "CHECK_OUT" : "CHECK_IN";
  }
  if (normalized === "late") return "LATE";
  if (normalized === "early_leave" || normalized === "early leave") {
    return "EARLY_LEAVE";
  }
  return null;
}

async function migrateTeacherAttendance(
  prisma: PrismaClient,
  dryRun: boolean
) {
  const rows = await queryMysql<OldTeacherAttendance>(
    "SELECT * FROM t_teacher_attendance WHERE active = 1 ORDER BY atid"
  );
  log(`Found ${rows.length} teacher attendance rows in t_teacher_attendance`);

  const sourceDatabase = getMysqlConfig().database || "unknown";
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      branchId: true,
    },
  });
  const teachersByName = new Map<string, AttendanceTeacherMatch[]>();
  for (const teacher of teachers) {
    const normalized = normalizeAttendanceName(
      `${teacher.firstName} ${teacher.lastName}`
    );
    if (!normalized) continue;
    const matches = teachersByName.get(normalized) ?? [];
    matches.push(teacher);
    teachersByName.set(normalized, matches);
  }

  const exactTeacherByName = new Map<string, AttendanceTeacherMatch>();
  for (const [name, matches] of teachersByName.entries()) {
    if (matches.length === 1) exactTeacherByName.set(name, matches[0]);
  }

  const teacherByCard = new Map<string, AttendanceTeacherMatch>();
  const ambiguousCards = new Set<string>();
  for (const row of rows) {
    const card = normalizeAttendanceCard(row.cardid);
    const name = normalizeAttendanceName(row.teacher_id);
    const teacher = exactTeacherByName.get(name);
    if (!card || !teacher || ambiguousCards.has(card)) continue;

    const existing = teacherByCard.get(card);
    if (existing && existing.id !== teacher.id) {
      teacherByCard.delete(card);
      ambiguousCards.add(card);
      continue;
    }
    teacherByCard.set(card, teacher);
  }

  let migrated = 0;
  let skipped = 0;
  let orphaned = 0;

  for (const row of rows) {
    const legacyId = toInt(row.atid);
    const key = legacyId
      ? legacyKey(sourceDatabase, "t_teacher_attendance", legacyId)
      : null;
    const date = parseAttendanceDate(row.tdate);
    const time = parseAttendanceTime(row.ttime);
    const card = normalizeAttendanceCard(row.cardid);
    const exactName = exactTeacherByName.get(
      normalizeAttendanceName(row.teacher_id)
    );
    const cardMatch = card ? teacherByCard.get(card) : undefined;
    const teacher = exactName ?? cardMatch;
    const status = mapAttendanceStatus(row.status, time);

    if (!legacyId || !key || !date || !time || !teacher) {
      orphaned++;
      continue;
    }

    const existingByKey = await prisma.teacherAttendance.findFirst({
      where: {
        note: {
          contains: key,
        },
      },
    });
    if (existingByKey) {
      setMapping("teacher_attendance", legacyId, existingByKey.id);
      skipped++;
      continue;
    }

    const isClockOut = status === "CHECK_OUT" || status === "EARLY_LEAVE";
    const existing = await prisma.teacherAttendance.findFirst({
      where: {
        employeeId: teacher.id,
        employeeType: "teacher",
        date,
        readerId: cleanString(row.readerid),
        readerName: cleanString(row.readername),
        cardId: cleanString(row.cardid),
        ...(isClockOut ? { timeOut: time } : { timeIn: time }),
      },
    });
    if (existing) {
      setMapping("teacher_attendance", legacyId, existing.id);
      skipped++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.teacherAttendance.create({
        data: {
          id,
          employeeId: teacher.id,
          employeeType: "teacher",
          date,
          timeIn: isClockOut ? null : time,
          timeOut: isClockOut ? time : null,
          status,
          readerId: cleanString(row.readerid),
          readerName: cleanString(row.readername),
          cardId: cleanString(row.cardid),
          note: JSON.stringify({
            legacyKey: key,
            sourceDatabase,
            sourceTable: "t_teacher_attendance",
            legacyId,
            legacyTeacherName: row.teacher_id,
            legacyStatus: row.status,
            legacyDefault: row.tdefault,
            legacyCreatedBy: row.uby,
            matchedBy: exactName ? "teacher_name" : "cardid_from_name_seed",
            legacyData: row,
          }),
          branchId: teacher.branchId,
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }

    setMapping("teacher_attendance", legacyId, id);
    migrated++;
    logProgress(migrated, rows.length, "Teacher Attendance");
  }

  log(
    `Teacher attendance: ${migrated} migrated, ${skipped} skipped, ${orphaned} orphaned`
  );
}

// ---------------------------------------------------------------------------
// Nurses
// ---------------------------------------------------------------------------
interface OldNurse {
  teacher_id: number;
  f_name: string;
  l_name: string;
  m_name: string;
  dob: string;
  pob: string;
  nationality: string;
  sel_gender: string;
  mobile: string;
  email: string;
  image: string;
  sel_branch: number;
  active: number;
  deleted: number;
  datetime: string;
}

async function migrateNurses(prisma: PrismaClient, dryRun: boolean) {
  const sourceDatabase = getMysqlConfig().database || "unknown";
  const rows = await queryMysql<OldNurse>(
    "SELECT * FROM t_nurse WHERE deleted = 0 ORDER BY teacher_id"
  );
  log(`Found ${rows.length} nurses in t_nurse`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const branchId = getMapping("branch", row.sel_branch);
    if (!branchId) {
      logError(`Nurse ${row.teacher_id} — branch ${row.sel_branch} not found`);
      continue;
    }

    const imageUrl = cleanLegacyFileName(row.image);
    const key = legacyKey(sourceDatabase, "t_nurse", row.teacher_id);
    const existingByKey = await prisma.nurse.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.nurse.findFirst({
        where: { firstName: row.f_name, lastName: row.l_name, branchId },
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
        legacyId: row.teacher_id,
        legacyTable: "t_nurse",
      };
      if (imageUrl && existing.imageUrl !== imageUrl) {
        updateData.imageUrl = imageUrl;
      }
      if (!dryRun) {
        await prisma.nurse.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      setMapping("nurse", row.teacher_id, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();
    if (!dryRun) {
      await prisma.nurse.create({
        data: {
          id: newId,
          sourceDatabase,
          legacyKey: key,
          legacyId: row.teacher_id,
          legacyTable: "t_nurse",
          firstName: row.f_name || "",
          lastName: row.l_name || "",
          mobile: cleanString(row.mobile),
          email: cleanString(row.email),
          nationality: cleanString(row.nationality),
          dateOfBirth: parseDate(row.dob),
          imageUrl,
          branchId,
          isActive: toBool(row.active),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }
    setMapping("nurse", row.teacher_id, newId);
    migrated++;
  }
  log(`Nurses: ${migrated} migrated, ${skipped} skipped`);

  // Nurse attachments
  const attachments = await queryMysql<OldTeacherAttachment>(
    "SELECT * FROM t_nurse_attachments WHERE active = 1"
  );
  let attCount = 0;
  let attSkipped = 0;
  for (const row of attachments) {
    const legacyId = toInt(row.tattid);
    const legacyNurseId = toInt(row.teacher_id);
    const nurseId = getMapping("nurse", legacyNurseId);
    if (!nurseId || !legacyId) continue;
    const fileUrl = cleanLegacyFileName(row.url);
    if (!fileUrl) {
      attSkipped++;
      continue;
    }
    const filename = cleanString(row.att_title) ?? fileUrl;

    const key = legacyKey(sourceDatabase, "t_nurse_attachments", legacyId);
    const existing = await prisma.nurseAttachment.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      if (!dryRun) {
        await prisma.nurseAttachment.update({
          where: { id: existing.id },
          data: {
            sourceDatabase,
            legacyKey: key,
            legacyId,
            legacyTable: "t_nurse_attachments",
            legacyNurseId,
            filename,
            fileUrl,
            type: cleanString(row.type),
            expiryDate: parseDate(row.exp_date),
          },
        });
      }
      attSkipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.nurseAttachment.create({
        data: {
          id: generateUUID(),
          nurseId,
          sourceDatabase,
          legacyKey: key,
          legacyId,
          legacyTable: "t_nurse_attachments",
          legacyNurseId,
          filename,
          fileUrl,
          type: cleanString(row.type),
          expiryDate: parseDate(row.exp_date),
        },
      });
    }
    attCount++;
  }
  log(`Nurse attachments: ${attCount} migrated, ${attSkipped} skipped`);
}

// ---------------------------------------------------------------------------
// Doctors
// ---------------------------------------------------------------------------
interface OldDoctor {
  did: number;
  dfname: string;
  dlname: string;
  muhafaza: string;
  country: string;
  quadaa: string;
  region: string;
  city: string;
  street: string;
  building: string;
  tel: string;
  remarks: string;
  active: number;
  datetime: string;
  [key: string]: unknown;
}

async function upsertDoctorAddress(
  prisma: PrismaClient,
  dryRun: boolean,
  doctorId: string,
  row: OldDoctor
) {
  if (!row.street && !row.city && !row.region && !row.building) return;

  const data = {
    governorate: cleanString(row.muhafaza),
    district: cleanString(row.quadaa),
    region: cleanString(row.region),
    city: cleanString(row.city),
    street: cleanString(row.street),
    building: cleanString(row.building),
  };

  if (dryRun) return;

  const existing = await prisma.doctorAddress.findFirst({
    where: { doctorId },
  });
  if (existing) {
    await prisma.doctorAddress.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  await prisma.doctorAddress.create({
    data: {
      id: generateUUID(),
      doctorId,
      ...data,
    },
  });
}

async function migrateDoctors(
  prisma: PrismaClient,
  dryRun: boolean,
  defaultBranchId: string
) {
  const sourceDatabase = getMysqlConfig().database || "unknown";
  const rows = await queryMysql<OldDoctor>(
    "SELECT * FROM t_doctor WHERE active = 1 ORDER BY did"
  );
  log(`Found ${rows.length} doctors in t_doctor`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.did, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_doctor", legacyId);
    const existingByKey = await prisma.doctor.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.doctor.findFirst({
        where: {
          firstName: row.dfname,
          lastName: row.dlname,
          legacyKey: null,
        },
      }));
    const createdAt = parseDate(row.datetime);
    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyTable: "t_doctor",
      firstName: row.dfname || "",
      lastName: row.dlname || "",
      phone: cleanString(row.tel),
      remarks: cleanString(row.remarks),
      branchId: defaultBranchId,
      isActive: toBool(row.active),
      legacyData: legacyRowData(sourceDatabase, "t_doctor", legacyId, row),
      ...(createdAt ? { createdAt } : {}),
    };

    if (existing) {
      if (!dryRun) {
        await prisma.doctor.update({
          where: { id: existing.id },
          data,
        });
      }
      await upsertDoctorAddress(prisma, dryRun, existing.id, row);
      setMapping("doctor", row.did, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();
    if (!dryRun) {
      await prisma.doctor.create({
        data: {
          id: newId,
          ...data,
        },
      });
    }
    await upsertDoctorAddress(prisma, dryRun, newId, row);
    setMapping("doctor", row.did, newId);
    migrated++;
  }
  log(`Doctors: ${migrated} migrated, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
// Managers
// ---------------------------------------------------------------------------
interface OldManager {
  teacher_id: number;
  f_name: string;
  l_name: string;
  m_name: string;
  f_name_ar: string;
  m_name_ar: string;
  l_name_ar: string;
  dob: string;
  pob: string;
  nationality: string;
  sel_gender: string;
  mobile: string;
  email: string;
  image: string;
  sel_branch: number;
  active: number;
  deleted: number;
  datetime: string;
}

async function migrateManagers(prisma: PrismaClient, dryRun: boolean) {
  const sourceDatabase = getMysqlConfig().database || "unknown";
  const rows = await queryMysql<OldManager>(
    "SELECT * FROM t_manager WHERE deleted = 0 ORDER BY teacher_id"
  );
  log(`Found ${rows.length} managers in t_manager`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const branchId = getMapping("branch", row.sel_branch);
    if (!branchId) {
      logError(
        `Manager ${row.teacher_id} — branch ${row.sel_branch} not found`
      );
      continue;
    }

    const imageUrl = cleanLegacyFileName(row.image);
    const key = legacyKey(sourceDatabase, "t_manager", row.teacher_id);
    const existingByKey = await prisma.manager.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.manager.findFirst({
        where: { firstName: row.f_name, lastName: row.l_name, branchId },
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
        legacyId: row.teacher_id,
        legacyTable: "t_manager",
      };
      if (imageUrl && existing.imageUrl !== imageUrl) {
        updateData.imageUrl = imageUrl;
      }
      if (!dryRun) {
        await prisma.manager.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      setMapping("manager", row.teacher_id, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();
    if (!dryRun) {
      await prisma.manager.create({
        data: {
          id: newId,
          sourceDatabase,
          legacyKey: key,
          legacyId: row.teacher_id,
          legacyTable: "t_manager",
          firstName: row.f_name || "",
          lastName: row.l_name || "",
          mobile: cleanString(row.mobile),
          email: cleanString(row.email),
          nationality: cleanString(row.nationality),
          dateOfBirth: parseDate(row.dob),
          imageUrl,
          branchId,
          isActive: toBool(row.active),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }
    setMapping("manager", row.teacher_id, newId);
    migrated++;
  }
  log(`Managers: ${migrated} migrated, ${skipped} skipped`);

  // Manager addresses
  const addrs = await queryMysql<OldTeacherAddress>(
    "SELECT * FROM t_manager_address WHERE active = 1"
  );
  let addrMigrated = 0;
  let addrBackfilled = 0;
  let addrSkipped = 0;
  for (const row of addrs) {
    const managerId = getMapping("manager", row.teacher_id);
    const legacyId = toInt(row.taid, 0);
    if (!managerId || !legacyId) {
      addrSkipped++;
      continue;
    }

    const legacyManagerId = toInt(row.teacher_id, 0) || null;
    const key = legacyKey(sourceDatabase, "t_manager_address", legacyId);
    const street = cleanString(row.street);
    const city = cleanString(row.city);
    const region = cleanString(row.region);
    const building = cleanString(row.building);
    const createdAt = parseDate(row.datetime ?? "");

    const existingByKey = await prisma.managerAddress.findUnique({
      where: { legacyKey: key },
    });
    const existing =
      existingByKey ??
      (await prisma.managerAddress.findFirst({
        where: {
          managerId,
          legacyKey: null,
          street,
          city,
          region,
          building,
        },
      }));

    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyTable: "t_manager_address",
      legacyManagerId,
      governorate: cleanString(row.muhafaza),
      district: cleanString(row.quadaa),
      region,
      city,
      street,
      building,
      legacyData: legacyRowData(
        sourceDatabase,
        "t_manager_address",
        legacyId,
        row
      ),
      ...(createdAt ? { createdAt } : {}),
    };

    if (existing) {
      if (!dryRun) {
        await prisma.managerAddress.update({
          where: { id: existing.id },
          data,
        });
      }
      setMapping("manager_address", legacyId, existing.id);
      addrBackfilled++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.managerAddress.create({
        data: {
          id,
          managerId,
          ...data,
        },
      });
    }
    setMapping("manager_address", legacyId, id);
    addrMigrated++;
  }
  log(
    `Manager addresses: ${addrMigrated} migrated, ${addrBackfilled} existing/backfilled, ${addrSkipped} skipped`
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function migrateEmployees(prisma: PrismaClient) {
  log("=== Migrating Employees ===");
  const dryRun = isDryRun();

  // Get a default branch for doctors (they have no branch_id in old schema)
  const firstBranch = await prisma.branch.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const defaultBranchId = firstBranch?.id;
  if (!defaultBranchId) {
    logError("No branches found — cannot migrate employees");
    return;
  }

  await migrateTeachers(prisma, dryRun);
  await migrateNurses(prisma, dryRun);
  await migrateDoctors(prisma, dryRun, defaultBranchId);
  await migrateManagers(prisma, dryRun);

  log(`=== Employee migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateEmployees(prisma);
    } catch (err) {
      logError("Employee migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
