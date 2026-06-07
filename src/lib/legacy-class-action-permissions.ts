import { legacyAccessAllows } from "@/lib/legacy-access-permissions";
import { getLegacyActionPermissionMap } from "@/lib/legacy-action-permissions";
import type { OrgContext } from "@/lib/require-org";

export const LEGACY_CLASS_ACTION_NAMES = [
  "addClass",
  "updateClass",
  "deleteClass",
] as const;

export type LegacyClassActionPermissions = {
  canAddClass: boolean;
  canUpdateClass: boolean;
  canDeleteClass: boolean;
};

export async function getLegacyClassActionPermissions(
  ctx: OrgContext,
): Promise<LegacyClassActionPermissions> {
  const decisions = await getLegacyActionPermissionMap(
    ctx,
    LEGACY_CLASS_ACTION_NAMES,
  );

  return {
    canAddClass: legacyAccessAllows(decisions.addClass),
    canUpdateClass: legacyAccessAllows(decisions.updateClass),
    canDeleteClass: legacyAccessAllows(decisions.deleteClass),
  };
}
