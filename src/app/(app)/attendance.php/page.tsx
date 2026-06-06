import { redirect } from "next/navigation";

export default function LegacyAttendanceRedirect() {
  redirect("/employees/attendance");
}
