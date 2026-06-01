import fs from "fs";
import path from "path";

import { closeMysqlPool, getMysqlConfig, queryMysql } from "./lib/mysql-client";
import { log, logError } from "./lib/utils";
import {
  getDefaultLegacyRoot,
  getLegacyDirectoryPath,
  LEGACY_FILE_RULES,
  type LegacyFileRule,
} from "./legacy-file-rules";

interface ColumnRow {
  Field: string;
}

interface LegacyFileRow {
  legacy_id: number | string | null;
  file_value: string | null;
  title_value?: string | null;
  owner_value?: number | string | null;
  active_value?: number | string | null;
}

type ExportStatus =
  | "exported"
  | "found"
  | "missing"
  | "default"
  | "unsafe"
  | "table-missing"
  | "column-missing";

interface LegacyFileExportEntry {
  status: ExportStatus;
  sourceDatabase: string;
  ruleId: string;
  legacyTable: string;
  legacyColumn: string;
  legacyId: number | string | null;
  ownerId: number | string | null;
  title: string | null;
  active: number | string | null;
  filename: string | null;
  sourcePath: string | null;
  storageKey: string | null;
  modernDestination: string;
  modernStorageKeyPrefix: string;
  reason?: string;
}

interface RuleExportSummary {
  ruleId: string;
  legacyTable: string;
  exported: number;
  found: number;
  missing: number;
  defaults: number;
  unsafe: number;
  skipped: number;
}

interface LegacyFileExportManifest {
  generatedAt: string;
  dryRun: boolean;
  sourceDatabase: string;
  legacyRoot: string;
  outDir: string | null;
  totals: {
    exported: number;
    found: number;
    missing: number;
    defaults: number;
    unsafe: number;
    skipped: number;
  };
  summaries: RuleExportSummary[];
  entries: LegacyFileExportEntry[];
}

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `\`${identifier}\``;
}

function safeKeyPart(value: unknown): string {
  const normalized = String(value ?? "unknown")
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "unknown";
}

function isDefaultOrEmpty(value: unknown): boolean {
  if (value == null) return true;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "0" ||
    normalized === "default.jpg" ||
    normalized === "default.jpeg" ||
    normalized === "default.png"
  );
}

function isUnsafeFilename(filename: string): boolean {
  return (
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("..") ||
    path.isAbsolute(filename)
  );
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

async function tableColumns(table: string): Promise<Set<string>> {
  const rows = await queryMysql<ColumnRow>(
    `SHOW COLUMNS FROM ${quoteIdentifier(table)}`
  );
  return new Set(rows.map((row) => row.Field));
}

function selectedColumns(rule: LegacyFileRule): string[] {
  return [
    rule.legacyIdColumn,
    rule.legacyFileColumn,
    rule.legacyTitleColumn,
    rule.legacyOwnerColumn,
    rule.legacyActiveColumn,
  ].filter((column): column is string => Boolean(column));
}

async function rowsForRule(rule: LegacyFileRule): Promise<LegacyFileRow[]> {
  const select = [
    `${quoteIdentifier(rule.legacyIdColumn)} AS legacy_id`,
    `${quoteIdentifier(rule.legacyFileColumn)} AS file_value`,
  ];

  if (rule.legacyTitleColumn) {
    select.push(`${quoteIdentifier(rule.legacyTitleColumn)} AS title_value`);
  }
  if (rule.legacyOwnerColumn) {
    select.push(`${quoteIdentifier(rule.legacyOwnerColumn)} AS owner_value`);
  }
  if (rule.legacyActiveColumn) {
    select.push(`${quoteIdentifier(rule.legacyActiveColumn)} AS active_value`);
  }

  return queryMysql<LegacyFileRow>(
    `SELECT ${select.join(", ")} FROM ${quoteIdentifier(
      rule.legacyTable
    )} ORDER BY ${quoteIdentifier(rule.legacyIdColumn)}`
  );
}

function storageKey(
  sourceDatabase: string,
  rule: LegacyFileRule,
  row: LegacyFileRow,
  filename: string
): string {
  return [
    "legacy",
    safeKeyPart(sourceDatabase),
    safeKeyPart(rule.id),
    safeKeyPart(row.legacy_id),
    safeKeyPart(filename),
  ].join("/");
}

function makeEntry(params: {
  status: ExportStatus;
  sourceDatabase: string;
  rule: LegacyFileRule;
  row?: LegacyFileRow;
  filename?: string | null;
  sourcePath?: string | null;
  storageKey?: string | null;
  reason?: string;
}): LegacyFileExportEntry {
  return {
    status: params.status,
    sourceDatabase: params.sourceDatabase,
    ruleId: params.rule.id,
    legacyTable: params.rule.legacyTable,
    legacyColumn: params.rule.legacyFileColumn,
    legacyId: params.row?.legacy_id ?? null,
    ownerId: params.row?.owner_value ?? null,
    title: params.row?.title_value ?? null,
    active: params.row?.active_value ?? null,
    filename: params.filename ?? null,
    sourcePath: params.sourcePath ?? null,
    storageKey: params.storageKey ?? null,
    modernDestination: params.rule.modernDestination,
    modernStorageKeyPrefix: params.rule.modernStorageKeyPrefix,
    reason: params.reason,
  };
}

function emptySummary(rule: LegacyFileRule): RuleExportSummary {
  return {
    ruleId: rule.id,
    legacyTable: rule.legacyTable,
    exported: 0,
    found: 0,
    missing: 0,
    defaults: 0,
    unsafe: 0,
    skipped: 0,
  };
}

async function exportRule(params: {
  rule: LegacyFileRule;
  sourceDatabase: string;
  legacyRoot: string;
  outDir: string | null;
  dryRun: boolean;
}): Promise<{ summary: RuleExportSummary; entries: LegacyFileExportEntry[] }> {
  const { rule, sourceDatabase, legacyRoot, outDir, dryRun } = params;
  const summary = emptySummary(rule);
  const entries: LegacyFileExportEntry[] = [];

  if (!(await tableExists(rule.legacyTable))) {
    summary.skipped++;
    entries.push(
      makeEntry({
        status: "table-missing",
        sourceDatabase,
        rule,
        reason: "Legacy table is not present in this database.",
      })
    );
    return { summary, entries };
  }

  const columns = await tableColumns(rule.legacyTable);
  const missingColumns = selectedColumns(rule).filter(
    (column) => !columns.has(column)
  );
  if (missingColumns.length > 0) {
    summary.skipped++;
    entries.push(
      makeEntry({
        status: "column-missing",
        sourceDatabase,
        rule,
        reason: `Missing columns: ${missingColumns.join(", ")}`,
      })
    );
    return { summary, entries };
  }

  const directory = getLegacyDirectoryPath(legacyRoot, rule);
  const rows = await rowsForRule(rule);

  for (const row of rows) {
    const filename = row.file_value == null ? "" : String(row.file_value).trim();
    if (isDefaultOrEmpty(filename)) {
      summary.defaults++;
      entries.push(
        makeEntry({
          status: "default",
          sourceDatabase,
          rule,
          row,
          filename,
          reason: "Default, empty, or zero file reference.",
        })
      );
      continue;
    }

    if (isUnsafeFilename(filename)) {
      summary.unsafe++;
      entries.push(
        makeEntry({
          status: "unsafe",
          sourceDatabase,
          rule,
          row,
          filename,
          reason: "Filename contains path traversal or path separators.",
        })
      );
      continue;
    }

    const sourcePath = path.join(directory, filename);
    const key = storageKey(sourceDatabase, rule, row, filename);
    if (!fs.existsSync(sourcePath)) {
      summary.missing++;
      entries.push(
        makeEntry({
          status: "missing",
          sourceDatabase,
          rule,
          row,
          filename,
          sourcePath,
          storageKey: key,
          reason: "Referenced file was not found in the legacy directory.",
        })
      );
      continue;
    }

    if (dryRun) {
      summary.found++;
      entries.push(
        makeEntry({
          status: "found",
          sourceDatabase,
          rule,
          row,
          filename,
          sourcePath,
          storageKey: key,
        })
      );
      continue;
    }

    if (!outDir) {
      throw new Error("--out-dir is required unless --dry-run is used.");
    }

    const targetPath = path.join(outDir, key);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    summary.exported++;
    entries.push(
      makeEntry({
        status: "exported",
        sourceDatabase,
        rule,
        row,
        filename,
        sourcePath,
        storageKey: key,
      })
    );
  }

  return { summary, entries };
}

function buildTotals(
  summaries: RuleExportSummary[]
): LegacyFileExportManifest["totals"] {
  return summaries.reduce(
    (totals, summary) => {
      totals.exported += summary.exported;
      totals.found += summary.found;
      totals.missing += summary.missing;
      totals.defaults += summary.defaults;
      totals.unsafe += summary.unsafe;
      totals.skipped += summary.skipped;
      return totals;
    },
    {
      exported: 0,
      found: 0,
      missing: 0,
      defaults: 0,
      unsafe: 0,
      skipped: 0,
    }
  );
}

async function exportLegacyFiles(): Promise<LegacyFileExportManifest> {
  const config = getMysqlConfig();
  if (!config.database) {
    throw new Error("MYSQL_DATABASE is required for legacy file export.");
  }

  const dryRun = process.argv.includes("--dry-run");
  const outDirArg = argValue("out-dir");
  if (!dryRun && !outDirArg) {
    throw new Error("--out-dir is required unless --dry-run is used.");
  }

  const legacyRoot =
    argValue("legacy-root") ||
    process.env.LEGACY_APP_ROOT ||
    getDefaultLegacyRoot();
  const outDir = outDirArg ? path.resolve(outDirArg) : null;
  const onlyRule = argValue("rule");
  const rules = onlyRule
    ? LEGACY_FILE_RULES.filter((rule) => rule.id === onlyRule)
    : LEGACY_FILE_RULES;

  if (onlyRule && rules.length === 0) {
    throw new Error(`Unknown legacy file rule: ${onlyRule}`);
  }

  log(
    `${dryRun ? "Auditing" : "Exporting"} legacy files for MySQL database ${
      config.database
    }`
  );
  log(`Legacy root: ${legacyRoot}`);
  if (outDir) log(`Export directory: ${outDir}`);

  const summaries: RuleExportSummary[] = [];
  const entries: LegacyFileExportEntry[] = [];

  for (const rule of rules) {
    const result = await exportRule({
      rule,
      sourceDatabase: config.database,
      legacyRoot,
      outDir,
      dryRun,
    });
    summaries.push(result.summary);
    entries.push(...result.entries);
    log(
      `${rule.id}: ${result.summary.exported} exported, ` +
        `${result.summary.found} found, ${result.summary.missing} missing, ` +
        `${result.summary.defaults} default, ${result.summary.unsafe} unsafe`
    );
  }

  const manifest: LegacyFileExportManifest = {
    generatedAt: new Date().toISOString(),
    dryRun,
    sourceDatabase: config.database,
    legacyRoot,
    outDir,
    totals: buildTotals(summaries),
    summaries,
    entries,
  };

  const manifestArg = argValue("manifest");
  const manifestPath =
    manifestArg || (outDir ? path.join(outDir, "manifest.json") : null);
  if (manifestPath) {
    fs.mkdirSync(path.dirname(path.resolve(manifestPath)), { recursive: true });
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    log(`Wrote legacy file export manifest to ${manifestPath}`);
  }

  log(
    `Legacy file export totals: ${manifest.totals.exported} exported, ` +
      `${manifest.totals.found} found, ${manifest.totals.missing} missing, ` +
      `${manifest.totals.defaults} default, ${manifest.totals.unsafe} unsafe`
  );

  return manifest;
}

if (require.main === module) {
  (async () => {
    try {
      await exportLegacyFiles();
    } catch (err) {
      logError("Legacy file export failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
    }
  })();
}
