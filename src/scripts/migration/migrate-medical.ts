/**
 * Migration: Medical forms from old DB to new MedicalForm + MedicalFormEntry
 *
 * Old DB structure:
 *   t_form_1 (Medical Dossier)     → MedicalForm (formType=GENERAL)
 *   t_form_2 (Health Assessment)   → MedicalForm (formType=CONDITIONS)
 *   t_form_3 (Physical Exam)       → MedicalForm (formType=VISITS)
 *   t_form_4 (Vaccinations)        → MedicalForm (formType=VACCINATIONS)
 *   t_form_5 (Accident Report)     → MedicalForm (formType=ACCIDENTS)
 *   t_form_6 (Parent Call Report)  → stored as JSON data in MedicalForm
 *   t_med_forms_info               → MedicalFormEntry rows
 *   t_forms_attachments            → FormAttachment
 *
 * Strategy:
 *   Each old form row creates one MedicalForm record.
 *   All the form's specific fields are stored in MedicalForm.data (JSON).
 *   Related t_med_forms_info rows become MedicalFormEntry records.
 *
 * Prerequisites: Children must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  getMapping,
  isDryRun,
  toBool,
  toInt,
  cleanLegacyFileName,
  cleanString,
  log,
  logError,
  logProgress,
  parseDate,
} from "./lib/utils";

type MedFormType =
  | "GENERAL"
  | "CONDITIONS"
  | "VISITS"
  | "VACCINATIONS"
  | "ACCIDENTS";
type MedFormStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

// ---------------------------------------------------------------------------
// Generic form migration helper
// ---------------------------------------------------------------------------
async function migrateFormTable(
  prisma: PrismaClient,
  dryRun: boolean,
  tableName: string,
  formType: MedFormType,
  formTypeKey: string,
  idColumn: string,
  childIdColumn: string
) {
  const rows = await queryMysql<Record<string, unknown>>(
    `SELECT * FROM ${tableName} WHERE active = 1 ORDER BY ${idColumn}`
  );
  log(`Found ${rows.length} records in ${tableName}`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const oldId = row[idColumn] as number;
    const childId = getMapping("child", row[childIdColumn] as string);
    if (!childId) continue;

    // Idempotency: check if form already exists for this child+type
    // Use the old ID in mapping to avoid false positives for children with multiple forms
    const _mapKey = `${formTypeKey}_${oldId}`;
    const existing = await prisma.medicalForm.findFirst({
      where: {
        childId,
        formType,
        // Check data JSON for old_id match
      },
    });

    // More precise idempotency: store old ID in data JSON
    if (existing) {
      const data = existing.data as Record<string, unknown> | null;
      if (data && data._oldId === oldId) {
        setMapping(formTypeKey, oldId, existing.id);
        skipped++;
        continue;
      }
    }

    const isDraft = toBool(row.is_rep_draft);
    const status: MedFormStatus = isDraft ? "DRAFT" : "SUBMITTED";

    // Store all form fields as JSON data
    const data: Record<string, unknown> = { _oldId: oldId };
    for (const [key, val] of Object.entries(row)) {
      if (
        key !== idColumn &&
        key !== childIdColumn &&
        key !== "active" &&
        key !== "datetime" &&
        key !== "is_rep_draft" &&
        key !== "uby"
      ) {
        data[key] = val;
      }
    }

    const newId = generateUUID();

    if (!dryRun) {
      await prisma.medicalForm.create({
        data: {
          id: newId,
          childId,
          formType,
          status,
          data: JSON.parse(JSON.stringify(data)),
          createdAt: row.datetime
            ? new Date(row.datetime as string)
            : new Date(),
        },
      });
    }

    setMapping(formTypeKey, oldId, newId);
    migrated++;
    logProgress(migrated, rows.length, tableName);
  }

  log(`${tableName}: ${migrated} migrated, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
// Migrate t_med_forms_info → MedicalFormEntry
// ---------------------------------------------------------------------------
interface OldMedFormInfo {
  medfid: number;
  form_id: number;
  medtype: string;
  formtype: string;
  medname: string;
  medcomment: string;
  meddate: string;
  medtime: string;
  medcase: string;
  remarks: string;
  child_id: string;
  expiry: string;
  active: number;
}

interface OldFormAttachment {
  fattid: number;
  att_title: string;
  url: string;
  child_id: string;
  formtype: string;
  formid: string;
  class_id: string;
  branch_id: string;
  datetime: string;
  active: number;
}

async function migrateMedFormEntries(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldMedFormInfo>(
    "SELECT * FROM t_med_forms_info WHERE active = 1 ORDER BY medfid"
  );
  log(`Found ${rows.length} medical form info entries`);

  let migrated = 0;

  for (const row of rows) {
    // Map formtype to our mapping key
    const formTypeKey = row.formtype; // e.g., "form1", "form2"
    const medicalFormId = getMapping(formTypeKey, row.form_id);
    if (!medicalFormId) continue;

    // Build a combined value from all info fields
    const valueParts: string[] = [];
    if (row.medname) valueParts.push(`name: ${row.medname}`);
    if (row.medcomment) valueParts.push(`comment: ${row.medcomment}`);
    if (row.meddate) valueParts.push(`date: ${row.meddate}`);
    if (row.medtime) valueParts.push(`time: ${row.medtime}`);
    if (row.medcase) valueParts.push(`case: ${row.medcase}`);
    if (row.remarks) valueParts.push(`remarks: ${row.remarks}`);
    if (row.expiry) valueParts.push(`expiry: ${row.expiry}`);

    const field = `${row.medtype || "general"}`;
    const value = valueParts.join("; ") || null;

    if (!dryRun) {
      await prisma.medicalFormEntry.create({
        data: {
          id: generateUUID(),
          medicalFormId,
          field,
          value,
          legacyData: {
            sourceDatabase: getMysqlConfig().database || "unknown",
            sourceTable: "t_med_forms_info",
            ...row,
          },
        },
      });
    }
    migrated++;
  }

  log(`Medical form entries: ${migrated} migrated`);
}

async function migrateFormAttachments(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldFormAttachment>(
    "SELECT * FROM t_forms_attachments ORDER BY fattid"
  );
  log(`Found ${rows.length} form attachments in t_forms_attachments`);

  const sourceDatabase = getMysqlConfig().database || "unknown";
  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyKey = `${sourceDatabase}:t_forms_attachments:${row.fattid}`;
    const existing = await prisma.formAttachment.findUnique({
      where: { legacyKey },
    });
    if (existing) {
      setMapping("forms_attachment", row.fattid, existing.id);
      skipped++;
      continue;
    }

    const formType = cleanString(row.formtype) ?? "unknown";
    const legacyFormId = toInt(row.formid, 0) || null;
    const fileUrl = cleanLegacyFileName(row.url);
    if (!fileUrl) {
      skipped++;
      continue;
    }
    const filename = cleanString(row.att_title) ?? fileUrl;
    const id = generateUUID();

    if (!dryRun) {
      await prisma.formAttachment.create({
        data: {
          id,
          sourceDatabase,
          legacyKey,
          legacyId: row.fattid,
          formType,
          legacyFormId,
          childId: getMapping("child", row.child_id),
          medicalFormId: legacyFormId
            ? getMapping(formType, legacyFormId)
            : null,
          callLogId:
            formType === "form6" && legacyFormId
              ? getMapping("call_log", legacyFormId)
              : null,
          legacyChildId: toInt(row.child_id, 0) || null,
          legacyClassId: toInt(row.class_id, 0) || null,
          legacyBranchId: toInt(row.branch_id, 0) || null,
          title: cleanString(row.att_title),
          filename,
          fileUrl,
          isActive: toBool(row.active),
          legacyData: JSON.parse(JSON.stringify(row)),
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }

    setMapping("forms_attachment", row.fattid, id);
    migrated++;
    logProgress(migrated, rows.length, "Form Attachments");
  }

  log(`Form Attachments: ${migrated} migrated, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
// Migrate t_form_4 vaccinations → Vaccination model
// ---------------------------------------------------------------------------
async function migrateVaccinations(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<Record<string, unknown>>(
    "SELECT * FROM t_form_4 WHERE active = 1 ORDER BY form_id"
  );
  log(`Found ${rows.length} vaccination forms in t_form_4`);

  // Vaccine field pairs: [dateField, statusField, vaccineName]
  const vaccineFields: [string, string, string][] = [
    ["hepdate", "hep", "Hepatitis B"],
    ["ipvdate", "ipv", "IPV"],
    ["opvdate1", "opv1", "OPV Dose 1"],
    ["opvdate2", "opv2", "OPV Dose 2"],
    ["opvdate3", "opv3", "OPV Dose 3"],
    ["opvdate4", "opv4", "OPV Dose 4"],
    ["opvdate5", "opv5", "OPV Dose 5"],
    ["dptdate1", "dpt1", "DPT Dose 1"],
    ["dptdate2", "dpt2", "DPT Dose 2"],
    ["dptdate3", "dpt3", "DPT Dose 3"],
    ["dptdate4", "dpt4", "DPT Dose 4"],
    ["hasbedate1", "hasbe1", "Hepatitis B Booster"],
    ["mmrdate1", "mmr1", "MMR Dose 1"],
    ["mmrdate2", "mmr2", "MMR Dose 2"],
    ["ndptdate", "ndpt", "NDPT"],
    ["dtdate1", "dt1", "DT"],
  ];

  let count = 0;
  for (const row of rows) {
    const childId = getMapping("child", row.child_id as string);
    if (!childId) continue;

    for (const [dateField, statusField, vaccineName] of vaccineFields) {
      const dateVal = cleanString(row[dateField]);
      const statusVal = cleanString(row[statusField]);

      // Only create if there's meaningful data
      if (!dateVal && !statusVal) continue;

      if (!dryRun) {
        // Check idempotency
        const existing = await prisma.vaccination.findFirst({
          where: { childId, vaccineName },
        });
        if (existing) continue;

        await prisma.vaccination.create({
          data: {
            id: generateUUID(),
            childId,
            vaccineName,
            dateGiven: dateVal
              ? (() => {
                  const d = new Date(dateVal);
                  return isNaN(d.getTime()) ? null : d;
                })()
              : null,
            notes: statusVal,
          },
        });
      }
      count++;
    }
  }
  log(`Vaccinations: ${count} created from t_form_4`);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function migrateMedical(prisma: PrismaClient) {
  log("=== Migrating Medical Forms ===");
  const dryRun = isDryRun();

  // Form 1 — Medical Dossier → GENERAL
  await migrateFormTable(
    prisma,
    dryRun,
    "t_form_1",
    "GENERAL",
    "form1",
    "form_id",
    "child_id"
  );

  // Form 2 — Health Assessment → CONDITIONS
  await migrateFormTable(
    prisma,
    dryRun,
    "t_form_2",
    "CONDITIONS",
    "form2",
    "form_id",
    "child_id"
  );

  // Form 3 — Physical Examination → VISITS
  await migrateFormTable(
    prisma,
    dryRun,
    "t_form_3",
    "VISITS",
    "form3",
    "form_id",
    "child_id"
  );

  // Form 4 — Vaccinations → VACCINATIONS (also creates Vaccination records)
  await migrateFormTable(
    prisma,
    dryRun,
    "t_form_4",
    "VACCINATIONS",
    "form4",
    "form_id",
    "child_id"
  );
  await migrateVaccinations(prisma, dryRun);

  // Form 5 — Accident Report → ACCIDENTS
  await migrateFormTable(
    prisma,
    dryRun,
    "t_form_5",
    "ACCIDENTS",
    "form5",
    "form_id",
    "child_id"
  );

  // Form 6 — Parent Call Report → stored as GENERAL with call data
  await migrateFormTable(
    prisma,
    dryRun,
    "t_form_6",
    "GENERAL",
    "form6",
    "form_id",
    "child_id"
  );

  // Med form info entries (linked to forms 1-6)
  await migrateMedFormEntries(prisma, dryRun);
  await migrateFormAttachments(prisma, dryRun);

  log(`=== Medical migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateMedical(prisma);
    } catch (err) {
      logError("Medical migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
