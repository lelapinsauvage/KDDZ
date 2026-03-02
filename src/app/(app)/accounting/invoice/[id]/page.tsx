import { notFound } from "next/navigation";
import { getPayment } from "@/lib/actions/payments";
import { InvoiceClient } from "./invoice-client";

interface Props {
  params: Promise<{ id: string }>;
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
    date: payment.date.toISOString().slice(0, 10),
    dateFrom: payment.dateFrom?.toISOString().slice(0, 10) ?? null,
    dateTo: payment.dateTo?.toISOString().slice(0, 10) ?? null,
    method: payment.method,
    category: payment.category,
    status: payment.status,
    reference: payment.reference,
    notes: payment.notes,
    childName: `${payment.child.firstName} ${payment.child.lastName}`,
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
