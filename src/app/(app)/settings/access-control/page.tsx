import { redirect } from "next/navigation";
import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";
import { getLegacyAccessControlMatrix } from "@/lib/actions/legacy-access-control";
import { AccessControlClient } from "./access-control-client";

export default async function AccessControlPage() {
  try {
    await requireLegacyAdminPanelAccess();
  } catch {
    redirect("/forbidden.php");
  }

  const matrixResult = await getLegacyAccessControlMatrix();

  return (
    <AccessControlClient
      initialGroups={matrixResult.data ?? []}
      initialError={matrixResult.success ? null : (matrixResult.error ?? null)}
    />
  );
}
