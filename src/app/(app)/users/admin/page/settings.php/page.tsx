import { redirect } from "next/navigation";

export default function LegacyAdminSettingsRedirectPage() {
  redirect("/settings/legacy-auth");
}
