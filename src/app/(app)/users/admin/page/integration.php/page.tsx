import { redirect } from "next/navigation";

export default function LegacyIntegrationRedirectPage() {
  redirect("/settings/legacy-auth?tab=integration");
}
