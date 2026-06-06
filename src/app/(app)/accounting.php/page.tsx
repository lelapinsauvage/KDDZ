import { redirect } from "next/navigation";

export default function LegacyAccountingRedirect() {
  redirect("/accounting");
}
