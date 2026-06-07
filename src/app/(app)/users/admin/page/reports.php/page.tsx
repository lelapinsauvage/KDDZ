import { redirect } from "next/navigation";

export default function LegacyReportsRedirectPage() {
  redirect("/settings/legacy-users/reports");
}
