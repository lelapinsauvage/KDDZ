import { legacyAccessAllows } from "@/lib/legacy-access-permissions";
import { getLegacyActionPermissionMap } from "@/lib/legacy-action-permissions";
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
  const decisions = await getLegacyActionPermissionMap(
    ctx,
    LEGACY_CHILD_ACTION_NAMES,
  );

  return {
    canAddChild: legacyAccessAllows(decisions.addChild),
    canUpdateChild: legacyAccessAllows(decisions.updateChild),
    canDeleteChild: legacyAccessAllows(decisions.deleteChild),
  };
}
