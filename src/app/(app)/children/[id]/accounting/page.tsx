import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getChildAccounting } from "@/lib/actions/accounting";
import { getChildPayments, getChildrenForPayment } from "@/lib/actions/payments";
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

  const [entriesRaw, paymentsResult, childrenResult] = await Promise.all([
    getChildAccounting(id),
    getChildPayments(id),
    getChildrenForPayment(),
  ]);

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    branchId: child.branchId,
  };

  // Serialize accounting entries
  const entries = entriesRaw.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    type: entry.type,
    description: entry.description ?? null,
    amount: Number(entry.amount),
  }));

  // Serialize payments
  const paymentsData =
    paymentsResult.success && paymentsResult.data
      ? (paymentsResult.data as {
          payments: Array<{
            id: string;
            amount: { toString(): string };
            currency: string;
            date: Date;
            dateFrom: Date | null;
            dateTo: Date | null;
            month: number | null;
            method: string;
            category: string;
            status: string;
            reference: string | null;
            notes: string | null;
            receiptFilename: string | null;
            receiptFileUrl: string | null;
            createdBy: { name: string | null } | null;
          }>;
          summary: {
            totalPaid: number;
            totalPending: number;
            totalOverdue: number;
            byCategory: Record<string, number>;
          };
        })
      : { payments: [], summary: { totalPaid: 0, totalPending: 0, totalOverdue: 0, byCategory: {} } };

  const payments = paymentsData.payments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    currency: p.currency,
    date: p.date.toISOString().split("T")[0],
    dateFrom: p.dateFrom?.toISOString().split("T")[0] ?? null,
    dateTo: p.dateTo?.toISOString().split("T")[0] ?? null,
    month: p.month,
    method: p.method,
    category: p.category,
    status: p.status,
    reference: p.reference,
    notes: p.notes,
    receiptFilename: p.receiptFilename,
    receiptFileUrl: p.receiptFileUrl,
    createdBy: p.createdBy?.name ?? null,
  }));

  const children =
    childrenResult.success && childrenResult.data
      ? (childrenResult.data as Array<{
          id: string;
          firstName: string;
          lastName: string;
          branchId: string;
          branch: { name: string } | null;
          class: { name: string } | null;
        }>)
      : [];

  return (
    <AccountingClient
      child={childData}
      entries={entries}
      payments={payments}
      paymentSummary={paymentsData.summary}
      childrenList={children}
    />
  );
}
