import { redirect } from "next/navigation";

export default function LegacyHolidayCalendarRedirect() {
  redirect("/settings/holidays");
}
