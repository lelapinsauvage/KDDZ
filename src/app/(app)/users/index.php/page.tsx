import { redirect } from "next/navigation";

export default function LegacyUsersIndexRedirect() {
  redirect("/users/home.php");
}
