import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BranchPage({ params }: Props) {
  const { id } = await params;
  redirect(`/branches/${id}/dashboard`);
}
