import { redirect } from "next/navigation";

export default function LegacyAlarmsRedirect() {
  redirect("/alarms");
}
