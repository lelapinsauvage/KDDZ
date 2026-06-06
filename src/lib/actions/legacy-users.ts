"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

type UserRole = "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
export type LegacyUserRecordType = "login_user" | "manager_login_user";
type LegacyLevelRecordType = "login_level" | "manager_login_level";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type LegacyAdminUserRow = {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  recordType: LegacyUserRecordType;
  username: string;
  name: string;
  email: string;
  isRestricted: boolean;
  levelIds: number[];
  levelLabels: string[];
  sites: string;
  classes: string;
  userId: string | null;
  modernRole: UserRole | null;
  modernActive: boolean | null;
  registeredAt: string | null;
};

export type LegacyAdminLevelOption = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  label: string;
  recordType: LegacyLevelRecordType;
  isDisabled: boolean;
};

export type LegacyAdminUserGroup = {
  key: string;
  sourceDatabase: string;
  recordType: LegacyUserRecordType;
  label: string;
  levelRecordType: LegacyLevelRecordType;
};

export type LegacyAdminBranchOption = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  label: string;
};

export type LegacyAdminClassOption = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  label: string;
  branchLegacyId: number | null;
  branchLabel: string | null;
};

export type LegacyAdminUsersData = {
  users: LegacyAdminUserRow[];
  levels: LegacyAdminLevelOption[];
  groups: LegacyAdminUserGroup[];
  branches: LegacyAdminBranchOption[];
  classes: LegacyAdminClassOption[];
};

export type LegacyAdminUserInput = {
  sourceDatabase: string;
  recordType: LegacyUserRecordType;
  name: string;
  username: string;
  email: string;
  password?: string;
  password2?: string;
  levelIds: number[];
  sites?: string;
  classes?: string;
  isRestricted?: boolean;
};

const USER_CONFIG: Record<
  LegacyUserRecordType,
  {
    legacyTable: "login_users" | "login_users_man";
    levelRecordType: LegacyLevelRecordType;
    label: string;
  }
> = {
  login_user: {
    legacyTable: "login_users",
    levelRecordType: "login_level",
    label: "Staff Users",
  },
  manager_login_user: {
    legacyTable: "login_users_man",
    levelRecordType: "manager_login_level",
    label: "Manager Users",
  },
};

function legacyObject(value: unknown): Prisma.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }
  return {};
}

function legacyString(value: unknown, key: string) {
  const raw = legacyObject(value)[key];
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
}

function parsePhpLevelIds(serialized: string | null) {
  if (!serialized) return [];
  return Array.from(serialized.matchAll(/s:\d+:"(\d+)"/g))
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value));
}

function serializePhpStringArray(values: number[]) {
  const ids = Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  return `a:${ids.length}:{${ids
    .map((value, index) => {
      const stringValue = String(value);
      return `i:${index};s:${stringValue.length}:"${stringValue}";`;
    })
    .join("")}}`;
}

function normalizeIds(values: number[]) {
  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function roleForLegacyLevels(
  levelIds: number[],
  levels: LegacyAdminLevelOption[],
): UserRole {
  const labels = levels
    .filter((level) => levelIds.includes(level.legacyId))
    .map((level) => level.label.toLowerCase());

  if (
    levelIds.includes(1) ||
    levelIds.includes(4) ||
    labels.some((label) => label.includes("admin") || label.includes("owner"))
  ) {
    return "ADMIN";
  }
  if (levelIds.includes(5) || labels.some((label) => label.includes("manager"))) {
    return "MANAGER";
  }
  if (labels.some((label) => label.includes("nurse"))) return "NURSE";
  if (labels.some((label) => label.includes("doctor"))) return "DOCTOR";
  return "TEACHER";
}

function userLegacyData(params: {
  existing?: unknown;
  legacyId: number;
  userLevel: string;
  name: string;
  username: string;
  email: string;
  isRestricted: boolean;
  sites: string;
  classes: string;
  dbId?: string | number | null;
  passwordChanged?: boolean;
}) {
  return {
    ...legacyObject(params.existing),
    user_id: params.legacyId,
    user_level: params.userLevel,
    restricted: params.isRestricted ? 1 : 0,
    username: params.username,
    name: params.name,
    email: params.email,
    usites: params.sites,
    uclasses: params.classes,
    db_id: params.dbId ?? null,
    ...(params.passwordChanged
      ? { password_updated_from: "modern_legacy_user_admin" }
      : {}),
    updated_from: "modern_legacy_user_admin",
  } satisfies Prisma.InputJsonObject;
}

function configForRecordType(recordType: LegacyUserRecordType) {
  return USER_CONFIG[recordType];
}

async function getDefaultLevelId(
  sourceDatabase: string,
  recordType: LegacyUserRecordType,
) {
  const setting = await db.legacySetting.findFirst({
    where: {
      sourceDatabase,
      legacyTable:
        recordType === "manager_login_user"
          ? "login_settings_man"
          : "login_settings",
      settingKey: { in: ["default-level", "default_level"] },
    },
    orderBy: { legacyId: "asc" },
    select: { settingValue: true },
  });
  const defaultLevelId = Number.parseInt(setting?.settingValue ?? "", 10);

  return Number.isInteger(defaultLevelId) && defaultLevelId > 0
    ? defaultLevelId
    : null;
}

function firstGroup(groups: LegacyAdminUserGroup[]) {
  return groups[0] ?? null;
}

function mapUserRow(params: {
  record: {
    id: string;
    sourceDatabase: string;
    legacyTable: string;
    legacyId: number;
    recordType: string;
    legacyUserId: number | null;
    userId: string | null;
    username: string | null;
    email: string | null;
    recordKey: string | null;
    recordValue: string | null;
    isDisabled: boolean | null;
    legacyData: Prisma.JsonValue | null;
  };
  levelOptions: LegacyAdminLevelOption[];
  modernUser?: {
    role: UserRole;
    isActive: boolean;
    name: string | null;
  } | null;
}): LegacyAdminUserRow {
  const levelIds = parsePhpLevelIds(params.record.recordValue);
  const levelRecordType =
    params.record.recordType === "manager_login_user"
      ? "manager_login_level"
      : "login_level";
  const legacyName = legacyString(params.record.legacyData, "name");
  const labels = params.levelOptions
    .filter(
      (level) =>
        level.sourceDatabase === params.record.sourceDatabase &&
        level.recordType === levelRecordType &&
        levelIds.includes(level.legacyId),
    )
    .map((level) => level.label);

  return {
    id: params.record.id,
    sourceDatabase: params.record.sourceDatabase,
    legacyTable: params.record.legacyTable,
    legacyId: params.record.legacyUserId ?? params.record.legacyId,
    recordType: params.record.recordType as LegacyUserRecordType,
    username:
      params.record.username ??
      params.record.recordKey ??
      legacyString(params.record.legacyData, "username"),
    name: legacyName || params.modernUser?.name || "",
    email: params.record.email ?? legacyString(params.record.legacyData, "email"),
    isRestricted: params.record.isDisabled ?? false,
    levelIds,
    levelLabels: labels,
    sites: legacyString(params.record.legacyData, "usites") || "0",
    classes: legacyString(params.record.legacyData, "uclasses") || "0",
    userId: params.record.userId,
    modernRole: params.modernUser?.role ?? null,
    modernActive: params.modernUser?.isActive ?? null,
    registeredAt:
      legacyString(params.record.legacyData, "timestamp") ||
      legacyString(params.record.legacyData, "created_at") ||
      null,
  };
}

async function getLevelsAndGroups() {
  const levelRecords = await db.legacyAuthRecord.findMany({
    where: {
      recordType: { in: ["login_level", "manager_login_level"] },
    },
    orderBy: [
      { sourceDatabase: "asc" },
      { recordType: "asc" },
      { legacyId: "asc" },
    ],
  });

  const levels: LegacyAdminLevelOption[] = levelRecords.map((level) => ({
    id: level.id,
    sourceDatabase: level.sourceDatabase,
    legacyId: level.legacyId,
    label: level.recordKey ?? `Level ${level.legacyId}`,
    recordType: level.recordType as LegacyLevelRecordType,
    isDisabled: level.isDisabled ?? false,
  }));

  const groupMap = new Map<string, LegacyAdminUserGroup>();
  for (const level of levels) {
    const recordType =
      level.recordType === "manager_login_level"
        ? "manager_login_user"
        : "login_user";
    const config = USER_CONFIG[recordType];
    const key = `${level.sourceDatabase}:${recordType}`;
    groupMap.set(key, {
      key,
      sourceDatabase: level.sourceDatabase,
      recordType,
      label: config.label,
      levelRecordType: config.levelRecordType,
    });
  }

  return { levels, groups: Array.from(groupMap.values()) };
}

async function getBranchAndClassOptions() {
  const [branchRecords, classRecords] = await Promise.all([
    db.branch.findMany({
      where: {
        sourceDatabase: { not: null },
        legacyId: { not: null },
      },
      orderBy: [
        { sourceDatabase: "asc" },
        { legacyId: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        sourceDatabase: true,
        legacyId: true,
        name: true,
      },
    }),
    db.class.findMany({
      where: {
        sourceDatabase: { not: null },
        legacyId: { not: null },
      },
      orderBy: [
        { sourceDatabase: "asc" },
        { legacyId: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        sourceDatabase: true,
        legacyId: true,
        name: true,
        branch: {
          select: {
            legacyId: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const branches: LegacyAdminBranchOption[] = branchRecords
    .filter(
      (
        branch,
      ): branch is typeof branch & {
        sourceDatabase: string;
        legacyId: number;
      } => branch.sourceDatabase !== null && branch.legacyId !== null,
    )
    .map((branch) => ({
      id: branch.id,
      sourceDatabase: branch.sourceDatabase,
      legacyId: branch.legacyId,
      label: branch.name,
    }));

  const classes: LegacyAdminClassOption[] = classRecords
    .filter(
      (
        classRecord,
      ): classRecord is typeof classRecord & {
        sourceDatabase: string;
        legacyId: number;
      } =>
        classRecord.sourceDatabase !== null && classRecord.legacyId !== null,
    )
    .map((classRecord) => ({
      id: classRecord.id,
      sourceDatabase: classRecord.sourceDatabase,
      legacyId: classRecord.legacyId,
      label: classRecord.name,
      branchLegacyId: classRecord.branch.legacyId,
      branchLabel: classRecord.branch.name,
    }));

  return { branches, classes };
}

async function validateLegacyUserInput(
  input: LegacyAdminUserInput,
  existingId?: string,
) {
  const sourceDatabase = input.sourceDatabase.trim();
  const name = input.name.trim();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const config = configForRecordType(input.recordType);

  if (!sourceDatabase) return { error: "Missing legacy source database" };
  if (!config) return { error: "Unknown legacy user type" };
  if (!name) return { error: "You must enter a name." };
  if (!username) return { error: "You must enter a username." };
  if (username.length < 2) return { error: "Username is required." };
  if (!validateEmail(email)) {
    return { error: "You have entered an invalid e-mail address, try again." };
  }
  if (!existingId && !input.password) {
    return { error: "You must enter a password." };
  }
  if (input.password && input.password.length < 5) {
    return { error: "Your password must be at least 5 characters." };
  }
  if (input.password && input.password !== input.password2) {
    return { error: "Your passwords did not match." };
  }

  let levelIds = normalizeIds(input.levelIds);
  if (levelIds.length === 0 && !existingId) {
    const defaultLevelId = await getDefaultLevelId(
      sourceDatabase,
      input.recordType,
    );
    levelIds = defaultLevelId ? [defaultLevelId] : [];
  }
  if (levelIds.length === 0) {
    return { error: "No user level has been selected." };
  }

  const validLevels = await db.legacyAuthRecord.findMany({
    where: {
      sourceDatabase,
      recordType: config.levelRecordType,
      legacyId: { in: levelIds },
    },
    select: { legacyId: true },
  });

  if (validLevels.length !== levelIds.length) {
    return { error: "One or more legacy levels no longer exist." };
  }

  const duplicateLegacy = await db.legacyAuthRecord.findMany({
    where: {
      sourceDatabase,
      recordType: input.recordType,
      OR: [{ username }, { email }],
    },
    select: { id: true, username: true, email: true },
  });

  if (
    duplicateLegacy.some(
      (record) => record.id !== existingId && record.username === username,
    )
  ) {
    return { error: "Sorry, username already taken." };
  }
  if (
    duplicateLegacy.some(
      (record) => record.id !== existingId && record.email === email,
    )
  ) {
    return { error: "That email address has already been taken." };
  }

  return {
    sourceDatabase,
    name,
    username,
    email,
    levelIds,
    sites: input.sites?.trim() || "0",
    classes: input.classes?.trim() || "0",
    isRestricted: Boolean(input.isRestricted),
  };
}

export async function getLegacyAdminUsers(): Promise<
  ActionResult<LegacyAdminUsersData>
> {
  try {
    await requireRole("ADMIN");

    const [{ levels, groups }, { branches, classes }, records] =
      await Promise.all([
        getLevelsAndGroups(),
        getBranchAndClassOptions(),
        db.legacyAuthRecord.findMany({
          where: {
            recordType: { in: ["login_user", "manager_login_user"] },
          },
          orderBy: [
            { sourceDatabase: "asc" },
            { recordType: "asc" },
            { legacyId: "asc" },
          ],
        }),
      ]);
    const userIds = records
      .map((record) => record.userId)
      .filter((id): id is string => Boolean(id));
    const modernUsers = userIds.length
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, role: true, isActive: true, name: true },
        })
      : [];
    const modernById = new Map(modernUsers.map((user) => [user.id, user]));

    return {
      success: true,
      data: {
        users: records.map((record) =>
          mapUserRow({
            record,
            levelOptions: levels,
            modernUser: record.userId ? modernById.get(record.userId) : null,
          }),
        ),
        levels,
        groups,
        branches,
        classes,
      },
    };
  } catch (error) {
    console.error("Failed to fetch legacy admin users:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch legacy admin users",
    };
  }
}

export async function createLegacyAdminUser(
  input: LegacyAdminUserInput,
): Promise<ActionResult<LegacyAdminUserRow>> {
  try {
    const ctx = await requireRole("ADMIN");
    const validated = await validateLegacyUserInput(input);
    if ("error" in validated) return { success: false, error: validated.error };

    const config = configForRecordType(input.recordType);
    const { levels } = await getLevelsAndGroups();
    const role = roleForLegacyLevels(
      validated.levelIds,
      levels.filter(
        (level) =>
          level.sourceDatabase === validated.sourceDatabase &&
          level.recordType === config.levelRecordType,
      ),
    );

    const existingModern = await db.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });
    if (existingModern) {
      return {
        success: false,
        error: "That email address has already been taken.",
      };
    }

    const maxUser = await db.legacyAuthRecord.findFirst({
      where: {
        sourceDatabase: validated.sourceDatabase,
        recordType: input.recordType,
      },
      orderBy: { legacyId: "desc" },
      select: { legacyId: true },
    });
    const legacyId = (maxUser?.legacyId ?? 0) + 1;
    const userLevel = serializePhpStringArray(validated.levelIds);
    const passwordHash = await hash(input.password ?? "", 12);

    const created = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          role,
          passwordHash,
          isActive: !validated.isRestricted,
          organizationId: ctx.organizationId,
        },
        select: { id: true, role: true, isActive: true, name: true },
      });

      const legacyRecord = await tx.legacyAuthRecord.create({
        data: {
          sourceDatabase: validated.sourceDatabase,
          legacyTable: config.legacyTable,
          legacyKey: `${validated.sourceDatabase}:${config.legacyTable}:${legacyId}`,
          legacyId,
          recordType: input.recordType,
          userId: user.id,
          legacyUserId: legacyId,
          username: validated.username,
          email: validated.email,
          recordKey: validated.username,
          recordValue: userLevel,
          isDisabled: validated.isRestricted,
          legacyData: userLegacyData({
            legacyId,
            userLevel,
            name: validated.name,
            username: validated.username,
            email: validated.email,
            isRestricted: validated.isRestricted,
            sites: validated.sites,
            classes: validated.classes,
            dbId: ctx.organizationId,
            passwordChanged: true,
          }),
        },
      });

      return { user, legacyRecord };
    });

    revalidatePath("/settings/legacy-users");

    return {
      success: true,
      data: mapUserRow({
        record: created.legacyRecord,
        levelOptions: levels,
        modernUser: created.user,
      }),
    };
  } catch (error) {
    console.error("Failed to create legacy admin user:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create legacy admin user",
    };
  }
}

export async function updateLegacyAdminUser(
  legacyRecordId: string,
  input: LegacyAdminUserInput,
): Promise<ActionResult<LegacyAdminUserRow>> {
  try {
    const ctx = await requireRole("ADMIN");
    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: legacyRecordId },
    });
    if (!existing) return { success: false, error: "No such user!" };

    const recordType = existing.recordType as LegacyUserRecordType;
    const validated = await validateLegacyUserInput(
      { ...input, sourceDatabase: existing.sourceDatabase, recordType },
      existing.id,
    );
    if ("error" in validated) return { success: false, error: validated.error };

    const config = configForRecordType(recordType);
    const { levels } = await getLevelsAndGroups();
    const role = roleForLegacyLevels(
      validated.levelIds,
      levels.filter(
        (level) =>
          level.sourceDatabase === validated.sourceDatabase &&
          level.recordType === config.levelRecordType,
      ),
    );
    const userLevel = serializePhpStringArray(validated.levelIds);

    const duplicateModern = await db.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });
    if (duplicateModern && duplicateModern.id !== existing.userId) {
      return {
        success: false,
        error: "That email address has already been taken.",
      };
    }

    const passwordHash = input.password ? await hash(input.password, 12) : null;
    const updated = await db.$transaction(async (tx) => {
      let modernUser: {
        id: string;
        role: UserRole;
        isActive: boolean;
        name: string | null;
      } | null = null;

      if (existing.userId) {
        modernUser = await tx.user.update({
          where: { id: existing.userId },
          data: {
            email: validated.email,
            name: validated.name,
            role,
            isActive: !validated.isRestricted,
            ...(passwordHash ? { passwordHash } : {}),
          },
          select: { id: true, role: true, isActive: true, name: true },
        });
      } else if (passwordHash) {
        modernUser = await tx.user.create({
          data: {
            email: validated.email,
            name: validated.name,
            role,
            passwordHash,
            isActive: !validated.isRestricted,
            organizationId: ctx.organizationId,
          },
          select: { id: true, role: true, isActive: true, name: true },
        });
      }

      const legacyRecord = await tx.legacyAuthRecord.update({
        where: { id: existing.id },
        data: {
          legacyTable: config.legacyTable,
          recordType,
          userId: modernUser?.id ?? existing.userId,
          legacyUserId: existing.legacyUserId ?? existing.legacyId,
          username: validated.username,
          email: validated.email,
          recordKey: validated.username,
          recordValue: userLevel,
          isDisabled: validated.isRestricted,
          legacyData: userLegacyData({
            existing: existing.legacyData,
            legacyId: existing.legacyUserId ?? existing.legacyId,
            userLevel,
            name: validated.name,
            username: validated.username,
            email: validated.email,
            isRestricted: validated.isRestricted,
            sites: validated.sites,
            classes: validated.classes,
            dbId: legacyString(existing.legacyData, "db_id") || ctx.organizationId,
            passwordChanged: Boolean(passwordHash),
          }),
        },
      });

      return { modernUser, legacyRecord };
    });

    revalidatePath("/settings/legacy-users");

    return {
      success: true,
      data: mapUserRow({
        record: updated.legacyRecord,
        levelOptions: levels,
        modernUser: updated.modernUser,
      }),
    };
  } catch (error) {
    console.error("Failed to update legacy admin user:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update legacy admin user",
    };
  }
}

export async function deleteLegacyAdminUser(
  legacyRecordId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN");

    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: legacyRecordId },
    });
    if (!existing) return { success: false, error: "No such user!" };

    await db.$transaction(async (tx) => {
      await tx.legacyAuthRecord.update({
        where: { id: existing.id },
        data: {
          recordType: `${existing.recordType}_deleted`,
          isDisabled: true,
          legacyData: {
            ...legacyObject(existing.legacyData),
            deleted_from: "modern_legacy_user_admin",
          },
        },
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: false },
        });
      }
    });

    revalidatePath("/settings/legacy-users");

    return { success: true, data: { id: existing.id } };
  } catch (error) {
    console.error("Failed to delete legacy admin user:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete legacy admin user",
    };
  }
}

export async function getDefaultLegacyAdminUserGroup(): Promise<
  ActionResult<LegacyAdminUserGroup | null>
> {
  try {
    await requireRole("ADMIN");
    const { groups } = await getLevelsAndGroups();
    return { success: true, data: firstGroup(groups) };
  } catch (error) {
    console.error("Failed to fetch default legacy user group:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch default legacy user group",
    };
  }
}
