import { redirect } from "next/navigation";

export default function LegacyAdminHomeRedirect() {
  redirect("/users/home.php");
}
