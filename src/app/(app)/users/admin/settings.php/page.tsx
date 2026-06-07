import { redirect } from "next/navigation";

export default function LegacyAdminSettingsRootRedirectPage() {
  redirect("/settings/legacy-auth");
}
