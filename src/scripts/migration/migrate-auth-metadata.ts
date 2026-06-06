/**
 * Migration: legacy PHP auth metadata -> LegacyAuthRecord
 *
 * These rows are not active Auth.js users. They preserve pending confirmation
 * tokens, profile fields/values, login levels, regular/manager-login user
 * metadata, and parent-login level metadata from the old PHP login library.
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

interface OldLoginLevel {
  id: number;
  level_name: string;
  level_disabled: number;
  redirect: string | null;
  welcome_email: number;
}

interface OldLegacyLoginUser {
  user_id: number;
  user_level: string;
  restricted: number;
  username: string;
  name: string;
  email: string;
  password: string;
  db_id: number;
  timestamp: string | Date;
  usites: string;
  uclasses: string;
  uchild: string;
}

const SOCIAL_LOGIN_PROVIDERS = [
  "twitter",
  "facebook",
  "google",
  "yahoo",
] as const;

interface OldLoginIntegration {
  user_id: number;
  twitter?: string | null;
  facebook?: string | null;
  google?: string | null;
  yahoo?: string | null;
}

function legacyData(row: object) {
  return JSON.parse(JSON.stringify(row));
}

function legacyKey(
  sourceDatabase: string,
  table: string,
  legacyId: number | string
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
    legacyKeyValue?: string | null;
    legacyData: object;
  },
  dryRun: boolean
): Promise<"migrated" | "skipped"> {
  const key =
    data.legacyKeyValue ??
    legacyKey(data.sourceDatabase, data.legacyTable, data.legacyId);
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
  table: "login_confirm" | "login_confirm_man",
  dryRun: boolean
) {
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldLoginConfirm>(
    `SELECT * FROM ${table} ORDER BY id`
  );
  log(`Found ${rows.length} rows in ${table}`);

  let migrated = 0;
  let skipped = 0;

  for (const [index, row] of rows.entries()) {
    const legacyId = toInt(row.id, 0);
    const email = cleanString(row.email);
    const keyDiscriminator =
      legacyId === 0
        ? `${legacyId}:${index}:${cleanString(row.key) ?? email ?? cleanString(row.username) ?? "unknown"}`
        : legacyId;
    const result = await createRecord(
      prisma,
      {
        sourceDatabase,
        legacyTable: table,
        legacyId,
        recordType: cleanString(row.type) ?? table,
        userId: await resolveUserByEmail(prisma, email),
        username: cleanString(row.username),
        email,
        recordKey: cleanString(row.key),
        recordValue: cleanString(row.data),
        legacyKeyValue:
          legacyId === 0
            ? legacyKey(sourceDatabase, table, keyDiscriminator)
            : null,
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateLoginProfiles(
  prisma: PrismaClient,
  sourceDatabase: string,
  table: "login_profiles" | "login_profiles_man",
  dryRun: boolean
) {
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldLoginProfile>(
    `SELECT * FROM ${table} ORDER BY p_id`
  );
  log(`Found ${rows.length} rows in ${table}`);

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
        legacyTable: table,
        legacyId,
        recordType:
          table === "login_profiles_man"
            ? "manager_profile_value"
            : "profile_value",
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
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateLoginProfileFields(
  prisma: PrismaClient,
  sourceDatabase: string,
  table: "login_profile_fields" | "login_profile_fields_man",
  dryRun: boolean
) {
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldLoginProfileField>(
    `SELECT * FROM ${table} ORDER BY id`
  );
  log(`Found ${rows.length} rows in ${table}`);

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
        legacyTable: table,
        legacyId,
        recordType:
          table === "login_profile_fields_man"
            ? "manager_profile_field"
            : "profile_field",
        recordKey: cleanString(row.label),
        recordValue: cleanString(row.type),
        isDisabled: !toBool(row.public),
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateLoginLevels(
  prisma: PrismaClient,
  sourceDatabase: string,
  table: "login_levels" | "login_levels_man" | "parent_login_levels",
  dryRun: boolean
) {
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldLoginLevel>(
    `SELECT * FROM ${table} ORDER BY id`
  );
  log(`Found ${rows.length} rows in ${table}`);

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
        legacyTable: table,
        legacyId,
        recordType:
          table === "parent_login_levels"
            ? "parent_login_level"
            : table === "login_levels_man"
              ? "manager_login_level"
              : "login_level",
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
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateLoginIntegration(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  const table = "login_integration";
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldLoginIntegration>(
    "SELECT * FROM login_integration ORDER BY user_id"
  );
  log(`Found ${rows.length} rows in login_integration`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyUserId = toInt(row.user_id, 0);
    if (!legacyUserId) {
      skipped++;
      continue;
    }

    const linkedProviders = SOCIAL_LOGIN_PROVIDERS.filter((provider) =>
      cleanString(row[provider])
    );

    const result = await createRecord(
      prisma,
      {
        sourceDatabase,
        legacyTable: table,
        legacyId: legacyUserId,
        recordType: "social_integration",
        userId: getMapping("user", legacyUserId),
        legacyUserId,
        recordKey: `user:${legacyUserId}`,
        recordValue: linkedProviders.join(",") || null,
        isDisabled: linkedProviders.length === 0,
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateManagerLoginUsers(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  const table = "login_users_man";
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldLegacyLoginUser>(
    "SELECT * FROM login_users_man ORDER BY user_id"
  );
  log(`Found ${rows.length} rows in login_users_man`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.user_id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const email = cleanString(row.email);
    const result = await createRecord(
      prisma,
      {
        sourceDatabase,
        legacyTable: table,
        legacyId,
        recordType: "manager_login_user",
        userId: await resolveUserByEmail(prisma, email),
        legacyUserId: legacyId,
        username: cleanString(row.username),
        email,
        recordKey: cleanString(row.username) ?? `user:${legacyId}`,
        recordValue: cleanString(row.user_level),
        isDisabled: toBool(row.restricted),
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateRegularLoginUsers(
  prisma: PrismaClient,
  sourceDatabase: string,
  dryRun: boolean
) {
  const table = "login_users";
  if (!(await tableExists(table))) {
    log(`${table}: table not present, skipping`);
    return;
  }

  const rows = await queryMysql<OldLegacyLoginUser>(
    "SELECT * FROM login_users ORDER BY user_id"
  );
  log(`Found ${rows.length} rows in login_users for auth metadata`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const legacyId = toInt(row.user_id, 0);
    if (!legacyId) {
      skipped++;
      continue;
    }

    const email = cleanString(row.email);
    const result = await createRecord(
      prisma,
      {
        sourceDatabase,
        legacyTable: table,
        legacyId,
        recordType: "login_user",
        userId:
          getMapping("user", legacyId) ??
          (await resolveUserByEmail(prisma, email)),
        legacyUserId: legacyId,
        username: cleanString(row.username),
        email,
        recordKey: cleanString(row.username) ?? `user:${legacyId}`,
        recordValue: cleanString(row.user_level),
        isDisabled: toBool(row.restricted),
        legacyData: row,
      },
      dryRun
    );

    if (result === "migrated") migrated++;
    else skipped++;
    logProgress(migrated + skipped, rows.length, table);
  }

  log(`${table}: ${migrated} auth metadata rows migrated, ${skipped} skipped`);
}

export async function migrateAuthMetadata(prisma: PrismaClient) {
  log("=== Migrating Legacy Auth Metadata ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  await migrateLoginConfirm(prisma, sourceDatabase, "login_confirm", dryRun);
  await migrateLoginConfirm(prisma, sourceDatabase, "login_confirm_man", dryRun);
  await migrateLoginProfiles(prisma, sourceDatabase, "login_profiles", dryRun);
  await migrateLoginProfiles(
    prisma,
    sourceDatabase,
    "login_profiles_man",
    dryRun
  );
  await migrateLoginProfileFields(
    prisma,
    sourceDatabase,
    "login_profile_fields",
    dryRun
  );
  await migrateLoginProfileFields(
    prisma,
    sourceDatabase,
    "login_profile_fields_man",
    dryRun
  );
  await migrateLoginLevels(prisma, sourceDatabase, "login_levels", dryRun);
  await migrateLoginLevels(prisma, sourceDatabase, "login_levels_man", dryRun);
  await migrateLoginLevels(
    prisma,
    sourceDatabase,
    "parent_login_levels",
    dryRun
  );
  await migrateRegularLoginUsers(prisma, sourceDatabase, dryRun);
  await migrateLoginIntegration(prisma, sourceDatabase, dryRun);
  await migrateManagerLoginUsers(prisma, sourceDatabase, dryRun);

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
