/**
 * Migration: t_assessment_1..7 + new_assessment → Assessment
 *            t_assessment_dates                 → AssessmentScheduleRule
 *
 * Legacy assessment reports store one table per age bracket. The modern app
 * stores the selected bracket in `assessmentType` and keeps the form payload in
 * Assessment.data, so all answer fields are preserved as flat JSON keys that
 * the current assessment form can reopen.
 *
 * Legacy `t_assessment_dates.assessment_date` is not a calendar date; it is an
 * age threshold in days used by the old "Missing Assessment Reports" screen.
 * Those thresholds are restored into AssessmentScheduleRule instead of the
 * modern AssessmentDate calendar table.
 *
 * Prerequisites: Children, classes, employees/users, and organization must be
 * migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
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
  toInt,
} from "./lib/utils";

interface OldNewAssessment {
  id: number;
  datetime: string;
  t_name: string;
  report_id: number;
  child_id: number;
  sent: number;
}

interface OldAssessmentScheduleDate {
  dateid: number;
  assessment_id: number;
  assessment_date: string;
  assessment_datetime: string;
}

interface ScheduleRuleDraft {
  assessmentType: number;
  minimumAgeDays: string | null;
  maximumAgeDays: string | null;
  legacyMinimumId: number | null;
  legacyMaximumId: number | null;
  legacyRows: OldAssessmentScheduleDate[];
}

const ASSESSMENT_TYPES = [1, 2, 3, 4, 5, 6, 7] as const;
const ANSWER_KEY_RE = /^[mclsd]\d+$/;

function legacyKey(sourceDatabase: string, table: string, legacyId: number) {
  return `${sourceDatabase}:${table}:${legacyId}`;
}

function legacyRowData(
  sourceDatabase: string,
  sourceTable: string,
  legacyId: number,
  row: Record<string, unknown>
) {
  return JSON.parse(
    JSON.stringify({
      sourceDatabase,
      sourceTable,
      legacyId,
      row,
    })
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseAssessmentType(tableName: string): number | null {
  const match = tableName.match(/^t_assessment_(\d+)$/);
  if (!match) return null;
  const assessmentType = parseInt(match[1], 10);
  return ASSESSMENT_TYPES.includes(assessmentType as (typeof ASSESSMENT_TYPES)[number])
    ? assessmentType
    : null;
}

function normalizeAgeDays(value: string): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
}

function datesMatch(left: unknown, right: unknown): boolean {
  const leftDate = typeof left === "string" ? parseDate(left) : null;
  const rightDate = typeof right === "string" ? parseDate(right) : null;
  return !!leftDate && !!rightDate && leftDate.getTime() === rightDate.getTime();
}

function buildAssessmentData(
  sourceDatabase: string,
  tableName: string,
  assessmentType: number,
  row: Record<string, unknown>
): Record<string, unknown> {
  const oldId = toInt(row.report_id);
  const data: Record<string, unknown> = {
    comments: cleanString(row.comments) ?? "",
    _legacy: {
      source: "mysql",
      sourceDatabase,
      table: tableName,
      reportId: oldId,
      childId: cleanString(row.child_id),
      classId: cleanString(row.class_id),
      classUuid: getMapping("class", row.class_id as string),
      teacherId: toInt(row.teacher_id, 0),
      teacherUuid: getMapping("teacher", row.teacher_id as number),
      reportDate: cleanString(row.ddate),
      progress: row.progress,
      isDraft: toBool(row.is_draft),
      active: toBool(row.active),
      createdByLegacyId: toInt(row.uby, 0),
      datetime: cleanString(row.datetime),
    },
    _legacyRaw: JSON.parse(JSON.stringify(row)),
  };

  for (const [key, value] of Object.entries(row)) {
    if (!ANSWER_KEY_RE.test(key)) continue;
    data[key] = key.startsWith("d") ? toBool(value) : toInt(value, 0);
  }

  data._legacyAssessmentType = assessmentType;
  return data;
}

async function findExistingAssessment(
  prisma: PrismaClient,
  childId: string,
  assessmentType: number,
  tableName: string,
  oldId: number,
  key: string
) {
  const existingByKey = await prisma.assessment.findUnique({
    where: { legacyKey: key },
    select: { id: true, data: true },
  });
  if (existingByKey) return existingByKey;

  const candidates = await prisma.assessment.findMany({
    where: { childId, assessmentType, legacyKey: null },
    select: { id: true, data: true },
  });

  return candidates.find((assessment) => {
    const data = asRecord(assessment.data);
    const legacy = asRecord(data._legacy);
    return legacy.table === tableName && legacy.reportId === oldId;
  });
}

async function migrateAssessmentTable(
  prisma: PrismaClient,
  sourceDatabase: string,
  tableName: string,
  assessmentType: number,
  dryRun: boolean
) {
  const rows = await queryMysql<Record<string, unknown>>(
    `SELECT * FROM ${tableName} WHERE active = 1 ORDER BY report_id`
  );
  log(`Found ${rows.length} rows in ${tableName}`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const oldId = toInt(row.report_id);
    const childId = getMapping("child", row.child_id as string);
    if (!oldId || !childId) {
      errors++;
      continue;
    }

    const existing = await findExistingAssessment(
      prisma,
      childId,
      assessmentType,
      tableName,
      oldId,
      legacyKey(sourceDatabase, tableName, oldId)
    );
    const status = toBool(row.is_draft)
      ? ("DRAFT" as const)
      : ("SUBMITTED" as const);
    const data = buildAssessmentData(sourceDatabase, tableName, assessmentType, row);
    const baseData = {
      childId,
      sourceDatabase,
      legacyKey: legacyKey(sourceDatabase, tableName, oldId),
      legacyId: oldId,
      legacyTable: tableName,
      legacyChildId: toInt(row.child_id, 0) || null,
      legacyClassId: toInt(row.class_id, 0) || null,
      legacyTeacherId: toInt(row.teacher_id, 0) || null,
      legacyCreatedById: toInt(row.uby, 0) || null,
      assessmentType,
      status,
      data: JSON.parse(JSON.stringify(data)),
      legacyData: legacyRowData(sourceDatabase, tableName, oldId, row),
      createdById: getMapping("user", row.uby as number),
      createdAt: parseDate(row.datetime as string) ?? new Date(),
    };
    if (existing) {
      if (!dryRun) {
        await prisma.assessment.update({
          where: { id: existing.id },
          data: baseData,
        });
      }
      setMapping(`assessment_${assessmentType}`, oldId, existing.id);
      skipped++;
      continue;
    }

    const id = generateUUID();

    if (!dryRun) {
      await prisma.assessment.create({
        data: {
          id,
          ...baseData,
        },
      });
    }

    setMapping(`assessment_${assessmentType}`, oldId, id);
    migrated++;
    logProgress(migrated, rows.length, tableName);
  }

  log(`${tableName}: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
}

async function findAssessmentForNotification(
  prisma: PrismaClient,
  row: OldNewAssessment,
  assessmentType: number,
  childId: string
) {
  const mappedId = row.report_id
    ? getMapping(`assessment_${assessmentType}`, row.report_id)
    : null;
  if (mappedId) {
    return prisma.assessment.findUnique({
      where: { id: mappedId },
      select: { id: true, data: true, createdAt: true },
    });
  }

  const candidates = await prisma.assessment.findMany({
    where: { childId, assessmentType },
    select: { id: true, data: true, createdAt: true },
  });

  return candidates.find((assessment) => {
    const data = asRecord(assessment.data);
    const legacy = asRecord(data._legacy);
    return (
      legacy.table === row.t_name &&
      (datesMatch(legacy.datetime, row.datetime) ||
        assessment.createdAt.getTime() === (parseDate(row.datetime)?.getTime() ?? -1))
    );
  });
}

async function migrateNewAssessmentMarkers(
  prisma: PrismaClient,
  dryRun: boolean,
  sourceDatabase: string
) {
  const rows = await queryMysql<OldNewAssessment>(
    "SELECT * FROM new_assessment ORDER BY id"
  );
  log(`Found ${rows.length} parent assessment notification markers`);

  let linked = 0;
  let stubs = 0;
  let skipped = 0;

  for (const row of rows) {
    const assessmentType = parseAssessmentType(row.t_name);
    const childId = getMapping("child", row.child_id);
    if (!assessmentType || !childId) {
      skipped++;
      continue;
    }

    const marker = {
      sourceDatabase,
      sourceTable: "new_assessment",
      id: row.id,
      datetime: row.datetime,
      table: row.t_name,
      reportId: row.report_id,
      childId: row.child_id,
      sent: toBool(row.sent),
    };
    const markerKey = legacyKey(sourceDatabase, "new_assessment", row.id);
    const existingStub = await prisma.assessment.findUnique({
      where: { legacyKey: markerKey },
      select: { id: true },
    });
    if (existingStub) {
      setMapping("new_assessment", row.id, existingStub.id);
      skipped++;
      continue;
    }

    const existing = await findAssessmentForNotification(
      prisma,
      row,
      assessmentType,
      childId
    );

    if (existing) {
      const data = asRecord(existing.data);
      const currentMarkers = Array.isArray(data._legacyNewAssessmentMarkers)
        ? data._legacyNewAssessmentMarkers
        : [];
      const alreadyLinked = currentMarkers.some(
        (item) => asRecord(item).id === row.id
      );

      if (!alreadyLinked && !dryRun) {
        await prisma.assessment.update({
          where: { id: existing.id },
          data: {
            data: JSON.parse(
              JSON.stringify({
                ...data,
                _legacyNewAssessmentMarkers: [...currentMarkers, marker],
              })
            ),
          },
        });
      }

      setMapping("new_assessment", row.id, existing.id);
      linked++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.assessment.create({
        data: {
          id,
          childId,
          sourceDatabase,
          legacyKey: markerKey,
          legacyId: row.id,
          legacyTable: "new_assessment",
          legacyChildId: row.child_id,
          assessmentType,
          status: toBool(row.sent) ? "SUBMITTED" : "DRAFT",
          legacyData: legacyRowData(sourceDatabase, "new_assessment", row.id, {
            ...row,
          }),
          data: JSON.parse(
            JSON.stringify({
              comments: "",
              _legacyNewAssessmentOnly: marker,
            })
          ),
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }
    setMapping("new_assessment", row.id, id);
    stubs++;
  }

  log(
    `New assessment markers: ${linked} linked, ${stubs} stub assessments created, ${skipped} skipped`
  );
}

function buildScheduleRules(rows: OldAssessmentScheduleDate[]): ScheduleRuleDraft[] {
  const rules = new Map<number, ScheduleRuleDraft>();

  for (const row of rows) {
    const isMaximum = row.assessment_id > 10;
    const assessmentType = isMaximum
      ? Math.floor(row.assessment_id / 11)
      : row.assessment_id;
    if (!ASSESSMENT_TYPES.includes(assessmentType as (typeof ASSESSMENT_TYPES)[number])) {
      continue;
    }

    const rule =
      rules.get(assessmentType) ??
      {
        assessmentType,
        minimumAgeDays: null,
        maximumAgeDays: null,
        legacyMinimumId: null,
        legacyMaximumId: null,
        legacyRows: [],
      };

    if (isMaximum) {
      rule.maximumAgeDays = normalizeAgeDays(row.assessment_date);
      rule.legacyMaximumId = row.assessment_id;
    } else {
      rule.minimumAgeDays = normalizeAgeDays(row.assessment_date);
      rule.legacyMinimumId = row.assessment_id;
    }

    rule.legacyRows.push(row);
    rules.set(assessmentType, rule);
  }

  return [...rules.values()].sort((a, b) => a.assessmentType - b.assessmentType);
}

async function migrateAssessmentScheduleRules(
  prisma: PrismaClient,
  organizationId: string,
  sourceDatabase: string,
  dryRun: boolean
) {
  const rows = await queryMysql<OldAssessmentScheduleDate>(
    "SELECT * FROM t_assessment_dates ORDER BY dateid"
  );
  log(`Found ${rows.length} legacy assessment threshold rows`);

  const rules = buildScheduleRules(rows);
  let migrated = 0;
  let backfilled = 0;
  let refreshed = 0;

  for (const rule of rules) {
    const key = legacyKey(
      sourceDatabase,
      "t_assessment_dates",
      rule.assessmentType
    );
    const data = {
      organizationId,
      sourceDatabase,
      legacyKey: key,
      legacyTable: "t_assessment_dates",
      assessmentType: rule.assessmentType,
      minimumAgeDays: rule.minimumAgeDays,
      maximumAgeDays: rule.maximumAgeDays,
      legacyMinimumId: rule.legacyMinimumId,
      legacyMaximumId: rule.legacyMaximumId,
      legacyData: JSON.parse(JSON.stringify(rule.legacyRows)),
    };
    const existingByKey = await prisma.assessmentScheduleRule.findUnique({
      where: { legacyKey: key },
    });
    const existingByType = await prisma.assessmentScheduleRule.findUnique({
      where: {
        organizationId_assessmentType: {
          organizationId,
          assessmentType: rule.assessmentType,
        },
      },
    });
    const existing = existingByKey ?? existingByType;

    if (existing) {
      if (!dryRun) {
        await prisma.assessmentScheduleRule.update({
          where: { id: existing.id },
          data,
        });
      }
      if (rule.legacyMinimumId) {
        setMapping("assessment_schedule_rule", rule.legacyMinimumId, existing.id);
      }
      if (rule.legacyMaximumId) {
        setMapping("assessment_schedule_rule", rule.legacyMaximumId, existing.id);
      }
      if (existingByKey) {
        refreshed++;
      } else {
        backfilled++;
      }
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.assessmentScheduleRule.create({
        data: {
          id,
          ...data,
        },
      });
    }

    if (rule.legacyMinimumId) {
      setMapping("assessment_schedule_rule", rule.legacyMinimumId, id);
    }
    if (rule.legacyMaximumId) {
      setMapping("assessment_schedule_rule", rule.legacyMaximumId, id);
    }
    migrated++;
  }

  log(
    `Assessment schedule rules: ${migrated} migrated, ${backfilled} backfilled, ${refreshed} refreshed`
  );
}

export async function migrateAssessments(
  prisma: PrismaClient,
  organizationId: string
) {
  log("=== Migrating Assessments ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  for (const assessmentType of ASSESSMENT_TYPES) {
    await migrateAssessmentTable(
      prisma,
      sourceDatabase,
      `t_assessment_${assessmentType}`,
      assessmentType,
      dryRun
    );
  }

  await migrateNewAssessmentMarkers(prisma, dryRun, sourceDatabase);
  await migrateAssessmentScheduleRules(
    prisma,
    organizationId,
    sourceDatabase,
    dryRun
  );

  log(`=== Assessment migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      const org = await prisma.organization.findFirst();
      if (!org) {
        logError("Assessment migration requires an existing organization");
        process.exit(1);
      }
      await migrateAssessments(prisma, org.id);
    } catch (err) {
      logError("Assessment migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
