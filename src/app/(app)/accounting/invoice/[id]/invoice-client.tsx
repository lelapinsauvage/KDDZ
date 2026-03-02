"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { format } from "date-fns";

interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  date: string;
  dateFrom: string | null;
  dateTo: string | null;
  method: string;
  category: string;
  status: string;
  reference: string | null;
  notes: string | null;
  childName: string;
  className: string | null;
  branchName: string;
  branchAddress: string | null;
  branchPhone: string | null;
  branchEmail: string | null;
  createdBy: string | null;
  createdAt: string;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Check",
  TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
};

const CATEGORY_LABELS: Record<string, string> = {
  REGISTRATION: "Registration",
  MONTHLY: "Monthly Tuition",
  BUS: "Bus Service",
  XTRA_TIME: "Extra Time",
  FOOD: "Food",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
};

function formatCurrency(amount: number, currency: string) {
  if (currency === "LBP") {
    return `${amount.toLocaleString("en-US")} LBP`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function receiptNumber(id: string) {
  return `REC-${id.slice(0, 8).toUpperCase()}`;
}

export function InvoiceClient({ invoice }: { invoice: InvoiceData }) {
  const receiptNo = receiptNumber(invoice.id);

  return (
    <>
      {/* Screen-only header */}
      <div className="print:hidden">
        <PageHeader
          title={`Receipt ${receiptNo}`}
          breadcrumbs={[
            { label: "Accounting", href: "/accounting" },
            { label: `Receipt ${receiptNo}` },
          ]}
          actions={
            <Button
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => window.print()}
            >
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          }
        />
      </div>

      {/* Printable content */}
      <div className="mx-auto max-w-2xl p-6 print:max-w-none print:p-0 print:text-black">
        {/* Header / Nursery branding */}
        <div className="mb-8 text-center" style={{ breakInside: "avoid" }}>
          <h1 className="text-2xl font-bold text-foreground print:text-black">
            {invoice.branchName}
          </h1>
          {invoice.branchAddress && (
            <p className="text-sm text-muted-foreground print:text-gray-600">
              {invoice.branchAddress}
            </p>
          )}
          {(invoice.branchPhone || invoice.branchEmail) && (
            <p className="text-sm text-muted-foreground print:text-gray-600">
              {[invoice.branchPhone, invoice.branchEmail]
                .filter(Boolean)
                .join(" | ")}
            </p>
          )}
          <div className="mx-auto mt-4 h-px w-24 bg-border print:bg-gray-300" />
          <p className="mt-3 text-lg font-semibold text-foreground print:text-black">
            Payment Receipt
          </p>
        </div>

        {/* Receipt meta */}
        <div
          className="mb-6 flex justify-between rounded-lg border border-border p-4 text-sm print:rounded-none print:border-gray-300"
          style={{ breakInside: "avoid" }}
        >
          <div className="space-y-1">
            <div>
              <span className="font-semibold">Receipt No:</span> {receiptNo}
            </div>
            <div>
              <span className="font-semibold">Date:</span>{" "}
              {format(new Date(invoice.date), "MMMM d, yyyy")}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div>
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={
                  invoice.status === "PAID"
                    ? "font-bold text-green-700 print:text-black"
                    : invoice.status === "OVERDUE"
                      ? "font-bold text-red-600 print:text-black"
                      : "font-bold text-yellow-600 print:text-black"
                }
              >
                {STATUS_LABELS[invoice.status] ?? invoice.status}
              </span>
            </div>
            {invoice.reference && (
              <div>
                <span className="font-semibold">Ref:</span> {invoice.reference}
              </div>
            )}
          </div>
        </div>

        {/* Bill To */}
        <div
          className="mb-6 rounded-lg border border-border p-4 print:rounded-none print:border-gray-300"
          style={{ breakInside: "avoid" }}
        >
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
            Bill To
          </h2>
          <p className="text-base font-bold">{invoice.childName}</p>
          {invoice.className && (
            <p className="text-sm text-muted-foreground print:text-gray-600">
              Class: {invoice.className}
            </p>
          )}
        </div>

        {/* Payment details table */}
        <div className="mb-6" style={{ breakInside: "avoid" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground print:border-gray-300 print:text-gray-500">
                <th className="pb-2 pr-4">Description</th>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 print:border-gray-200">
                <td className="py-3 pr-4">
                  <div className="font-medium">
                    {CATEGORY_LABELS[invoice.category] ?? invoice.category}
                  </div>
                  {(invoice.dateFrom || invoice.dateTo) && (
                    <div className="text-xs text-muted-foreground print:text-gray-500">
                      Period:{" "}
                      {invoice.dateFrom
                        ? format(new Date(invoice.dateFrom), "MMM d, yyyy")
                        : "—"}{" "}
                      to{" "}
                      {invoice.dateTo
                        ? format(new Date(invoice.dateTo), "MMM d, yyyy")
                        : "—"}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {METHOD_LABELS[invoice.method] ?? invoice.method}
                </td>
                <td className="py-3 text-right font-medium">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-3 text-right font-bold">
                  Total
                </td>
                <td className="pt-3 text-right text-lg font-bold">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div
            className="mb-6 rounded-lg border border-border p-4 print:rounded-none print:border-gray-300"
            style={{ breakInside: "avoid" }}
          >
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
              Notes
            </h2>
            <p className="text-sm">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground print:border-gray-300 print:text-gray-500"
          style={{ breakInside: "avoid" }}
        >
          {invoice.createdBy && (
            <p className="mb-1">Recorded by: {invoice.createdBy}</p>
          )}
          <p>
            Generated on{" "}
            {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>
    </>
  );
}
