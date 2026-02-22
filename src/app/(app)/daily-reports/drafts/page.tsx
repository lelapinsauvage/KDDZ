import { redirect } from "next/navigation";

export default function DraftDailyReportsPage() {
  redirect("/daily-reports?status=DRAFT");
}
