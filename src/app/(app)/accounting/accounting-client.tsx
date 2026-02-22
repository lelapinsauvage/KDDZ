"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  X,
  Banknote,
  CreditCard,
  Building2,
  ArrowLeftRight,
  Receipt,
  CheckCircle2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { deletePayment } from "@/lib/actions/payments";
import { PaymentDialog } from "./payment-dialog";
import { QuickPaymentDialog } from "@/components/accounting/quick-payment-dialog";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";

// ── Types ──

interface PaymentRow {
  id: string;
  childId: string;
  childName: string;
  branchName: string;
  branchId: string;
  className: string;
  classId: string;
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
  createdAt: string;
}

interface SummaryData {
  totalRevenue: number;
  revenueCount: number;
  totalPending: number;
  pendingCount: number;
  totalOverdue: number;
  overdueCount: number;
  thisMonthCollections: number;
  thisMonthCount: number;
}

interface ChildOption {
  id: string;
  firstName: string;
  lastName: string;
  branch: { name: string } | null;
  class: { name: string } | null;
}

interface AccountingClientProps {
  payments: PaymentRow[];
  summary: SummaryData;
  branches: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
  childrenList: ChildOption[];
}

// ── Helpers ──

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getInitials(name: string) {
  const parts = name.split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const childAvatarColors = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return childAvatarColors[Math.abs(hash) % childAvatarColors.length];
}

const categoryLabels: Record<string, string> = {
  REGISTRATION: "Registration",
  MONTHLY: "Monthly",
  BUS: "Bus",
  XTRA_TIME: "Xtra-Time",
  FOOD: "Food",
  OTHER: "Other",
};

const categoryBadgeStyles: Record<string, string> = {
  REGISTRATION: "bg-blue-100 text-blue-700 border-blue-200",
  MONTHLY: "bg-purple-100 text-purple-700 border-purple-200",
  BUS: "bg-red-100 text-red-700 border-red-200",
  XTRA_TIME: "bg-cyan-100 text-cyan-700 border-cyan-200",
  FOOD: "bg-amber-100 text-amber-700 border-amber-200",
  OTHER: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusBadgeStyles: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  OVERDUE: "bg-red-100 text-red-700 border-red-200",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  PAID: CheckCircle2,
  PENDING: Clock,
  OVERDUE: AlertTriangle,
};

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Cheque",
  TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
};

const methodIcons: Record<string, typeof Banknote> = {
  CASH: Banknote,
  CHECK: Receipt,
  TRANSFER: ArrowLeftRight,
  CREDIT_CARD: CreditCard,
};

const monthNames = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── Component ──

export function AccountingClient({
  payments,
  summary,
  branches,
  classes,
  childrenList,
}: AccountingClientProps) {
  // Filters
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<PaymentRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter logic
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (branchFilter !== "ALL" && p.branchId !== branchFilter) return false;
      if (classFilter !== "ALL" && p.classId !== classFilter) return false;
      if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (dateFromFilter && p.date < dateFromFilter) return false;
      if (dateToFilter && p.date > dateToFilter) return false;
      return true;
    });
  }, [payments, branchFilter, classFilter, categoryFilter, statusFilter, dateFromFilter, dateToFilter]);

  const hasActiveFilters =
    branchFilter !== "ALL" ||
    classFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    dateFromFilter !== "" ||
    dateToFilter !== "";

  function clearFilters() {
    setBranchFilter("ALL");
    setClassFilter("ALL");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
    setDateFromFilter("");
    setDateToFilter("");
  }

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
    setEditPayment(row);
    setDialogOpen(true);
  }

  const paymentsExportColumns: ExportColumn[] = [
    { header: "Child Name", key: "childName" },
    { header: "Branch", key: "branchName" },
    { header: "Class", key: "className" },
    { header: "Amount", key: "amount", transform: (v) => Number(v).toFixed(2) },
    { header: "Currency", key: "currency" },
    { header: "Date", key: "date", transform: (v) => formatDate(v as string) },
    {
      header: "Category",
      key: "category",
      transform: (v) => categoryLabels[v as string] ?? String(v),
    },
    { header: "Status", key: "status" },
    {
      header: "Method",
      key: "method",
      transform: (v) => methodLabels[v as string] ?? String(v),
    },
    { header: "Receipt #", key: "reference" },
    { header: "Notes", key: "notes" },
  ];

  // ── Column definitions ──
  const columns: ColumnDef<PaymentRow>[] = [
    {
      accessorKey: "childName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Child Name
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.original.childName;
        return (
          <a
            href={`/children/${row.original.childId}/accounting`}
            className="flex items-center gap-2.5 font-medium text-foreground hover:text-primary transition-colors"
          >
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(name)}`}>
              {getInitials(name)}
            </div>
            {name}
          </a>
        );
      },
    },
    {
      accessorKey: "branchName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Branch
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-normal">
          <Building2 className="mr-1 size-3" />
          {row.original.branchName}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-foreground">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.date)}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const cat = row.original.category;
        return (
          <Badge className={categoryBadgeStyles[cat] ?? "bg-gray-100 text-gray-600"}>
            {categoryLabels[cat] ?? cat}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const Icon = statusIcons[status];
        return (
          <Badge className={`gap-1 ${statusBadgeStyles[status] ?? "bg-gray-100 text-gray-600"}`}>
            {Icon && <Icon className="size-3" />}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => {
        const method = row.original.method;
        const Icon = methodIcons[method];
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            {Icon && <Icon className="size-3.5" />}
            {methodLabels[method] ?? method}
          </span>
        );
      },
    },
    {
      accessorKey: "reference",
      header: "Receipt #",
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.reference ?? "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "month",
      header: "For Month",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.month ? monthNames[row.original.month] : "\u2014"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={`/children/${p.childId}/accounting`}>
                  <Eye className="mr-2 size-4" />
                  View Child
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(p)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleDelete(p.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Accounting"
        breadcrumbs={[{ label: "Accounting" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditPayment(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1 size-4" />
              New Payment
            </Button>
            <Button onClick={() => setQuickDialogOpen(true)}>
              <Banknote className="mr-1 size-4" />
              Record Payment
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden py-4 border-emerald-200/60">
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100">
                <DollarSign className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-700">
                  {formatCurrency(summary.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.revenueCount} payment{summary.revenueCount !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden py-4 border-amber-200/60">
            <div className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold tabular-nums text-amber-700">
                  {formatCurrency(summary.totalPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.pendingCount} payment{summary.pendingCount !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden py-4 border-red-200/60">
            <div className="absolute inset-y-0 left-0 w-1 bg-red-500" />
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overdue</p>
                <p className="text-2xl font-bold tabular-nums text-red-700">
                  {formatCurrency(summary.totalOverdue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.overdueCount} payment{summary.overdueCount !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden py-4 border-blue-200/60">
            <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Month</p>
                <p className="text-2xl font-bold tabular-nums text-blue-700">
                  {formatCurrency(summary.thisMonthCollections)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.thisMonthCount} payment{summary.thisMonthCount !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="REGISTRATION">Registration</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="BUS">Bus</SelectItem>
              <SelectItem value="XTRA_TIME">Xtra-Time</SelectItem>
              <SelectItem value="FOOD">Food</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="w-[130px] sm:w-[150px]"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              placeholder="From"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              className="w-[130px] sm:w-[150px]"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              placeholder="To"
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 size-3" />
              Clear
            </Button>
          )}

          <div className="flex-1" />

          <ExportButton
            filename="accounting"
            sheetName="Payments"
            columns={paymentsExportColumns}
            data={filteredPayments as unknown as Record<string, unknown>[]}
          />
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredPayments}
          searchKey="childName"
          searchPlaceholder="Search by child name..."
        />
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        childrenList={childrenList}
        editData={editPayment}
      />

      {/* Quick Payment Dialog */}
      <QuickPaymentDialog
        open={quickDialogOpen}
        onOpenChange={setQuickDialogOpen}
        childrenList={childrenList}
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
              className="bg-red-600 hover:bg-red-700"
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
