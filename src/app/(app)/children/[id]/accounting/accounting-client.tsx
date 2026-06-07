"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  Pencil,
  DollarSign,
  Download,
  AlertTriangle,
  Clock,
  Paperclip,
  Printer,
} from "lucide-react";
import { deletePayment } from "@/lib/actions/payments";
import { PaymentDialog } from "@/app/(app)/accounting/payment-dialog";
import {
  AttachmentPreviewDialog,
  type AttachmentPreviewItem,
} from "@/components/shared/attachment-preview-dialog";

// ── Types ──

interface ChildData {
  id: string;
  childNumber: string | null;
  firstName: string;
  lastName: string;
  branchId: string;
}

interface AccountingEntry {
  id: string;
  date: string;
  type: string;
  description: string | null;
  amount: number;
}

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  date: string;
  dateFrom: string | null;
  dateTo: string | null;
  month: number | null;
  method: string;
  category: string;
  status: string;
  reference: string | null;
  notes: string | null;
  legacyImageFilename: string | null;
  receiptFilename: string | null;
  receiptFileUrl: string | null;
  methodLabel: string;
  childNumber: string | null;
  firstName: string;
  lastName: string;
  createdBy: string | null;
}

interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  byCategory: Record<string, number>;
}

interface ChildOption {
  id: string;
  firstName: string;
  lastName: string;
  branchId: string;
  branch: { name: string } | null;
  class: { name: string } | null;
}

interface Props {
  child: ChildData;
  entries: AccountingEntry[];
  payments: PaymentRow[];
  paymentSummary: PaymentSummary;
  childrenList: ChildOption[];
}

// ── Helpers ──

const typeConfig: Record<string, { color: string; sign: string }> = {
  FEE: { color: "bg-blue-100 text-blue-700", sign: "+" },
  PAYMENT: { color: "bg-green-100 text-green-700", sign: "\u2212" },
  DISCOUNT: { color: "bg-orange-100 text-orange-700", sign: "\u2212" },
  ADJUSTMENT: { color: "bg-gray-100 text-gray-700", sign: "+" },
};

const categoryLabels: Record<string, string> = {
  REGISTRATION: "Registration Fees",
  MONTHLY: "Monthly Fees",
  BUS: "Bus Fees",
  XTRA_TIME: "Xtra-Time Fees",
  FOOD: "Food Fees",
  OTHER: "Other Fees",
};

const categoryColors: Record<string, string> = {
  REGISTRATION: "bg-blue-100 text-blue-700",
  MONTHLY: "bg-purple-100 text-purple-700",
  BUS: "bg-red-100 text-red-700",
  XTRA_TIME: "bg-cyan-100 text-cyan-700",
  FOOD: "bg-amber-100 text-amber-700",
  OTHER: "bg-gray-100 text-gray-600",
};

const categoryCardColors: Record<string, string> = {
  REGISTRATION: "border-l-4 border-l-blue-500",
  MONTHLY: "border-l-4 border-l-purple-500",
  BUS: "border-l-4 border-l-red-500",
  XTRA_TIME: "border-l-4 border-l-cyan-500",
  FOOD: "border-l-4 border-l-amber-500",
  OTHER: "border-l-4 border-l-gray-400",
};

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Cheque",
  TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
};

const monthNames = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function display(value: string | null | undefined) {
  return value && value.trim() ? value : "\u2014";
}

function paymentReceiptRaw(payment: PaymentRow) {
  return (
    payment.receiptFileUrl?.trim() ||
    payment.receiptFilename?.trim() ||
    payment.legacyImageFilename?.trim() ||
    null
  );
}

function paymentReceiptHref(payment: PaymentRow) {
  const raw = paymentReceiptRaw(payment);
  if (!raw) return null;
  if (/^(https?:|blob:|data:)/i.test(raw) || raw.startsWith("/")) return raw;
  if (raw.includes("/")) return `/${raw.replace(/^\/+/, "")}`;
  return `/images/AccDocs/${raw}`;
}

function paymentReceiptFilename(payment: PaymentRow) {
  const raw = paymentReceiptRaw(payment);
  if (!raw) return "Payment attachment";
  return raw.split("?")[0].split("/").filter(Boolean).at(-1) ?? raw;
}

function paymentPreviewItems(payment: PaymentRow): AttachmentPreviewItem[] {
  const href = paymentReceiptHref(payment);
  if (!href) return [];
  return [
    {
      id: `payment-attachment-${payment.id}`,
      filename: paymentReceiptFilename(payment),
      href,
    },
  ];
}

// ── Component ──

export function AccountingClient({
  child,
  entries,
  payments,
  paymentSummary,
  childrenList,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<
    (PaymentRow & { childId: string; childName: string; branchId: string }) | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<{
    title: string;
    attachments: AttachmentPreviewItem[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Accounting entry totals
  const totalFees = entries
    .filter((e) => e.type === "FEE" || e.type === "ADJUSTMENT")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPaymentsEntry = entries
    .filter((e) => e.type === "PAYMENT")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalDiscounts = entries
    .filter((e) => e.type === "DISCOUNT")
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalFees - totalPaymentsEntry - totalDiscounts;

  // Group payments by category
  const paymentsByCategory = useMemo(() => {
    const groups: Record<string, PaymentRow[]> = {};
    for (const p of payments) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    return groups;
  }, [payments]);

  const categories = ["REGISTRATION", "MONTHLY", "BUS", "XTRA_TIME", "OTHER"];

  function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!deletingId) return;
    startTransition(async () => {
      await deletePayment(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    });
  }

  function handleEdit(row: PaymentRow) {
    setEditPayment({
      ...row,
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      branchId: child.branchId,
    });
    setDialogOpen(true);
  }

  function handleExport() {
    const headers = ["Date", "Child#", "Fees Type", "Amount $", "For", "Payment", "From", "To", "Notes"];
    const rows = payments.map((p) => [
      formatDate(p.date),
      p.childNumber ?? "",
      categoryLabels[p.category] ?? p.category,
      p.amount.toFixed(2),
      p.month ? monthNames[p.month] : "",
      p.methodLabel || methodLabels[p.method] || p.method,
      p.dateFrom ? formatDate(p.dateFrom) : "",
      p.dateTo ? formatDate(p.dateTo) : "",
      p.notes ?? "",
    ]);

    const csv = [
      `Payment Statement - ${child.firstName} ${child.lastName}`,
      "",
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${child.firstName}_${child.lastName}_accounting.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Payment table columns
  const paymentColumns: ColumnDef<PaymentRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="font-medium">{formatDate(row.original.date)}</span>,
    },
    {
      accessorKey: "childNumber",
      header: "Child #",
      cell: ({ row }) => <span className="text-[#555]">{display(row.original.childNumber)}</span>,
    },
    {
      accessorKey: "firstName",
      header: "First Name",
      cell: ({ row }) => <span className="text-[#555]">{row.original.firstName}</span>,
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
      cell: ({ row }) => <span className="text-[#555]">{row.original.lastName}</span>,
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount ($)</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${row.original.amount.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "month",
      header: "For",
      cell: ({ row }) => (
        <span className="text-[#555]">{row.original.month ? monthNames[row.original.month] : "\u2014"}</span>
      ),
    },
    {
      accessorKey: "method",
      header: "Payment",
      cell: ({ row }) => (
        <span className="text-[#555]">{row.original.methodLabel || methodLabels[row.original.method] || row.original.method}</span>
      ),
    },
    {
      accessorKey: "dateFrom",
      header: "From",
      cell: ({ row }) => (
        <span className="text-[#555]">{row.original.dateFrom ? formatDate(row.original.dateFrom) : "\u2014"}</span>
      ),
    },
    {
      accessorKey: "dateTo",
      header: "To",
      cell: ({ row }) => (
        <span className="text-[#555]">{row.original.dateTo ? formatDate(row.original.dateTo) : "\u2014"}</span>
      ),
    },
    {
      accessorKey: "notes",
      header: "Remarks",
      cell: ({ row }) => (
        <span className="text-[#555] text-sm">{row.original.notes ?? "\u2014"}</span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-0.5">
            <Button asChild variant="ghost" size="sm" className="size-8 p-0">
              <a href={`/accounting/invoice/${p.id}`} target="_blank" rel="noreferrer">
                <Printer className="size-4 text-muted-foreground" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => handleEdit(p)}>
              <Pencil className="size-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: "attachment",
      header: "Attachment",
      cell: ({ row }) => {
        const attachments = paymentPreviewItems(row.original);
        return attachments.length ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-primary"
            onClick={() =>
              setPreviewTarget({
                title: `Payment attachment - ${formatDate(row.original.date)}`,
                attachments,
              })
            }
          >
            <Paperclip className="size-3.5" />
            View Attachment
          </Button>
        ) : (
          <span className="text-muted-foreground">\u2014</span>
        );
      },
      enableSorting: false,
    },
  ];

  // Accounting entry columns
  const entryColumns: ColumnDef<AccountingEntry>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="font-medium">{row.original.date}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const cfg = typeConfig[row.original.type] ?? { color: "bg-gray-100 text-gray-700" };
        return <Badge className={cfg.color}>{row.original.type}</Badge>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description ?? "\u2014",
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const cfg = typeConfig[row.original.type] ?? { sign: "" };
        return (
          <div className="text-right font-medium">
            {cfg.sign}${row.original.amount.toFixed(2)}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Accounting`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${child.id}/dashboard` },
          { label: "Accounting" },
        ]}
      />

      <div className="space-y-4 p-4 md:space-y-6 md:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="group relative overflow-hidden rounded bg-[#327ad5] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">${totalFees.toFixed(2)}</p>
                <p className="text-xs text-white/80">Total Fees</p>
              </div>
              <DollarSign className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="group relative overflow-hidden rounded bg-[#008200] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">${paymentSummary.totalPaid.toFixed(2)}</p>
                <p className="text-xs text-white/80">Total Paid</p>
              </div>
              <DollarSign className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="group relative overflow-hidden rounded bg-[#c29d0b] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">${paymentSummary.totalPending.toFixed(2)}</p>
                <p className="text-xs text-white/80">Pending</p>
              </div>
              <Clock className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="group relative overflow-hidden rounded bg-[#d64635] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">${paymentSummary.totalOverdue.toFixed(2)}</p>
                <p className="text-xs text-white/80">Overdue</p>
              </div>
              <AlertTriangle className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="group relative overflow-hidden rounded bg-[#8e44ad] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">${Math.abs(balance).toFixed(2)}</p>
                <p className="text-xs text-white/80">
                  {balance > 0 ? "Outstanding" : balance < 0 ? "Overpaid" : "Settled"}
                </p>
              </div>
              <DollarSign className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setEditPayment(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add New Payment
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-1 h-4 w-4" />
            Export Statement
          </Button>
        </div>

        {/* Payment Tables by Category — matching old PHP layout */}
        {categories.map((cat) => {
          const catPayments = paymentsByCategory[cat] ?? [];
          const catTotal = catPayments.reduce((sum, p) => sum + p.amount, 0);
          if (catPayments.length === 0) return null;

          return (
            <Card key={cat} className={categoryCardColors[cat]}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{categoryLabels[cat]}</span>
                  <Badge className={categoryColors[cat]}>
                    {catPayments.length} payment{catPayments.length !== 1 ? "s" : ""} — ${catTotal.toFixed(2)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={paymentColumns}
                  data={catPayments}
                  searchKey="notes"
                  searchPlaceholder="Search payments..."
                />
              </CardContent>
            </Card>
          );
        })}

        {/* Show message if no payments at all */}
        {payments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No payments recorded yet. Click &quot;Add New Payment&quot; to get started.
            </CardContent>
          </Card>
        )}

        {/* Accounting Entries (ledger) */}
        {entries.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Accounting Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={entryColumns}
                data={entries}
                searchKey="description"
                searchPlaceholder="Search entries..."
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        childrenList={childrenList}
        editData={editPayment}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? It will be hidden from accounting totals, matching the legacy delete behavior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AttachmentPreviewDialog
        open={Boolean(previewTarget)}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
        title={previewTarget?.title ?? "Payment attachment"}
        attachments={previewTarget?.attachments ?? []}
      />
    </>
  );
}
