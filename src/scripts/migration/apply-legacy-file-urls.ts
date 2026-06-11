import fs from "fs";
import path from "path";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { log, logError } from "./lib/utils";

type UploadStatus =
  | "uploaded"
  | "skipped"
  | "dry-run"
  | "not-exported"
  | "missing-package-file"
  | "unsafe-key"
  | "error";

type ApplyStatus =
  | "updated"
  | "would-update"
  | "already-current"
  | "not-uploaded"
  | "missing-public-url"
  | "not-found"
  | "no-provenance"
  | "unsupported-destination"
  | "error";

interface LegacyFileUploadEntry {
  status: UploadStatus;
  sourceDatabase: string;
  ruleId: string;
  legacyTable: string;
  legacyColumn: string;
  legacyId: number | string | null;
  ownerId: number | string | null;
  title: string | null;
  active: number | string | null;
  filename: string | null;
  exportStatus: string;
  packagePath: string | null;
  storageKey: string | null;
  objectKey: string | null;
  publicUrl: string | null;
  bytes: number | null;
  provider: string;
  bucket: string | null;
  modernDestination: string;
  modernStorageKeyPrefix: string;
  reason?: string;
}

interface LegacyFileUploadManifest {
  schemaVersion?: number;
  generatedAt: string;
  sourceManifest: string;
  sourceDatabase: string;
  dryRun: boolean;
  provider: string;
  bucket: string | null;
  publicBaseUrl: string | null;
  entries: LegacyFileUploadEntry[];
}

interface LegacyFileUrlApplyEntry {
  status: ApplyStatus;
  sourceDatabase: string;
  ruleId: string;
  legacyTable: string;
  legacyColumn: string;
  legacyId: number | string | null;
  ownerId: number | string | null;
  filename: string | null;
  uploadStatus: UploadStatus;
  storageKey: string | null;
  objectKey: string | null;
  publicUrl: string | null;
  modernDestination: string;
  targetModel: string | null;
  targetField: string | null;
  affectedRows: number;
  reason?: string;
}

interface LegacyFileUrlApplyManifest {
  schemaVersion: 1;
  generatedAt: string;
  sourceUploadManifest: string;
  sourceUploadManifestGeneratedAt: string;
  sourceUploadManifestSchemaVersion: number | null;
  sourceDatabase: string;
  dryRun: boolean;
  uploadWasDryRun: boolean;
  totals: Record<ApplyStatus, number>;
  entries: LegacyFileUrlApplyEntry[];
}

interface LocatedRow {
  id: string;
  value: string | null;
}

interface LocatedChildHistoryRow {
  id: string;
  snapshot: Record<string, unknown>;
  value: string | null;
}

interface ApplyContext {
  prisma: PrismaClient;
  entry: LegacyFileUploadEntry;
  publicUrl: string;
  dryRun: boolean;
}

interface ApplyRowsParams {
  entry: LegacyFileUploadEntry;
  publicUrl: string;
  dryRun: boolean;
  targetModel: string;
  targetField: string;
  rows: LocatedRow[];
  updateRow: (id: string) => Promise<void>;
}

const NO_PROVENANCE_REASONS: Record<string, string> = {};

const UNSUPPORTED_DESTINATION_REASONS: Record<string, string> = {};

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function hasArg(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function usage(): string {
  return [
    "Usage:",
    "  pnpm tsx src/scripts/migration/apply-legacy-file-urls.ts \\",
    "    --manifest=/tmp/kiddzonl-legacy-file-upload.json --dry-run",
    "",
    "Options:",
    "  --manifest=<path>       Required upload manifest from upload-legacy-file-export.ts.",
    "  --out-manifest=<path>   URL-application report path.",
    "  --json=<path>           Alias for --out-manifest.",
    "  --rule=<rule-id>        Apply only one legacy file rule.",
    "  --dry-run               Report rows that would change without updating PostgreSQL.",
    "  --fail-on-warning       Exit non-zero on not-uploaded, missing-public-url, not-found, no-provenance, unsupported, or error entries.",
  ].join("\n");
}

function readUploadManifest(manifestPath: string): LegacyFileUploadManifest {
  const raw = fs.readFileSync(manifestPath, "utf8");
  const parsed = JSON.parse(raw) as LegacyFileUploadManifest;
  if (!Array.isArray(parsed.entries)) {
    throw new Error(`Invalid legacy file upload manifest: ${manifestPath}`);
  }
  return parsed;
}

function emptyTotals(): Record<ApplyStatus, number> {
  return {
    updated: 0,
    "would-update": 0,
    "already-current": 0,
    "not-uploaded": 0,
    "missing-public-url": 0,
    "not-found": 0,
    "no-provenance": 0,
    "unsupported-destination": 0,
    error: 0,
  };
}

function legacyIdNumber(entry: LegacyFileUploadEntry): number | null {
  if (entry.legacyId == null || entry.legacyId === "") return null;
  const value =
    typeof entry.legacyId === "number"
      ? entry.legacyId
      : Number.parseInt(String(entry.legacyId), 10);
  return Number.isFinite(value) ? value : null;
}

function snapshotObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizedString(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function applyEntry(params: {
  entry: LegacyFileUploadEntry;
  status: ApplyStatus;
  targetModel?: string | null;
  targetField?: string | null;
  affectedRows?: number;
  reason?: string;
}): LegacyFileUrlApplyEntry {
  return {
    status: params.status,
    sourceDatabase: params.entry.sourceDatabase,
    ruleId: params.entry.ruleId,
    legacyTable: params.entry.legacyTable,
    legacyColumn: params.entry.legacyColumn,
    legacyId: params.entry.legacyId,
    ownerId: params.entry.ownerId,
    filename: params.entry.filename,
    uploadStatus: params.entry.status,
    storageKey: params.entry.storageKey,
    objectKey: params.entry.objectKey,
    publicUrl: params.entry.publicUrl,
    modernDestination: params.entry.modernDestination,
    targetModel: params.targetModel ?? null,
    targetField: params.targetField ?? null,
    affectedRows: params.affectedRows ?? 0,
    reason: params.reason,
  };
}

async function applyRows(
  params: ApplyRowsParams
): Promise<LegacyFileUrlApplyEntry> {
  const {
    entry,
    publicUrl,
    dryRun,
    targetModel,
    targetField,
    rows,
    updateRow,
  } = params;

  if (rows.length === 0) {
    return applyEntry({
      entry,
      status: "not-found",
      targetModel,
      targetField,
      reason: "No migrated row matched sourceDatabase and legacyId.",
    });
  }

  const staleRows = rows.filter((row) => row.value !== publicUrl);
  if (staleRows.length === 0) {
    return applyEntry({
      entry,
      status: "already-current",
      targetModel,
      targetField,
      affectedRows: rows.length,
    });
  }

  if (dryRun) {
    return applyEntry({
      entry,
      status: "would-update",
      targetModel,
      targetField,
      affectedRows: staleRows.length,
    });
  }

  for (const row of staleRows) {
    await updateRow(row.id);
  }

  return applyEntry({
    entry,
    status: "updated",
    targetModel,
    targetField,
    affectedRows: staleRows.length,
  });
}

async function applyBranchPhoto(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "Branch",
      targetField: "imageUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.branch.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, imageUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "Branch",
    targetField: "imageUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.imageUrl })),
    updateRow: (id) =>
      context.prisma.branch
        .update({ where: { id }, data: { imageUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyClassPhoto(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "Class",
      targetField: "imageUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.class.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, imageUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "Class",
    targetField: "imageUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.imageUrl })),
    updateRow: (id) =>
      context.prisma.class
        .update({ where: { id }, data: { imageUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyChildPhoto(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "Child",
      targetField: "photo",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.child.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, photo: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "Child",
    targetField: "photo",
    rows: rows.map((row) => ({ id: row.id, value: row.photo })),
    updateRow: (id) =>
      context.prisma.child
        .update({ where: { id }, data: { photo: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyChildHistoryPhoto(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "ChildHistory",
      targetField: "snapshot.image",
      reason: "Missing numeric legacyId.",
    });
  }

  const filename = normalizedString(context.entry.filename);
  if (!filename) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "ChildHistory",
      targetField: "snapshot.image",
      reason: "Missing legacy filename.",
    });
  }

  const children = await context.prisma.child.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyId,
    },
    select: { id: true },
  });

  if (children.length === 0) {
    return applyEntry({
      entry: context.entry,
      status: "not-found",
      targetModel: "ChildHistory",
      targetField: "snapshot.image",
      reason: "No migrated child matched sourceDatabase and legacyId.",
    });
  }

  const histories = await context.prisma.childHistory.findMany({
    where: {
      changeNote: "Legacy t_child_h snapshot",
      childId: { in: children.map((child) => child.id) },
    },
    select: { id: true, snapshot: true },
  });

  const rows: LocatedChildHistoryRow[] = histories.flatMap((history) => {
    const snapshot = snapshotObject(history.snapshot);
    if (!snapshot) return [];
    if (normalizedString(snapshot.sourceTable) !== context.entry.legacyTable) {
      return [];
    }

    const image = normalizedString(snapshot.image);
    if (image !== filename && image !== context.publicUrl) return [];

    return [{ id: history.id, snapshot, value: image }];
  });

  if (rows.length === 0) {
    return applyEntry({
      entry: context.entry,
      status: "not-found",
      targetModel: "ChildHistory",
      targetField: "snapshot.image",
      reason:
        "No legacy child history snapshot matched sourceDatabase, child legacyId, sourceTable, and image filename.",
    });
  }

  const staleRows = rows.filter((row) => row.value !== context.publicUrl);
  if (staleRows.length === 0) {
    return applyEntry({
      entry: context.entry,
      status: "already-current",
      targetModel: "ChildHistory",
      targetField: "snapshot.image",
      affectedRows: rows.length,
    });
  }

  if (context.dryRun) {
    return applyEntry({
      entry: context.entry,
      status: "would-update",
      targetModel: "ChildHistory",
      targetField: "snapshot.image",
      affectedRows: staleRows.length,
    });
  }

  for (const row of staleRows) {
    await context.prisma.childHistory.update({
      where: { id: row.id },
      data: {
        snapshot: {
          ...row.snapshot,
          image: context.publicUrl,
        } as Prisma.InputJsonValue,
      },
    });
  }

  return applyEntry({
    entry: context.entry,
    status: "updated",
    targetModel: "ChildHistory",
    targetField: "snapshot.image",
    affectedRows: staleRows.length,
  });
}

async function applyChildAttachment(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "ChildAttachment",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.childAttachment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "ChildAttachment",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.childAttachment
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyBranchDocument(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "BranchDocument",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.branchDocument.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "BranchDocument",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.branchDocument
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyDoctorPhoto(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "Doctor",
      targetField: "imageUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.doctor.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, imageUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "Doctor",
    targetField: "imageUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.imageUrl })),
    updateRow: (id) =>
      context.prisma.doctor
        .update({ where: { id }, data: { imageUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyDoctorAttachment(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "DoctorAttachment",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.doctorAttachment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "DoctorAttachment",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.doctorAttachment
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyTeacherPhoto(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "Teacher",
      targetField: "imageUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.teacher.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, imageUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "Teacher",
    targetField: "imageUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.imageUrl })),
    updateRow: (id) =>
      context.prisma.teacher
        .update({ where: { id }, data: { imageUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyTeacherAttachment(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "TeacherAttachment",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.teacherAttachment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "TeacherAttachment",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.teacherAttachment
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyNursePhoto(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "Nurse",
      targetField: "imageUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.nurse.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, imageUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "Nurse",
    targetField: "imageUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.imageUrl })),
    updateRow: (id) =>
      context.prisma.nurse
        .update({ where: { id }, data: { imageUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyNurseAttachment(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "NurseAttachment",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.nurseAttachment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "NurseAttachment",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.nurseAttachment
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyManagerPhoto(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "Manager",
      targetField: "imageUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.manager.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, imageUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "Manager",
    targetField: "imageUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.imageUrl })),
    updateRow: (id) =>
      context.prisma.manager
        .update({ where: { id }, data: { imageUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyManagerAttachment(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "ManagerAttachment",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.managerAttachment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "ManagerAttachment",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.managerAttachment
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyDailyReportAttachment(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "DailyReportAttachment",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.dailyReportAttachment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "DailyReportAttachment",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.dailyReportAttachment
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyAbsenceAttachment(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "AbsenceAttachment",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.absenceAttachment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyTable: context.entry.legacyTable,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "AbsenceAttachment",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.absenceAttachment
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyPaymentReceipt(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "Payment",
      targetField: "receiptFileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.payment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyId,
    },
    select: { id: true, receiptFileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "Payment",
    targetField: "receiptFileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.receiptFileUrl })),
    updateRow: (id) =>
      context.prisma.payment
        .update({ where: { id }, data: { receiptFileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

async function applyFormAttachment(
  context: ApplyContext
): Promise<LegacyFileUrlApplyEntry> {
  const legacyId = legacyIdNumber(context.entry);
  if (!legacyId) {
    return applyEntry({
      entry: context.entry,
      status: "error",
      targetModel: "FormAttachment",
      targetField: "fileUrl",
      reason: "Missing numeric legacyId.",
    });
  }

  const rows = await context.prisma.formAttachment.findMany({
    where: {
      sourceDatabase: context.entry.sourceDatabase,
      legacyId,
    },
    select: { id: true, fileUrl: true },
  });

  return applyRows({
    entry: context.entry,
    publicUrl: context.publicUrl,
    dryRun: context.dryRun,
    targetModel: "FormAttachment",
    targetField: "fileUrl",
    rows: rows.map((row) => ({ id: row.id, value: row.fileUrl })),
    updateRow: (id) =>
      context.prisma.formAttachment
        .update({ where: { id }, data: { fileUrl: context.publicUrl } })
        .then(() => undefined),
  });
}

const APPLY_BY_RULE: Record<
  string,
  (context: ApplyContext) => Promise<LegacyFileUrlApplyEntry>
> = {
  "branch-photo": applyBranchPhoto,
  "class-photo": applyClassPhoto,
  "child-photo": applyChildPhoto,
  "child-draft-photo": applyChildPhoto,
  "child-history-photo": applyChildHistoryPhoto,
  "child-document": applyChildAttachment,
  "garderie-document": applyBranchDocument,
  "teacher-photo": applyTeacherPhoto,
  "teacher-document": applyTeacherAttachment,
  "nurse-photo": applyNursePhoto,
  "nurse-document": applyNurseAttachment,
  "doctor-photo": applyDoctorPhoto,
  "doctor-document": applyDoctorAttachment,
  "manager-photo": applyManagerPhoto,
  "manager-document": applyManagerAttachment,
  "payment-receipt": applyPaymentReceipt,
  "daily-attachment": applyDailyReportAttachment,
  "absence-attachment": applyAbsenceAttachment,
  "medical-form-document": applyFormAttachment,
  "form-attachment": applyFormAttachment,
};

async function applyUploadEntry(
  prisma: PrismaClient,
  entry: LegacyFileUploadEntry,
  dryRun: boolean
): Promise<LegacyFileUrlApplyEntry> {
  try {
    if (NO_PROVENANCE_REASONS[entry.ruleId]) {
      return applyEntry({
        entry,
        status: "no-provenance",
        reason: NO_PROVENANCE_REASONS[entry.ruleId],
      });
    }

    if (UNSUPPORTED_DESTINATION_REASONS[entry.ruleId]) {
      return applyEntry({
        entry,
        status: "unsupported-destination",
        reason: UNSUPPORTED_DESTINATION_REASONS[entry.ruleId],
      });
    }

    if (entry.status !== "uploaded" && entry.status !== "skipped") {
      return applyEntry({
        entry,
        status: "not-uploaded",
        reason: `Upload status was ${entry.status}.`,
      });
    }

    if (!entry.publicUrl) {
      return applyEntry({
        entry,
        status: "missing-public-url",
        reason: "Upload manifest entry has no publicUrl.",
      });
    }

    const handler = APPLY_BY_RULE[entry.ruleId];
    if (!handler) {
      return applyEntry({
        entry,
        status: "unsupported-destination",
        reason: `No URL application handler for rule ${entry.ruleId}.`,
      });
    }

    return await handler({
      prisma,
      entry,
      publicUrl: entry.publicUrl,
      dryRun,
    });
  } catch (err) {
    return applyEntry({
      entry,
      status: "error",
      reason: err instanceof Error ? err.message : String(err),
    });
  }
}

async function applyLegacyFileUrls(): Promise<LegacyFileUrlApplyManifest> {
  if (hasArg("help") || hasArg("h")) {
    console.log(usage());
    process.exit(0);
  }

  const manifestArg = argValue("manifest");
  if (!manifestArg) {
    throw new Error(`--manifest is required.\n\n${usage()}`);
  }

  const manifestPath = path.resolve(manifestArg);
  const uploadManifest = readUploadManifest(manifestPath);
  const outManifest = path.resolve(
    argValue("out-manifest") ||
      argValue("json") ||
      path.join(path.dirname(manifestPath), "file-url-apply-manifest.json")
  );
  const onlyRule = argValue("rule");
  const dryRun = hasArg("dry-run");
  const failOnWarning = hasArg("fail-on-warning");

  if (uploadManifest.dryRun && !dryRun) {
    throw new Error(
      "The upload manifest was generated with --dry-run. Re-run this script with --dry-run or upload files for real first."
    );
  }

  const entries = onlyRule
    ? uploadManifest.entries.filter((entry) => entry.ruleId === onlyRule)
    : uploadManifest.entries;

  if (onlyRule && entries.length === 0) {
    throw new Error(`No upload manifest entries found for rule: ${onlyRule}`);
  }

  log(
    `${dryRun ? "Planning" : "Applying"} storage URLs for ${entries.length} upload manifest entries`
  );
  log(`Upload manifest: ${manifestPath}`);
  log(`Upload provider: ${uploadManifest.provider}`);

  const prisma = createPrismaClient();
  const totals = emptyTotals();
  const results: LegacyFileUrlApplyEntry[] = [];

  try {
    for (const entry of entries) {
      const result = await applyUploadEntry(prisma, entry, dryRun);
      results.push(result);
      totals[result.status]++;
    }
  } finally {
    await prisma.$disconnect();
  }

  const manifest: LegacyFileUrlApplyManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceUploadManifest: manifestPath,
    sourceUploadManifestGeneratedAt: uploadManifest.generatedAt,
    sourceUploadManifestSchemaVersion: uploadManifest.schemaVersion ?? null,
    sourceDatabase: uploadManifest.sourceDatabase,
    dryRun,
    uploadWasDryRun: uploadManifest.dryRun,
    totals,
    entries: results,
  };

  fs.mkdirSync(path.dirname(outManifest), { recursive: true });
  fs.writeFileSync(outManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  log(`Wrote legacy file URL apply manifest to ${outManifest}`);
  log(
    `Legacy file URL apply totals: ${totals.updated} updated, ` +
      `${totals["would-update"]} would-update, ` +
      `${totals["already-current"]} already-current, ` +
      `${totals["not-uploaded"]} not-uploaded, ` +
      `${totals["missing-public-url"]} missing public URLs, ` +
      `${totals["not-found"]} not found, ` +
      `${totals["no-provenance"]} no provenance, ` +
      `${totals["unsupported-destination"]} unsupported, ${totals.error} errors`
  );

  if (
    failOnWarning &&
    (totals["not-uploaded"] > 0 ||
      totals["missing-public-url"] > 0 ||
      totals["not-found"] > 0 ||
      totals["no-provenance"] > 0 ||
      totals["unsupported-destination"] > 0 ||
      totals.error > 0)
  ) {
    throw new Error("Legacy file URL apply warnings found.");
  }

  return manifest;
}

if (require.main === module) {
  applyLegacyFileUrls().catch((err) => {
    logError("Legacy file URL application failed", err);
    process.exit(1);
  });
}
