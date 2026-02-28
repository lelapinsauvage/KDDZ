import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FadeIn } from "@/components/ui/skeleton";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: (session.user as { role?: string }).role ?? "",
  };

  return (
    <FadeIn>
      <ProfileClient user={user} />
    </FadeIn>
  );
}
