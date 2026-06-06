import { redirect } from "next/navigation";

export default function LegacyMedicalAlarmsRedirect() {
  redirect("/alarms/medical");
}
