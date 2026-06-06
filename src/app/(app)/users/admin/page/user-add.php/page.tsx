import { redirect } from "next/navigation";

export default function LegacyUserAddRedirect() {
  redirect("/settings/legacy-users?new=1");
}
