import { redirect } from "next/navigation";

export default function LegacyDraftChildrenRedirect() {
  redirect("/children/drafts");
}
