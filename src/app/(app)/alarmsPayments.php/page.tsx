import { redirect } from "next/navigation";

export default function LegacyPaymentAlarmsRedirect() {
  redirect("/alarms/payments");
}
