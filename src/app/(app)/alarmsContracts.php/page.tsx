import { redirect } from "next/navigation";

export default function LegacyContractAlarmsRedirect() {
  redirect("/alarms/contracts");
}
