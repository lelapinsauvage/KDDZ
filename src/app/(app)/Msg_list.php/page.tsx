import { redirect } from "next/navigation";

export default function LegacySentMessagesRedirect() {
  redirect("/messages/sent");
}
