"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Trash2,
  Pencil,
  DollarSign,
  Download,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { deletePayment } from "@/lib/actions/payments";
import { PaymentDialog } from "@/app/(app)/accounting/payment-dialog";

// ── Types ──

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
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

const statusBadgeStyles: Record<string, string> = {
  PAID: "bg-[#059669]/15 text-[#059669]",
  PENDING: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
};

const monthNames = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
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
  const [editPayment, setEditPayment] = useState<PaymentRow & { childId: string; childName: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    });
    setDialogOpen(true);
  }

  function handleExport() {
    const headers = ["Date", "Amount", "Category", "Method", "Status", "For Month", "Notes", "Receipt #"];
    const rows = payments.map((p) => [
      formatDate(p.date),
      p.amount.toFixed(2),
      categoryLabels[p.category] ?? p.category,
      methodLabels[p.method] ?? p.method,
      p.status,
      p.month ? monthNames[p.month] : "",
      p.notes ?? "",
      p.reference ?? "",
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
        <span className="text-[#555]">
          {row.original.month ? monthNames[row.original.month] : "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "method",
      header: "Payment",
      cell: ({ row }) => (
        <span className="text-[#555]">{methodLabels[row.original.method] ?? row.original.method}</span>
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusBadgeStyles[row.original.status] ?? "bg-gray-100 text-gray-600"}>
          {row.original.status}
        </Badge>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(p)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDelete(p.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">${totalFees.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Fees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    ${paymentSummary.totalPaid.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    ${paymentSummary.totalPending.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    ${paymentSummary.totalOverdue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className={`text-2xl font-bold ${balance > 0 ? "text-red-500" : "text-green-600"}`}>
                    ${Math.abs(balance).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {balance > 0 ? "Outstanding" : balance < 0 ? "Overpaid" : "Settled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              Are you sure you want to delete this payment? This action cannot be undone.
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
    </>
  );
}
