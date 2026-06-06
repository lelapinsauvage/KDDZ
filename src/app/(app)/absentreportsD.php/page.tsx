import { redirect } from "next/navigation";

export default function LegacyDraftAbsenceReportsRedirect() {
  redirect("/absent-reports/drafts");
}
