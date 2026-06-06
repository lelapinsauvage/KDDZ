import { redirect } from "next/navigation";

export default function LegacyVaccinationAlarmsRedirect() {
  redirect("/alarms/vaccinations");
}
