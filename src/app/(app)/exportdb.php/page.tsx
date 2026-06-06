import { redirect } from "next/navigation";

export default function LegacyExportDatabaseRedirect() {
  redirect("/settings/export");
}
