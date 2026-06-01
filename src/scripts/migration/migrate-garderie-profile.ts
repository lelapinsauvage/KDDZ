/**
 * Migration: t_garderie + t_garderie_attachments + t_old_garderie
 *
 * Field mapping:
 *   t_garderie             -> BranchCompliance, with source key/raw JSON kept
 *   t_garderie_attachments -> BranchDocument, with source key/raw JSON kept
 *   t_old_garderie         -> ChildPreviousGarderie, preserving inactive history
 *
 * Prerequisites: Branches and Children must be migrated first.
 */

import type {
  DocumentStatus,
  DocumentType,
  PrismaClient,
} from "@/generated/prisma/client";
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
  toFloat,
  toInt,
} from "./lib/utils";

interface OldGarderieProfile {
  id: number;
  branch_id: number;
  formtype: string;
  special_for: string;
  special_num: string;
  special_date: string;
  name: string;
  father: string;
  family: string;
  mother: string;
  idnum: string;
  nationality: string;
  pob: string;
  dob: string;
  type: string;
  legal_name: string;
  companytype: string;
  type_others: string;
  sub_others: string;
  subject: string;
  regnum: string;
  regplace: string;
  regdate: string;
  res_name: string;
  res_position: string;
  res_nationality: string;
  res_phone: string;
  garderie_ar: string;
  garderie: string;
  gar_country: string;
  gar_muhafaza: string;
  gar_quadaa: string;
  gar_region: string;
  gar_street: string;
  gar_bldg: string;
  gar_floor: number | string;
  gar_post: string;
  gar_post_no: string;
  gar_tel: string;
  gar_phone: string;
  gar_fax: string;
  gar_email: string;
  gar_website: string;
  app_owner_name: string;
  app_num: string;
  app_regoin: string;
  app_muhafaza: string;
  app_quadaa: string;
  ownership: string;
  rent_name: string;
  rent_date: string;
  rentalverify: string;
  man_name: string;
  man_family: string;
  man_pos: string;
  doc_name: string;
  doc_father: string;
  doc_family: string;
  doc_pos: string;
  doc_reg_no: string;
  child_walk: number;
  child_n_walk: number;
  work_hours: number | string;
  daman: string;
  damantype: string;
  progress: number | string;
  uby: number;
  datetime: string | Date;
  latitude?: string;
  longitude?: string;
}

interface OldGarderieAttachment {
  fattid: number;
  branch_id: number;
  att_title: string;
  exp_date: string;
  start_date: string;
  url: string;
  type: string;
  datetime: string | Date;
  active: number;
}

interface OldPreviousGarderie {
  gid: number;
  gname: string;
  gyear: string;
  child_id: string;
  active: number;
  datetime: string | Date;
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

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

function completionPercentage(progress: unknown): number {
  const value = Math.round(toFloat(progress, 0));
  return Math.max(0, Math.min(value, 100));
}

function totalChildren(row: OldGarderieProfile): number | null {
  const walkers = toInt(row.child_walk, 0);
  const nonWalkers = toInt(row.child_n_walk, 0);
  const total = walkers + nonWalkers;
  return total > 0 ? total : null;
}

function mapDocumentType(type: string, title: string | null): DocumentType {
  const normalized = `${type} ${title ?? ""}`.toLowerCase();
  if (normalized.includes("id")) return "ID_COPY";
  if (normalized.includes("map")) return "BUILDING_MAP";
  if (normalized.includes("sanad")) return "PROPERTY_DEED";
  if (normalized.includes("rent") || normalized.includes("lease")) {
    return "LEASE_CONTRACT";
  }
  if (normalized.includes("profile") || normalized.includes("photo")) {
    return "CERTIFIED_PHOTO";
  }
  if (normalized.includes("daman") || normalized.includes("insurance")) {
    return "INSURANCE_CERTIFICATE";
  }
  return "OTHER";
}

function mapDocumentStatus(
  isActive: boolean,
  fileUrl: string | null,
  expiryDate: Date | null
): DocumentStatus {
  if (!isActive) return "EXPIRED";
  if (expiryDate && expiryDate < new Date()) return "EXPIRED";
  if (!fileUrl || fileUrl === "default.jpg") return "PENDING";
  return "UPLOADED";
}

async function migrateGarderieProfiles(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_garderie"))) {
    log("t_garderie: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldGarderieProfile>(
    "SELECT * FROM t_garderie ORDER BY id"
  );
  log(`Found ${rows.length} rows in t_garderie`);

  let migrated = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id);
    const branchId = getMapping("branch", row.branch_id);
    if (!legacyId || !branchId) {
      errors++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_garderie", legacyId);
    const existingByKey = await prisma.branchCompliance.findUnique({
      where: { legacyKey: key },
    });
    if (existingByKey) {
      setMapping("branch_compliance", legacyId, existingByKey.id);
      skipped++;
      continue;
    }

    const existingByBranch = await prisma.branchCompliance.findUnique({
      where: { branchId },
    });

    const data = {
      sourceDatabase,
      legacyKey: key,
      legacyId,
      legacyBranchId: toInt(row.branch_id, 0) || null,
      legacyUserId: toInt(row.uby, 0) || null,
      entityType: cleanString(row.type),
      legalName: cleanString(row.legal_name),
      organizationType: cleanString(row.companytype) ?? cleanString(row.type_others),
      companySubType: cleanString(row.sub_others),
      purpose: cleanString(row.subject),
      ownerFirstName: cleanString(row.name),
      ownerFatherName: cleanString(row.father),
      ownerFamilyName: cleanString(row.family),
      ownerMotherName: cleanString(row.mother),
      ownerDob: asDate(row.dob),
      ownerPlaceOfBirth: cleanString(row.pob),
      ownerNationality: cleanString(row.nationality),
      ownerRegistryNumber: cleanString(row.idnum),
      registrationNumber: cleanString(row.regnum),
      registrationPlace: cleanString(row.regplace),
      registrationDate: asDate(row.regdate),
      signatoryName: cleanString(row.res_name),
      signatoryRole: cleanString(row.res_position),
      signatoryNationality: cleanString(row.res_nationality),
      signatoryPhone: cleanString(row.res_phone),
      nameArabic: cleanString(row.garderie_ar),
      nameLatin: cleanString(row.garderie),
      country: cleanString(row.gar_country) ?? "Lebanon",
      governorate: cleanString(row.gar_muhafaza),
      district: cleanString(row.gar_quadaa),
      town: cleanString(row.gar_region),
      realEstateArea: cleanString(row.gar_region),
      street: cleanString(row.gar_street),
      building: cleanString(row.gar_bldg),
      floor: cleanString(row.gar_floor),
      addrPhone: cleanString(row.gar_tel),
      addrFax: cleanString(row.gar_fax),
      addrEmail: cleanString(row.gar_email),
      postalCode: cleanString(row.gar_post_no),
      poBox: cleanString(row.gar_post),
      addrMobile: cleanString(row.gar_phone),
      addrWebsite: cleanString(row.gar_website),
      ownerName: cleanString(row.app_owner_name),
      propertyGovernorate: cleanString(row.app_muhafaza),
      propertyDistrict: cleanString(row.app_quadaa),
      propertyRegion: cleanString(row.app_regoin),
      ownershipType: cleanString(row.ownership),
      specialFor: cleanString(row.special_for),
      specialNumber: cleanString(row.special_num),
      specialDate: asDate(row.special_date),
      applicationOwnerName: cleanString(row.app_owner_name),
      applicationNumber: cleanString(row.app_num),
      applicationRegion: cleanString(row.app_regoin),
      applicationGovernorate: cleanString(row.app_muhafaza),
      applicationDistrict: cleanString(row.app_quadaa),
      leaseOwnerName: cleanString(row.rent_name),
      leaseDate: asDate(row.rent_date),
      leaseVerified: cleanString(row.rentalverify),
      directorFirstName: cleanString(row.man_name),
      directorLastName: cleanString(row.man_family),
      directorSpecialty: cleanString(row.man_pos),
      doctorFirstName: cleanString(row.doc_name),
      doctorFatherName: cleanString(row.doc_father),
      doctorLastName: cleanString(row.doc_family),
      doctorSyndicateNo: cleanString(row.doc_reg_no),
      doctorSpecialty: cleanString(row.doc_pos),
      totalChildren: totalChildren(row),
      walkers: toInt(row.child_walk, 0) || null,
      nonWalkers: toInt(row.child_n_walk, 0) || null,
      workingHours: cleanString(row.work_hours),
      insuranceCompany: cleanString(row.daman),
      insuranceContractType: cleanString(row.damantype),
      completionPercentage: completionPercentage(row.progress),
      legacyLatitude: cleanString(row.latitude),
      legacyLongitude: cleanString(row.longitude),
      legacyData: legacyData(row),
      createdAt: asDate(row.datetime) ?? new Date(),
    };

    if (!dryRun) {
      if (existingByBranch) {
        await prisma.branchCompliance.update({
          where: { id: existingByBranch.id },
          data,
        });
        setMapping("branch_compliance", legacyId, existingByBranch.id);
        updated++;
      } else {
        const id = generateUUID();
        await prisma.branchCompliance.create({
          data: {
            id,
            branchId,
            ...data,
          },
        });
        setMapping("branch_compliance", legacyId, id);
        migrated++;
      }
    } else if (existingByBranch) {
      updated++;
    } else {
      migrated++;
    }

    logProgress(migrated + updated, rows.length, "Garderie Profiles");
  }

  log(
    `t_garderie: ${migrated} migrated, ${updated} updated, ${skipped} skipped, ${errors} errors`
  );
}

async function migrateGarderieAttachments(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_garderie_attachments"))) {
    log("t_garderie_attachments: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldGarderieAttachment>(
    "SELECT * FROM t_garderie_attachments ORDER BY fattid"
  );
  log(`Found ${rows.length} rows in t_garderie_attachments`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const legacyId = toInt(row.fattid);
    const branchId = getMapping("branch", row.branch_id);
    if (!legacyId || !branchId) {
      errors++;
      continue;
    }

    const key = legacyKey(sourceDatabase, "t_garderie_attachments", legacyId);
    const existing = await prisma.branchDocument.findUnique({
      where: { legacyKey: key },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const title = cleanString(row.att_title);
    const fileUrl = cleanString(row.url);
    const expiryDate = asDate(row.exp_date);
    const active = toBool(row.active);

    if (!dryRun) {
      await prisma.branchDocument.create({
        data: {
          id: generateUUID(),
          branchId,
          sourceDatabase,
          legacyKey: key,
          legacyId,
          legacyBranchId: toInt(row.branch_id, 0) || null,
          documentType: mapDocumentType(row.type, title),
          label: title,
          filename: fileUrl,
          fileUrl,
          issueDate: asDate(row.start_date),
          expiryDate,
          status: mapDocumentStatus(active, fileUrl, expiryDate),
          isActive: active,
          notes: active ? null : "Inactive in legacy t_garderie_attachments",
          legacyData: legacyData(row),
          createdAt: asDate(row.datetime) ?? new Date(),
        },
      });
    }

    migrated++;
    logProgress(migrated, rows.length, "Garderie Attachments");
  }

  log(
    `t_garderie_attachments: ${migrated} migrated, ${skipped} skipped, ${errors} errors`
  );
}

async function migratePreviousGarderies(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("t_old_garderie"))) {
    log("t_old_garderie: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldPreviousGarderie>(
    "SELECT * FROM t_old_garderie ORDER BY gid"
  );
  log(`Found ${rows.length} rows in t_old_garderie`);

  let migrated = 0;
  let skipped = 0;
  let childUpdates = 0;

  for (const row of rows) {
    const legacyId = toInt(row.gid);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const childId = getMapping("child", row.child_id);
    const active = toBool(row.active);
    const name = cleanString(row.gname);
    const key = legacyKey(sourceDatabase, "t_old_garderie", legacyId);
    const existing = await prisma.childPreviousGarderie.findUnique({
      where: { legacyKey: key },
    });

    if (!existing && !dryRun) {
      await prisma.childPreviousGarderie.create({
        data: {
          id: generateUUID(),
          sourceDatabase,
          legacyKey: key,
          legacyId,
          childId,
          legacyChildId: toInt(row.child_id, 0) || null,
          name,
          year: cleanString(row.gyear),
          isActive: active,
          legacyData: legacyData(row),
          createdAt: asDate(row.datetime) ?? new Date(),
        },
      });
    }

    if (existing) {
      skipped++;
    } else {
      migrated++;
    }

    if (childId && active) {
      if (!dryRun) {
        await prisma.child.update({
          where: { id: childId },
          data: {
            previousGarderie: true,
            previousGarderieName: name,
          },
        });
      }
      childUpdates++;
    }

    logProgress(migrated + skipped, rows.length, "Previous Garderies");
  }

  log(
    `t_old_garderie: ${migrated} migrated, ${skipped} skipped, ${childUpdates} child flags refreshed`
  );
}

export async function migrateGarderieProfile(prisma: PrismaClient) {
  log("=== Migrating Garderie Profile ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  await migrateGarderieProfiles(prisma, sourceDatabase, dryRun);
  await migrateGarderieAttachments(prisma, sourceDatabase, dryRun);
  await migratePreviousGarderies(prisma, sourceDatabase, dryRun);

  log(`=== Garderie profile migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateGarderieProfile(prisma);
    } catch (err) {
      logError("Garderie profile migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
