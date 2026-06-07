import { redirect } from "next/navigation";
import { getLegacyProfileFields } from "@/lib/actions/legacy-users";
import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";
import { LegacyProfileFieldsClient } from "./profile-fields-client";

export default async function LegacyProfileFieldsPage() {
  try {
    await requireLegacyAdminPanelAccess();
  } catch {
    redirect("/forbidden.php");
  }

  const fieldsResult = await getLegacyProfileFields();

  return (
    <LegacyProfileFieldsClient
      initialData={
        fieldsResult.data ?? {
          fields: [],
          groups: [],
        }
      }
      initialError={fieldsResult.success ? null : (fieldsResult.error ?? null)}
    />
  );
}
