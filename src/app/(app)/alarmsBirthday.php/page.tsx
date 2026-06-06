import { redirect } from "next/navigation";

export default function LegacyBirthdayAlarmsRedirect() {
  redirect("/alarms/birthdays");
}
