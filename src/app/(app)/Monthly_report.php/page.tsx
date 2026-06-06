import { redirect } from "next/navigation";

export default function LegacyMonthlyReportRedirect() {
  redirect("/reports/monthly");
}
