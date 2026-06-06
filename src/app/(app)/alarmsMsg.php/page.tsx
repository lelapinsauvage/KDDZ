import { redirect } from "next/navigation";

export default function LegacyMessageAlarmsRedirect() {
  redirect("/alarms/msg");
}
