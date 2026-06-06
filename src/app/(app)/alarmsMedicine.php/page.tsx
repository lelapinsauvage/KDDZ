import { redirect } from "next/navigation";

export default function LegacyMedicineAlarmsRedirect() {
  redirect("/alarms/medicine");
}
