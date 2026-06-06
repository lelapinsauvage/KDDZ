import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FadeIn } from "@/components/ui/skeleton";
import { ProfileClient } from "./profile-client";

interface PageProps {
  searchParams: Promise<{ legacy?: string | string[] }>;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  const params = await searchParams;
  const legacySource = firstParam(params.legacy);

  const user = {
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: (session.user as { role?: string }).role ?? "",
  };

  return (
    <FadeIn>
      <ProfileClient
        user={user}
        legacySettings={legacySource === "settings.php" || legacySource === "settings"}
      />
    </FadeIn>
  );
}
