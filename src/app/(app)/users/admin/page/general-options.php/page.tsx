import { redirect } from "next/navigation";

export default function LegacyGeneralOptionsRedirectPage() {
  redirect("/settings/legacy-auth?tab=general");
}
