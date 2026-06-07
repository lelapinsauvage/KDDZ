import { notFound, redirect } from "next/navigation";
import { getLegacyClassActionPermissions } from "@/lib/legacy-class-action-permissions";
import { resolveLegacyClassId } from "@/lib/legacy-class";
import { requireOrg } from "@/lib/require-org";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyClassFormRedirect({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const ctx = await requireOrg();
  const permissions = await getLegacyClassActionPermissions(ctx);

  if (!id?.trim()) {
    if (!permissions.canAddClass) {
      redirect("/forbidden.php");
    }
    redirect("/classes?new=1");
  }

  if (!permissions.canUpdateClass) {
    redirect("/forbidden.php");
  }

  const classId = await resolveLegacyClassId(id);
  if (!classId) {
    notFound();
  }

  redirect(`/classes?edit=${encodeURIComponent(classId)}`);
}
