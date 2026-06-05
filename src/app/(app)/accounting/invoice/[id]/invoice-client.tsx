"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { format } from "date-fns";

interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  receiptNumber: string;
  date: string;
  dateFrom: string | null;
  dateTo: string | null;
  month: number | null;
  method: string;
  category: string;
  status: string;
  reference: string | null;
  notes: string | null;
  childNumber: string | null;
  childName: string;
  childLastName: string;
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
  CHECK: "Cheque",
  TRANSFER: "by Bank Transfere",
  CREDIT_CARD: "by Credit Card",
};

const CATEGORY_LABELS: Record<string, string> = {
  REGISTRATION: "Registration Fees",
  MONTHLY: "Monthly Fees",
  BUS: "Bus Fees",
  XTRA_TIME: "Xtra-time Fees",
  FOOD: "Food Fees",
  OTHER: "Other Fees",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
};

function formatCurrency(amount: number, currency: string) {
  if (currency === "LBP") {
    return `LL ${amount.toLocaleString("en-US")}`;
  }
  return `US ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLegacyDate(value: string | null) {
  if (!value) return "-";
  return format(new Date(`${value}T00:00:00`), "dd/MM/yyyy");
}

function monthName(month: number | null) {
  if (!month || month < 1 || month > 12) return "-";
  return format(new Date(1990, month - 1, 1), "MMMM");
}

function currencyName(currency: string) {
  return currency === "LBP" ? "LEBANESE POUND" : "US DOLLAR";
}

function numberToWords(value: number): string {
  const dictionary: Record<number, string> = {
    0: "Zero",
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Nine",
    10: "Ten",
    11: "Eleven",
    12: "Twelve",
    13: "Thirteen",
    14: "Fourteen",
    15: "Fifteen",
    16: "Sixteen",
    17: "Seventeen",
    18: "Eighteen",
    19: "Nineteen",
    20: "Twenty",
    30: "Thirty",
    40: "Fourty",
    50: "Fifty",
    60: "Sixty",
    70: "Seventy",
    80: "Eighty",
    90: "Ninety",
  };

  if (!Number.isFinite(value)) return "";
  if (value < 0) return `negative ${numberToWords(Math.abs(value))}`;

  const [wholeRaw, fractionRaw] = value.toString().split(".");
  const whole = Number(wholeRaw);

  function wholeToWords(number: number): string {
    if (number < 21) return dictionary[number];
    if (number < 100) {
      const tens = Math.floor(number / 10) * 10;
      const units = number % 10;
      return units ? `${dictionary[tens]}-${dictionary[units]}` : dictionary[tens];
    }
    if (number < 1000) {
      const hundreds = Math.floor(number / 100);
      const remainder = number % 100;
      return remainder
        ? `${dictionary[hundreds]} Hundred and ${wholeToWords(remainder)}`
        : `${dictionary[hundreds]} Hundred`;
    }

    const units = [
      { value: 1_000_000_000, label: "Billion" },
      { value: 1_000_000, label: "Million" },
      { value: 1_000, label: "Thousand" },
    ];

    for (const unit of units) {
      if (number >= unit.value) {
        const leading = Math.floor(number / unit.value);
        const remainder = number % unit.value;
        return remainder
          ? `${wholeToWords(leading)} ${unit.label}, ${wholeToWords(remainder)}`
          : `${wholeToWords(leading)} ${unit.label}`;
      }
    }

    return "";
  }

  let words = wholeToWords(whole);
  if (fractionRaw && Number(fractionRaw) > 0) {
    words += ` point ${fractionRaw
      .split("")
      .map((digit) => dictionary[Number(digit)])
      .join(" ")}`;
  }
  return words;
}

export function InvoiceClient({ invoice }: { invoice: InvoiceData }) {
  const receiptNo = invoice.receiptNumber;
  const methodLabel = METHOD_LABELS[invoice.method] ?? invoice.method;
  const categoryLabel = CATEGORY_LABELS[invoice.category] ?? invoice.category;

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
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => window.print()}
            >
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          }
        />
      </div>

      <div className="mx-auto max-w-3xl bg-background p-6 print:max-w-none print:bg-white print:p-0 print:text-black">
        <div className="border-b border-transparent pb-4">
          <div className="grid grid-cols-[1fr_1.5fr_1fr] items-start gap-4">
            <div className="text-center">
              <div className="mx-auto flex size-24 items-center justify-center rounded-full border text-lg font-bold print:border-gray-400">
                {invoice.branchName.slice(0, 2).toUpperCase()}
              </div>
              <p className="mt-2 text-sm font-semibold">{invoice.branchName}</p>
              {(invoice.branchPhone || invoice.branchEmail) && (
                <p className="text-xs text-muted-foreground print:text-gray-600">
                  {[invoice.branchPhone, invoice.branchEmail].filter(Boolean).join(" | ")}
                </p>
              )}
            </div>

            <div className="pt-6 text-center">
              <h1 className="text-2xl font-bold">Receipt Voucher</h1>
              <p className="mt-4 text-base font-semibold">
                Receipt No. {receiptNo}
              </p>
            </div>

            <div />
          </div>

          <hr className="mt-4" />

          <ul className="mt-5 space-y-1 text-sm">
            <li>Child No. : {invoice.childNumber ?? "-"}</li>
            <li>Invoice Date : {formatLegacyDate(invoice.date)}</li>
            <li>
              <b>Child Name</b> : {invoice.childName}
            </li>
            <li>
              <b>Status</b> : {STATUS_LABELS[invoice.status] ?? invoice.status}
            </li>
          </ul>
        </div>

        <div className="mt-12 space-y-5 text-base leading-8">
          <p>
            <b>
              We have received {methodLabel} from Mr/Mrs. {invoice.childLastName} on{" "}
              {formatLegacyDate(invoice.date)}
              <br />
              The amount of {formatCurrency(invoice.amount, invoice.currency)} (
              {numberToWords(invoice.amount)} {currencyName(invoice.currency)}).
            </b>
          </p>

          <p>
            <b>{categoryLabel}</b>
          </p>

          <p>
            <b>Month</b>: {monthName(invoice.month)}
            <br />
            <b>Valid From</b>: {formatLegacyDate(invoice.dateFrom)} <b>To</b>:{" "}
            {formatLegacyDate(invoice.dateTo)}
          </p>

          {invoice.notes && (
            <p>
              <b>Remarks</b>: {invoice.notes}
            </p>
          )}

          <div className="pt-8">
            <p>
              <b>Signature</b> :
            </p>
            <p className="pt-8 tracking-[0.2em]">.......................</p>
          </div>
        </div>

        <div className="mt-10 flex justify-end print:hidden">
          <Button size="lg" onClick={() => window.print()}>
            Print
            <Printer className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
