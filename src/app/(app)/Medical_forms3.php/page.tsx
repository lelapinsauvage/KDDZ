import { redirect } from "next/navigation";

export default function LegacyMedicalVisitFormsRedirect() {
  redirect("/medical/visits");
}
