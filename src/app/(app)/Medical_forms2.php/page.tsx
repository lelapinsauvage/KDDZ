import { redirect } from "next/navigation";

export default function LegacySufferingMedicalFormsRedirect() {
  redirect("/medical/conditions");
}
