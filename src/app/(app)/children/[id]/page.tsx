import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/children/${id}/dashboard`);
}
