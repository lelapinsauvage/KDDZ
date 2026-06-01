import fs from "fs";
import path from "path";

import { closeMysqlPool, getMysqlConfig, queryMysql } from "./lib/mysql-client";
import { log, logError } from "./lib/utils";
import {
  getDefaultLegacyRoot,
  getLegacyDirectoryPath,
  getLegacyImagesRoot,
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

interface FileAuditExample {
  legacyId: number | string | null;
  owner: number | string | null;
  filename: string;
  active: number | string | null;
}

interface RuleAuditResult {
  ruleId: string;
  legacyTable: string;
  legacyColumn: string;
  legacyDirectory: string;
  modernDestination: string;
  tableExists: boolean;
  directoryExists: boolean;
  missingColumns: string[];
  totalRows: number;
  defaultOrEmpty: number;
  referencedFiles: number;
  foundFiles: number;
  missingFiles: number;
  unsafeReferences: number;
  missingExamples: FileAuditExample[];
  unsafeExamples: FileAuditExample[];
}

interface AuditReport {
  mysqlDatabase: string;
  legacyRoot: string;
  imagesRoot: string;
  generatedAt: string;
  totals: {
    rules: number;
    tablesPresent: number;
    rows: number;
    references: number;
    found: number;
    missing: number;
    defaults: number;
    unsafe: number;
  };
  results: RuleAuditResult[];
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

function addExample(
  examples: FileAuditExample[],
  row: LegacyFileRow,
  filename: string
) {
  if (examples.length >= 10) return;
  examples.push({
    legacyId: row.legacy_id,
    owner: row.owner_value ?? null,
    filename,
    active: row.active_value ?? null,
  });
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

async function auditRule(
  rule: LegacyFileRule,
  legacyRoot: string
): Promise<RuleAuditResult> {
  const directory = getLegacyDirectoryPath(legacyRoot, rule);
  const result: RuleAuditResult = {
    ruleId: rule.id,
    legacyTable: rule.legacyTable,
    legacyColumn: rule.legacyFileColumn,
    legacyDirectory: rule.legacyDirectory,
    modernDestination: rule.modernDestination,
    tableExists: false,
    directoryExists: fs.existsSync(directory),
    missingColumns: [],
    totalRows: 0,
    defaultOrEmpty: 0,
    referencedFiles: 0,
    foundFiles: 0,
    missingFiles: 0,
    unsafeReferences: 0,
    missingExamples: [],
    unsafeExamples: [],
  };

  if (!(await tableExists(rule.legacyTable))) {
    return result;
  }
  result.tableExists = true;

  const columns = await tableColumns(rule.legacyTable);
  result.missingColumns = selectedColumns(rule).filter(
    (column) => !columns.has(column)
  );
  if (result.missingColumns.length > 0) {
    return result;
  }

  const rows = await rowsForRule(rule);
  result.totalRows = rows.length;

  for (const row of rows) {
    const raw = row.file_value == null ? "" : String(row.file_value).trim();
    if (isDefaultOrEmpty(raw)) {
      result.defaultOrEmpty++;
      continue;
    }

    if (isUnsafeFilename(raw)) {
      result.unsafeReferences++;
      addExample(result.unsafeExamples, row, raw);
      continue;
    }

    result.referencedFiles++;
    const filePath = path.join(directory, raw);
    if (fs.existsSync(filePath)) {
      result.foundFiles++;
    } else {
      result.missingFiles++;
      addExample(result.missingExamples, row, raw);
    }
  }

  return result;
}

function buildTotals(results: RuleAuditResult[]): AuditReport["totals"] {
  return results.reduce(
    (totals, result) => {
      totals.tablesPresent += result.tableExists ? 1 : 0;
      totals.rows += result.totalRows;
      totals.references += result.referencedFiles + result.unsafeReferences;
      totals.found += result.foundFiles;
      totals.missing += result.missingFiles;
      totals.defaults += result.defaultOrEmpty;
      totals.unsafe += result.unsafeReferences;
      return totals;
    },
    {
      rules: results.length,
      tablesPresent: 0,
      rows: 0,
      references: 0,
      found: 0,
      missing: 0,
      defaults: 0,
      unsafe: 0,
    }
  );
}

async function auditLegacyFiles(): Promise<AuditReport> {
  const config = getMysqlConfig();
  if (!config.database) {
    throw new Error("MYSQL_DATABASE is required for legacy file auditing.");
  }

  const legacyRoot =
    argValue("legacy-root") ||
    process.env.LEGACY_APP_ROOT ||
    getDefaultLegacyRoot();
  const imagesRoot = getLegacyImagesRoot(legacyRoot);

  log(`Auditing legacy file references for MySQL database ${config.database}`);
  log(`Legacy image root: ${imagesRoot}`);

  const results: RuleAuditResult[] = [];
  for (const rule of LEGACY_FILE_RULES) {
    const result = await auditRule(rule, legacyRoot);
    results.push(result);

    if (!result.tableExists) {
      log(`${rule.legacyTable}: table not present, skipped`);
      continue;
    }
    if (result.missingColumns.length > 0) {
      log(
        `${rule.legacyTable}: missing columns ${result.missingColumns.join(
          ", "
        )}, skipped`
      );
      continue;
    }

    log(
      `${rule.legacyTable}.${rule.legacyFileColumn} -> ${rule.legacyDirectory}: ` +
        `${result.foundFiles}/${result.referencedFiles} found, ` +
        `${result.missingFiles} missing, ${result.defaultOrEmpty} default/empty, ` +
        `${result.unsafeReferences} unsafe`
    );
  }

  const report: AuditReport = {
    mysqlDatabase: config.database,
    legacyRoot,
    imagesRoot,
    generatedAt: new Date().toISOString(),
    totals: buildTotals(results),
    results,
  };

  const jsonPath = argValue("json");
  if (jsonPath) {
    fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    log(`Wrote legacy file audit report to ${jsonPath}`);
  }

  log(
    `Legacy file audit totals: ${report.totals.found}/${report.totals.references} ` +
      `found, ${report.totals.missing} missing, ${report.totals.defaults} defaults, ` +
      `${report.totals.unsafe} unsafe`
  );

  return report;
}

if (require.main === module) {
  (async () => {
    try {
      await auditLegacyFiles();
    } catch (err) {
      logError("Legacy file audit failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
    }
  })();
}
