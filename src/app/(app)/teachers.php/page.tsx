import { redirect } from "next/navigation";

export default function LegacyTeachersRedirect() {
  redirect("/employees/teachers");
}
