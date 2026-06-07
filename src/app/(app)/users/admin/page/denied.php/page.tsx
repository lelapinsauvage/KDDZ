import { redirect } from "next/navigation";

export default function LegacyDeniedRedirectPage() {
  redirect("/settings/legacy-auth?tab=denied");
}
