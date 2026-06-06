import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { isAdminRole } from "@/lib/require-role";
import { FadeIn } from "@/components/ui/skeleton";
import { ProfileClient } from "./profile-client";

interface PageProps {
  searchParams: Promise<{ legacy?: string | string[] }>;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function dateOnly(value: Date) {
  return value.toISOString().split("T")[0];
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  const params = await searchParams;
  const legacySource = firstParam(params.legacy);
  const legacySettings = legacySource === "settings.php" || legacySource === "settings";

  const user = {
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: (session.user as { role?: string }).role ?? "",
  };

  let activeSchoolYear:
    | { id: string; label: string; startDate: string; endDate: string }
    | null = null;
  let canEditSchoolYear = false;

  if (legacySettings) {
    const ctx = await requireOrg();
    canEditSchoolYear = isAdminRole(ctx.role);

    const year = await db.schoolYear.findFirst({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        label: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: "desc" },
    });

    if (year) {
      activeSchoolYear = {
        id: year.id,
        label: year.label,
        startDate: dateOnly(year.startDate),
        endDate: dateOnly(year.endDate),
      };
    }
  }

  return (
    <FadeIn>
      <ProfileClient
        user={user}
        legacySettings={legacySettings}
        activeSchoolYear={activeSchoolYear}
        canEditSchoolYear={canEditSchoolYear}
      />
    </FadeIn>
  );
}
