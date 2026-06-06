import { notFound, redirect } from "next/navigation";
import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyParentUserId } from "@/lib/legacy-parent-user";

interface PageProps {
  searchParams: Promise<{ fid?: string; id?: string }>;
}

export default async function LegacyParentUserRedirect({
  searchParams,
}: PageProps) {
  const { fid, id } = await searchParams;

  if (!id?.trim() && !fid?.trim()) {
    redirect("/settings/parent-users");
  }

  const parentUserId = await resolveLegacyParentUserId(fid, id);
  if (parentUserId) {
    redirect(`/settings/parent-users/${encodeURIComponent(parentUserId)}`);
  }

  if (id?.trim()) {
    const childId = await resolveLegacyChildId(id);
    if (childId) {
      redirect(`/settings/parent-users?createChildId=${encodeURIComponent(childId)}`);
    }
  }

  notFound();
}
