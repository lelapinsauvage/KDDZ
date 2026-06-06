import { redirect } from "next/navigation";

export default function LegacyVaccinationMedicalFormsRedirect() {
  redirect("/medical/vaccinations");
}
