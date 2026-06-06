import { redirect } from "next/navigation";

export default function LegacyAssessmentAlarmsRedirect() {
  redirect("/alarms/assessments");
}
