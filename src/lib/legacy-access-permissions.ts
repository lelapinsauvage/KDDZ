import { db } from "@/lib/db";
import type { OrgContext } from "@/lib/require-org";

type LegacyAccessConfig = {
  userRecordType: "login_user" | "manager_login_user";
  actionRecordType: "system_action" | "manager_system_action";
  grantRecordType: "level_action_grant" | "manager_level_action_grant";
};

type LegacyLevelEntry = {
  sourceDatabase: string;
  legacyLevelId: number;
  config: LegacyAccessConfig;
};

export type LegacyAccessPermissionDecision = {
  isConfigured: boolean;
  isAllowed: boolean;
};

const LEGACY_ACCESS_CONFIGS: LegacyAccessConfig[] = [
  {
    userRecordType: "login_user",
    actionRecordType: "system_action",
    grantRecordType: "level_action_grant",
  },
  {
    userRecordType: "manager_login_user",
    actionRecordType: "manager_system_action",
    grantRecordType: "manager_level_action_grant",
  },
];

function uniqueNumbers(values: number[]) {
  return Array.from(
    new Set(
      values.filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

function parsePhpLevelIds(serialized: string | null) {
  if (!serialized) return [];

  const ids = new Set<number>();
  for (const match of serialized.matchAll(/s:\d+:"(\d+)"/g)) {
    ids.add(Number.parseInt(match[1], 10));
  }
  for (const match of serialized.matchAll(/i:\d+;i:(\d+)/g)) {
    ids.add(Number.parseInt(match[1], 10));
  }

  return uniqueNumbers(Array.from(ids));
}

function normalizeActionType(actionType: string) {
  return actionType.trim().toUpperCase();
}

function actionMatches(params: {
  actionName: string | null;
  actionType: string | null;
  expectedName: string;
  expectedType: string;
}) {
  return (
    params.actionName === params.expectedName &&
    normalizeActionType(params.actionType ?? "") === params.expectedType
  );
}

function configForUserRecordType(recordType: string) {
  return LEGACY_ACCESS_CONFIGS.find(
    (config) => config.userRecordType === recordType,
  );
}

function configForActionRecordType(recordType: string) {
  return LEGACY_ACCESS_CONFIGS.find(
    (config) => config.actionRecordType === recordType,
  );
}

export async function getLegacyAccessPermissionDecision(
  ctx: OrgContext,
  actionName: string,
  actionType: "PAGE" | "ACTION" | string = "PAGE",
): Promise<LegacyAccessPermissionDecision> {
  const normalizedType = normalizeActionType(actionType);
  const legacyUsers = await db.legacyAuthRecord.findMany({
    where: {
      userId: ctx.userId,
      recordType: {
        in: LEGACY_ACCESS_CONFIGS.map((config) => config.userRecordType),
      },
    },
    select: {
      sourceDatabase: true,
      recordType: true,
      recordValue: true,
    },
  });

  const levelEntries: LegacyLevelEntry[] = [];
  for (const legacyUser of legacyUsers) {
    const config = configForUserRecordType(legacyUser.recordType);
    if (!config) continue;
    for (const legacyLevelId of parsePhpLevelIds(legacyUser.recordValue)) {
      levelEntries.push({
        sourceDatabase: legacyUser.sourceDatabase,
        legacyLevelId,
        config,
      });
    }
  }

  if (levelEntries.length === 0) {
    return { isConfigured: false, isAllowed: false };
  }

  const sourceDatabases = Array.from(
    new Set(levelEntries.map((entry) => entry.sourceDatabase)),
  );
  const actions = await db.legacyAccessControlRecord.findMany({
    where: {
      sourceDatabase: { in: sourceDatabases },
      recordType: {
        in: LEGACY_ACCESS_CONFIGS.map((config) => config.actionRecordType),
      },
    },
    select: {
      sourceDatabase: true,
      recordType: true,
      legacyActionId: true,
      actionName: true,
      actionType: true,
    },
  });

  const matchingActions = actions.filter((action) =>
    actionMatches({
      actionName: action.actionName,
      actionType: action.actionType,
      expectedName: actionName,
      expectedType: normalizedType,
    }),
  );
  if (matchingActions.length === 0) {
    return { isConfigured: false, isAllowed: false };
  }

  const relevantActions = matchingActions.filter((action) => {
    const config = configForActionRecordType(action.recordType);
    return (
      config &&
      action.legacyActionId &&
      levelEntries.some(
        (entry) =>
          entry.sourceDatabase === action.sourceDatabase &&
          entry.config.actionRecordType === config.actionRecordType,
      )
    );
  });
  if (relevantActions.length === 0) {
    return { isConfigured: false, isAllowed: false };
  }

  const actionIds = uniqueNumbers(
    relevantActions.map((action) => action.legacyActionId ?? 0),
  );
  const levelIds = uniqueNumbers(
    levelEntries.map((entry) => entry.legacyLevelId),
  );
  const grants = await db.legacyAccessControlRecord.findMany({
    where: {
      sourceDatabase: { in: sourceDatabases },
      recordType: {
        in: LEGACY_ACCESS_CONFIGS.map((config) => config.grantRecordType),
      },
      legacyActionId: { in: actionIds },
      legacyLevelId: { in: levelIds },
      OR: [{ isActive: true }, { isActive: null }],
    },
    select: {
      sourceDatabase: true,
      recordType: true,
      legacyActionId: true,
      legacyLevelId: true,
    },
  });

  const isAllowed = grants.some((grant) => {
    const entry = levelEntries.find(
      (level) =>
        level.sourceDatabase === grant.sourceDatabase &&
        level.config.grantRecordType === grant.recordType &&
        level.legacyLevelId === grant.legacyLevelId,
    );
    if (!entry) return false;

    return relevantActions.some((action) => {
      const config = configForActionRecordType(action.recordType);
      return (
        config &&
        config.grantRecordType === grant.recordType &&
        action.sourceDatabase === grant.sourceDatabase &&
        action.legacyActionId === grant.legacyActionId
      );
    });
  });

  return { isConfigured: true, isAllowed };
}
