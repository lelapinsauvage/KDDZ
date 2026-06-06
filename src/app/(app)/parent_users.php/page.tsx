import { redirect } from "next/navigation";

export default function LegacyParentUsersRedirect() {
  redirect("/settings/parent-users");
}
