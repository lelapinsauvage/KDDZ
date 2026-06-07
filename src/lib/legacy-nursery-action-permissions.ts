import { legacyAccessAllows } from "@/lib/legacy-access-permissions";
import { getLegacyActionPermissionMap } from "@/lib/legacy-action-permissions";
import type { OrgContext } from "@/lib/require-org";

export const LEGACY_NURSERY_ACTION_NAMES = ["Upnurseryinfo"] as const;

export type LegacyNurseryActionPermissions = {
  canUpdateNurseryInfo: boolean;
};

export async function getLegacyNurseryActionPermissions(
  ctx: OrgContext,
): Promise<LegacyNurseryActionPermissions> {
  const decisions = await getLegacyActionPermissionMap(
    ctx,
    LEGACY_NURSERY_ACTION_NAMES,
  );

  return {
    canUpdateNurseryInfo: legacyAccessAllows(decisions.Upnurseryinfo),
  };
}
