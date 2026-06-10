import { redirect } from "next/navigation";

export default function LegacySendEmailRedirectPage() {
  redirect("/settings/notifications?tab=bulk");
}
