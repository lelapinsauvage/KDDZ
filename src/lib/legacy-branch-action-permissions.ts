import { legacyAccessAllows } from "@/lib/legacy-access-permissions";
import { getLegacyActionPermissionMap } from "@/lib/legacy-action-permissions";
import type { OrgContext } from "@/lib/require-org";

export const LEGACY_BRANCH_ACTION_NAMES = [
  "addBranch",
  "updateBranch",
  "deleteBranch",
] as const;

export type LegacyBranchActionPermissions = {
  canAddBranch: boolean;
  canUpdateBranch: boolean;
  canDeleteBranch: boolean;
};

export async function getLegacyBranchActionPermissions(
  ctx: OrgContext,
): Promise<LegacyBranchActionPermissions> {
  const decisions = await getLegacyActionPermissionMap(
    ctx,
    LEGACY_BRANCH_ACTION_NAMES,
  );

  return {
    canAddBranch: legacyAccessAllows(decisions.addBranch),
    canUpdateBranch: legacyAccessAllows(decisions.updateBranch),
    canDeleteBranch: legacyAccessAllows(decisions.deleteBranch),
  };
}
