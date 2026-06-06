import { redirect } from "next/navigation";

export default function LegacySettingsRedirect() {
  redirect("/profile?legacy=settings.php");
}
