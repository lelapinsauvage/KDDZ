import {
  getLegacyAccessPermissionDecision,
  getLegacyAccessPermissionMap,
  legacyAccessAllows,
} from "@/lib/legacy-access-permissions";
import type { OrgContext } from "@/lib/require-org";

export async function getLegacyActionPermissionMap(
  ctx: OrgContext,
  actionNames: readonly string[],
) {
  return getLegacyAccessPermissionMap(ctx, actionNames, "ACTION");
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
