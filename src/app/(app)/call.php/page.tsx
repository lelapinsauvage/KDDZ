import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ fid?: string; id?: string }>;
}

export default async function LegacyCallPhpRedirect({ searchParams }: PageProps) {
  const { fid, id } = await searchParams;

  if (!fid?.trim()) {
    redirect("/calls");
  }

  const target = new URLSearchParams();
  if (id?.trim()) {
    target.set("legacyChild", id.trim());
  }

  const query = target.toString();
  redirect(`/calls/${encodeURIComponent(fid.trim())}${query ? `?${query}` : ""}`);
}
