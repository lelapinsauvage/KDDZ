/**
 * Migration: legacy PHP auth metadata -> LegacyAuthRecord
 *
 * These rows are not active Auth.js users. They preserve pending confirmation
 * tokens, profile fields/values, and parent-login level metadata from the old
 * PHP login library.
 *
 * Prerequisites: Users should be migrated first so records can resolve userId
 * where possible.
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
  toBool,
  toInt,
} from "./lib/utils";

interface OldLoginConfirm {
  id: number;
  data: string;
  username: string;
  email: string;
  key: string;
  type: string;
}

interface OldLoginProfile {
  p_id: number;
  pfield_id: number;
  user_id: number;
  profile_label: string | null;
  profile_value: string | null;
}

interface OldLoginProfileField {
  id: number;
  section: string;
  type: string;
  label: string;
  public: number;
  signup: string;
}

interface OldParentLoginLevel {
  id: number;
  level_name: string;
  level_disabled: number;
  redirect: string | null;
  welcome_email: number;
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

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryMysql<Record<string, unknown>>("SHOW TABLES LIKE ?", [
    table,
  ]);
  return rows.length > 0;
}

async function resolveUserByEmail(
  prisma: PrismaClient,
  email: string | null
): Promise<string | null> {
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email } });
  return user?.id ?? null;
}

async function createRecord(
  prisma: PrismaClient,
  data: {
    sourceDatabase: string;
    legacyTable: string;
    legacyId: number;
    recordType: string;
    userId?: string | null;
    parentUserId?: string | null;
    legacyUserId?: number | null;
    username?: string | null;
    email?: string | null;
    recordKey?: string | null;
    recordValue?: string | null;
    isDisabled?: boolean | null;
    redirect?: string | null;
    welcomeEmail?: boolean | null;
    legacyData: object;
  },
  dryRun: boolean
): Promise<"migrated" | "skipped"> {
  const key = legacyKey(data.sourceDatabase, data.legacyTable, data.legacyId);
  const existing = await prisma.legacyAuthRecord.findUnique({
    where: { legacyKey: key },
  });
  if (existing) return "skipped";

  if (!dryRun) {
    await prisma.legacyAuthRecord.create({
      data: {
        id: generateUUID(),
        sourceDatabase: data.sourceDatabase,
        legacyTable: data.legacyTable,
        legacyKey: key,
        legacyId: data.legacyId,
        recordType: data.recordType,
        userId: data.userId ?? null,
        parentUserId: data.parentUserId ?? null,
        legacyUserId: data.legacyUserId ?? null,
        username: data.username ?? null,
        email: data.email ?? null,
        recordKey: data.recordKey ?? null,
        recordValue: data.recordValue ?? null,
        isDisabled: data.isDisabled ?? null,
        redirect: data.redirect ?? null,
        welcomeEmail: data.welcomeEmail ?? null,
        legacyData: legacyData(data.legacyData),
      },
    });
  }

  return "migrated";
}

async function migrateLoginConfirm(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("login_confirm"))) {
    log("login_confirm: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldLoginConfirm>(
    "SELECT * FROM login_confirm ORDER BY id"
  );
  log(`Found ${rows.length} rows in login_confirm`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const email = cleanString(row.email);
    const result = await createRecord(
      prisma,
      {
        sourceDatabase,
        legacyTable: "login_confirm",
        legacyId,
        recordType: cleanString(row.type) ?? "login_confirm",
        userId: await resolveUserByEmail(prisma, email),
        username: cleanString(row.username),
        email,
        recordKey: cleanString(row.key),
        recordValue: cleanString(row.data),
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, "Login Confirm");
  }

  log(`login_confirm: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateLoginProfiles(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("login_profiles"))) {
    log("login_profiles: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldLoginProfile>(
    "SELECT * FROM login_profiles ORDER BY p_id"
  );
  log(`Found ${rows.length} rows in login_profiles`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.p_id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const legacyUserId = toInt(row.user_id, 0) || null;
    const result = await createRecord(
      prisma,
      {
        sourceDatabase,
        legacyTable: "login_profiles",
        legacyId,
        recordType: "profile_value",
        userId: legacyUserId ? getMapping("user", legacyUserId) : null,
        legacyUserId,
        recordKey:
          cleanString(row.profile_label) ??
          `profile_field:${toInt(row.pfield_id, 0)}`,
        recordValue: cleanString(row.profile_value),
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, "Login Profiles");
  }

  log(`login_profiles: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateLoginProfileFields(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("login_profile_fields"))) {
    log("login_profile_fields: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldLoginProfileField>(
    "SELECT * FROM login_profile_fields ORDER BY id"
  );
  log(`Found ${rows.length} rows in login_profile_fields`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const result = await createRecord(
      prisma,
      {
        sourceDatabase,
        legacyTable: "login_profile_fields",
        legacyId,
        recordType: "profile_field",
        recordKey: cleanString(row.label),
        recordValue: cleanString(row.type),
        isDisabled: !toBool(row.public),
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, "Login Profile Fields");
  }

  log(`login_profile_fields: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateParentLoginLevels(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  if (!(await tableExists("parent_login_levels"))) {
    log("parent_login_levels: table not present, skipping");
    return;
  }

  const rows = await queryMysql<OldParentLoginLevel>(
    "SELECT * FROM parent_login_levels ORDER BY id"
  );
  log(`Found ${rows.length} rows in parent_login_levels`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const result = await createRecord(
      prisma,
      {
        sourceDatabase,
        legacyTable: "parent_login_levels",
        legacyId,
        recordType: "parent_login_level",
        recordKey: cleanString(row.level_name),
        isDisabled: toBool(row.level_disabled),
        redirect: cleanString(row.redirect),
        welcomeEmail: toBool(row.welcome_email),
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, "Parent Login Levels");
  }

  log(`parent_login_levels: ${migrated} migrated, ${skipped} skipped`);
}

export async function migrateAuthMetadata(prisma: PrismaClient) {
  log("=== Migrating Legacy Auth Metadata ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  await migrateLoginConfirm(prisma, sourceDatabase, dryRun);
  await migrateLoginProfiles(prisma, sourceDatabase, dryRun);
  await migrateLoginProfileFields(prisma, sourceDatabase, dryRun);
  await migrateParentLoginLevels(prisma, sourceDatabase, dryRun);

  log(
    `=== Legacy auth metadata migration complete ===${dryRun ? " [DRY RUN]" : ""}`
  );
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateAuthMetadata(prisma);
    } catch (err) {
      logError("Legacy auth metadata migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
