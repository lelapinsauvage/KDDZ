import { redirect } from "next/navigation";

export default function LegacyUserProfilesRedirectPage() {
  redirect("/settings/legacy-users/profile-fields");
}
