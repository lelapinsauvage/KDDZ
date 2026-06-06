import { redirect } from "next/navigation";

export default function LegacyAccidentReportsRedirect() {
  redirect("/medical/accidents");
}
