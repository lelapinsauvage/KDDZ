import { notFound } from "next/navigation";
import { getPayment } from "@/lib/actions/payments";
import { InvoiceClient } from "./invoice-client";

interface Props {
  params: Promise<{ id: string }>;
}

function legacyValue(
  legacyData: unknown,
  key: string,
): string | null {
  if (!legacyData || typeof legacyData !== "object" || Array.isArray(legacyData)) {
    return null;
  }

  const value = (legacyData as Record<string, unknown>)[key];
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;

  const payment = await getPayment(id);
  if (!payment) {
    notFound();
  }

  const data = {
    id: payment.id,
    amount: Number(payment.amount),
    currency: payment.currency,
    receiptNumber:
      legacyValue(payment.legacyData, "pay_num") ??
      payment.reference ??
      `REC-${payment.id.slice(0, 8).toUpperCase()}`,
    date: payment.date.toISOString().slice(0, 10),
    dateFrom: payment.dateFrom?.toISOString().slice(0, 10) ?? null,
    dateTo: payment.dateTo?.toISOString().slice(0, 10) ?? null,
    month: payment.month,
    method: payment.method,
    category: payment.category,
    status: payment.status,
    reference: payment.reference,
    notes: payment.notes,
    childNumber: payment.child.childNumber,
    childName: `${payment.child.firstName} ${payment.child.lastName}`,
    childLastName: payment.child.lastName,
    className: payment.child.class?.name ?? null,
    branchName: payment.child.branch.name,
    branchAddress: payment.child.branch.address,
    branchPhone: payment.child.branch.phone,
    branchEmail: payment.child.branch.email,
    createdBy: payment.createdBy?.name ?? null,
    createdAt: payment.createdAt.toISOString(),
  };

  return <InvoiceClient invoice={data} />;
}
