import { redirect } from "next/navigation";

export default function LegacyFoodRedirect() {
  redirect("/food");
}
