import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { getLegacyAccessPermissionDecision } from "@/lib/legacy-access-permissions";
import { isAdminRole } from "@/lib/require-role";
import { FadeIn } from "@/components/ui/skeleton";
import {
  confirmCurrentUserLegacyProfileUpdate,
  getCurrentLegacyProfile,
} from "@/lib/actions/profile";
import { ProfileClient } from "./profile-client";

interface PageProps {
  searchParams: Promise<{
    legacy?: string | string[];
    key?: string | string[];
  }>;
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
  const confirmKey = firstParam(params.key);
  const legacySettings = legacySource === "settings.php" || legacySource === "settings";
  const profileNotice = confirmKey
    ? await confirmCurrentUserLegacyProfileUpdate(confirmKey)
    : null;

  const dbUser = session.user.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, role: true },
      })
    : null;
  const user = {
    name: dbUser?.name ?? session.user.name ?? "",
    email: dbUser?.email ?? session.user.email ?? "",
    role: dbUser?.role ?? (session.user as { role?: string }).role ?? "",
  };
  const legacyProfile = await getCurrentLegacyProfile();

  let activeSchoolYear:
    | { id: string; label: string; startDate: string; endDate: string }
    | null = null;
  let canEditSchoolYear = false;

  if (legacySettings) {
    const ctx = await requireOrg();
    const editSchoolYearPermission =
      await getLegacyAccessPermissionDecision(ctx, "EditSchoolFromTo", "ACTION");
    canEditSchoolYear =
      isAdminRole(ctx.role) &&
      (!editSchoolYearPermission.isConfigured ||
        editSchoolYearPermission.isAllowed);

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
        legacyProfile={legacyProfile}
        profileNotice={
          profileNotice
            ? {
                type: profileNotice.success ? "success" : "error",
                message:
                  profileNotice.data?.message ??
                  profileNotice.error ??
                  "Incorrect confirmation link",
              }
            : null
        }
        legacySettings={legacySettings}
        activeSchoolYear={activeSchoolYear}
        canEditSchoolYear={canEditSchoolYear}
      />
    </FadeIn>
  );
}
