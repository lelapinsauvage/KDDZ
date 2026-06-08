export type LegacyGarderieRegistryForBootstrap = {
  legacyId: number;
  name: string | null;
  alias: string | null;
  userManageDatabase: string | null;
  currentDatabase: string | null;
  path: string | null;
};

export type LegacyGarderieBootstrapItem = {
  gid: string;
  garderie_name: string;
  garderie_alias: string;
  user_manage_db: string;
  current_db: string;
  path: string;
};

export function mapLegacyGarderieBootstrapItem(
  row: LegacyGarderieRegistryForBootstrap
): LegacyGarderieBootstrapItem {
  return {
    gid: String(row.legacyId),
    garderie_name: row.name ?? "",
    garderie_alias: row.alias ?? "",
    user_manage_db: row.userManageDatabase ?? "",
    current_db: row.currentDatabase ?? "",
    path: normalizeLegacyGarderiePath(row.path),
  };
}

export function buildDefaultLegacyGarderieBootstrapItem(
  env: NodeJS.ProcessEnv = process.env
): LegacyGarderieBootstrapItem {
  return {
    gid: env.LEGACY_MOBILE_GARDERIE_ID ?? "1",
    garderie_name: env.LEGACY_MOBILE_GARDERIE_NAME ?? "KiddzOnline Nursery",
    garderie_alias: env.LEGACY_MOBILE_GARDERIE_ALIAS ?? "",
    user_manage_db: env.LEGACY_MOBILE_USER_DB ?? "",
    current_db: env.LEGACY_MOBILE_CURRENT_DB ?? "",
    path: normalizeLegacyGarderiePath(env.LEGACY_MOBILE_WS_PATH ?? ""),
  };
}

export function buildLegacyGarderieBootstrapPayload(
  rows: LegacyGarderieRegistryForBootstrap[],
  env: NodeJS.ProcessEnv = process.env
) {
  const payload = rows.map(mapLegacyGarderieBootstrapItem);
  return payload.length > 0 ? payload : [buildDefaultLegacyGarderieBootstrapItem(env)];
}

export function normalizeLegacyGarderiePath(path: string | null | undefined) {
  return String(path ?? "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}
