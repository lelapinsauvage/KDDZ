"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type LegacyAccessLevelRecordType =
  | "login_level"
  | "manager_login_level";

type LegacyAccessActionRecordType = "system_action" | "manager_system_action";
type LegacyAccessGrantRecordType =
  | "level_action_grant"
  | "manager_level_action_grant";
type LegacyAccessUserRecordType = "login_user" | "manager_login_user";

export type LegacyAccessActionRow = {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyActionId: number;
  actionGroupId: number | null;
  actionName: string;
  actionType: string | null;
  description: string | null;
  isActive: boolean;
};

export type LegacyAccessLevelRow = {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  label: string;
  redirect: string | null;
  welcomeEmail: boolean;
  isDisabled: boolean;
  userCount: number;
  selectedActionIds: number[];
};

export type LegacyAccessControlGroup = {
  key: string;
  sourceDatabase: string;
  title: string;
  levelRecordType: LegacyAccessLevelRecordType;
  actionRecordType: LegacyAccessActionRecordType;
  grantRecordType: LegacyAccessGrantRecordType;
  levels: LegacyAccessLevelRow[];
  actions: LegacyAccessActionRow[];
  grantCount: number;
};

export type LegacyAccessLevelUserRow = {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  username: string;
  name: string;
  email: string;
  registeredAt: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  isRestricted: boolean;
};

export type LegacyAccessLevelUsersData = {
  levelLabel: string;
  users: LegacyAccessLevelUserRow[];
};

export type UpdateLegacyAccessControlLevelsInput = {
  sourceDatabase: string;
  levelRecordType: LegacyAccessLevelRecordType;
  levels: Array<{
    legacyLevelId: number;
    actionIds: number[];
  }>;
};

export type CreateLegacyAccessLevelInput = {
  sourceDatabase: string;
  levelRecordType: LegacyAccessLevelRecordType;
  levelName: string;
  redirect?: string | null;
};

export type UpdateLegacyAccessLevelInput = {
  levelRecordId: string;
  levelName: string;
  redirect?: string | null;
  welcomeEmail?: boolean;
  isDisabled?: boolean;
};

type AccessConfig = {
  levelRecordType: LegacyAccessLevelRecordType;
  actionRecordType: LegacyAccessActionRecordType;
  grantRecordType: LegacyAccessGrantRecordType;
  userRecordType: LegacyAccessUserRecordType;
  levelTable: "login_levels" | "login_levels_man";
  grantTable: "actions_control" | "actions_control_man";
  title: string;
};

const ACCESS_CONFIGS: AccessConfig[] = [
  {
    levelRecordType: "login_level",
    actionRecordType: "system_action",
    grantRecordType: "level_action_grant",
    userRecordType: "login_user",
    levelTable: "login_levels",
    grantTable: "actions_control",
    title: "Staff Levels",
  },
  {
    levelRecordType: "manager_login_level",
    actionRecordType: "manager_system_action",
    grantRecordType: "manager_level_action_grant",
    userRecordType: "manager_login_user",
    levelTable: "login_levels_man",
    grantTable: "actions_control_man",
    title: "Manager Levels",
  },
];

function uniqueNumbers(values: number[]) {
  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

function parsePhpLevelIds(serialized: string | null) {
  if (!serialized) return [];
  return Array.from(serialized.matchAll(/s:\d+:"(\d+)"/g))
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value));
}

function inputString(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

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

function levelLegacyData(params: {
  existing?: unknown;
  legacyId: number;
  levelName: string;
  redirect: string | null;
  welcomeEmail: boolean;
  isDisabled: boolean;
}) {
  return {
    ...legacyObject(params.existing),
    id: params.legacyId,
    level_name: params.levelName,
    level_disabled: params.isDisabled ? 1 : 0,
    redirect: params.redirect,
    welcome_email: params.welcomeEmail ? 1 : 0,
    updated_from: "modern_legacy_level_admin",
  } satisfies Prisma.InputJsonObject;
}

function configForLevelType(levelRecordType: LegacyAccessLevelRecordType) {
  return ACCESS_CONFIGS.find(
    (config) => config.levelRecordType === levelRecordType,
  );
}

function grantLegacyKey(
  sourceDatabase: string,
  table: AccessConfig["grantTable"],
  legacyLevelId: number,
  legacyActionId: number,
) {
  return `${sourceDatabase}:${table}:${legacyLevelId}:${legacyActionId}`;
}

function auditPrincipalForUserType(recordType: LegacyAccessUserRecordType) {
  return recordType === "manager_login_user" ? "MANAGER_USER" : "USER";
}

function registeredTimestamp(record: { legacyData: Prisma.JsonValue | null }) {
  return (
    legacyString(record.legacyData, "timestamp") ||
    legacyString(record.legacyData, "created_at") ||
    null
  );
}

async function countUsersForLegacyLevel(
  sourceDatabase: string,
  userRecordType: LegacyAccessUserRecordType,
  legacyLevelId: number,
) {
  const users = await db.legacyAuthRecord.findMany({
    where: {
      sourceDatabase,
      recordType: userRecordType,
    },
    select: { recordValue: true },
  });

  return users.reduce((count, user) => {
    return parsePhpLevelIds(user.recordValue).includes(legacyLevelId)
      ? count + 1
      : count;
  }, 0);
}

function levelRowFromRecord(params: {
  record: {
    id: string;
    sourceDatabase: string;
    legacyTable: string;
    legacyId: number;
    recordKey: string | null;
    redirect: string | null;
    welcomeEmail: boolean | null;
    isDisabled: boolean | null;
  };
  selectedActionIds?: number[];
  userCount?: number;
}): LegacyAccessLevelRow {
  return {
    id: params.record.id,
    sourceDatabase: params.record.sourceDatabase,
    legacyTable: params.record.legacyTable,
    legacyId: params.record.legacyId,
    label: params.record.recordKey ?? `Level ${params.record.legacyId}`,
    redirect: params.record.redirect ?? null,
    welcomeEmail: params.record.welcomeEmail ?? false,
    isDisabled: params.record.isDisabled ?? false,
    userCount: params.userCount ?? 0,
    selectedActionIds: params.selectedActionIds ?? [],
  };
}

export async function getLegacyAccessControlMatrix(): Promise<
  ActionResult<LegacyAccessControlGroup[]>
> {
  try {
    await requireLegacyAdminPanelAccess();

    const [levels, actions, grants, users] = await Promise.all([
      db.legacyAuthRecord.findMany({
        where: {
          recordType: {
            in: ACCESS_CONFIGS.map((config) => config.levelRecordType),
          },
        },
        orderBy: [
          { sourceDatabase: "asc" },
          { legacyTable: "asc" },
          { legacyId: "asc" },
        ],
      }),
      db.legacyAccessControlRecord.findMany({
        where: {
          recordType: {
            in: ACCESS_CONFIGS.map((config) => config.actionRecordType),
          },
        },
        orderBy: [
          { sourceDatabase: "asc" },
          { legacyTable: "asc" },
          { actionGroupId: "asc" },
          { legacyActionId: "asc" },
        ],
      }),
      db.legacyAccessControlRecord.findMany({
        where: {
          recordType: {
            in: ACCESS_CONFIGS.map((config) => config.grantRecordType),
          },
          OR: [{ isActive: true }, { isActive: null }],
        },
        orderBy: [
          { sourceDatabase: "asc" },
          { legacyLevelId: "asc" },
          { legacyActionId: "asc" },
        ],
      }),
      db.legacyAuthRecord.findMany({
        where: {
          recordType: {
            in: ACCESS_CONFIGS.map((config) => config.userRecordType),
          },
        },
        select: {
          sourceDatabase: true,
          recordType: true,
          recordValue: true,
        },
      }),
    ]);

    const groups: LegacyAccessControlGroup[] = [];

    for (const config of ACCESS_CONFIGS) {
      const sourceDatabases = new Set<string>();

      for (const level of levels) {
        if (level.recordType === config.levelRecordType) {
          sourceDatabases.add(level.sourceDatabase);
        }
      }
      for (const action of actions) {
        if (action.recordType === config.actionRecordType) {
          sourceDatabases.add(action.sourceDatabase);
        }
      }
      for (const grant of grants) {
        if (grant.recordType === config.grantRecordType) {
          sourceDatabases.add(grant.sourceDatabase);
        }
      }

      for (const sourceDatabase of Array.from(sourceDatabases).sort()) {
        const groupActions = actions
          .filter(
            (action) =>
              action.sourceDatabase === sourceDatabase &&
              action.recordType === config.actionRecordType &&
              action.legacyActionId,
          )
          .map((action) => ({
            id: action.id,
            sourceDatabase: action.sourceDatabase,
            legacyTable: action.legacyTable,
            legacyActionId: action.legacyActionId ?? 0,
            actionGroupId: action.actionGroupId ?? null,
            actionName:
              action.actionName ??
              action.description ??
              `Action ${action.legacyActionId ?? ""}`.trim(),
            actionType: action.actionType ?? null,
            description: action.description ?? null,
            isActive: action.isActive ?? true,
          }));

        const groupGrants = grants.filter(
          (grant) =>
            grant.sourceDatabase === sourceDatabase &&
            grant.recordType === config.grantRecordType &&
            grant.legacyLevelId &&
            grant.legacyActionId,
        );
        const grantsByLevel = new Map<number, Set<number>>();

        for (const grant of groupGrants) {
          const legacyLevelId = grant.legacyLevelId ?? 0;
          const legacyActionId = grant.legacyActionId ?? 0;
          if (!legacyLevelId || !legacyActionId) continue;
          const selected = grantsByLevel.get(legacyLevelId) ?? new Set<number>();
          selected.add(legacyActionId);
          grantsByLevel.set(legacyLevelId, selected);
        }

        const groupLevels = levels
          .filter(
            (level) =>
              level.sourceDatabase === sourceDatabase &&
              level.recordType === config.levelRecordType,
          )
          .map((level) => {
            const userCount = users.reduce((count, user) => {
              if (
                user.sourceDatabase !== sourceDatabase ||
                user.recordType !== config.userRecordType
              ) {
                return count;
              }

              return parsePhpLevelIds(user.recordValue).includes(level.legacyId)
                ? count + 1
                : count;
            }, 0);

            return levelRowFromRecord({
              record: level,
              userCount,
              selectedActionIds: Array.from(
                grantsByLevel.get(level.legacyId) ?? new Set<number>(),
              ).sort((a, b) => a - b),
            });
          });

        if (groupLevels.length === 0 && groupActions.length === 0) continue;

        groups.push({
          key: `${sourceDatabase}:${config.levelRecordType}`,
          sourceDatabase,
          title: config.title,
          levelRecordType: config.levelRecordType,
          actionRecordType: config.actionRecordType,
          grantRecordType: config.grantRecordType,
          levels: groupLevels,
          actions: groupActions,
          grantCount: groupGrants.length,
        });
      }
    }

    return { success: true, data: groups };
  } catch (error) {
    console.error("Failed to fetch legacy access control matrix:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch legacy access control matrix",
    };
  }
}

export async function getLegacyAccessLevelUsers(input: {
  sourceDatabase: string;
  levelRecordType: LegacyAccessLevelRecordType;
  legacyLevelId: number;
}): Promise<ActionResult<LegacyAccessLevelUsersData>> {
  try {
    await requireLegacyAdminPanelAccess();

    const config = configForLevelType(input.levelRecordType);
    if (!config) {
      return { success: false, error: "Unknown legacy level type" };
    }

    const sourceDatabase = input.sourceDatabase.trim();
    const legacyLevelId = Number(input.legacyLevelId);
    if (!sourceDatabase || !Number.isInteger(legacyLevelId) || legacyLevelId <= 0) {
      return { success: false, error: "Missing legacy level" };
    }

    const level = await db.legacyAuthRecord.findFirst({
      where: {
        sourceDatabase,
        recordType: config.levelRecordType,
        legacyId: legacyLevelId,
      },
      select: {
        recordKey: true,
        legacyId: true,
      },
    });
    if (!level) return { success: false, error: "No such legacy level!" };

    const userRecords = await db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase,
        recordType: config.userRecordType,
      },
      select: {
        id: true,
        sourceDatabase: true,
        legacyTable: true,
        legacyId: true,
        legacyUserId: true,
        username: true,
        email: true,
        recordKey: true,
        recordValue: true,
        isDisabled: true,
        legacyData: true,
      },
    });
    const matchingUsers = userRecords
      .filter((user) => parsePhpLevelIds(user.recordValue).includes(legacyLevelId))
      .sort((a, b) => {
        const aTime = Date.parse(registeredTimestamp(a) ?? "") || 0;
        const bTime = Date.parse(registeredTimestamp(b) ?? "") || 0;
        if (aTime !== bTime) return bTime - aTime;
        return (b.legacyUserId ?? b.legacyId) - (a.legacyUserId ?? a.legacyId);
      });
    const legacyUserIds = matchingUsers
      .map((user) => user.legacyUserId ?? user.legacyId)
      .filter((value) => Number.isInteger(value) && value > 0);
    const loginRows = legacyUserIds.length
      ? await db.legacyLoginTimestamp.findMany({
          where: {
            sourceDatabase,
            legacyUserId: { in: legacyUserIds },
            principalType: auditPrincipalForUserType(config.userRecordType),
          },
          orderBy: [{ occurredAt: "desc" }, { legacyId: "desc" }],
          select: {
            legacyUserId: true,
            occurredAt: true,
            ipAddress: true,
          },
        })
      : [];
    const latestLoginByUser = new Map<
      number,
      { occurredAt: Date | null; ipAddress: string | null }
    >();

    for (const login of loginRows) {
      if (!latestLoginByUser.has(login.legacyUserId)) {
        latestLoginByUser.set(login.legacyUserId, {
          occurredAt: login.occurredAt,
          ipAddress: login.ipAddress,
        });
      }
    }

    return {
      success: true,
      data: {
        levelLabel: level.recordKey ?? `Level ${level.legacyId}`,
        users: matchingUsers.map((user) => {
          const legacyId = user.legacyUserId ?? user.legacyId;
          const latestLogin = latestLoginByUser.get(legacyId);

          return {
            id: user.id,
            sourceDatabase: user.sourceDatabase,
            legacyTable: user.legacyTable,
            legacyId,
            username:
              user.username ??
              user.recordKey ??
              legacyString(user.legacyData, "username"),
            name: legacyString(user.legacyData, "name"),
            email: user.email ?? legacyString(user.legacyData, "email"),
            registeredAt: registeredTimestamp(user),
            lastLoginAt: latestLogin?.occurredAt?.toISOString() ?? null,
            lastLoginIp: latestLogin?.ipAddress ?? null,
            isRestricted: user.isDisabled ?? false,
          };
        }),
      },
    };
  } catch (error) {
    console.error("Failed to fetch legacy level users:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch legacy level users",
    };
  }
}

export async function updateLegacyAccessControlLevels(
  input: UpdateLegacyAccessControlLevelsInput,
): Promise<ActionResult<{ updatedLevels: number; activeGrants: number }>> {
  try {
    await requireLegacyAdminPanelAccess();

    const config = configForLevelType(input.levelRecordType);
    if (!config) {
      return { success: false, error: "Unknown legacy level type" };
    }

    const sourceDatabase = input.sourceDatabase.trim();
    if (!sourceDatabase) {
      return { success: false, error: "Missing legacy source database" };
    }

    const levels = input.levels
      .map((level) => ({
        legacyLevelId: Number(level.legacyLevelId),
        actionIds: uniqueNumbers(level.actionIds),
      }))
      .filter(
        (level) =>
          Number.isInteger(level.legacyLevelId) && level.legacyLevelId > 0,
      );

    if (levels.length === 0) {
      return { success: false, error: "No level selected!" };
    }

    const uniqueLevelIds = uniqueNumbers(
      levels.map((level) => level.legacyLevelId),
    );

    const existingLevels = await db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase,
        recordType: config.levelRecordType,
        legacyId: { in: uniqueLevelIds },
      },
      select: { legacyId: true },
    });

    if (existingLevels.length !== uniqueLevelIds.length) {
      return {
        success: false,
        error: "One or more legacy levels no longer exist",
      };
    }

    const selectedActionIds = uniqueNumbers(
      levels.flatMap((level) => level.actionIds),
    );
    const validActions =
      selectedActionIds.length > 0
        ? await db.legacyAccessControlRecord.findMany({
            where: {
              sourceDatabase,
              recordType: config.actionRecordType,
              legacyActionId: { in: selectedActionIds },
            },
            select: { legacyActionId: true },
          })
        : [];
    const validActionIds = new Set(
      validActions
        .map((action) => action.legacyActionId)
        .filter((value): value is number => value !== null),
    );

    if (validActionIds.size !== selectedActionIds.length) {
      return {
        success: false,
        error: "One or more legacy actions no longer exist",
      };
    }

    const normalizedLevels = uniqueLevelIds.map((legacyLevelId) => {
      const mergedActionIds = uniqueNumbers(
        levels
          .filter((level) => level.legacyLevelId === legacyLevelId)
          .flatMap((level) => level.actionIds),
      );

      return { legacyLevelId, actionIds: mergedActionIds };
    });

    await db.$transaction(async (tx) => {
      for (const level of normalizedLevels) {
        await tx.legacyAccessControlRecord.updateMany({
          where: {
            sourceDatabase,
            recordType: config.grantRecordType,
            legacyLevelId: level.legacyLevelId,
          },
          data: { isActive: false },
        });

        for (const legacyActionId of level.actionIds) {
          const key = grantLegacyKey(
            sourceDatabase,
            config.grantTable,
            level.legacyLevelId,
            legacyActionId,
          );

          await tx.legacyAccessControlRecord.upsert({
            where: { legacyKey: key },
            create: {
              sourceDatabase,
              legacyTable: config.grantTable,
              legacyKey: key,
              recordType: config.grantRecordType,
              legacyLevelId: level.legacyLevelId,
              legacyActionId,
              isActive: true,
              legacyData: {
                actioncon_level_id: level.legacyLevelId,
                actioncon_sysact_id: legacyActionId,
                updated_from: "modern_legacy_access_control",
              },
            },
            update: {
              sourceDatabase,
              legacyTable: config.grantTable,
              recordType: config.grantRecordType,
              legacyLevelId: level.legacyLevelId,
              legacyActionId,
              isActive: true,
              legacyData: {
                actioncon_level_id: level.legacyLevelId,
                actioncon_sysact_id: legacyActionId,
                updated_from: "modern_legacy_access_control",
              },
            },
          });
        }
      }
    });

    revalidatePath("/settings/access-control");

    return {
      success: true,
      data: {
        updatedLevels: normalizedLevels.length,
        activeGrants: normalizedLevels.reduce(
          (total, level) => total + level.actionIds.length,
          0,
        ),
      },
    };
  } catch (error) {
    console.error("Failed to update legacy access control:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update legacy access control",
    };
  }
}

export async function createLegacyAccessLevel(
  input: CreateLegacyAccessLevelInput,
): Promise<ActionResult<LegacyAccessLevelRow>> {
  try {
    await requireLegacyAdminPanelAccess();

    const config = configForLevelType(input.levelRecordType);
    if (!config) {
      return { success: false, error: "Unknown legacy level type" };
    }

    const sourceDatabase = input.sourceDatabase.trim();
    const levelName = input.levelName.trim();
    const redirect = inputString(input.redirect);

    if (!sourceDatabase) {
      return { success: false, error: "Missing legacy source database" };
    }
    if (!levelName) {
      return { success: false, error: "You must enter a level name." };
    }

    const existingLevels = await db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase,
        recordType: config.levelRecordType,
      },
      select: { recordKey: true },
    });
    const duplicate = existingLevels.some(
      (level) =>
        level.recordKey?.trim().toLowerCase() === levelName.toLowerCase(),
    );

    if (duplicate) {
      return {
        success: false,
        error: `Level name ${levelName} already exists.`,
      };
    }

    const maxLevel = await db.legacyAuthRecord.findFirst({
      where: {
        sourceDatabase,
        recordType: config.levelRecordType,
      },
      orderBy: { legacyId: "desc" },
      select: { legacyId: true },
    });
    const legacyId = (maxLevel?.legacyId ?? 0) + 1;
    const legacyKey = `${sourceDatabase}:${config.levelTable}:${legacyId}`;

    const created = await db.legacyAuthRecord.create({
      data: {
        sourceDatabase,
        legacyTable: config.levelTable,
        legacyKey,
        legacyId,
        recordType: config.levelRecordType,
        recordKey: levelName,
        redirect,
        isDisabled: false,
        welcomeEmail: false,
        legacyData: levelLegacyData({
          legacyId,
          levelName,
          redirect,
          welcomeEmail: false,
          isDisabled: false,
        }),
      },
    });

    revalidatePath("/settings/access-control");

    return {
      success: true,
      data: levelRowFromRecord({ record: created }),
    };
  } catch (error) {
    console.error("Failed to create legacy level:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create legacy level",
    };
  }
}

export async function updateLegacyAccessLevel(
  input: UpdateLegacyAccessLevelInput,
): Promise<ActionResult<LegacyAccessLevelRow>> {
  try {
    await requireLegacyAdminPanelAccess();

    const levelName = input.levelName.trim();
    const redirect = inputString(input.redirect);

    if (!levelName) {
      return { success: false, error: "You must enter a level name." };
    }

    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: input.levelRecordId },
    });

    if (!existing) {
      return { success: false, error: "Level doesn't exist!" };
    }

    const config = configForLevelType(
      existing.recordType as LegacyAccessLevelRecordType,
    );
    if (!config) {
      return { success: false, error: "Unknown legacy level type" };
    }

    const siblingLevels = await db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase: existing.sourceDatabase,
        recordType: config.levelRecordType,
      },
      select: { id: true, recordKey: true },
    });
    const duplicate = siblingLevels.some(
      (level) =>
        level.id !== existing.id &&
        level.recordKey?.trim().toLowerCase() === levelName.toLowerCase(),
    );

    if (duplicate) {
      return {
        success: false,
        error: `Level name ${levelName} already exists.`,
      };
    }

    const isAdminLevel = existing.legacyId === 1;
    const isDisabled = isAdminLevel ? false : Boolean(input.isDisabled);
    const welcomeEmail = Boolean(input.welcomeEmail);

    const updated = await db.legacyAuthRecord.update({
      where: { id: existing.id },
      data: {
        recordKey: levelName,
        redirect,
        welcomeEmail,
        isDisabled,
        legacyData: levelLegacyData({
          existing: existing.legacyData,
          legacyId: existing.legacyId,
          levelName,
          redirect,
          welcomeEmail,
          isDisabled,
        }),
      },
    });

    const userCount = await countUsersForLegacyLevel(
      updated.sourceDatabase,
      config.userRecordType,
      updated.legacyId,
    );

    revalidatePath("/settings/access-control");

    return {
      success: true,
      data: levelRowFromRecord({ record: updated, userCount }),
    };
  } catch (error) {
    console.error("Failed to update legacy level:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update legacy level",
    };
  }
}

export async function deleteLegacyAccessLevel(input: {
  levelRecordId: string;
}): Promise<ActionResult<{ id: string; legacyId: number }>> {
  try {
    await requireLegacyAdminPanelAccess();

    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: input.levelRecordId },
    });

    if (!existing) {
      return { success: false, error: "Level doesn't exist!" };
    }

    const config = configForLevelType(
      existing.recordType as LegacyAccessLevelRecordType,
    );
    if (!config) {
      return { success: false, error: "Unknown legacy level type" };
    }

    if (existing.legacyId === 1) {
      return { success: false, error: "The admin level cannot be deleted." };
    }

    const userCount = await countUsersForLegacyLevel(
      existing.sourceDatabase,
      config.userRecordType,
      existing.legacyId,
    );

    if (userCount > 0) {
      return {
        success: false,
        error: "This level still has users in it!",
      };
    }

    await db.$transaction([
      db.legacyAuthRecord.update({
        where: { id: existing.id },
        data: {
          recordType: `${existing.recordType}_deleted`,
          isDisabled: true,
          legacyData: {
            ...legacyObject(existing.legacyData),
            deleted_from: "modern_legacy_level_admin",
          },
        },
      }),
      db.legacyAccessControlRecord.updateMany({
        where: {
          sourceDatabase: existing.sourceDatabase,
          recordType: config.grantRecordType,
          legacyLevelId: existing.legacyId,
        },
        data: { isActive: false },
      }),
    ]);

    revalidatePath("/settings/access-control");

    return {
      success: true,
      data: { id: existing.id, legacyId: existing.legacyId },
    };
  } catch (error) {
    console.error("Failed to delete legacy level:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete legacy level",
    };
  }
}
