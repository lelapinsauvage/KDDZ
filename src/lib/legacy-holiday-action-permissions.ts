import { legacyAccessAllows } from "@/lib/legacy-access-permissions";
import { getLegacyActionPermissionMap } from "@/lib/legacy-action-permissions";
import type { OrgContext } from "@/lib/require-org";

export const LEGACY_HOLIDAY_ACTION_NAMES = ["AddEditHolidays"] as const;

export type LegacyHolidayActionPermissions = {
  canAddEditHolidays: boolean;
};

export async function getLegacyHolidayActionPermissions(
  ctx: OrgContext,
): Promise<LegacyHolidayActionPermissions> {
  const decisions = await getLegacyActionPermissionMap(
    ctx,
    LEGACY_HOLIDAY_ACTION_NAMES,
  );

  return {
    canAddEditHolidays: legacyAccessAllows(decisions.AddEditHolidays),
  };
}
