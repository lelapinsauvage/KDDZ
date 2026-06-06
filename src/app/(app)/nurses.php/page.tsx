import { redirect } from "next/navigation";

export default function LegacyNursesRedirect() {
  redirect("/employees/nurses");
}
