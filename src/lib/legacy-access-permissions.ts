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

type LegacyUserGrantEntry = {
  sourceDatabase: string;
  legacyUserId: number;
  config: LegacyAccessConfig;
};

export type LegacyAccessPermissionDecision = {
  isConfigured: boolean;
  isAllowed: boolean;
};

export type LegacyAccessPermissionRequest = {
  actionName: string;
  actionType?: "PAGE" | "ACTION" | string;
};

export type LegacyAccessSessionSnapshot = {
  generatedAt: string;
  levels: Array<{
    sourceDatabase: string;
    legacyTable: "login_users" | "login_users_man";
    legacyUserId: number | null;
    legacyLevelIds: number[];
  }>;
  configuredActionKeys: string[];
  allowedActionKeys: string[];
  directUserActionKeys: string[];
};

export function legacyAccessAllows(
  decision: LegacyAccessPermissionDecision | null | undefined,
) {
  return !decision?.isConfigured || decision.isAllowed;
}

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

export function legacyAccessPermissionKey(
  actionName: string,
  actionType: "PAGE" | "ACTION" | string = "PAGE",
) {
  return `${normalizeActionType(actionType)}:${actionName}`;
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
  const decisions = await getLegacyAccessPermissionDecisions(ctx, [
    { actionName, actionType },
  ]);
  return (
    decisions[legacyAccessPermissionKey(actionName, actionType)] ?? {
      isConfigured: false,
      isAllowed: false,
    }
  );
}

export async function getLegacyAccessPermissionMap(
  ctx: OrgContext,
  actionNames: readonly string[],
  actionType: "PAGE" | "ACTION" | string = "PAGE",
): Promise<Record<string, LegacyAccessPermissionDecision>> {
  const decisions = await getLegacyAccessPermissionDecisions(
    ctx,
    actionNames.map((actionName) => ({ actionName, actionType })),
  );

  return Object.fromEntries(
    actionNames.map((actionName) => [
      actionName,
      decisions[legacyAccessPermissionKey(actionName, actionType)] ?? {
        isConfigured: false,
        isAllowed: false,
      },
    ]),
  );
}

export async function getLegacyAccessPermissionDecisions(
  ctx: OrgContext,
  requests: LegacyAccessPermissionRequest[],
): Promise<Record<string, LegacyAccessPermissionDecision>> {
  const normalizedRequests = Array.from(
    new Map(
      requests
        .map((request) => ({
          actionName: request.actionName.trim(),
          actionType: normalizeActionType(request.actionType ?? "PAGE"),
        }))
        .filter((request) => request.actionName)
        .map((request) => [
          legacyAccessPermissionKey(request.actionName, request.actionType),
          request,
        ]),
    ).values(),
  );
  const emptyDecisions: Record<string, LegacyAccessPermissionDecision> =
    Object.fromEntries(
      normalizedRequests.map((request) => [
        legacyAccessPermissionKey(request.actionName, request.actionType),
        { isConfigured: false, isAllowed: false },
      ]),
    );

  if (normalizedRequests.length === 0) return {};

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
    return emptyDecisions;
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

  const relevantActionsByRequest = new Map<
    string,
    Array<(typeof actions)[number]>
  >();
  for (const request of normalizedRequests) {
    const requestKey = legacyAccessPermissionKey(
      request.actionName,
      request.actionType,
    );
    const relevantActions = actions.filter((action) => {
      if (
        !actionMatches({
          actionName: action.actionName,
          actionType: action.actionType,
          expectedName: request.actionName,
          expectedType: request.actionType,
        })
      ) {
        return false;
      }

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
    relevantActionsByRequest.set(requestKey, relevantActions);
  }

  const allRelevantActions = Array.from(
    new Map(
      Array.from(relevantActionsByRequest.values())
        .flat()
        .map((action) => [
          `${action.sourceDatabase}:${action.recordType}:${action.legacyActionId}`,
          action,
        ]),
    ).values(),
  );
  const decisions = { ...emptyDecisions };
  for (const [requestKey, relevantActions] of relevantActionsByRequest) {
    if (relevantActions.length > 0) {
      decisions[requestKey] = { isConfigured: true, isAllowed: false };
    }
  }
  if (allRelevantActions.length === 0) return decisions;

  const actionIds = uniqueNumbers(
    allRelevantActions.map((action) => action.legacyActionId ?? 0),
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

  function hasLevelGrant(relevantActions: typeof allRelevantActions) {
    return grants.some((grant) => {
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
  }

  for (const [requestKey, relevantActions] of relevantActionsByRequest) {
    if (relevantActions.length === 0) continue;
    decisions[requestKey] = {
      isConfigured: true,
      isAllowed: hasLevelGrant(relevantActions),
    };
  }

  return decisions;
}

export async function getLegacyAccessSessionSnapshot(
  userId: string,
): Promise<LegacyAccessSessionSnapshot | null> {
  const legacyUsers = await db.legacyAuthRecord.findMany({
    where: {
      userId,
      recordType: {
        in: LEGACY_ACCESS_CONFIGS.map((config) => config.userRecordType),
      },
    },
    select: {
      sourceDatabase: true,
      recordType: true,
      legacyTable: true,
      legacyId: true,
      legacyUserId: true,
      recordValue: true,
    },
  });

  const levelEntries: LegacyLevelEntry[] = [];
  const userGrantEntries: LegacyUserGrantEntry[] = [];
  const levels = legacyUsers.flatMap((legacyUser) => {
    const config = configForUserRecordType(legacyUser.recordType);
    if (!config) return [];
    const legacyUserId = legacyUser.legacyUserId ?? legacyUser.legacyId;
    if (Number.isInteger(legacyUserId) && legacyUserId > 0) {
      userGrantEntries.push({
        sourceDatabase: legacyUser.sourceDatabase,
        legacyUserId,
        config,
      });
    }
    const legacyLevelIds = parsePhpLevelIds(legacyUser.recordValue);
    for (const legacyLevelId of legacyLevelIds) {
      levelEntries.push({
        sourceDatabase: legacyUser.sourceDatabase,
        legacyLevelId,
        config,
      });
    }
    return [
      {
        sourceDatabase: legacyUser.sourceDatabase,
        legacyTable:
          legacyUser.recordType === "manager_login_user"
            ? ("login_users_man" as const)
            : ("login_users" as const),
        legacyUserId,
        legacyLevelIds,
      },
    ];
  });

  if (levelEntries.length === 0 && userGrantEntries.length === 0) return null;

  const sourceDatabases = Array.from(
    new Set(
      [...levelEntries, ...userGrantEntries].map(
        (entry) => entry.sourceDatabase,
      ),
    ),
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
  const actionIds = uniqueNumbers(
    actions.map((action) => action.legacyActionId ?? 0),
  );
  const levelIds = uniqueNumbers(
    levelEntries.map((entry) => entry.legacyLevelId),
  );
  const legacyUserIds = uniqueNumbers(
    userGrantEntries.map((entry) => entry.legacyUserId),
  );
  const [grants, userGrants] = await Promise.all([
    levelIds.length && actionIds.length
      ? db.legacyAccessControlRecord.findMany({
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
        })
      : Promise.resolve([]),
    legacyUserIds.length && actionIds.length
      ? db.legacyAccessControlRecord.findMany({
          where: {
            sourceDatabase: { in: sourceDatabases },
            recordType: "user_action_grant",
            legacyActionId: { in: actionIds },
            legacyUserId: { in: legacyUserIds },
            OR: [{ isActive: true }, { isActive: null }],
          },
          select: {
            sourceDatabase: true,
            legacyActionId: true,
            legacyUserId: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const configuredActionKeys = new Set<string>();
  const allowedActionKeys = new Set<string>();
  const directUserActionKeys = new Set<string>();
  for (const action of actions) {
    if (!action.actionName || !action.actionType || !action.legacyActionId) {
      continue;
    }
    const actionKey = legacyAccessPermissionKey(
      action.actionName,
      action.actionType,
    );
    configuredActionKeys.add(actionKey);
    const config = configForActionRecordType(action.recordType);
    if (!config) continue;

    const allowedByLevel = grants.some((grant) =>
      levelEntries.some(
        (entry) =>
          entry.sourceDatabase === grant.sourceDatabase &&
          entry.config.grantRecordType === grant.recordType &&
          entry.legacyLevelId === grant.legacyLevelId &&
          config.grantRecordType === grant.recordType &&
          action.sourceDatabase === grant.sourceDatabase &&
          action.legacyActionId === grant.legacyActionId,
      ),
    );
    const allowedByUser = userGrants.some((grant) =>
      userGrantEntries.some(
        (entry) =>
          entry.sourceDatabase === grant.sourceDatabase &&
          entry.config.actionRecordType === config.actionRecordType &&
          entry.legacyUserId === grant.legacyUserId &&
          action.sourceDatabase === grant.sourceDatabase &&
          action.legacyActionId === grant.legacyActionId,
      ),
    );
    if (allowedByUser) directUserActionKeys.add(actionKey);
    if (allowedByLevel) allowedActionKeys.add(actionKey);
  }

  return {
    generatedAt: new Date().toISOString(),
    levels,
    configuredActionKeys: Array.from(configuredActionKeys).sort(),
    allowedActionKeys: Array.from(allowedActionKeys).sort(),
    directUserActionKeys: Array.from(directUserActionKeys).sort(),
  };
}
