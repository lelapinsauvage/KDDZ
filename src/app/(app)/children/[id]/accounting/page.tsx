import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getChildAccounting } from "@/lib/actions/accounting";
import { AccountingClient } from "./accounting-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildAccountingPage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  const entriesRaw = await getChildAccounting(id);

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
  };

  // Serialize dates and convert Decimal amounts to numbers
  const entries = entriesRaw.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    type: entry.type,
    description: entry.description ?? null,
    amount: Number(entry.amount),
  }));

  return (
    <AccountingClient
      child={childData}
      entries={entries}
    />
  );
}
