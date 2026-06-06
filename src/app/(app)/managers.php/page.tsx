import { redirect } from "next/navigation";

export default function LegacyManagersRedirect() {
  redirect("/employees/managers");
}
