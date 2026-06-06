import { redirect } from "next/navigation";

export default function LegacyAdminIndexRedirect() {
  redirect("/settings/legacy-users");
}
