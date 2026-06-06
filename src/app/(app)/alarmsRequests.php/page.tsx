import { redirect } from "next/navigation";

export default function LegacyRequestAlarmsRedirect() {
  redirect("/alarms/requests");
}
