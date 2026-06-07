import { redirect } from "next/navigation";

export default function LegacyUpdateRedirectPage() {
  redirect("/settings/legacy-auth?tab=update");
}
