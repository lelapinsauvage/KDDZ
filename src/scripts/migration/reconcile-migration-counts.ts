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

async function mysqlCount(table: string, where: string | null): Promise<number> {
  const sql = `SELECT COUNT(*) AS count FROM ${quoteMysqlIdentifier(table)}${
    where ? ` WHERE ${where}` : ""
  }`;
  const rows = await queryMysql<Array<{ count: unknown }>[number]>(sql);
  return parseCount(rows[0]?.count);
}

async function postgresCount(
  prisma: PrismaClient,
  schema: string,
  table: string,
  where: string | null
): Promise<number> {
  const sql = `SELECT COUNT(*)::bigint AS count FROM ${pgTableRef(
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
      const sourceCount = await mysqlCount(rule.source.table, sourceWhere);
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
      mysqlCount(rule.source.table, sourceWhere),
      postgresCount(prisma, targetSchema, rule.target.table, targetWhere),
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
  targetWhere?: string;
  notes: string;
  expectation?: Expectation;
  evidence?: EvidenceStrength;
}): ReconciliationRule {
  return baseRule({
    id: params.id,
    step: params.step,
    source: { table: params.sourceTable, where: params.sourceWhere },
    target: { table: params.targetTable, where: params.targetWhere },
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
const receiptTables = [
  "custom_notifications",
  "custom_notifications_birthday",
  "custom_notifications_contracts",
  "custom_notifications_insurance",
  "custom_notifications_medical",
  "custom_notifications_medicine",
  "custom_notifications_assessment",
  "custom_notifications_payments",
  "custom_notifications_vaccinations",
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

const RECONCILIATION_RULES: ReconciliationRule[] = [
  weakRule({
    id: "branches.t_branch",
    step: "1. Branches",
    sourceTable: "t_branch",
    targetTable: "branches",
    notes:
      "Branch rows do not yet carry legacy provenance; count is a lower-bound sanity check, not row-level proof.",
  }),
  weakRule({
    id: "locations.t_mouhafaza",
    step: "2. Locations",
    sourceTable: "t_mouhafaza",
    sourceWhere: "active = 1",
    targetTable: "provinces",
    notes:
      "Location migrator deduplicates by name/reference and skips inactive rows.",
  }),
  weakRule({
    id: "locations.t_quadaa",
    step: "2. Locations",
    sourceTable: "t_quadaa",
    sourceWhere: "active = 1",
    targetTable: "districts",
    notes:
      "Districts depend on migrated provinces; lower counts require orphan-parent review.",
  }),
  weakRule({
    id: "locations.t_region",
    step: "2. Locations",
    sourceTable: "t_region",
    sourceWhere: "active = 1",
    targetTable: "regions",
    notes:
      "Regions depend on migrated districts; lower counts require orphan-parent review.",
  }),
  provenancedRule({
    id: "school_years.t_school_year",
    step: "3. School Years",
    sourceTable: "t_school_year",
    targetTable: "school_years",
    notes: "School years preserve sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "classes.t_class",
    step: "4. Classes",
    sourceTable: "t_class",
    targetTable: "classes",
    notes:
      "Classes currently lack legacy provenance; count cannot detect row swaps.",
  }),
  weakRule({
    id: "children.t_child",
    step: "5. Children",
    sourceTable: "t_child",
    sourceWhere: "deleted = 0",
    targetTable: "children",
    targetWhere: `${pgColumn("isDraft")} = false`,
    notes:
      "Active child rows are restored as non-draft children; no row-level legacy key exists yet.",
  }),
  weakRule({
    id: "children.t_child_draft",
    step: "5. Children",
    sourceTable: "t_child_draft",
    sourceWhere: "deleted = 0",
    targetTable: "children",
    targetWhere: `${pgColumn("isDraft")} = true`,
    notes:
      "Draft child rows are restored into children with isDraft=true.",
  }),
  weakRule({
    id: "children.t_child_h",
    step: "5. Children",
    sourceTable: "t_child_h",
    targetTable: "child_history",
    notes:
      "History rows depend on child mapping and currently do not store sourceDatabase.",
  }),
  weakRule({
    id: "children.t_address",
    step: "5. Children",
    sourceTable: "t_address",
    sourceWhere: "active = 1",
    targetTable: "child_addresses",
    notes:
      "Child address rows depend on child and location mapping; no provenance column exists.",
  }),
  weakRule({
    id: "children.t_authorized",
    step: "5. Children",
    sourceTable: "t_authorized",
    sourceWhere: "active = 1",
    targetTable: "relatives",
    targetWhere: `${pgColumn("isAuthorized")} = true`,
    notes:
      "Authorized pickup rows become Relative rows with isAuthorized=true.",
  }),
  weakRule({
    id: "children.t_relatives",
    step: "5. Children",
    sourceTable: "t_relatives",
    sourceWhere: "active = 1",
    targetTable: "relatives",
    targetWhere: `${pgColumn("isAuthorized")} = false`,
    notes:
      "General relatives become Relative rows with isAuthorized=false.",
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
  weakRule({
    id: "parents.t_parents",
    step: "7. Parents",
    sourceTable: "t_parents",
    sourceWhere: "active = 1",
    targetTable: "parents",
    notes:
      "Parent rows do not yet carry legacy provenance; count only proves broad coverage.",
  }),
  weakRule({
    id: "employees.t_teacher",
    step: "8. Employees",
    sourceTable: "t_teacher",
    sourceWhere: "deleted = 0",
    targetTable: "teachers",
    notes: "Teacher core rows do not yet carry sourceDatabase.",
  }),
  weakRule({
    id: "employees.t_teacher_address",
    step: "8. Employees",
    sourceTable: "t_teacher_address",
    sourceWhere: "active = 1",
    targetTable: "teacher_addresses",
    notes: "Teacher address rows depend on teacher mapping.",
  }),
  weakRule({
    id: "employees.t_teacher_attachments",
    step: "8. Employees",
    sourceTable: "t_teacher_attachments",
    sourceWhere: "active = 1",
    targetTable: "teacher_attachments",
    notes: "Teacher attachments still need legacy provenance fields.",
  }),
  provenancedRule({
    id: "employees.t_teacher_info",
    step: "8. Employees",
    sourceTable: "t_teacher_info",
    targetTable: "teacher_experiences",
    notes: "Teacher experience rows keep sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "employees.t_nurse",
    step: "8. Employees",
    sourceTable: "t_nurse",
    sourceWhere: "deleted = 0",
    targetTable: "nurses",
    notes: "Nurse core rows do not yet carry sourceDatabase.",
  }),
  weakRule({
    id: "employees.t_nurse_attachments",
    step: "8. Employees",
    sourceTable: "t_nurse_attachments",
    sourceWhere: "active = 1",
    targetTable: "nurse_attachments",
    notes: "Nurse attachments still need legacy provenance fields.",
  }),
  weakRule({
    id: "employees.t_doctor",
    step: "8. Employees",
    sourceTable: "t_doctor",
    sourceWhere: "active = 1",
    targetTable: "doctors",
    notes:
      "General doctor rows are matched by name and do not yet store sourceDatabase.",
  }),
  weakRule({
    id: "employees.t_manager",
    step: "8. Employees",
    sourceTable: "t_manager",
    sourceWhere: "deleted = 0",
    targetTable: "managers",
    notes: "Manager core rows do not yet carry sourceDatabase.",
  }),
  weakRule({
    id: "employees.t_manager_address",
    step: "8. Employees",
    sourceTable: "t_manager_address",
    sourceWhere: "active = 1",
    targetTable: "manager_addresses",
    notes: "Manager address rows depend on manager mapping.",
  }),
  provenancedRule({
    id: "garderie_misc.t_attachments",
    step: "9. Garderie Misc",
    sourceTable: "t_attachments",
    targetTable: "child_attachments",
    notes: "Generic child attachments keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "garderie_misc.t_events_types",
    step: "9. Garderie Misc",
    sourceTable: "t_events_types",
    targetTable: "event_types",
    notes: "Event type rows keep sourceDatabase and legacyKey.",
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
    targetTable: "doctor_attachments",
    notes: "Garderie doctor attachments keep sourceDatabase and legacyKey.",
  }),
  provenancedRule({
    id: "garderie_misc.t_manager_attachments",
    step: "9. Garderie Misc",
    sourceTable: "t_manager_attachments",
    targetTable: "manager_attachments",
    notes: "Manager attachments keep sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "users.login_users",
    step: "10. Users",
    sourceTable: "login_users",
    targetTable: "users",
    notes:
      "Modern users can include seeded/admin users; this is a lower-bound check.",
  }),
  weakRule({
    id: "users.parent_login_users",
    step: "10. Users",
    sourceTable: "parent_login_users",
    targetTable: "parent_users",
    notes:
      "Parent users do not yet preserve sourceDatabase; count is not row-level proof.",
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
  weakRule({
    id: "daily_reports.t_daily_report",
    step: "15. Daily Reports",
    sourceTable: "t_daily_report",
    sourceWhere: "active = 1",
    targetTable: "daily_reports",
    notes:
      "Daily reports are keyed by child/date, but no sourceDatabase is stored yet.",
  }),
  weakRule({
    id: "daily_reports.t_daily_fever",
    step: "15. Daily Reports",
    sourceTable: "t_daily_fever",
    sourceWhere: "active = 1",
    targetTable: "daily_report_fevers",
    notes: "Fever rows depend on successfully mapped daily reports.",
  }),
  weakRule({
    id: "daily_reports.t_daily_milk",
    step: "15. Daily Reports",
    sourceTable: "t_daily_milk",
    sourceWhere: "active = 1",
    targetTable: "daily_report_milks",
    notes: "Milk rows depend on successfully mapped daily reports.",
  }),
  weakRule({
    id: "daily_reports.t_daily_attachments",
    step: "15. Daily Reports",
    sourceTable: "t_daily_attachments",
    sourceWhere: "active = 1",
    targetTable: "daily_report_attachments",
    notes: "Daily attachments still need legacy provenance fields.",
  }),
  weakRule({
    id: "absences.t_absent_report",
    step: "16. Absences",
    sourceTable: "t_absent_report",
    sourceWhere: "active = 1",
    targetTable: "absence_reports",
    notes: "Absence reports are matched by child/date/reason without provenance.",
  }),
  weakRule({
    id: "absences.t_absent_attachments",
    step: "16. Absences",
    sourceTable: "t_absent_attachments",
    sourceWhere: "active = 1",
    targetTable: "absence_attachments",
    notes: "Absence attachments depend on mapped absence reports.",
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
  weakRule({
    id: "calls.t_form_6",
    step: "17. Calls",
    sourceTable: "t_form_6",
    sourceWhere: "active = 1 AND is_rep_draft = 0",
    targetTable: "call_logs",
    notes:
      "Current code migrates t_form_6 to CallLog; README also mentions MedicalForm, so this rule exposes that parity decision.",
  }),
  ...assessmentTables.map((assessmentType) =>
    weakRule({
      id: `assessments.t_assessment_${assessmentType}`,
      step: "18. Assessments",
      sourceTable: `t_assessment_${assessmentType}`,
      sourceWhere: "active = 1",
      targetTable: "assessments",
      targetWhere: `${pgColumn("assessmentType")} = ${assessmentType}`,
      notes:
        "Assessment rows preserve legacy identifiers inside JSON, not queryable provenance columns.",
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
    weakRule({
      id: `medical.${table}`,
      step: "19. Medical Forms",
      sourceTable: table,
      sourceWhere: "active = 1",
      targetTable: "medical_forms",
      targetWhere: `${pgColumn("formType")} = ${pgLiteral(type)}`,
      notes:
        "Medical form rows store legacy IDs inside JSON; add provenance columns before treating this as row-level proof.",
    })
  ),
  weakRule({
    id: "medical.t_med_forms_info",
    step: "19. Medical Forms",
    sourceTable: "t_med_forms_info",
    sourceWhere: "active = 1",
    targetTable: "medical_form_entries",
    notes: "Medical form info rows depend on mapped medical forms.",
  }),
  provenancedRule({
    id: "medical.t_forms_attachments",
    step: "19. Medical Forms",
    sourceTable: "t_forms_attachments",
    targetTable: "form_attachments",
    notes: "Form attachments keep sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "medical.vaccinations_from_t_form_4",
    step: "19. Medical Forms",
    sourceTable: "t_form_4",
    sourceWhere: "active = 1",
    targetTable: "vaccinations",
    expectation: "informational",
    evidence: "derived",
    notes:
      "Each t_form_4 row can fan out into zero or many vaccination rows depending on populated vaccine fields.",
  }),
  provenancedRule({
    id: "payments.t_payments",
    step: "20. Payments",
    sourceTable: "t_payments",
    sourceWhere: "active = 1",
    targetTable: "payments",
    notes: "Payments keep sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "payments.t_accounting",
    step: "20. Payments",
    sourceTable: "t_accounting",
    sourceWhere: "active = 1",
    targetTable: "accounting_entries",
    expectation: "informational",
    evidence: "derived",
    notes:
      "Each accounting row can fan out into several fee and discount entries.",
  }),
  provenancedRule({
    id: "payments.newpayment",
    step: "20. Payments",
    sourceTable: "newpayment",
    targetTable: "payment_reminders",
    notes: "Payment reminder rows keep sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "food.t_food",
    step: "21. Food, Calendar & Holidays",
    sourceTable: "t_food",
    sourceWhere: "deleted = 0",
    targetTable: "foods",
    notes: "Food items are matched by organization/name/category without provenance.",
  }),
  weakRule({
    id: "food.t_food_calendar",
    step: "21. Food, Calendar & Holidays",
    sourceTable: "t_food_calendar",
    sourceWhere: "active = 1",
    targetTable: "food_calendars",
    expectation: "informational",
    evidence: "derived",
    notes:
      "Each food-calendar row can fan out into breakfast/lunch/snack/dessert entries.",
  }),
  provenancedRule({
    id: "food.t_food_apply",
    step: "21. Food, Calendar & Holidays",
    sourceTable: "t_food_apply",
    targetTable: "food_applications",
    notes: "Food application rows keep sourceDatabase and legacyKey.",
  }),
  weakRule({
    id: "food.t_holiday",
    step: "21. Food, Calendar & Holidays",
    sourceTable: "t_holiday",
    targetTable: "holidays",
    notes: "Holidays are matched by name/date without provenance.",
  }),
  ...alarmTables.map((table) =>
    weakRule({
      id: `alarms.${table}`,
      step: "22. Alarms & Notifications",
      sourceTable: table,
      targetTable: "alarms",
      targetWhere: `${pgColumn("legacyData")} ->> ${pgLiteral(
        "sourceTable"
      )} = ${pgLiteral(table)}`,
      notes:
        "Alarm provenance is currently stored inside legacyData JSON rather than dedicated columns.",
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
    notes: "Notification logs keep legacyId but not sourceDatabase.",
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
      "Message migration creates sender messages plus recipient delivery messages, so counts intentionally fan out.",
  }),
  weakRule({
    id: "messages.custom_notifications_msg",
    step: "23. Messages",
    sourceTable: "custom_notifications_msg",
    targetTable: "messages",
    expectation: "informational",
    evidence: "derived",
    notes:
      "custom_notifications_msg rows become per-recipient delivery messages when users resolve.",
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
