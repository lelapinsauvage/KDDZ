import { redirect } from "next/navigation";

export default function LegacyLevelControlRedirectPage() {
  redirect("/settings/access-control");
}
