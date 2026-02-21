import { getAccountingSummary } from "@/lib/actions/accounting";
import { db } from "@/lib/db";
import { AccountingClient } from "./accounting-client";

export default async function AccountingManagementPage() {
  const [summary, entries] = await Promise.all([
    getAccountingSummary(),
    db.accountingEntry.findMany({
      include: {
        child: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  // Serialize for client
  const serializedEntries = entries.map((entry) => ({
    id: entry.id,
    childId: entry.childId,
    childName: `${entry.child.firstName} ${entry.child.lastName}`,
    type: entry.type as "FEE" | "PAYMENT" | "DISCOUNT" | "ADJUSTMENT",
    description: entry.description ?? "",
    amount: Number(entry.amount),
    date: entry.date.toISOString().split("T")[0],
  }));

  return (
    <AccountingClient
      entries={serializedEntries}
      summary={summary}
    />
  );
}
