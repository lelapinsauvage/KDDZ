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

export type LegacyAccessPermissionRequest = {
  actionName: string;
  actionType?: "PAGE" | "ACTION" | string;
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

  for (const [requestKey, relevantActions] of relevantActionsByRequest) {
    if (relevantActions.length === 0) continue;

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
    decisions[requestKey] = { isConfigured: true, isAllowed };
  }

  return decisions;
}
