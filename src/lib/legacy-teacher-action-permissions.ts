import { legacyAccessAllows } from "@/lib/legacy-access-permissions";
import { getLegacyActionPermissionMap } from "@/lib/legacy-action-permissions";
import type { OrgContext } from "@/lib/require-org";

export const LEGACY_TEACHER_ACTION_NAMES = [
  "addTeacher",
  "updateTeacher",
  "deleteTeacher",
] as const;

export type LegacyTeacherActionPermissions = {
  canAddTeacher: boolean;
  canUpdateTeacher: boolean;
  canDeleteTeacher: boolean;
};

export async function getLegacyTeacherActionPermissions(
  ctx: OrgContext,
): Promise<LegacyTeacherActionPermissions> {
  const decisions = await getLegacyActionPermissionMap(
    ctx,
    LEGACY_TEACHER_ACTION_NAMES,
  );

  return {
    canAddTeacher: legacyAccessAllows(decisions.addTeacher),
    canUpdateTeacher: legacyAccessAllows(decisions.updateTeacher),
    canDeleteTeacher: legacyAccessAllows(decisions.deleteTeacher),
  };
}
