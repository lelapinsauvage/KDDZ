import { redirect } from "next/navigation";

export default function LegacyChildrenRedirect() {
  redirect("/children");
}
