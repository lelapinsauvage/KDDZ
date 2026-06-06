import { redirect } from "next/navigation";

export default function LegacyOtherAlarmsRedirect() {
  redirect("/alarms/others");
}
