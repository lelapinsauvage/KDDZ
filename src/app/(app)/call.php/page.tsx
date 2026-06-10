import { redirect } from "next/navigation";
import StandaloneCallPage from "../calls/[id]/page";

interface PageProps {
  searchParams: Promise<{ fid?: string; id?: string }>;
}

export default async function LegacyCallPhpRedirect({ searchParams }: PageProps) {
  const { fid, id } = await searchParams;

  if (!fid?.trim()) {
    redirect("/calls");
  }

  return (
    <StandaloneCallPage
      params={Promise.resolve({ id: fid.trim() })}
      searchParams={Promise.resolve({ legacyChild: id?.trim() })}
    />
  );
}
