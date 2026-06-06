"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

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
  isDisabled: boolean;
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

export type UpdateLegacyAccessControlLevelsInput = {
  sourceDatabase: string;
  levelRecordType: LegacyAccessLevelRecordType;
  levels: Array<{
    legacyLevelId: number;
    actionIds: number[];
  }>;
};

type AccessConfig = {
  levelRecordType: LegacyAccessLevelRecordType;
  actionRecordType: LegacyAccessActionRecordType;
  grantRecordType: LegacyAccessGrantRecordType;
  grantTable: "actions_control" | "actions_control_man";
  title: string;
};

const ACCESS_CONFIGS: AccessConfig[] = [
  {
    levelRecordType: "login_level",
    actionRecordType: "system_action",
    grantRecordType: "level_action_grant",
    grantTable: "actions_control",
    title: "Staff Levels",
  },
  {
    levelRecordType: "manager_login_level",
    actionRecordType: "manager_system_action",
    grantRecordType: "manager_level_action_grant",
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

export async function getLegacyAccessControlMatrix(): Promise<
  ActionResult<LegacyAccessControlGroup[]>
> {
  try {
    await requireRole("ADMIN");

    const [levels, actions, grants] = await Promise.all([
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
          .map((level) => ({
            id: level.id,
            sourceDatabase: level.sourceDatabase,
            legacyTable: level.legacyTable,
            legacyId: level.legacyId,
            label: level.recordKey ?? `Level ${level.legacyId}`,
            isDisabled: level.isDisabled ?? false,
            selectedActionIds: Array.from(
              grantsByLevel.get(level.legacyId) ?? new Set<number>(),
            ).sort((a, b) => a - b),
          }));

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

export async function updateLegacyAccessControlLevels(
  input: UpdateLegacyAccessControlLevelsInput,
): Promise<ActionResult<{ updatedLevels: number; activeGrants: number }>> {
  try {
    await requireRole("ADMIN");

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
