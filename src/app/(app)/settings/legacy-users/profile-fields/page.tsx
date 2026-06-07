import { redirect } from "next/navigation";
import { getLegacyProfileFields } from "@/lib/actions/legacy-users";
import { requireRole } from "@/lib/require-role";
import { LegacyProfileFieldsClient } from "./profile-fields-client";

export default async function LegacyProfileFieldsPage() {
  try {
    await requireRole("ADMIN");
  } catch {
    redirect("/dashboard");
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
