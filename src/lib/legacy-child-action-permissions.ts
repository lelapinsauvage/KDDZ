import {
  getLegacyAccessPermissionDecision,
  getLegacyAccessPermissionMap,
  legacyAccessAllows,
} from "@/lib/legacy-access-permissions";
import type { OrgContext } from "@/lib/require-org";

export const LEGACY_CHILD_ACTION_NAMES = [
  "addChild",
  "updateChild",
  "deleteChild",
] as const;

export type LegacyChildActionPermissions = {
  canAddChild: boolean;
  canUpdateChild: boolean;
  canDeleteChild: boolean;
};

export async function getLegacyChildActionPermissions(
  ctx: OrgContext,
): Promise<LegacyChildActionPermissions> {
  const decisions = await getLegacyAccessPermissionMap(
    ctx,
    LEGACY_CHILD_ACTION_NAMES,
    "ACTION",
  );

  return {
    canAddChild: legacyAccessAllows(decisions.addChild),
    canUpdateChild: legacyAccessAllows(decisions.updateChild),
    canDeleteChild: legacyAccessAllows(decisions.deleteChild),
  };
}

export async function requireLegacyActionAllowed(
  ctx: OrgContext,
  actionName: string,
) {
  const decision = await getLegacyAccessPermissionDecision(
    ctx,
    actionName,
    "ACTION",
  );

  if (!legacyAccessAllows(decision)) {
    return { ok: false as const, error: "Access denied" };
  }

  return { ok: true as const };
}
