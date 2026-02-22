import { redirect } from "next/navigation";

export default function DraftAbsentReportsPage() {
  redirect("/absent-reports?status=PENDING");
}
