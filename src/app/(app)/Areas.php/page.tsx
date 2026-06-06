import { redirect } from "next/navigation";

export default function LegacyAreasRedirect() {
  redirect("/settings/areas");
}
