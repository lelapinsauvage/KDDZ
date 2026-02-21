import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { CallsClient } from "./calls-client";

// Note: There is no CallLog model in the Prisma schema yet.
// When a CallLog model is added, replace the empty array below
// with a direct db query: db.callLog.findMany({ where: { childId: id } })

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildCallsPage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
  };

  // No CallLog model exists in the schema — return empty array
  // TODO: Wire to db.callLog.findMany({ where: { childId: id } }) once model is added
  const calls: Array<{
    id: string;
    date: string;
    time: string;
    direction: string;
    contact: string;
    phone: string;
    reason: string;
    duration: string;
    notes: string;
  }> = [];

  return (
    <CallsClient
      child={childData}
      calls={calls}
    />
  );
}
