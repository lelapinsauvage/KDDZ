import { redirect } from "next/navigation";

export default function LegacyDraftDailyReportsRedirect() {
  redirect("/daily-reports/drafts");
}
