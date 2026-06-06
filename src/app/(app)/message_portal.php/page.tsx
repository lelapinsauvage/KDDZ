import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyMessagePortalRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;
  const target = new URLSearchParams();
  if (id?.trim()) {
    target.set("legacyRecipient", id.trim());
  }
  redirect(`/messages/compose${target.size ? `?${target.toString()}` : ""}`);
}
