import { legacyAccessAllows } from "@/lib/legacy-access-permissions";
import { getLegacyActionPermissionMap } from "@/lib/legacy-action-permissions";
import { requireRole } from "@/lib/require-role";
import type { OrgContext } from "@/lib/require-org";

export const LEGACY_SYSTEM_ACTION_NAMES = ["manageSystem"] as const;

export type LegacySystemActionPermissions = {
  canManageSystem: boolean;
};

export async function getLegacySystemActionPermissions(
  ctx: OrgContext,
): Promise<LegacySystemActionPermissions> {
  const decisions = await getLegacyActionPermissionMap(
    ctx,
    LEGACY_SYSTEM_ACTION_NAMES,
  );

  return {
    canManageSystem: legacyAccessAllows(decisions.manageSystem),
  };
}

export async function requireLegacyAdminPanelAccess(): Promise<OrgContext> {
  const ctx = await requireRole("ADMIN");
  const permissions = await getLegacySystemActionPermissions(ctx);

  if (!permissions.canManageSystem) {
    throw new Error("Access denied");
  }

  return ctx;
}
