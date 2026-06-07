import { redirect } from "next/navigation";
import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";

export default async function LegacyAdminDirectoryRedirect() {
  try {
    await requireLegacyAdminPanelAccess();
  } catch {
    redirect("/forbidden.php");
  }

  redirect("/settings/legacy-users");
}
