import { notFound, redirect } from "next/navigation";
import { resolveLegacyMessageThreadMessageId } from "@/lib/legacy-message";
import { resolveLegacyParentUserId } from "@/lib/legacy-parent-user";

interface PageProps {
  searchParams: Promise<{ id?: string; thread?: string }>;
}

export default async function LegacyDirectMessagePortalRedirect({
  searchParams,
}: PageProps) {
  const { id, thread } = await searchParams;

  if (thread?.trim()) {
    const messageId = await resolveLegacyMessageThreadMessageId(thread);
    if (!messageId) {
      redirect("/forbidden.php");
    }
    redirect(`/messages/${encodeURIComponent(messageId)}`);
  }

  const target = new URLSearchParams();
  if (id?.trim()) {
    const parentUserId = await resolveLegacyParentUserId(null, id);
    if (!parentUserId) {
      notFound();
    }
    target.set("recipientId", parentUserId);
  }

  redirect(`/messages/compose/direct${target.size ? `?${target.toString()}` : ""}`);
}
