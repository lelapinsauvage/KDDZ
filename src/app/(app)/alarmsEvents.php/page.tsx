import { redirect } from "next/navigation";

export default function LegacyEventAlarmsRedirect() {
  redirect("/alarms/events");
}
