import fs from "fs";

import type { PrismaClient } from "@/generated/prisma/client";
import { closeMysqlPool, getMysqlConfig, queryMysql } from "./lib/mysql-client";
import { createPrismaClient } from "./lib/prisma-client";
import { log, logError } from "./lib/utils";

type Expectation =
  | "equal"
  | "target-at-least-source"
  | "target-at-most-source"
  | "informational";

type EvidenceStrength = "strong" | "weak" | "derived";
type ResultStatus = "ok" | "warning" | "missing" | "not-applicable" | "error";

interface CountSide {
  table: string;
  where?: string | ((sourceDatabase: string) => string);
  countExpression?: string;
  label?: string;
}

interface ReconciliationRule {
  id: string;
  step: string;
  source: CountSide;
  target: CountSide;
  expectation: Expectation;
  evidence: EvidenceStrength;
  notes: string;
}

interface ReconciliationResult {
  id: string;
  step: string;
  sourceTable: string;
  sourceWhere: string | null;
  targetTable: string;
  targetWhere: string | null;
  sourceCount: number | null;
  targetCount: number | null;
  delta: number | null;
  expectation: Expectation;
  evidence: EvidenceStrength;
  status: ResultStatus;
  notes: string;
  message: string;
}

interface ReconciliationReport {
  generatedAt: string;
  sourceDatabase: string;
  targetSchema: string;
  totals: Record<ResultStatus, number> & { rules: number };
  results: ReconciliationResult[];
}

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function argValues(name: string): string[] {
  const prefix = `--${name}=`;
  return process.argv
    .filter((item) => item.startsWith(prefix))
    .map((item) => item.slice(prefix.length));
}

function quoteMysqlIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe MySQL identifier: ${identifier}`);
  }
  return `\`${identifier}\``;
}

function quotePgIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function pgTableRef(schema: string, table: string): string {
  return `${quotePgIdentifier(schema)}.${quotePgIdentifier(table)}`;
}

function pgLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function pgColumn(column: string): string {
  return quotePgIdentifier(column);
}

function pgDistinctCount(column: string): string {
  return `COUNT(DISTINCT ${pgColumn(column)})`;
}

function pgTextContains(column: string, fragment: string): string {
  return `POSITION(${pgLiteral(fragment)} IN ${pgColumn(column)}) > 0`;
}

function bySourceDatabase(column = "sourceDatabase") {
  return (sourceDatabase: string) =>
    `${pgColumn(column)} = ${pgLiteral(sourceDatabase)}`;
}

function byLegacyTable(table: string) {
  return (sourceDatabase: string) =>
    `${pgColumn("sourceDatabase")} = ${pgLiteral(sourceDatabase)} AND ${pgColumn(
      "legacyTable"
    )} = ${pgLiteral(table)}`;
}

function bySourceTable(table: string): string {
  return `${pgColumn("sourceTable")} = ${pgLiteral(table)}`;
}

function byLegacyDataSourceTable(table: string) {
  return (sourceDatabase: string) =>
    `${pgColumn("legacyData")} ->> ${pgLiteral(
      "sourceDatabase"
    )} = ${pgLiteral(sourceDatabase)} AND ${pgColumn(
      "legacyData"
    )} ->> ${pgLiteral("sourceTable")} = ${pgLiteral(table)}`;
}

function realLegacyFileWhere(prefix?: string): string {
  const filePredicate =
    "url IS NOT NULL AND TRIM(url) <> '' AND TRIM(url) <> '0' " +
    "AND LOWER(TRIM(url)) NOT IN ('default.jpg', 'default.jpeg', 'default.png')";
  return prefix ? `${prefix} AND ${filePredicate}` : filePredicate;
}

function resolveWhere(
  where: CountSide["where"],
  sourceDatabase: string
): string | null {
  if (!where) return null;
  return typeof where === "function" ? where(sourceDatabase) : where;
}

function parseCount(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseInt(value, 10);
  return 0;
}

async function mysqlTableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

async function postgresTableExists(
  prisma: PrismaClient,
  schema: string,
  table: string
): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ regclass: string | null }>>(
    `SELECT to_regclass(${pgLiteral(`${schema}.${table}`)}) AS regclass`
  );
  return Boolean(rows[0]?.regclass);
}

async function mysqlCount(
  table: string,
  where: string | null,
  countExpression = "COUNT(*)"
): Promise<number> {
  const sql = `SELECT ${countExpression} AS count FROM ${quoteMysqlIdentifier(table)}${
    where ? ` WHERE ${where}` : ""
  }`;
  const rows = await queryMysql<Array<{ count: unknown }>[number]>(sql);
  return parseCount(rows[0]?.count);
}

async function postgresCount(
  prisma: PrismaClient,
  schema: string,
  table: string,
  where: string | null,
  countExpression = "COUNT(*)"
): Promise<number> {
  const sql = `SELECT (${countExpression})::bigint AS count FROM ${pgTableRef(
    schema,
    table
  )}${where ? ` WHERE ${where}` : ""}`;
  const rows = await prisma.$queryRawUnsafe<Array<{ count: unknown }>>(sql);
  return parseCount(rows[0]?.count);
}

function evaluate(
  rule: ReconciliationRule,
  sourceCount: number,
  targetCount: number
): Pick<ReconciliationResult, "delta" | "status" | "message"> {
  const delta = targetCount - sourceCount;
  if (rule.expectation === "informational") {
    return {
      delta,
      status: "ok",
      message: "Informational count only; review notes before treating as parity.",
    };
  }

  if (rule.expectation === "equal" && targetCount === sourceCount) {
    return { delta, status: "ok", message: "Target count equals source count." };
  }

  if (
    rule.expectation === "target-at-least-source" &&
    targetCount >= sourceCount
  ) {
    return {
      delta,
      status: "ok",
      message: "Target count is at least the source count.",
    };
  }

  if (
    rule.expectation === "target-at-most-source" &&
    targetCount <= sourceCount
  ) {
    return {
      delta,
      status: "ok",
      message: "Target count is no greater than the source count.",
    };
  }

  return {
    delta,
    status: "warning",
    message: `Count mismatch for expectation ${rule.expectation}.`,
  };
}

async function reconcileRule(
  prisma: PrismaClient,
  rule: ReconciliationRule,
  sourceDatabase: string,
  targetSchema: string
): Promise<ReconciliationResult> {
  const sourceWhere = resolveWhere(rule.source.where, sourceDatabase);
  const targetWhere = resolveWhere(rule.target.where, sourceDatabase);

  try {
    if (!(await mysqlTableExists(rule.source.table))) {
      return {
        id: rule.id,
        step: rule.step,
        sourceTable: rule.source.table,
        sourceWhere,
        targetTable: rule.target.table,
        targetWhere,
        sourceCount: null,
        targetCount: null,
        delta: null,
        expectation: rule.expectation,
        evidence: rule.evidence,
        status: "not-applicable",
        notes: rule.notes,
        message: "Legacy table is not present in this imported database.",
      };
    }

    if (!(await postgresTableExists(prisma, targetSchema, rule.target.table))) {
      const sourceCount = await mysqlCount(
        rule.source.table,
        sourceWhere,
        rule.source.countExpression
      );
      return {
        id: rule.id,
        step: rule.step,
        sourceTable: rule.source.table,
        sourceWhere,
        targetTable: rule.target.table,
        targetWhere,
        sourceCount,
        targetCount: null,
        delta: null,
        expectation: rule.expectation,
        evidence: rule.evidence,
        status: "missing",
        notes: rule.notes,
        message: "Modern target table does not exist.",
      };
    }

    const [sourceCount, targetCount] = await Promise.all([
      mysqlCount(rule.source.table, sourceWhere, rule.source.countExpression),
      postgresCount(
        prisma,
        targetSchema,
        rule.target.table,
        targetWhere,
        rule.target.countExpression
      ),
    ]);
    const evaluation = evaluate(rule, sourceCount, targetCount);

    return {
      id: rule.id,
      step: rule.step,
      sourceTable: rule.source.table,
      sourceWhere,
      targetTable: rule.target.table,
      targetWhere,
      sourceCount,
      targetCount,
      expectation: rule.expectation,
      evidence: rule.evidence,
      notes: rule.notes,
      ...evaluation,
    };
  } catch (err) {
    return {
      id: rule.id,
      step: rule.step,
      sourceTable: rule.source.table,
      sourceWhere,
      targetTable: rule.target.table,
      targetWhere,
      sourceCount: null,
      targetCount: null,
      delta: null,
      expectation: rule.expectation,
      evidence: rule.evidence,
      status: "error",
      notes: rule.notes,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

function baseRule(params: ReconciliationRule): ReconciliationRule {
  return params;
}

function provenancedRule(params: {
  id: string;
  step: string;
  sourceTable: string;
  sourceWhere?: string;
  targetTable: string;
  targetWhere?: CountSide["where"];
  notes: string;
  expectation?: Expectation;
}): ReconciliationRule {
  return baseRule({
    id: params.id,
    step: params.step,
    source: { table: params.sourceTable, where: params.sourceWhere },
    target: {
      table: params.targetTable,
      where: params.targetWhere ?? bySourceDatabase(),
    },
    expectation: params.expectation ?? "equal",
    evidence: "strong",
    notes: params.notes,
  });
}

function weakRule(params: {
  id: string;
  step: string;
  sourceTable: string;
  sourceWhere?: string;
  targetTable: string;
  targetWhere?: CountSide["where"];
  targetCountExpression?: string;
  notes: string;
  expectation?: Expectation;
  evidence?: EvidenceStrength;
}): ReconciliationRule {
  return baseRule({
    id: params.id,
    step: params.step,
    source: { table: params.sourceTable, where: params.sourceWhere },
    target: {
      table: params.targetTable,
      where: params.targetWhere,
      countExpression: params.targetCountExpression,
    },
    expectation: params.expectation ?? "target-at-least-source",
    evidence: params.evidence ?? "weak",
    notes: params.notes,
  });
}

const assessmentTables = [1, 2, 3, 4, 5, 6, 7];
const formTables = [
  { table: "t_form_1", type: "GENERAL" },
  { table: "t_form_2", type: "CONDITIONS" },
  { table: "t_form_3", type: "VISITS" },
  { table: "t_form_4", type: "VACCINATIONS" },
  { table: "t_form_5", type: "ACCIDENTS" },
];
const vaccinationFieldPairs = [
  ["hepdate", "hep"],
  ["ipvdate", "ipv"],
  ["opvdate1", "opv1"],
  ["opvdate2", "opv2"],
  ["opvdate3", "opv3"],
  ["opvdate4", "opv4"],
  ["opvdate5", "opv5"],
  ["dptdate1", "dpt1"],
  ["dptdate2", "dpt2"],
  ["dptdate3", "dpt3"],
  ["dptdate4", "dpt4"],
  ["hasbedate1", "hasbe1"],
  ["mmrdate1", "mmr1"],
  ["mmrdate2", "mmr2"],
  ["ndptdate", "ndpt"],
  ["dtdate1", "dt1"],
] as const;
function mysqlMeaningfulText(column: string) {
  return `(NULLIF(NULLIF(TRIM(COALESCE(${quoteMysqlIdentifier(
    column
  )}, '')), ''), '0') IS NOT NULL)`;
}
const vaccinationSourceCountExpression = `COALESCE(SUM(${vaccinationFieldPairs
  .map(
    ([dateField, statusField]) =>
      `(${mysqlMeaningfulText(dateField)} OR ${mysqlMeaningfulText(
        statusField
      )})`
  )
  .join(" + ")}), 0)`;
const alarmTables = [
  "t_alarms",
  "t_alarms_birthday",
  "t_alarms_medical",
  "t_alarms_insurance",
  "t_alarms_medicine",
  "t_alarms_payments",
  "t_alarms_vaccinations",
  "t_alarms_contracts",
  "t_alarms_assessment",
  "t_alarms_assessment_parents",
  "t_alarms_others",
  "t_alarms_parents",
  "t_alarms_requests",
];

// Keep in sync with RECEIPT_CONFIGS in migrate-alarms.ts.
const receiptTables = [
  "custom_notifications",
  "custom_notifications_birthday",
  "custom_notifications_birthday_parents",
  "custom_notifications_contracts",
  "custom_notifications_insurance",
  "custom_notifications_insurance_parents",
  "custom_notifications_medical",
  "custom_notifications_medical_parents",
  "custom_notifications_medicine",
  "custom_notifications_medicine_parents",
  "custom_notifications_assessment",
  "custom_notifications_payments",
  "custom_notifications_vaccinations",
  "custom_notifications_requests",
  "custom_notifications_requests_parents",
  "custom_notifications_others",
  "custom_notifications_others_parents",
  "custom_notifications_parents",
  "custom_notifications_events",
  "custom_notifications_events_parents",
  "custom_notifications_holiday",
];
const authTables = [
  "login_confirm",
  "login_confirm_man",
  "login_profiles",
  "login_profiles_man",
  "login_profile_fields",
  "login_profile_fields_man",
  "login_levels",
  "login_levels_man",
  "parent_login_levels",
  "login_integration",
  "login_users_man",
];
const settingsTables = [
  "login_settings",
  "parent_login_settings",
  "login_settings_man",
  "t_settings",
  "t_notification_setting",
];
const accessControlTables = [
  "system_actions",
  "actions_control",
  "system_actions_man",
  "actions_control_man",
  "users_control",
];
const loginTimestampTables = [
  "login_timestamps",
  "login_timestamps_man",
  "parent_login_timestamps",
];
const accountingAmountFields = [
  "general_fees_total",
  "general_fees_disc",
  "xtra_fees_total",
  "xtra_fees_disc",
  "bus_fees_total",
  "bus_fees_disc",
  "apron_fees_total",
  "apron_fees_disc",
  "reg_fees_total",
  "reg_fees_disc",
  "act_fees_total",
  "act_fees_disc",
];
const accountingEntrySourceCountExpression = `COALESCE(SUM(${accountingAmountFields
  .map((field) => `(${field} > 0)`)
  .join(" + ")}), 0)`;

const RECONCILIATION_RULES: ReconciliationRule[] = [
  provenancedRule({
    id: "branches.t_branch",
    step: "1. Branches",
    sourceTable: "t_branch",
    targetTable: "branches",
    targetWhere: byLegacyTable("t_branch"),
    notes:
      "Branch rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, organization mapping, contact fields, image, prefix, and active flag.",
  }),
  provenancedRule({
    id: "locations.t_mouhafaza",
    step: "2. Locations",
    sourceTable: "t_mouhafaza",
    sourceWhere: "active = 1",
    targetTable: "provinces",
    targetWhere: byLegacyTable("t_mouhafaza"),
    notes:
      "Province rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, reference number, created timestamp, and raw legacyData.",
  }),
  provenancedRule({
    id: "locations.t_quadaa",
    step: "2. Locations",
    sourceTable: "t_quadaa",
    sourceWhere: "active = 1",
    targetTable: "districts",
    targetWhere: byLegacyTable("t_quadaa"),
    notes:
      "District rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacyProvinceId, reference number, created timestamp, province mapping, and raw legacyData.",
  }),
  provenancedRule({
    id: "locations.t_region",
    step: "2. Locations",
    sourceTable: "t_region",
    sourceWhere: "active = 1",
    targetTable: "regions",
    targetWhere: byLegacyTable("t_region"),
    notes:
      "Region rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacyDistrictId, reference number, created timestamp, district mapping, and raw legacyData.",
  }),
  provenancedRule({
    id: "school_years.t_school_year",
    step: "3. School Years",
    sourceTable: "t_school_year",
    targetTable: "school_years",
    notes: "School years preserve sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "classes.t_class",
    step: "4. Classes",
    sourceTable: "t_class",
    targetTable: "classes",
    targetWhere: byLegacyTable("t_class"),
    notes:
      "Classes preserve sourceDatabase, legacyKey, legacyId, legacyTable, branch mapping, age window, capacity, camera number, image, and active flag.",
  }),
  provenancedRule({
    id: "children.t_child",
    step: "5. Children",
    sourceTable: "t_child",
    sourceWhere: "deleted = 0",
    targetTable: "children",
    targetWhere: byLegacyTable("t_child"),
    notes:
      "Child rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, core identity, branch/class/year mappings, photo, activity/draft flags, and raw profile fields; mismatches expose unresolved branches or duplicate legacy keys.",
  }),
  provenancedRule({
    id: "children.t_child_draft",
    step: "5. Children",
    sourceTable: "t_child_draft",
    sourceWhere: "deleted = 0",
    targetTable: "children",
    targetWhere: byLegacyTable("t_child_draft"),
    notes:
      "Draft child rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, photo, school-year mapping, and isDraft=true; mismatches expose unresolved branches or invalid draft IDs.",
  }),
  provenancedRule({
    id: "children.t_child_h",
    step: "5. Children",
    sourceTable: "t_child_h",
    targetTable: "child_history",
    targetWhere: byLegacyTable("t_child_h"),
    notes:
      "History snapshots preserve sourceDatabase, legacyKey, legacyTable, legacy child id, raw snapshot JSON, changed-by user, and timestamp.",
  }),
  provenancedRule({
    id: "children.t_address",
    step: "5. Children",
    sourceTable: "t_address",
    sourceWhere: "active = 1",
    targetTable: "child_addresses",
    targetWhere: byLegacyTable("t_address"),
    notes:
      "Child address rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy child id, raw legacy row, address type, phone, and region mapping when available.",
  }),
  provenancedRule({
    id: "children.t_authorized",
    step: "5. Children",
    sourceTable: "t_authorized",
    sourceWhere: "active = 1",
    targetTable: "relatives",
    targetWhere: byLegacyTable("t_authorized"),
    notes:
      "Authorized pickup rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy child id, split first/last name, emergency flag, and raw legacy row.",
  }),
  provenancedRule({
    id: "children.t_relatives",
    step: "5. Children",
    sourceTable: "t_relatives",
    sourceWhere: "active = 1",
    targetTable: "relatives",
    targetWhere: byLegacyTable("t_relatives"),
    notes:
      "General relatives preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy child id, pickup authorization, and raw legacy row.",
  }),
  provenancedRule({
    id: "garderie_profile.t_garderie",
    step: "6. Garderie Profile",
    sourceTable: "t_garderie",
    targetTable: "branch_compliance",
    notes: "Branch compliance rows keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "garderie_profile.t_garderie_attachments",
    step: "6. Garderie Profile",
    sourceTable: "t_garderie_attachments",
    targetTable: "branch_documents",
    notes: "Garderie attachments keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "garderie_profile.t_old_garderie",
    step: "6. Garderie Profile",
    sourceTable: "t_old_garderie",
    targetTable: "child_previous_garderies",
    notes: "Previous-garderie history keeps sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "parents.t_parents",
    step: "7. Parents",
    sourceTable: "t_parents",
    sourceWhere: "active = 1",
    targetTable: "parents",
    targetWhere: byLegacyTable("t_parents"),
    notes:
      "Parent rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy child id, contact fields, pickup flag, and raw legacy row.",
  }),
  provenancedRule({
    id: "employees.t_teacher",
    step: "8. Employees",
    sourceTable: "t_teacher",
    sourceWhere: "deleted = 0",
    targetTable: "teachers",
    targetWhere: byLegacyTable("t_teacher"),
    notes:
      "Teacher core rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, branch mapping, profile image, register number, contact fields, and active flag.",
  }),
  provenancedRule({
    id: "employees.t_teacher_address",
    step: "8. Employees",
    sourceTable: "t_teacher_address",
    sourceWhere: "active = 1",
    targetTable: "teacher_addresses",
    targetWhere: byLegacyTable("t_teacher_address"),
    notes:
      "Teacher address rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy teacher id, full address columns, and raw legacy row.",
  }),
  provenancedRule({
    id: "employees.t_teacher_attachments",
    step: "8. Employees",
    sourceTable: "t_teacher_attachments",
    sourceWhere: realLegacyFileWhere("active = 1"),
    targetTable: "teacher_attachments",
    notes:
      "Teacher attachment rows with real legacy files keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "employees.t_teacher_info",
    step: "8. Employees",
    sourceTable: "t_teacher_info",
    targetTable: "teacher_experiences",
    notes: "Teacher experience rows keep sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "employees.t_emp_status",
    step: "8. Employees",
    sourceTable: "t_emp_status",
    sourceWhere: "active = 1",
    targetTable: "employee_events",
    targetWhere: (sourceDatabase) =>
      [
        pgTextContains("notes", `"sourceDatabase":"${sourceDatabase}"`),
        pgTextContains("notes", `"sourceTable":"t_emp_status"`),
      ].join(" AND "),
    expectation: "equal",
    notes:
      "Teacher calendar status rows preserve sourceDatabase/sourceTable in EmployeeEvent.notes JSON; mismatches expose orphaned teachers, invalid statuses, or invalid dates.",
  }),
  provenancedRule({
    id: "employees.t_nurse",
    step: "8. Employees",
    sourceTable: "t_nurse",
    sourceWhere: "deleted = 0",
    targetTable: "nurses",
    targetWhere: byLegacyTable("t_nurse"),
    notes:
      "Nurse core rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, branch mapping, profile image, contact fields, and active flag.",
  }),
  provenancedRule({
    id: "employees.t_nurse_attachments",
    step: "8. Employees",
    sourceTable: "t_nurse_attachments",
    sourceWhere: realLegacyFileWhere("active = 1"),
    targetTable: "nurse_attachments",
    notes:
      "Nurse attachment rows with real legacy files keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "employees.t_doctor",
    step: "8. Employees",
    sourceTable: "t_doctor",
    sourceWhere: "active = 1",
    targetTable: "doctors",
    targetWhere: byLegacyTable("t_doctor"),
    notes:
      "General doctor rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, default branch assignment, phone, remarks, active flag, raw legacy row, and backfilled address fields.",
  }),
  provenancedRule({
    id: "employees.t_manager",
    step: "8. Employees",
    sourceTable: "t_manager",
    sourceWhere: "deleted = 0",
    targetTable: "managers",
    targetWhere: byLegacyTable("t_manager"),
    notes:
      "Manager core rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, branch mapping, profile image, contact fields, and active flag.",
  }),
  provenancedRule({
    id: "employees.t_manager_address",
    step: "8. Employees",
    sourceTable: "t_manager_address",
    sourceWhere: "active = 1",
    targetTable: "manager_addresses",
    targetWhere: byLegacyTable("t_manager_address"),
    notes:
      "Manager address rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy manager id, full address columns, and raw legacy row.",
  }),
  provenancedRule({
    id: "garderie_misc.t_attachments",
    step: "9. Garderie Misc",
    sourceTable: "t_attachments",
    sourceWhere: realLegacyFileWhere(),
    targetTable: "child_attachments",
    notes:
      "Generic child attachment rows with real legacy files keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "garderie_misc.t_events_types",
    step: "9. Garderie Misc",
    sourceTable: "t_events_types",
    targetTable: "event_types",
    notes: "Event type rows keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "garderie_misc.t_events",
    step: "9. Garderie Misc",
    sourceTable: "t_events",
    targetTable: "events",
    notes:
      "Event rows keep sourceDatabase, legacyKey, custom notification text, branch-list JSON, and day-offset metadata.",
  }),
  provenancedRule({
    id: "garderie_misc.t_garderie_doctor",
    step: "9. Garderie Misc",
    sourceTable: "t_garderie_doctor",
    sourceWhere: "deleted = 0",
    targetTable: "doctors",
    targetWhere: (sourceDatabase) =>
      `${pgColumn("sourceDatabase")} = ${pgLiteral(
        sourceDatabase
      )} AND ${pgColumn("legacyTable")} = ${pgLiteral("t_garderie_doctor")}`,
    notes: "Garderie doctor rows keep sourceDatabase, legacyTable, and legacyKey.",
  }),
  provenancedRule({
    id: "garderie_misc.t_garderie_doctor_attachments",
    step: "9. Garderie Misc",
    sourceTable: "t_garderie_doctor_attachments",
    sourceWhere: realLegacyFileWhere(),
    targetTable: "doctor_attachments",
    notes:
      "Garderie doctor attachment rows with real legacy files keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "garderie_misc.t_manager_attachments",
    step: "9. Garderie Misc",
    sourceTable: "t_manager_attachments",
    sourceWhere: realLegacyFileWhere(),
    targetTable: "manager_attachments",
    notes:
      "Manager attachment rows with real legacy files keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "users.login_users",
    step: "10. Users",
    sourceTable: "login_users",
    sourceWhere: "TRIM(email) <> ''",
    targetTable: "users",
    targetWhere: byLegacyTable("login_users"),
    notes:
      "Legacy staff/admin auth users preserve sourceDatabase, legacyKey, legacyId, legacyTable, email/name/role mapping, branch mapping, active flag, and raw legacyData.",
  }),
  provenancedRule({
    id: "users.parent_login_users",
    step: "10. Users",
    sourceTable: "parent_login_users",
    sourceWhere: "TRIM(username) <> ''",
    targetTable: "parent_users",
    notes:
      "Parent users preserve sourceDatabase, legacyKey, legacyId, legacyChildId, token, active flag, and raw legacyData; mismatches expose unresolved child links or invalid usernames.",
  }),
  ...accessControlTables.map((table) =>
    provenancedRule({
      id: `control_plane.${table}`,
      step: "11. Control Plane",
      sourceTable: table,
      targetTable: "legacy_access_control_records",
      targetWhere: byLegacyTable(table),
      notes: `${table} rows are preserved as LegacyAccessControlRecord.`,
    })
  ),
  provenancedRule({
    id: "control_plane.t_garderies",
    step: "11. Control Plane",
    sourceTable: "t_garderies",
    targetTable: "legacy_garderie_registry",
    notes: "Legacy garderie registry rows keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "control_plane.notifications",
    step: "11. Control Plane",
    sourceTable: "notifications",
    targetTable: "legacy_settings",
    targetWhere: byLegacyTable("notifications"),
    notes: "Master notification channel rows are preserved as LegacySetting.",
  }),
  provenancedRule({
    id: "control_plane.year_select",
    step: "11. Control Plane",
    sourceTable: "year_select",
    targetTable: "legacy_year_databases",
    targetWhere: byLegacyTable("year_select"),
    notes: "Selected school-year rows are preserved as LegacyYearDatabase.",
  }),
  provenancedRule({
    id: "control_plane.year_db",
    step: "11. Control Plane",
    sourceTable: "year_db",
    targetTable: "legacy_year_databases",
    targetWhere: byLegacyTable("year_db"),
    notes: "Historical year database rows are preserved as LegacyYearDatabase.",
  }),
  ...authTables.map((table) =>
    provenancedRule({
      id: `auth_metadata.${table}`,
      step: "12. Auth Metadata",
      sourceTable: table,
      targetTable: "legacy_auth_records",
      targetWhere: byLegacyTable(table),
      notes: `${table} rows are preserved as LegacyAuthRecord.`,
    })
  ),
  ...loginTimestampTables.map((table) =>
    provenancedRule({
      id: `login_audit.${table}`,
      step: "13. Login Audit",
      sourceTable: table,
      targetTable: "legacy_login_timestamps",
      targetWhere: byLegacyTable(table),
      notes: `${table} rows are preserved as LegacyLoginTimestamp.`,
    })
  ),
  ...settingsTables.map((table) =>
    provenancedRule({
      id: `legacy_settings.${table}`,
      step: "14. Legacy Settings",
      sourceTable: table,
      targetTable: "legacy_settings",
      targetWhere: byLegacyTable(table),
      notes: `${table} rows are preserved as LegacySetting.`,
    })
  ),
  provenancedRule({
    id: "daily_reports.t_daily_report",
    step: "15. Daily Reports",
    sourceTable: "t_daily_report",
    sourceWhere: "active = 1",
    targetTable: "daily_reports",
    targetWhere: byLegacyDataSourceTable("t_daily_report"),
    notes:
      "Daily reports preserve sourceDatabase/sourceTable inside legacyData; mismatches expose unmapped children, invalid dates, or duplicate child/date merges.",
  }),
  provenancedRule({
    id: "daily_reports.t_daily_fever",
    step: "15. Daily Reports",
    sourceTable: "t_daily_fever",
    sourceWhere: "active = 1",
    targetTable: "daily_report_fevers",
    targetWhere: byLegacyTable("t_daily_fever"),
    notes:
      "Fever rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy report id, temperature/time, and raw legacy row.",
  }),
  provenancedRule({
    id: "daily_reports.t_daily_milk",
    step: "15. Daily Reports",
    sourceTable: "t_daily_milk",
    sourceWhere: "active = 1",
    targetTable: "daily_report_milks",
    targetWhere: byLegacyTable("t_daily_milk"),
    notes:
      "Milk rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy report id, milk type, amount/time, and raw legacy row.",
  }),
  provenancedRule({
    id: "daily_reports.t_daily_attachments",
    step: "15. Daily Reports",
    sourceTable: "t_daily_attachments",
    sourceWhere: realLegacyFileWhere("active = 1"),
    targetTable: "daily_report_attachments",
    notes:
      "Daily report attachment rows with real legacy files keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "absences.t_absent_report",
    step: "16. Absences",
    sourceTable: "t_absent_report",
    sourceWhere: "active = 1",
    targetTable: "absence_reports",
    notes:
      "Absence reports preserve sourceDatabase, legacyKey, legacyId, legacyChildId, status, hospital fields, createdBy mapping, and raw legacyData; mismatches expose unresolved child links or invalid legacy dates.",
  }),
  provenancedRule({
    id: "absences.t_absent_attachments",
    step: "16. Absences",
    sourceTable: "t_absent_attachments",
    sourceWhere: realLegacyFileWhere("active = 1"),
    targetTable: "absence_attachments",
    notes:
      "Absence attachment rows with real legacy files keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "calls.callparent",
    step: "17. Calls",
    sourceTable: "callparent",
    targetTable: "call_cause_categories",
    notes: "Call parent rows keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "calls.callcauses",
    step: "17. Calls",
    sourceTable: "callcauses",
    targetTable: "call_causes",
    notes: "Call cause rows keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "calls.t_form_6",
    step: "17. Calls",
    sourceTable: "t_form_6",
    sourceWhere: "active = 1",
    targetTable: "call_logs",
    targetWhere: bySourceDatabase(),
    notes:
      "Call logs preserve sourceDatabase, legacyKey, legacy ids, draft status, child/branch/class/teacher ids, and raw legacyData.",
  }),
  ...assessmentTables.map((assessmentType) =>
    provenancedRule({
      id: `assessments.t_assessment_${assessmentType}`,
      step: "18. Assessments",
      sourceTable: `t_assessment_${assessmentType}`,
      sourceWhere: "active = 1",
      targetTable: "assessments",
      targetWhere: (sourceDatabase) =>
        `${byLegacyTable(`t_assessment_${assessmentType}`)(
          sourceDatabase
        )} AND ${pgColumn("assessmentType")} = ${assessmentType}`,
      notes:
        "Assessment rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, child/class/teacher/user legacy ids, answer payload, and raw legacy row.",
    })
  ),
  weakRule({
    id: "assessments.new_assessment",
    step: "18. Assessments",
    sourceTable: "new_assessment",
    targetTable: "assessments",
    expectation: "informational",
    evidence: "derived",
    notes:
      "new_assessment markers may link onto existing assessments or create stubs, so source and target counts are not expected to match.",
  }),
  baseRule({
    id: "assessments.t_assessment_dates",
    step: "18. Assessments",
    source: { table: "t_assessment_dates" },
    target: { table: "assessment_schedule_rules" },
    expectation: "target-at-most-source",
    evidence: "derived",
    notes:
      "Multiple legacy threshold rows are consolidated into one AssessmentScheduleRule per assessment type.",
  }),
  ...formTables.map(({ table, type }) =>
    provenancedRule({
      id: `medical.${table}`,
      step: "19. Medical Forms",
      sourceTable: table,
      sourceWhere: "active = 1",
      targetTable: "medical_forms",
      targetWhere: (sourceDatabase) =>
        `${byLegacyTable(table)(sourceDatabase)} AND ${pgColumn(
          "formType"
        )} = ${pgLiteral(type)}`,
      notes:
        "Medical form rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, child/branch/class/user legacy ids, form status, form data, and raw legacy row.",
    })
  ),
  provenancedRule({
    id: "medical.t_med_forms_info",
    step: "19. Medical Forms",
    sourceTable: "t_med_forms_info",
    sourceWhere: "active = 1",
    targetTable: "medical_form_entries",
    targetWhere: byLegacyTable("t_med_forms_info"),
    notes:
      "Medical form info rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy form/child ids, field/value text, and raw legacy row.",
  }),
  provenancedRule({
    id: "medical.t_forms_attachments",
    step: "19. Medical Forms",
    sourceTable: "t_forms_attachments",
    sourceWhere: realLegacyFileWhere(),
    targetTable: "form_attachments",
    notes:
      "Medical form attachment rows with real legacy files keep sourceDatabase and legacyKey.",
  }),
  baseRule({
    id: "medical.vaccinations_from_t_form_4",
    step: "19. Medical Forms",
    source: {
      table: "t_form_4",
      where: "active = 1",
      countExpression: vaccinationSourceCountExpression,
    },
    target: {
      table: "vaccinations",
      where: byLegacyTable("t_form_4"),
    },
    expectation: "equal",
    evidence: "strong",
    notes:
      "Vaccination rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy child id, vaccine/date/status fields, and raw legacy row.",
  }),
  provenancedRule({
    id: "payments.t_payments",
    step: "20. Payments",
    sourceTable: "t_payments",
    sourceWhere: "active = 1",
    targetTable: "payments",
    notes: "Payments keep sourceDatabase and legacyKey.",
  }),
  baseRule({
    id: "payments.t_accounting",
    step: "20. Payments",
    source: {
      table: "t_accounting",
      where: "active = 1",
      countExpression: accountingEntrySourceCountExpression,
    },
    target: {
      table: "accounting_entries",
      where: byLegacyTable("t_accounting"),
    },
    expectation: "equal",
    evidence: "strong",
    notes:
      "Accounting fee/discount lines preserve sourceDatabase, legacyKey, legacyId, legacyTable, legacy child id, legacy amount field, and raw legacy row.",
  }),
  provenancedRule({
    id: "payments.newpayment",
    step: "20. Payments",
    sourceTable: "newpayment",
    targetTable: "payment_reminders",
    notes: "Payment reminder rows keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "food.t_food",
    step: "21. Food, Calendar & Holidays",
    sourceTable: "t_food",
    sourceWhere: "deleted = 0",
    targetTable: "foods",
    notes:
      "Food items preserve sourceDatabase, legacyKey, legacyId, raw legacyData, organization mapping, category, active flag, and created timestamp.",
  }),
  weakRule({
    id: "food.t_food_calendar",
    step: "21. Food, Calendar & Holidays",
    sourceTable: "t_food_calendar",
    sourceWhere: "active = 1",
    targetTable: "food_calendars",
    targetWhere: bySourceDatabase(),
    targetCountExpression: pgDistinctCount("legacyId"),
    expectation: "equal",
    evidence: "strong",
    notes:
      "Food calendar rows fan out by meal type, so reconciliation counts distinct legacyId values with sourceDatabase provenance.",
  }),
  provenancedRule({
    id: "food.t_food_apply",
    step: "21. Food, Calendar & Holidays",
    sourceTable: "t_food_apply",
    targetTable: "food_applications",
    notes: "Food application rows keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "food.t_holiday",
    step: "21. Food, Calendar & Holidays",
    sourceTable: "t_holiday",
    targetTable: "holidays",
    targetWhere: byLegacyTable("t_holiday"),
    notes:
      "Holiday rows preserve sourceDatabase, legacyKey, legacyId, legacyTable, notification fields, repeated/active flags, date, and raw legacyData.",
  }),
  ...alarmTables.map((table) =>
    provenancedRule({
      id: `alarms.${table}`,
      step: "22. Alarms & Notifications",
      sourceTable: table,
      targetTable: "alarms",
      targetWhere: byLegacyDataSourceTable(table),
      notes:
        "Alarm content rows preserve sourceDatabase, sourceTable, and category inside Alarm.legacyData.",
    })
  ),
  ...receiptTables.map((table) =>
    provenancedRule({
      id: `notification_receipts.${table}`,
      step: "22. Alarms & Notifications",
      sourceTable: table,
      targetTable: "notification_receipts",
      targetWhere: bySourceTable(table),
      notes: `${table} delivery rows are preserved as NotificationReceipt.`,
    })
  ),
  weakRule({
    id: "alarms.notifications_tokens",
    step: "22. Alarms & Notifications",
    sourceTable: "notifications_tokens",
    targetTable: "push_tokens",
    notes: "Push tokens are unique by token and can deduplicate across rows.",
  }),
  weakRule({
    id: "alarms.t_notifications_log",
    step: "22. Alarms & Notifications",
    sourceTable: "t_notifications_log",
    targetTable: "legacy_notification_logs",
    targetWhere: byLegacyDataSourceTable("t_notifications_log"),
    notes:
      "Notification logs preserve sourceDatabase/sourceTable inside legacyData, but legacyId remains globally unique for compatibility.",
  }),
  provenancedRule({
    id: "alarms.notifications_nature",
    step: "22. Alarms & Notifications",
    sourceTable: "notifications_nature",
    targetTable: "legacy_notification_natures",
    notes: "Notification nature rows keep sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "messages.t_alarms_msg",
    step: "23. Messages",
    sourceTable: "t_alarms_msg",
    targetTable: "messages",
    expectation: "informational",
    evidence: "derived",
    notes:
      "Message rows keep sourceDatabase, legacyKey, legacyId, and legacyThreadId, but t_alarms_msg count is informational because custom_notifications_msg delivery rows intentionally fan out into multiple recipient messages.",
  }),
  weakRule({
    id: "messages.custom_notifications_msg",
    step: "23. Messages",
    sourceTable: "custom_notifications_msg",
    targetTable: "messages",
    expectation: "informational",
    evidence: "derived",
    notes:
      "custom_notifications_msg rows become per-recipient Message rows with legacyKey and delivery user/type provenance; count is informational because source messages without delivery rows create a self-recipient fallback.",
  }),
];

function selectedRules(): ReconciliationRule[] {
  const requested = new Set(argValues("rule"));
  if (requested.size === 0) return RECONCILIATION_RULES;
  return RECONCILIATION_RULES.filter((rule) => requested.has(rule.id));
}

function printRuleList() {
  for (const rule of RECONCILIATION_RULES) {
    console.log(`${rule.id}\t${rule.step}\t${rule.source.table} -> ${rule.target.table}`);
  }
}

function statusSummary(results: ReconciliationResult[]): ReconciliationReport["totals"] {
  const totals: ReconciliationReport["totals"] = {
    rules: results.length,
    ok: 0,
    warning: 0,
    missing: 0,
    "not-applicable": 0,
    error: 0,
  };
  for (const result of results) {
    totals[result.status]++;
  }
  return totals;
}

function printResults(results: ReconciliationResult[]) {
  log("Migration count reconciliation");
  log(
    "status          source  target  delta  evidence  rule"
  );
  for (const result of results) {
    const source = result.sourceCount == null ? "-" : String(result.sourceCount);
    const target = result.targetCount == null ? "-" : String(result.targetCount);
    const delta = result.delta == null ? "-" : String(result.delta);
    console.log(
      [
        result.status.padEnd(15),
        source.padStart(6),
        target.padStart(6),
        delta.padStart(6),
        result.evidence.padEnd(8),
        result.id,
      ].join("  ")
    );
    if (result.status !== "ok") {
      console.log(`  ${result.message}`);
    }
  }
}

async function main() {
  if (process.argv.includes("--list-rules")) {
    printRuleList();
    return;
  }

  const rules = selectedRules();
  const unknownRuleIds = argValues("rule").filter(
    (id) => !RECONCILIATION_RULES.some((rule) => rule.id === id)
  );
  if (unknownRuleIds.length > 0) {
    throw new Error(`Unknown reconciliation rule(s): ${unknownRuleIds.join(", ")}`);
  }

  const sourceDatabase = getMysqlConfig().database || "unknown";
  const targetSchema = argValue("target-schema") ?? "public";
  const jsonPath = argValue("json");
  const failOnWarning = process.argv.includes("--fail-on-warning");
  const prisma = createPrismaClient();

  try {
    const results: ReconciliationResult[] = [];
    for (const rule of rules) {
      results.push(
        await reconcileRule(prisma, rule, sourceDatabase, targetSchema)
      );
    }

    const report: ReconciliationReport = {
      generatedAt: new Date().toISOString(),
      sourceDatabase,
      targetSchema,
      totals: statusSummary(results),
      results,
    };

    printResults(results);
    log(
      `Totals: ${report.totals.ok} ok, ${report.totals.warning} warning, ${report.totals.missing} missing, ${report.totals["not-applicable"]} not-applicable, ${report.totals.error} error`
    );

    if (jsonPath) {
      fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
      log(`Wrote reconciliation JSON to ${jsonPath}`);
    }

    if (
      report.totals.error > 0 ||
      report.totals.missing > 0 ||
      (failOnWarning && report.totals.warning > 0)
    ) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
    await closeMysqlPool();
  }
}

if (require.main === module) {
  main().catch((err) => {
    logError("Migration reconciliation failed", err);
    process.exit(1);
  });
}
