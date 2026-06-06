/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hashSync } from "bcryptjs";
import { randomUUID } from "crypto";
import * as path from "path";
import { parseSqlDump, type TableData } from "./lib/sql-parser";
import { getUUID, hasMapping } from "./lib/id-map";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const DUMP_DIR =
  "/Users/karimsaab/Desktop/Garderie-old-backup/ajax/annual backups";
const GARDERIE_DUMP = path.join(DUMP_DIR, "kiddzonl_garderie17-18.sql");
const USERS_DUMP = path.join(DUMP_DIR, "kiddzonl_users29sept.sql");

const BCRYPT_HASH = hashSync("changeme123", 10);
const CHUNK_SIZE = 500;
const NOW = new Date();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function col(row: any[], colName: string, columns: string[]): any {
  const idx = columns.indexOf(colName);
  if (idx === -1 || idx >= row.length) return null;
  return row[idx];
}

function colStr(row: any[], colName: string, columns: string[]): string | null {
  const val = col(row, colName, columns);
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function colInt(row: any[], colName: string, columns: string[]): number {
  const s = colStr(row, colName, columns);
  if (!s) return 0;
  return parseInt(s, 10) || 0;
}

function colFloat(row: any[], colName: string, columns: string[]): number {
  const s = colStr(row, colName, columns);
  if (!s) return 0;
  return parseFloat(s) || 0;
}

function colBool(row: any[], colName: string, columns: string[]): boolean {
  const val = col(row, colName, columns);
  return val === 1 || val === "1" || val === true || val === "Yes";
}

function parseDate(s: string | null): Date | null {
  if (!s || s === "0000-00-00" || s === "none" || s === "0000-00-00 00:00:00")
    return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseTime(s: string | null): Date | null {
  if (!s || s.trim() === "") return null;
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = match[1].padStart(2, "0");
  const m = match[2];
  return new Date(`1970-01-01T${h}:${m}:00.000Z`);
}

function parsePortion(s: string | null): string | null {
  if (!s || s.trim() === "") return null;
  switch (s.toLowerCase().trim()) {
    case "well":
      return "ALL";
    case "half":
      return "HALF";
    case "none":
      return "NONE";
    case "little":
      return "LITTLE";
    case "most":
      return "MOST";
    default:
      return null;
  }
}

function legacyRowData(row: any[], columns: string[]): Record<string, unknown> {
  return Object.fromEntries(columns.map((column, index) => [column, row[index] ?? null]));
}

function parseGender(s: string | null): "MALE" | "FEMALE" | null {
  if (!s) return null;
  const lower = s.toLowerCase().trim();
  if (lower === "male") return "MALE";
  if (lower === "female") return "FEMALE";
  return null;
}

function parseFoodCategory(
  s: string | null
): "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK" {
  if (!s) return "SNACK";
  const lower = s.toLowerCase().trim();
  if (lower === "breakfast" || lower === "break fast") return "BREAKFAST";
  if (lower === "lunch") return "LUNCH";
  if (lower === "dessert") return "DESSERT";
  return "SNACK";
}

function parsePaymentMethod(
  s: string | null
): "CASH" | "CHECK" | "TRANSFER" {
  if (!s) return "CASH";
  const lower = s.toLowerCase().trim();
  if (lower === "cash") return "CASH";
  if (lower === "check" || lower === "cheque") return "CHECK";
  if (lower === "creditcard" || lower === "credit card" || lower === "transfer")
    return "TRANSFER";
  return "CASH";
}

function parseUserRole(
  phpSerialized: string
): "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER" {
  // PHP serialized: a:1:{i:0;s:1:"6";} → extract level numbers
  const matches = phpSerialized.match(/s:\d+:\\"?(\d+)\\"?/g);
  if (!matches) return "TEACHER";
  const levels = matches.map((m) => {
    const num = m.match(/(\d+)\\"?$/);
    return num ? num[1] : "";
  });
  if (levels.includes("1") || levels.includes("4")) return "ADMIN";
  if (levels.includes("5")) return "MANAGER";
  if (levels.includes("12")) return "NURSE";
  if (levels.includes("6")) return "TEACHER";
  return "TEACHER";
}

function getTable(
  data: Map<string, TableData>,
  name: string
): { columns: string[]; rows: any[][] } {
  const table = data.get(name);
  if (!table) return { columns: [], rows: [] };
  return table;
}

async function createManyChunked(
  model: any,
  data: any[],
  label: string,
  chunkSize = CHUNK_SIZE
): Promise<number> {
  if (data.length === 0) return 0;
  let created = 0;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    try {
      await model.createMany({ data: chunk, skipDuplicates: true });
      created += chunk.length;
    } catch (err: any) {
      console.error(
        `  Error in ${label} chunk ${Math.floor(i / chunkSize) + 1}: ${err.message}`
      );
      // Try one-by-one for this chunk to skip bad records
      for (const record of chunk) {
        try {
          await model.create({ data: record });
          created++;
        } catch {
          // Skip individual bad records silently
        }
      }
    }
  }
  return created;
}

// ─────────────────────────────────────────────
// CLEAR ALL DATA
// ─────────────────────────────────────────────

async function clearAllData(prisma: PrismaClient) {
  console.log("Clearing existing data...");

  await prisma.pushToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.legacyNotificationLog.deleteMany();
  await prisma.legacyNotificationNature.deleteMany();
  await prisma.legacyLoginTimestamp.deleteMany();
  await prisma.legacyAuthRecord.deleteMany();
  await prisma.legacySetting.deleteMany();
  await prisma.legacyAccessControlRecord.deleteMany();
  await prisma.legacyGarderieRegistry.deleteMany();
  await prisma.legacyYearDatabase.deleteMany();
  await prisma.alarm.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.event.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.accountingEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.assessmentDate.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.foodCalendar.deleteMany();
  await prisma.food.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.medicalFormEntry.deleteMany();
  await prisma.medicalForm.deleteMany();
  await prisma.absenceAttachment.deleteMany();
  await prisma.absenceReport.deleteMany();
  await prisma.dailyReportAttachment.deleteMany();
  await prisma.dailyReportMilk.deleteMany();
  await prisma.dailyReportFever.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.childPreviousGarderie.deleteMany();
  await prisma.childHistory.deleteMany();
  await prisma.childAttachment.deleteMany();
  await prisma.relative.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.childAddress.deleteMany();
  await prisma.parentUser.deleteMany();
  await prisma.child.deleteMany();
  await prisma.managerAttachment.deleteMany();
  await prisma.managerAddress.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.doctorAttachment.deleteMany();
  await prisma.doctorAddress.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.nurseAttachment.deleteMany();
  await prisma.nurseAddress.deleteMany();
  await prisma.nurse.deleteMany();
  await prisma.teacherAttachment.deleteMany();
  await prisma.teacherAddress.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branchDocument.deleteMany();
  await prisma.branchCompliance.deleteMany();
  await prisma.region.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();
  await prisma.schoolYear.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.organization.deleteMany();

  console.log("  All data cleared.\n");
}

// ─────────────────────────────────────────────
// PHASE 1: GEOGRAPHIC LOOKUPS
// ─────────────────────────────────────────────

async function migrateProvinces(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_mouhafaza");
  console.log(`Migrating provinces (${rows.length} rows)...`);

  for (const row of rows) {
    const oldId = colInt(row, "m_id", columns);
    const name = colStr(row, "m_name", columns);
    if (!name || !oldId) continue;

    await prisma.province.create({
      data: {
        id: getUUID("t_mouhafaza", oldId),
        name: name.trim(),
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
  }
  console.log(`  Done: ${rows.length} provinces.\n`);
}

async function migrateDistricts(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_quadaa");
  console.log(`Migrating districts (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    const oldId = colInt(row, "qid", columns);
    const name = colStr(row, "qname", columns);
    const provinceOldId = colInt(row, "q_mid", columns);
    if (!name || !oldId || !provinceOldId) continue;
    if (!hasMapping("t_mouhafaza", provinceOldId)) continue;

    await prisma.district.create({
      data: {
        id: getUUID("t_quadaa", oldId),
        name: name.trim(),
        provinceId: getUUID("t_mouhafaza", provinceOldId),
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    count++;
  }
  console.log(`  Done: ${count} districts.\n`);
}

async function migrateRegions(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_region");
  console.log(`Migrating regions (${rows.length} rows)...`);

  const records = [];
  for (const row of rows) {
    const oldId = colInt(row, "rid", columns);
    const name = colStr(row, "rname", columns);
    const districtOldId = colInt(row, "r_qid", columns);
    if (!name || !oldId || !districtOldId) continue;
    if (!hasMapping("t_quadaa", districtOldId)) continue;

    records.push({
      id: getUUID("t_region", oldId),
      name: name.trim(),
      districtId: getUUID("t_quadaa", districtOldId),
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(
    prisma.region,
    records,
    "regions"
  );
  console.log(`  Done: ${created} regions.\n`);
}

// ─────────────────────────────────────────────
// PHASE 2: ORGANIZATION STRUCTURE
// ─────────────────────────────────────────────

async function createOrganization(prisma: PrismaClient): Promise<string> {
  console.log("Creating organization...");
  const org = await prisma.organization.create({
    data: {
      name: "KiddzOnline",
      slug: "kiddzonline",
      settings: { timezone: "Asia/Beirut", currency: "USD", language: "en" },
      createdAt: NOW,
      updatedAt: NOW,
    },
  });
  console.log(`  Done: organization ${org.id}\n`);
  return org.id;
}

async function migrateBranches(
  prisma: PrismaClient,
  data: Map<string, TableData>,
  orgId: string
) {
  const { columns, rows } = getTable(data, "t_branch");
  console.log(`Migrating branches (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    const oldId = colInt(row, "brid", columns);
    if (!oldId) continue;

    await prisma.branch.create({
      data: {
        id: getUUID("t_branch", oldId),
        organizationId: orgId,
        name: colStr(row, "brname", columns) || `Branch ${oldId}`,
        address: colStr(row, "brlocation", columns),
        phone: colStr(row, "tel", columns) || colStr(row, "mobile", columns),
        isActive: colBool(row, "active", columns),
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    count++;
  }
  console.log(`  Done: ${count} branches.\n`);
}

async function migrateSchoolYears(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_school_year");
  console.log(`Migrating school years (${rows.length} rows)...`);

  // Map year number → school year for child lookups
  for (const row of rows) {
    const oldId = colInt(row, "id", columns);
    const _sid = colInt(row, "sid", columns);
    const sdate = colStr(row, "sdate", columns);
    if (!oldId || !sdate) continue;

    const startYear = new Date(sdate).getFullYear();
    const endYear = startYear + 1;
    const label = `${startYear}-${endYear}`;

    await prisma.schoolYear.create({
      data: {
        id: getUUID("t_school_year", oldId),
        label,
        startDate: new Date(`${startYear}-10-01`),
        endDate: new Date(`${endYear}-06-30`),
        isActive: oldId === rows.length, // last one is active
        createdAt: NOW,
        updatedAt: NOW,
      },
    });

    // Also map by year number for child lookups: "2018" → school year UUID
    getUUID("school_year_by_num", startYear);
    // Store the mapping: school_year_by_num:startYear → same UUID as t_school_year:oldId
    // We need a custom approach since getUUID generates new UUIDs...
  }

  console.log(`  Done: ${rows.length} school years.\n`);
}

async function migrateClasses(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_class");
  console.log(`Migrating classes (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    const oldId = colInt(row, "clid", columns);
    const branchId = colInt(row, "branch_id", columns);
    if (!oldId || !branchId) continue;
    if (!hasMapping("t_branch", branchId)) continue;

    const ageFrom = colInt(row, "age_from", columns);
    const ageTo = colInt(row, "age_to", columns);
    const ageGroup =
      ageFrom || ageTo ? `${ageFrom}-${ageTo}` : null;

    await prisma.class.create({
      data: {
        id: getUUID("t_class", oldId),
        branchId: getUUID("t_branch", branchId),
        name: colStr(row, "classname", columns) || `Class ${oldId}`,
        capacity: colInt(row, "max_students", columns) || 15,
        ageGroup,
        isActive: colBool(row, "active", columns),
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    count++;
  }
  console.log(`  Done: ${count} classes.\n`);
}

// ─────────────────────────────────────────────
// PHASE 3: USERS & STAFF
// ─────────────────────────────────────────────

async function migrateUsers(
  prisma: PrismaClient,
  usersData: Map<string, TableData>
) {
  const { columns, rows } = getTable(usersData, "login_users");
  console.log(`Migrating users (${rows.length} rows)...`);

  const seenEmails = new Set<string>();
  let count = 0;

  for (const row of rows) {
    const oldId = colInt(row, "user_id", columns);
    const username = colStr(row, "username", columns) || "";
    const name = colStr(row, "name", columns) || username;
    const userLevel = colStr(row, "user_level", columns) || "";
    let email = colStr(row, "email", columns);
    const branchIdStr = colStr(row, "usites", columns);
    const branchOldId =
      branchIdStr && branchIdStr !== "0" ? parseInt(branchIdStr, 10) : 0;

    if (!oldId) continue;

    // Generate unique email if missing or duplicate
    if (!email || email === "noemail@mail.com" || email === "noemail@hotmail.com" || email === "") {
      email = `${username.toLowerCase().replace(/\s+/g, "")}@kiddzoline.local`;
    }
    if (seenEmails.has(email.toLowerCase())) {
      email = `${username.toLowerCase().replace(/\s+/g, "")}.${oldId}@kiddzoline.local`;
    }
    seenEmails.add(email.toLowerCase());

    const role = parseUserRole(userLevel);
    const branchId =
      branchOldId && hasMapping("t_branch", branchOldId)
        ? getUUID("t_branch", branchOldId)
        : null;

    await prisma.user.create({
      data: {
        id: getUUID("login_users", oldId),
        email,
        passwordHash: BCRYPT_HASH,
        name,
        role,
        isActive: true,
        branchId,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    count++;
  }
  console.log(`  Done: ${count} users.\n`);
}

async function migrateTeachers(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_teacher");
  console.log(`Migrating teachers (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    const oldId = colInt(row, "teacher_id", columns);
    const branchOldId = colInt(row, "sel_branch", columns);
    if (!oldId || !branchOldId) continue;
    if (!hasMapping("t_branch", branchOldId)) continue;
    if (colBool(row, "deleted", columns)) continue;

    const userOldId = colInt(row, "t_user_id", columns);

    await prisma.teacher.create({
      data: {
        id: getUUID("t_teacher", oldId),
        userId:
          userOldId && hasMapping("login_users", userOldId)
            ? getUUID("login_users", userOldId)
            : null,
        firstName: colStr(row, "f_name", columns) || "Unknown",
        lastName: colStr(row, "l_name", columns) || "Unknown",
        phone: colStr(row, "tel", columns),
        mobile: colStr(row, "mobile", columns),
        email: colStr(row, "email", columns),
        nationality: colStr(row, "nationality", columns),
        dateOfBirth: parseDate(colStr(row, "dob", columns)),
        branchId: getUUID("t_branch", branchOldId),
        specialization: colStr(row, "uni_degree", columns),
        isActive: colBool(row, "active", columns),
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    count++;
  }

  // Teacher addresses
  const addr = getTable(data, "t_teacher_address");
  if (addr.rows.length > 0) {
    // Deduplicate: keep highest taid per teacher_id with active=1
    const latestByTeacher = new Map<string, any[]>();
    for (const row of addr.rows) {
      const teacherOldId = colStr(row, "teacher_id", addr.columns);
      const active = colBool(row, "active", addr.columns);
      if (!teacherOldId || !active) continue;
      if (!hasMapping("t_teacher", parseInt(teacherOldId, 10))) continue;

      const taid = colInt(row, "taid", addr.columns);
      const existing = latestByTeacher.get(teacherOldId);
      if (!existing || taid > colInt(existing, "taid", addr.columns)) {
        latestByTeacher.set(teacherOldId, row);
      }
    }

    let addrCount = 0;
    for (const [teacherOldId, row] of latestByTeacher) {
      const street = [
        colStr(row, "street", addr.columns),
        colStr(row, "building", addr.columns),
      ]
        .filter(Boolean)
        .join(", ");

      await prisma.teacherAddress.create({
        data: {
          teacherId: getUUID("t_teacher", parseInt(teacherOldId, 10)),
          street: street || null,
          city: colStr(row, "city", addr.columns),
          region: null,
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
      addrCount++;
    }
    console.log(`  Teacher addresses: ${addrCount}`);
  }

  console.log(`  Done: ${count} teachers.\n`);
}

async function migrateNurses(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_nurse");
  console.log(`Migrating nurses (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    const oldId = colInt(row, "teacher_id", columns);
    const branchOldId = colInt(row, "sel_branch", columns);
    if (!oldId || !branchOldId) continue;
    if (!hasMapping("t_branch", branchOldId)) continue;
    if (colBool(row, "deleted", columns)) continue;

    await prisma.nurse.create({
      data: {
        id: getUUID("t_nurse", oldId),
        firstName: colStr(row, "f_name", columns) || "Unknown",
        lastName: colStr(row, "l_name", columns) || "Unknown",
        mobile: colStr(row, "mobile", columns),
        email: colStr(row, "email", columns),
        nationality: colStr(row, "nationality", columns),
        dateOfBirth: parseDate(colStr(row, "dob", columns)),
        branchId: getUUID("t_branch", branchOldId),
        specialization: colStr(row, "uni_degree", columns),
        isActive: colBool(row, "active", columns),
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    count++;
  }
  console.log(`  Done: ${count} nurses.\n`);
}

async function migrateDoctors(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_doctor");
  console.log(`Migrating doctors (${rows.length} rows)...`);

  // Doctors don't have a branch_id in old schema — assign to first branch
  const branchTable = getTable(data, "t_branch");
  const firstBranchOldId =
    branchTable.rows.length > 0
      ? colInt(branchTable.rows[0], "brid", branchTable.columns)
      : 1;

  let count = 0;
  for (const row of rows) {
    const oldId = colInt(row, "did", columns);
    if (!oldId) continue;

    const firstName = colStr(row, "dfname", columns) || "Unknown";
    const lastName = colStr(row, "dlname", columns) || "Unknown";

    const doctor = await prisma.doctor.create({
      data: {
        id: getUUID("t_doctor", oldId),
        firstName,
        lastName,
        phone: colStr(row, "tel", columns),
        branchId: getUUID("t_branch", firstBranchOldId),
        isActive: colBool(row, "active", columns),
        createdAt: NOW,
        updatedAt: NOW,
      },
    });

    // Create inline address if city/street exist
    const city = colStr(row, "city", columns);
    const street = colStr(row, "street", columns);
    if (city && city.toLowerCase() !== "no") {
      const addrStreet = [
        street && street.toLowerCase() !== "no" ? street : null,
        colStr(row, "building", columns),
      ]
        .filter((s) => s && s.toLowerCase() !== "no")
        .join(", ");

      await prisma.doctorAddress.create({
        data: {
          doctorId: doctor.id,
          street: addrStreet || null,
          city: city.toLowerCase() !== "no" ? city : null,
          region: null,
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
    }
    count++;
  }
  console.log(`  Done: ${count} doctors.\n`);
}

async function migrateManagers(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_manager");
  console.log(`Migrating managers (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    const oldId = colInt(row, "teacher_id", columns);
    const branchOldId = colInt(row, "sel_branch", columns);
    if (!oldId || !branchOldId) continue;
    if (!hasMapping("t_branch", branchOldId)) continue;
    if (colBool(row, "deleted", columns)) continue;

    const userOldId = colInt(row, "t_user_id", columns);

    await prisma.manager.create({
      data: {
        id: getUUID("t_manager", oldId),
        userId:
          userOldId && hasMapping("login_users", userOldId)
            ? getUUID("login_users", userOldId)
            : null,
        firstName: colStr(row, "f_name", columns) || "Unknown",
        lastName: colStr(row, "l_name", columns) || "Unknown",
        mobile: colStr(row, "mobile", columns),
        email: colStr(row, "email", columns),
        nationality: colStr(row, "nationality", columns),
        dateOfBirth: parseDate(colStr(row, "dob", columns)),
        branchId: getUUID("t_branch", branchOldId),
        specialization: colStr(row, "uni_degree", columns),
        isActive: colBool(row, "active", columns),
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    count++;
  }
  console.log(`  Done: ${count} managers.\n`);
}

// ─────────────────────────────────────────────
// PHASE 4: CHILDREN & FAMILY
// ─────────────────────────────────────────────

// Build a lookup: old year number → school year UUID
function buildSchoolYearLookup(
  data: Map<string, TableData>
): Map<string, string> {
  const lookup = new Map<string, string>();
  const { columns, rows } = getTable(data, "t_school_year");
  for (const row of rows) {
    const oldId = colInt(row, "id", columns);
    const sdate = colStr(row, "sdate", columns);
    if (!oldId || !sdate) continue;
    const startYear = String(new Date(sdate).getFullYear());
    lookup.set(startYear, getUUID("t_school_year", oldId));
  }
  return lookup;
}

async function migrateChildren(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_child");
  console.log(`Migrating children (${rows.length} rows)...`);

  const yearLookup = buildSchoolYearLookup(data);

  const records = [];
  for (const row of rows) {
    const oldId = colInt(row, "cid", columns);
    const branchOldId = colInt(row, "branch_id", columns);
    if (!oldId || !branchOldId) continue;
    if (!hasMapping("t_branch", branchOldId)) continue;
    if (colBool(row, "deleted", columns)) continue;

    const classOldId = colInt(row, "class_id", columns);
    const selYear = colStr(row, "sel_year", columns);
    const schoolYearId = selYear ? yearLookup.get(selYear) || null : null;

    const allergies = colStr(row, "allergy", columns);
    const diapers = colStr(row, "diapers", columns);
    const milkName = colStr(row, "milk_name", columns);
    const remarks = [
      colStr(row, "remarks", columns),
      colStr(row, "remarks_food", columns),
    ]
      .filter(Boolean)
      .join("; ");

    records.push({
      id: getUUID("t_child", oldId),
      firstName: colStr(row, "cname", columns) || "Unknown",
      middleName: colStr(row, "cmname", columns),
      lastName: colStr(row, "clname", columns) || "Unknown",
      dateOfBirth: parseDate(colStr(row, "dob", columns)),
      placeOfBirth: colStr(row, "pob", columns),
      gender: parseGender(colStr(row, "gender", columns)),
      nationality: colStr(row, "nationality", columns),
      bloodType: colStr(row, "blood_type", columns),
      allergies:
        allergies && allergies.toLowerCase() !== "no" ? allergies : null,
      branchId: getUUID("t_branch", branchOldId),
      classId:
        classOldId && hasMapping("t_class", classOldId)
          ? getUUID("t_class", classOldId)
          : null,
      schoolYearId,
      isActive: colBool(row, "active", columns),
      isDraft: colBool(row, "is_draft", columns),
      enrollmentDate: parseDate(colStr(row, "joining_date", columns)),
      busAttendance: colStr(row, "bus", columns)?.toLowerCase() === "yes",
      diaperType:
        diapers && diapers.toLowerCase() !== "no" ? diapers : null,
      milkType:
        milkName && milkName.toLowerCase() !== "no" ? milkName : null,
      milkPortions: colInt(row, "milk_portion", columns) || null,
      sleepFrom: parseTime(colStr(row, "sleep_from", columns)),
      sleepTo: parseTime(colStr(row, "sleep_to", columns)),
      remarks: remarks || null,
      language: colStr(row, "language", columns),
      createdAt: parseDate(colStr(row, "datetime", columns)) || NOW,
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(prisma.child, records, "children");
  console.log(`  Done: ${created} children.\n`);
}

async function migrateChildAddresses(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_address");
  console.log(`Migrating child addresses (${rows.length} rows)...`);

  // Deduplicate: keep highest aid per child_id with active=1
  const latestByChild = new Map<string, any[]>();
  for (const row of rows) {
    const childOldId = colStr(row, "child_id", columns);
    const active = colBool(row, "active", columns);
    if (!childOldId || !active) continue;
    if (!hasMapping("t_child", parseInt(childOldId, 10))) continue;

    const aid = colInt(row, "aid", columns);
    const existing = latestByChild.get(childOldId);
    if (!existing || aid > colInt(existing, "aid", columns)) {
      latestByChild.set(childOldId, row);
    }
  }

  const records = [];
  for (const [childOldId, row] of latestByChild) {
    const street = [
      colStr(row, "street", columns),
      colStr(row, "building", columns),
    ]
      .filter(Boolean)
      .join(", ");
    const regionOldId = colStr(row, "region", columns);
    const regionId =
      regionOldId &&
      regionOldId !== "0" &&
      hasMapping("t_region", parseInt(regionOldId, 10))
        ? getUUID("t_region", parseInt(regionOldId, 10))
        : null;

    records.push({
      id: randomUUID(),
      childId: getUUID("t_child", parseInt(childOldId, 10)),
      street: street || null,
      building: colStr(row, "building", columns),
      floor: colStr(row, "floor", columns),
      city: colStr(row, "city", columns),
      regionId,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(
    prisma.childAddress,
    records,
    "childAddresses"
  );
  console.log(`  Done: ${created} child addresses.\n`);
}

async function migrateParents(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_parents");
  console.log(`Migrating parents (${rows.length} rows)...`);

  // Deduplicate: keep highest pid per (child_id, relation)
  const latestByKey = new Map<string, any[]>();
  for (const row of rows) {
    const childOldId = colStr(row, "child_id", columns);
    const relation = colStr(row, "relation", columns);
    if (!childOldId || !relation) continue;
    if (!hasMapping("t_child", parseInt(childOldId, 10))) continue;

    const key = `${childOldId}:${relation.toLowerCase()}`;
    const pid = colInt(row, "pid", columns);
    const existing = latestByKey.get(key);
    if (!existing || pid > colInt(existing, "pid", columns)) {
      latestByKey.set(key, row);
    }
  }

  const records = [];
  for (const [, row] of latestByKey) {
    const childOldId = colStr(row, "child_id", columns)!;
    const relation = colStr(row, "relation", columns)!;
    const type =
      relation.toLowerCase() === "father" ? "FATHER" : "MOTHER";

    records.push({
      id: randomUUID(),
      childId: getUUID("t_child", parseInt(childOldId, 10)),
      type: type as "FATHER" | "MOTHER",
      firstName: colStr(row, "pname", columns),
      lastName: colStr(row, "plname", columns),
      phone: colStr(row, "parent_mobile", columns),
      email: colStr(row, "parent_email", columns),
      workplace: colStr(row, "profession", columns),
      workPhone: colStr(row, "work_tel", columns),
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(prisma.parent, records, "parents");
  console.log(`  Done: ${created} parents.\n`);
}

async function migrateRelatives(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_relatives");
  console.log(`Migrating relatives (${rows.length} rows)...`);

  // Deduplicate: keep active rows, dedup by (child_id, fname, relation)
  const seenKeys = new Set<string>();
  const records = [];

  for (const row of rows) {
    const childOldId = colStr(row, "child_id", columns);
    if (!childOldId) continue;
    if (!hasMapping("t_child", parseInt(childOldId, 10))) continue;
    if (!colBool(row, "active", columns)) continue;

    const fname = colStr(row, "fname", columns);
    if (!fname) continue;

    const relation = colStr(row, "relation", columns) || "";
    const key = `${childOldId}:${fname.toLowerCase()}:${relation.toLowerCase()}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    records.push({
      id: randomUUID(),
      childId: getUUID("t_child", parseInt(childOldId, 10)),
      name: fname,
      relation: relation || null,
      phone: colStr(row, "relative_phone", columns),
      isAuthorized: colStr(row, "can_pick", columns)?.toLowerCase() === "yes",
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(
    prisma.relative,
    records,
    "relatives"
  );
  console.log(`  Done: ${created} relatives.\n`);
}

// ─────────────────────────────────────────────
// PHASE 5: OPERATIONAL DATA
// ─────────────────────────────────────────────

async function migrateFoods(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_food");
  console.log(`Migrating foods (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    const oldId = colInt(row, "fid", columns);
    if (!oldId) continue;
    if (colBool(row, "deleted", columns)) continue;

    const name = colStr(row, "fname", columns) || "Unknown";
    const type = colStr(row, "type", columns);
    const active = colStr(row, "active", columns);

    await prisma.food.create({
      data: {
        id: getUUID("t_food", oldId),
        name,
        category: parseFoodCategory(type),
        isActive: active?.toLowerCase() === "on",
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    count++;
  }
  console.log(`  Done: ${count} foods.\n`);
}

async function migrateFoodCalendars(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_food_calendar");
  console.log(`Migrating food calendars (${rows.length} rows)...`);

  // Each old row has bfid (breakfast) and lnid (lunch) → split into separate rows
  // Unique constraint: [branchId, date, mealType]
  const seenKeys = new Set<string>();
  const records = [];

  for (const row of rows) {
    if (!colBool(row, "active", columns)) continue;

    const branchOldId = colInt(row, "branch_id", columns);
    const dateStr = colStr(row, "date", columns);
    if (!branchOldId || !dateStr) continue;
    if (!hasMapping("t_branch", branchOldId)) continue;

    const branchId = getUUID("t_branch", branchOldId);
    const date = parseDate(dateStr);
    if (!date) continue;
    const dateKey = date.toISOString().split("T")[0];

    // Breakfast
    const bfid = colInt(row, "bfid", columns);
    if (bfid && hasMapping("t_food", bfid)) {
      const key = `${branchId}:${dateKey}:BREAKFAST`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        records.push({
          id: randomUUID(),
          branchId,
          date,
          mealType: "BREAKFAST" as const,
          foodId: getUUID("t_food", bfid),
          createdAt: NOW,
          updatedAt: NOW,
        });
      }
    }

    // Lunch
    const lnid = colInt(row, "lnid", columns);
    if (lnid && hasMapping("t_food", lnid)) {
      const key = `${branchId}:${dateKey}:LUNCH`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        records.push({
          id: randomUUID(),
          branchId,
          date,
          mealType: "LUNCH" as const,
          foodId: getUUID("t_food", lnid),
          createdAt: NOW,
          updatedAt: NOW,
        });
      }
    }
  }

  const created = await createManyChunked(
    prisma.foodCalendar,
    records,
    "foodCalendars"
  );
  console.log(`  Done: ${created} food calendar entries.\n`);
}

async function migrateDailyReports(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_daily_report");
  console.log(`Migrating daily reports (${rows.length} rows)...`);

  // Deduplicate: keep highest report_id per (child_id, reportdate)
  const latestByKey = new Map<string, any[]>();
  for (const row of rows) {
    const childOldId = colStr(row, "child_id", columns);
    const reportDate = colStr(row, "reportdate", columns);
    if (!childOldId || !reportDate) continue;
    if (!hasMapping("t_child", parseInt(childOldId, 10))) continue;

    const key = `${childOldId}:${reportDate}`;
    const reportId = colInt(row, "report_id", columns);
    const existing = latestByKey.get(key);
    if (!existing || reportId > colInt(existing, "report_id", columns)) {
      latestByKey.set(key, row);
    }
  }

  console.log(
    `  Deduplicated: ${rows.length} → ${latestByKey.size} unique reports`
  );

  const records = [];
  for (const [, row] of latestByKey) {
    const reportId = colInt(row, "report_id", columns);
    const childOldId = colStr(row, "child_id", columns)!;
    const reportDate = parseDate(colStr(row, "reportdate", columns));
    if (!reportDate) continue;

    const breakfastId = colStr(row, "breakfast_id", columns);
    const lunchId = colStr(row, "lunch_id", columns);
    const bfFoodId =
      breakfastId &&
      breakfastId !== "0" &&
      breakfastId !== "" &&
      hasMapping("t_food", parseInt(breakfastId, 10))
        ? getUUID("t_food", parseInt(breakfastId, 10))
        : null;
    const lnFoodId =
      lunchId &&
      lunchId !== "0" &&
      lunchId !== "" &&
      hasMapping("t_food", parseInt(lunchId, 10))
        ? getUUID("t_food", parseInt(lunchId, 10))
        : null;

    records.push({
      id: getUUID("t_daily_report", reportId),
      childId: getUUID("t_child", parseInt(childOldId, 10)),
      reportDate,
      status: colBool(row, "is_rep_draft", columns)
        ? ("DRAFT" as const)
        : ("SUBMITTED" as const),
      breakfastFoodId: bfFoodId,
      breakfastPortion: parsePortion(colStr(row, "breakf", columns)),
      breakfastTime: parseTime(colStr(row, "bftime", columns)),
      lunchFoodId: lnFoodId,
      lunchPortion: parsePortion(colStr(row, "lunchf", columns)),
      lunchTime: parseTime(colStr(row, "lntime", columns)),
      dessert: colStr(row, "dessert", columns),
      dessertPortion: parsePortion(colStr(row, "dess_portion", columns)),
      dessertTime: parseTime(colStr(row, "desstime", columns)),
      isSleep: colBool(row, "is_sleep", columns),
      sleepFrom: parseTime(colStr(row, "sleep_from", columns)),
      sleepTo: parseTime(colStr(row, "sleep_to", columns)),
      diarrhea: colBool(row, "diahria", columns),
      urinePotty: colInt(row, "ur_pot", columns),
      stoolPotty: colInt(row, "stool_pot", columns),
      urineDiaper: colInt(row, "ur_di", columns),
      stoolDiaper: colInt(row, "stool_di", columns),
      remarks: colStr(row, "remarks", columns),
      cough: false,
      runnyNose: false,
      vomit: false,
      createdAt: parseDate(colStr(row, "datetime", columns)) || NOW,
      legacyData: legacyRowData(row, columns),
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(
    prisma.dailyReport,
    records,
    "dailyReports"
  );
  console.log(`  Done: ${created} daily reports.\n`);
}

async function migrateDailyFevers(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_daily_fever");
  console.log(`Migrating daily fevers (${rows.length} rows)...`);

  const records = [];
  for (const row of rows) {
    if (!colBool(row, "active", columns)) continue;

    const reportOldId = colInt(row, "report_id", columns);
    if (!reportOldId || !hasMapping("t_daily_report", reportOldId)) continue;

    let temp = colFloat(row, "fvalue", columns);
    // Fix values > 100 (e.g., 394 → 39.4)
    if (temp > 100) temp = temp / 10;
    if (temp <= 0) continue;

    const time = parseTime(colStr(row, "ftime", columns));
    if (!time) continue;

    records.push({
      id: randomUUID(),
      dailyReportId: getUUID("t_daily_report", reportOldId),
      temperature: String(temp),
      time,
      createdAt: NOW,
    });
  }

  const created = await createManyChunked(
    prisma.dailyReportFever,
    records,
    "dailyReportFevers"
  );
  console.log(`  Done: ${created} daily fevers.\n`);
}

async function migrateDailyMilks(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_daily_milk");
  console.log(`Migrating daily milks (${rows.length} rows)...`);

  const records = [];
  for (const row of rows) {
    if (!colBool(row, "active", columns)) continue;

    const reportOldId = colInt(row, "report_id", columns);
    if (!reportOldId || !hasMapping("t_daily_report", reportOldId)) continue;

    const cc = colInt(row, "mcc", columns);
    const time = parseTime(colStr(row, "mtime", columns));
    if (!time) continue;

    records.push({
      id: randomUUID(),
      dailyReportId: getUUID("t_daily_report", reportOldId),
      amountCc: cc || 0,
      time,
      createdAt: NOW,
    });
  }

  const created = await createManyChunked(
    prisma.dailyReportMilk,
    records,
    "dailyReportMilks"
  );
  console.log(`  Done: ${created} daily milks.\n`);
}

async function migrateAbsenceReports(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_absent_report");
  console.log(`Migrating absence reports (${rows.length} rows)...`);

  const records = [];
  for (const row of rows) {
    if (!colBool(row, "active", columns)) continue;

    const childOldId = colStr(row, "child_id", columns);
    const reportDate = colStr(row, "reportdate", columns);
    if (!childOldId || !reportDate) continue;
    if (!hasMapping("t_child", parseInt(childOldId, 10))) continue;

    const date = parseDate(reportDate);
    if (!date) continue;

    const reason = colStr(row, "ab_reason", columns);

    records.push({
      id: randomUUID(),
      childId: getUUID("t_child", parseInt(childOldId, 10)),
      date,
      reason,
      status: "APPROVED" as const,
      createdAt: parseDate(colStr(row, "datetime", columns)) || NOW,
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(
    prisma.absenceReport,
    records,
    "absenceReports"
  );
  console.log(`  Done: ${created} absence reports.\n`);
}

async function migrateMedicalForms(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  console.log("Migrating medical forms...");

  const formTypeMap: Record<string, string> = {
    t_form_1: "GENERAL",
    t_form_2: "CONDITIONS",
    t_form_3: "VISITS",
    t_form_4: "VACCINATIONS",
    t_form_5: "ACCIDENTS",
    t_form_6: "GENERAL",
  };

  let totalCount = 0;

  for (const [tableName, formType] of Object.entries(formTypeMap)) {
    const table = data.get(tableName);
    if (!table || table.rows.length === 0) continue;

    const { columns, rows } = table;

    for (const row of rows) {
      if (!colBool(row, "active", columns)) continue;

      const childOldId = colStr(row, "child_id", columns);
      if (!childOldId || !hasMapping("t_child", parseInt(childOldId, 10)))
        continue;

      // Store all columns as JSON data
      const jsonData: Record<string, any> = {};
      for (let c = 0; c < columns.length; c++) {
        if (c < row.length) {
          jsonData[columns[c]] = row[c];
        }
      }

      try {
        await prisma.medicalForm.create({
          data: {
            childId: getUUID("t_child", parseInt(childOldId, 10)),
            formType: formType as any,
            status: colBool(row, "is_rep_draft", columns)
              ? "DRAFT"
              : "SUBMITTED",
            data: jsonData,
            createdAt:
              parseDate(colStr(row, "datetime", columns)) || NOW,
            updatedAt: NOW,
          },
        });
        totalCount++;
      } catch {
        // Skip on error
      }
    }
  }

  console.log(`  Done: ${totalCount} medical forms.\n`);
}

async function migrateAssessments(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  console.log("Migrating assessments...");

  let totalCount = 0;

  for (let aType = 1; aType <= 7; aType++) {
    const tableName = `t_assessment_${aType}`;
    const table = data.get(tableName);
    if (!table || table.rows.length === 0) continue;

    const { columns, rows } = table;

    for (const row of rows) {
      if (!colBool(row, "active", columns)) continue;

      const childOldId = colStr(row, "child_id", columns);
      if (!childOldId || !hasMapping("t_child", parseInt(childOldId, 10)))
        continue;

      // Store all columns as JSON data
      const jsonData: Record<string, any> = {};
      for (let c = 0; c < columns.length; c++) {
        if (c < row.length) {
          jsonData[columns[c]] = row[c];
        }
      }

      try {
        await prisma.assessment.create({
          data: {
            childId: getUUID("t_child", parseInt(childOldId, 10)),
            assessmentType: aType,
            status: colBool(row, "is_draft", columns)
              ? "DRAFT"
              : "SUBMITTED",
            data: jsonData,
            createdAt:
              parseDate(colStr(row, "datetime", columns)) || NOW,
            updatedAt: NOW,
          },
        });
        totalCount++;
      } catch {
        // Skip on error
      }
    }
  }

  console.log(`  Done: ${totalCount} assessments.\n`);
}

async function migratePayments(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_payments");
  console.log(`Migrating payments (${rows.length} rows)...`);

  const records = [];
  for (const row of rows) {
    if (!colBool(row, "active", columns)) continue;

    const childOldId = colInt(row, "cid", columns);
    if (!childOldId || !hasMapping("t_child", childOldId)) continue;

    const amount = colFloat(row, "amount", columns);
    const dateStr = colStr(row, "datetime", columns);
    const date = parseDate(dateStr);
    if (!date) continue;

    const type = colStr(row, "type", columns);
    const target = colStr(row, "target", columns);
    const notes = colStr(row, "notes", columns);
    const cheque = colStr(row, "cheque", columns);

    records.push({
      id: randomUUID(),
      childId: getUUID("t_child", childOldId),
      amount: String(amount),
      date,
      method: parsePaymentMethod(type),
      reference: cheque || null,
      notes: [target, notes].filter(Boolean).join(" - ") || null,
      createdAt: date,
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(prisma.payment, records, "payments");
  console.log(`  Done: ${created} payments.\n`);
}

async function migrateAccountingEntries(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_accounting");
  console.log(`Migrating accounting entries (${rows.length} rows)...`);

  const records = [];
  for (const row of rows) {
    if (!colBool(row, "active", columns)) continue;

    const childOldId = colStr(row, "child_id", columns);
    if (!childOldId || !hasMapping("t_child", parseInt(childOldId, 10)))
      continue;

    // Sum all fee totals
    const generalTotal = colFloat(row, "general_fees_total", columns);
    const xtraTotal = colFloat(row, "xtra_fees_total", columns);
    const busTotal = colFloat(row, "bus_fees_total", columns);
    const apronTotal = colFloat(row, "apron_fees_total", columns);
    const regTotal = colFloat(row, "reg_fees_total", columns);
    const actTotal = colFloat(row, "act_fees_total", columns);
    const totalAmount =
      generalTotal + xtraTotal + busTotal + apronTotal + regTotal + actTotal;

    if (totalAmount === 0) continue;

    const dateStr = colStr(row, "datetime", columns);
    const date = parseDate(dateStr);
    if (!date) continue;

    const remarks = colStr(row, "accounting_remarks", columns);

    records.push({
      id: randomUUID(),
      childId: getUUID("t_child", parseInt(childOldId, 10)),
      description: remarks || "Tuition fees",
      amount: String(totalAmount),
      type: "FEE" as const,
      date,
      createdAt: date,
      updatedAt: NOW,
    });
  }

  const created = await createManyChunked(
    prisma.accountingEntry,
    records,
    "accountingEntries"
  );
  console.log(`  Done: ${created} accounting entries.\n`);
}

// ─────────────────────────────────────────────
// PHASE 6: CALENDAR & NOTIFICATIONS
// ─────────────────────────────────────────────

async function migrateHolidays(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_holiday");
  console.log(`Migrating holidays (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    if (!colBool(row, "active", columns)) continue;

    const name = colStr(row, "description", columns);
    const dateStr = colStr(row, "date", columns);
    const date = parseDate(dateStr);
    if (!name || !date) continue;

    try {
      await prisma.holiday.create({
        data: {
          name,
          date,
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
      count++;
    } catch {
      // Skip duplicates
    }
  }
  console.log(`  Done: ${count} holidays.\n`);
}

async function migrateEventTypes(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_events_types");
  console.log(`Migrating event types (${rows.length} rows)...`);

  for (const row of rows) {
    const oldId = colInt(row, "id", columns);
    const name = colStr(row, "event_name", columns);
    if (!oldId || !name) continue;

    await prisma.eventType.create({
      data: {
        id: getUUID("t_events_types", oldId),
        name,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
  }
  console.log(`  Done: ${rows.length} event types.\n`);
}

async function migrateEvents(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "t_events");
  console.log(`Migrating events (${rows.length} rows)...`);

  let count = 0;
  for (const row of rows) {
    if (!colBool(row, "active", columns)) continue;

    const eventTypeOldId = colInt(row, "eventType", columns);
    const dateStr = colStr(row, "edate", columns);
    const date = parseDate(dateStr);
    if (!date) continue;

    const subject = colStr(row, "custom_subject", columns) || "Event";

    try {
      await prisma.event.create({
        data: {
          title: subject,
          description: colStr(row, "custom_body", columns),
          date,
          eventTypeId:
            eventTypeOldId && hasMapping("t_events_types", eventTypeOldId)
              ? getUUID("t_events_types", eventTypeOldId)
              : null,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
      count++;
    } catch {
      // Skip on error
    }
  }
  console.log(`  Done: ${count} events.\n`);
}

async function migrateAlarms(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  console.log("Migrating alarms...");

  const alarmTableMap: Record<string, string> = {
    t_alarms_birthday: "BIRTHDAY",
    t_alarms_assessment: "ASSESSMENT",
    t_alarms_vaccinations: "VACCINATION",
    t_alarms_medical: "MEDICAL",
    t_alarms_medicine: "MEDICINE",
    t_alarms_insurance: "INSURANCE",
    t_alarms_payments: "PAYMENT",
    t_alarms_contracts: "CONTRACT",
    t_alarms_msg: "OTHER",
    t_alarms: "OTHER",
  };

  const records = [];

  for (const [tableName, alarmType] of Object.entries(alarmTableMap)) {
    const table = data.get(tableName);
    if (!table || table.rows.length === 0) continue;

    const { columns, rows } = table;

    for (const row of rows) {
      const details = colStr(row, "details", columns);
      const dateStr = colStr(row, "datetime", columns);
      const date = parseDate(dateStr);

      const childOldId = colInt(row, "child_id", columns);
      const referenceId =
        childOldId && hasMapping("t_child", childOldId)
          ? getUUID("t_child", childOldId)
          : null;

      records.push({
        id: randomUUID(),
        type: alarmType as any,
        referenceId,
        referenceType: referenceId ? "child" : null,
        message: details,
        dueDate: date,
        isActive: true,
        createdAt: date || NOW,
        updatedAt: NOW,
      });
    }
  }

  const created = await createManyChunked(prisma.alarm, records, "alarms");
  console.log(`  Done: ${created} alarms.\n`);
}

// ─────────────────────────────────────────────
// PHASE 7: PARENT PORTAL
// ─────────────────────────────────────────────

async function migrateParentUsers(
  prisma: PrismaClient,
  data: Map<string, TableData>
) {
  const { columns, rows } = getTable(data, "parent_login_users");
  console.log(`Migrating parent users (${rows.length} rows)...`);

  const seenUsernames = new Set<string>();
  let count = 0;

  for (const row of rows) {
    const oldId = colInt(row, "user_id", columns);
    const username = colStr(row, "username", columns);
    if (!oldId || !username) continue;

    // usites = child_id for parent users
    const childOldIdStr = colStr(row, "usites", columns);
    const childOldId = childOldIdStr ? parseInt(childOldIdStr, 10) : 0;
    if (!childOldId || !hasMapping("t_child", childOldId)) continue;

    // Skip duplicate usernames
    const normalizedUsername = username.toLowerCase().trim();
    if (seenUsernames.has(normalizedUsername)) continue;
    seenUsernames.add(normalizedUsername);

    try {
      await prisma.parentUser.create({
        data: {
          id: getUUID("parent_login_users", oldId),
          username: normalizedUsername,
          passwordHash: BCRYPT_HASH,
          isActive: true,
          childId: getUUID("t_child", childOldId),
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
      count++;
    } catch (err: any) {
      // Skip on unique constraint errors
      if (!err.message?.includes("Unique constraint")) {
        console.error(`  Error creating parent user ${username}: ${err.message}`);
      }
    }
  }
  console.log(`  Done: ${count} parent users.\n`);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  KiddzOnline Data Migration");
  console.log("  Old PHP/MySQL → New Prisma/PostgreSQL");
  console.log("═══════════════════════════════════════════════\n");

  // Setup Prisma
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter }) as any;

  try {
    // Parse SQL dumps
    console.log("Parsing SQL dumps...");
    console.log(`  Garderie: ${GARDERIE_DUMP}`);
    const garderieData = parseSqlDump(GARDERIE_DUMP);
    console.log(
      `  Parsed ${garderieData.size} tables from garderie dump.`
    );

    console.log(`  Users: ${USERS_DUMP}`);
    const usersData = parseSqlDump(USERS_DUMP);
    console.log(
      `  Parsed ${usersData.size} tables from users dump.\n`
    );

    // Print summary of source tables
    console.log("Key source table counts:");
    for (const name of [
      "t_child",
      "t_parents",
      "t_address",
      "t_daily_report",
      "t_daily_milk",
      "t_daily_fever",
      "t_absent_report",
      "t_food",
      "t_payments",
      "t_teacher",
      "t_region",
    ]) {
      const t = garderieData.get(name);
      if (t) console.log(`  ${name}: ${t.rows.length} rows`);
    }
    const loginUsers = usersData.get("login_users");
    if (loginUsers) console.log(`  login_users: ${loginUsers.rows.length} rows`);
    console.log("");

    // Clear all existing data
    await clearAllData(prisma);

    // Phase 1: Geographic lookups
    console.log("── Phase 1: Geographic Lookups ──\n");
    await migrateProvinces(prisma, garderieData);
    await migrateDistricts(prisma, garderieData);
    await migrateRegions(prisma, garderieData);

    // Phase 2: Organization structure
    console.log("── Phase 2: Organization Structure ──\n");
    const orgId = await createOrganization(prisma);
    await migrateBranches(prisma, garderieData, orgId);
    await migrateSchoolYears(prisma, garderieData);
    await migrateClasses(prisma, garderieData);

    // Phase 3: Users & Staff
    console.log("── Phase 3: Users & Staff ──\n");
    await migrateUsers(prisma, usersData);
    await migrateTeachers(prisma, garderieData);
    await migrateNurses(prisma, garderieData);
    await migrateDoctors(prisma, garderieData);
    await migrateManagers(prisma, garderieData);

    // Phase 4: Children & family
    console.log("── Phase 4: Children & Family ──\n");
    await migrateChildren(prisma, garderieData);
    await migrateChildAddresses(prisma, garderieData);
    await migrateParents(prisma, garderieData);
    await migrateRelatives(prisma, garderieData);

    // Phase 5: Operational data
    console.log("── Phase 5: Operational Data ──\n");
    await migrateFoods(prisma, garderieData);
    await migrateFoodCalendars(prisma, garderieData);
    await migrateDailyReports(prisma, garderieData);
    await migrateDailyFevers(prisma, garderieData);
    await migrateDailyMilks(prisma, garderieData);
    await migrateAbsenceReports(prisma, garderieData);
    await migrateMedicalForms(prisma, garderieData);
    await migrateAssessments(prisma, garderieData);
    await migratePayments(prisma, garderieData);
    await migrateAccountingEntries(prisma, garderieData);

    // Phase 6: Calendar & notifications
    console.log("── Phase 6: Calendar & Notifications ──\n");
    await migrateHolidays(prisma, garderieData);
    await migrateEventTypes(prisma, garderieData);
    await migrateEvents(prisma, garderieData);
    await migrateAlarms(prisma, garderieData);

    // Phase 7: Parent portal
    console.log("── Phase 7: Parent Portal ──\n");
    await migrateParentUsers(prisma, garderieData);

    // Final summary
    console.log("═══════════════════════════════════════════════");
    console.log("  Migration Complete!");
    console.log("═══════════════════════════════════════════════");
    console.log('  All passwords set to: "changeme123"');
    console.log("  Run the app and verify data is correct.\n");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
