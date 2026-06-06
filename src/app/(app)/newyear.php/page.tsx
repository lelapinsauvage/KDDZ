import { redirect } from "next/navigation";

export default function LegacyNewYearRedirect() {
  redirect("/settings/new-year");
}
