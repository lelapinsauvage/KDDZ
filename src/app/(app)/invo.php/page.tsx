import { notFound, redirect } from "next/navigation";

import { resolveLegacyPaymentId } from "@/lib/legacy-payment";

interface PageProps {
  searchParams: Promise<{ po?: string }>;
}

export default async function LegacyInvoiceRedirect({ searchParams }: PageProps) {
  const { po } = await searchParams;

  if (!po?.trim()) {
    redirect("/accounting");
  }

  const paymentId = await resolveLegacyPaymentId(po);
  if (!paymentId) notFound();

  redirect(`/accounting/invoice/${encodeURIComponent(paymentId)}`);
}
