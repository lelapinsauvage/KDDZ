import { notFound, redirect } from "next/navigation";
import { getBranch } from "@/lib/actions/branches";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BranchCallsRedirect({ params }: PageProps) {
  const { id } = await params;
  const result = await getBranch(id);

  if (!result.success || !result.data) {
    notFound();
  }

  redirect(`/calls?branch=${encodeURIComponent(id)}`);
}
