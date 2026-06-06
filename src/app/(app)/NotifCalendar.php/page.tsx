import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyNotificationCalendarRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;
  const target = new URLSearchParams();
  if (id?.trim()) {
    target.set("legacyEvent", id.trim());
  }
  redirect(`/settings/events${target.size ? `?${target.toString()}` : ""}`);
}
