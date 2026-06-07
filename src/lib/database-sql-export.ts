import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { db } from "@/lib/db";

const execFileAsync = promisify(execFile);

const PG_DUMP_MAX_BUFFER = 500 * 1024 * 1024;

type TableRow = {
  table_name: string;
};

type EnumRow = {
  type_name: string;
  value: string;
};

type ColumnRow = {
  column_name: string;
  formatted_type: string;
  not_null: boolean;
  column_default: string | null;
};

type ConstraintRow = {
  constraint_name: string;
  constraint_type: "p" | "u" | "c" | "f";
  definition: string;
};

type IndexRow = {
  index_definition: string;
};

export type DatabaseSqlDump = {
  content: string;
  filename: string;
  engine: "pg_dump" | "fallback";
};

function databaseNameFromUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return "garderie";

  try {
    const parsed = new URL(databaseUrl);
    const rawName = parsed.pathname.replace(/^\/+/, "");
    return decodeURIComponent(rawName || "garderie");
  } catch {
    return "garderie";
  }
}

function dumpFilename() {
  const year = new Date().getFullYear();
  const databaseName = databaseNameFromUrl().replace(/[^A-Za-z0-9._-]+/g, "_");
  return `${databaseName}_${year - 1}-${year}.sql`;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function quoteLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function byteaLiteral(value: Buffer | Uint8Array) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return `decode('${buffer.toString("hex")}', 'hex')`;
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return quoteLiteral(value.toISOString());
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return byteaLiteral(value);

  switch (typeof value) {
    case "bigint":
      return value.toString();
    case "boolean":
      return value ? "TRUE" : "FALSE";
    case "number":
      return Number.isFinite(value) ? String(value) : quoteLiteral(String(value));
    case "object":
      return quoteLiteral(JSON.stringify(value));
    default:
      return quoteLiteral(String(value));
  }
}

function valuesClause(row: Record<string, unknown>, columns: ColumnRow[]) {
  return `(${columns.map((column) => sqlLiteral(row[column.column_name])).join(", ")})`;
}

async function tryPgDump(): Promise<string | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  try {
    const { stdout } = await execFileAsync(
      "pg_dump",
      [
        "--dbname",
        databaseUrl,
        "--encoding",
        "UTF8",
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
      ],
      { maxBuffer: PG_DUMP_MAX_BUFFER },
    );

    return [
      "-- Garderie database backup generated with pg_dump.",
      `-- Generated at ${new Date().toISOString()}.`,
      "",
      stdout,
    ].join("\n");
  } catch {
    return null;
  }
}

async function listTables() {
  return db.$queryRawUnsafe<TableRow[]>(`
    SELECT c.relname AS table_name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname
  `);
}

async function listEnums() {
  return db.$queryRawUnsafe<EnumRow[]>(`
    SELECT t.typname AS type_name, e.enumlabel AS value
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_enum e ON e.enumtypid = t.oid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `);
}

async function listColumns(tableName: string) {
  return db.$queryRawUnsafe<ColumnRow[]>(
    `
      SELECT
        a.attname AS column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS formatted_type,
        a.attnotnull AS not_null,
        pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) AS column_default
      FROM pg_catalog.pg_attribute a
      JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_catalog.pg_attrdef ad
        ON ad.adrelid = a.attrelid
       AND ad.adnum = a.attnum
      WHERE n.nspname = 'public'
        AND c.relname = $1
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
    `,
    tableName,
  );
}

async function listConstraints(tableName: string) {
  return db.$queryRawUnsafe<ConstraintRow[]>(
    `
      SELECT
        con.conname AS constraint_name,
        con.contype::text AS constraint_type,
        pg_catalog.pg_get_constraintdef(con.oid) AS definition
      FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = $1
        AND con.contype IN ('p', 'u', 'c', 'f')
      ORDER BY con.conname
    `,
    tableName,
  );
}

async function listIndexes(tableName: string) {
  return db.$queryRawUnsafe<IndexRow[]>(
    `
      SELECT pg_catalog.pg_get_indexdef(i.oid) AS index_definition
      FROM pg_catalog.pg_class t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_catalog.pg_index ix ON ix.indrelid = t.oid
      JOIN pg_catalog.pg_class i ON i.oid = ix.indexrelid
      LEFT JOIN pg_catalog.pg_constraint con ON con.conindid = i.oid
      WHERE n.nspname = 'public'
        AND t.relname = $1
        AND con.oid IS NULL
      ORDER BY i.relname
    `,
    tableName,
  );
}

async function tableRows(tableName: string, columns: ColumnRow[]) {
  if (!columns.length) return [];
  const columnList = columns.map((column) => quoteIdentifier(column.column_name)).join(", ");
  return db.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT ${columnList} FROM ${quoteIdentifier(tableName)}`,
  );
}

function createEnumStatements(enumRows: EnumRow[]) {
  const grouped = new Map<string, string[]>();
  for (const row of enumRows) {
    const values = grouped.get(row.type_name) ?? [];
    values.push(row.value);
    grouped.set(row.type_name, values);
  }

  return [...grouped.entries()].map(
    ([typeName, values]) =>
      `CREATE TYPE ${quoteIdentifier(typeName)} AS ENUM (${values
        .map(quoteLiteral)
        .join(", ")});`,
  );
}

function createTableStatement(
  tableName: string,
  columns: ColumnRow[],
  constraints: ConstraintRow[],
) {
  const columnLines = columns.map((column) => {
    const defaultSql = column.column_default ? ` DEFAULT ${column.column_default}` : "";
    const notNullSql = column.not_null ? " NOT NULL" : "";
    return `${quoteIdentifier(column.column_name)} ${column.formatted_type}${defaultSql}${notNullSql}`;
  });

  const inlineConstraints = constraints
    .filter((constraint) => constraint.constraint_type !== "f")
    .map(
      (constraint) =>
        `CONSTRAINT ${quoteIdentifier(constraint.constraint_name)} ${constraint.definition}`,
    );

  return [
    `CREATE TABLE ${quoteIdentifier(tableName)} (`,
    [...columnLines, ...inlineConstraints].map((line) => `  ${line}`).join(",\n"),
    ");",
  ].join("\n");
}

function insertStatements(tableName: string, columns: ColumnRow[], rows: Record<string, unknown>[]) {
  if (!rows.length || !columns.length) return [];

  const columnList = columns.map((column) => quoteIdentifier(column.column_name)).join(", ");
  const statements: string[] = [];
  for (let index = 0; index < rows.length; index += 100) {
    const batch = rows.slice(index, index + 100);
    statements.push(
      [
        `INSERT INTO ${quoteIdentifier(tableName)} (${columnList}) VALUES`,
        batch.map((row) => valuesClause(row, columns)).join(",\n"),
        ";",
      ].join("\n"),
    );
  }

  return statements;
}

function sequenceResetStatements(tableName: string, columns: ColumnRow[]) {
  return columns
    .filter((column) => column.column_default?.includes("nextval("))
    .map(
      (column) =>
        `SELECT pg_catalog.setval(pg_catalog.pg_get_serial_sequence(${quoteLiteral(
          tableName,
        )}, ${quoteLiteral(column.column_name)}), COALESCE((SELECT MAX(${quoteIdentifier(
          column.column_name,
        )}) FROM ${quoteIdentifier(tableName)}), 1), true);`,
    );
}

function foreignKeyStatements(tableName: string, constraints: ConstraintRow[]) {
  return constraints
    .filter((constraint) => constraint.constraint_type === "f")
    .map(
      (constraint) =>
        `ALTER TABLE ${quoteIdentifier(tableName)} ADD CONSTRAINT ${quoteIdentifier(
          constraint.constraint_name,
        )} ${constraint.definition};`,
    );
}

async function fallbackDump() {
  const tables = await listTables();
  const enums = await listEnums();
  const enumNames = [...new Set(enums.map((row) => row.type_name))];
  const tableNames = tables.map((row) => row.table_name);
  const chunks: string[] = [
    "-- Garderie database backup generated by the built-in SQL exporter.",
    `-- Generated at ${new Date().toISOString()}.`,
    "-- Install pg_dump on the server for native PostgreSQL dump fidelity; this fallback includes public schema DDL and table data.",
    "",
    "SET client_encoding = 'UTF8';",
    "SET search_path = public;",
    "",
    "BEGIN;",
    "",
  ];

  if (tableNames.length) {
    chunks.push(
      `DROP TABLE IF EXISTS ${tableNames.map(quoteIdentifier).join(", ")} CASCADE;`,
      "",
    );
  }

  if (enumNames.length) {
    chunks.push(...enumNames.map((typeName) => `DROP TYPE IF EXISTS ${quoteIdentifier(typeName)} CASCADE;`), "");
    chunks.push(...createEnumStatements(enums), "");
  }

  const foreignKeys: string[] = [];
  const indexes: string[] = [];
  const sequenceResets: string[] = [];

  for (const { table_name: tableName } of tables) {
    const [columns, constraints, tableIndexes] = await Promise.all([
      listColumns(tableName),
      listConstraints(tableName),
      listIndexes(tableName),
    ]);

    chunks.push(createTableStatement(tableName, columns, constraints), "");

    const rows = await tableRows(tableName, columns);
    chunks.push(`-- Data for ${quoteIdentifier(tableName)} (${rows.length} rows).`);
    chunks.push(...insertStatements(tableName, columns, rows), "");

    foreignKeys.push(...foreignKeyStatements(tableName, constraints));
    indexes.push(...tableIndexes.map((index) => `${index.index_definition};`));
    sequenceResets.push(...sequenceResetStatements(tableName, columns));
  }

  if (sequenceResets.length) chunks.push("-- Sequence values.", ...sequenceResets, "");
  if (foreignKeys.length) chunks.push("-- Foreign keys.", ...foreignKeys, "");
  if (indexes.length) chunks.push("-- Indexes.", ...indexes, "");

  chunks.push("COMMIT;", "");
  return chunks.join("\n");
}

export async function createDatabaseSqlDump(): Promise<DatabaseSqlDump> {
  const pgDumpContent = await tryPgDump();
  if (pgDumpContent) {
    return {
      content: pgDumpContent,
      filename: dumpFilename(),
      engine: "pg_dump",
    };
  }

  return {
    content: await fallbackDump(),
    filename: dumpFilename(),
    engine: "fallback",
  };
}
