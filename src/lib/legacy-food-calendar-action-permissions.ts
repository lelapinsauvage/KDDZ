import { legacyAccessAllows } from "@/lib/legacy-access-permissions";
import { getLegacyActionPermissionMap } from "@/lib/legacy-action-permissions";
import type { OrgContext } from "@/lib/require-org";

export const LEGACY_FOOD_CALENDAR_ACTION_NAMES = [
  "AddFoodToCalendar",
  "EditFoodCalendar",
  "FoodAllBranches",
] as const;

export type LegacyFoodCalendarActionPermissions = {
  canAddFoodToCalendar: boolean;
  canEditFoodCalendar: boolean;
  canApplyFoodAllBranches: boolean;
};

export async function getLegacyFoodCalendarActionPermissions(
  ctx: OrgContext,
): Promise<LegacyFoodCalendarActionPermissions> {
  const decisions = await getLegacyActionPermissionMap(
    ctx,
    LEGACY_FOOD_CALENDAR_ACTION_NAMES,
  );

  return {
    canAddFoodToCalendar: legacyAccessAllows(decisions.AddFoodToCalendar),
    canEditFoodCalendar: legacyAccessAllows(decisions.EditFoodCalendar),
    canApplyFoodAllBranches: legacyAccessAllows(decisions.FoodAllBranches),
  };
}
