import { redirect } from "next/navigation";

export default function LegacyZonesManagementRedirect() {
  redirect("/settings/zones");
}
