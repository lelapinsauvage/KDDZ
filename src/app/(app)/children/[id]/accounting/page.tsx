import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getChildAccounting } from "@/lib/actions/accounting";
import { getChildPayments, getChildrenForPayment } from "@/lib/actions/payments";
import { AccountingClient } from "./accounting-client";

interface Props {
  params: Promise<{ id: string }>;
}

function legacyString(data: unknown, key: string) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const value = (data as Record<string, unknown>)[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function legacyPaymentMethodLabel(method: string, legacyData: unknown) {
  const raw = (legacyString(legacyData, "type") ?? method).trim().toLowerCase();
  if (raw === "cash") return "Cash";
  if (raw === "check" || raw === "cheque") return "Cheque";
  if (raw === "creditcard" || raw === "credit_card" || raw === "credit card") return "Credit Card";
  if (raw === "bank") return "by Bank Transfere";

  const modernLabels: Record<string, string> = {
    CASH: "Cash",
    CHECK: "Cheque",
    TRANSFER: "Bank Transfer",
    CREDIT_CARD: "Credit Card",
  };
  return modernLabels[method] ?? method;
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
    childNumber: child.childNumber ?? null,
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
            legacyImageFilename: string | null;
            receiptFilename: string | null;
            receiptFileUrl: string | null;
            legacyData: unknown;
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
    legacyImageFilename: p.legacyImageFilename,
    receiptFilename: p.receiptFilename,
    receiptFileUrl: p.receiptFileUrl,
    methodLabel: legacyPaymentMethodLabel(p.method, p.legacyData),
    childNumber: childData.childNumber,
    firstName: childData.firstName,
    lastName: childData.lastName,
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
