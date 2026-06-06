import { redirect } from "next/navigation";

export default function LegacyRegionsRedirect() {
  redirect("/settings/regions");
}
