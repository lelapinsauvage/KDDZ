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
      cell: ({ row }) => (
        <a
          href={`/children/${row.original.childId}/accounting`}
          className="font-medium text-[#333] hover:text-[#1caf9a] hover:underline"
        >
          {row.original.childName}
        </a>
      ),
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
      cell: ({ row }) => <span className="text-[#555]">{row.original.branchName}</span>,
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
        <span className="font-medium text-[#333]">
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
      cell: ({ row }) => <span className="text-[#555]">{formatDate(row.original.date)}</span>,
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
        return (
          <Badge className={statusBadgeStyles[status] ?? "bg-gray-100 text-gray-600"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <span className="text-[#555]">
          {methodLabels[row.original.method] ?? row.original.method}
        </span>
      ),
    },
    {
      accessorKey: "reference",
      header: "Receipt #",
      cell: ({ row }) => (
        <span className="text-[#555] font-mono text-xs">
          {row.original.reference ?? "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "month",
      header: "For Month",
      cell: ({ row }) => (
        <span className="text-[#555]">
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
        title="Invoice - Receipt"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Invoice - Receipt" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100">
                <DollarSign className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-semibold text-[#333]">
                  {formatCurrency(summary.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.revenueCount} payment{summary.revenueCount !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold text-amber-600">
                  {formatCurrency(summary.totalPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.pendingCount} payment{summary.pendingCount !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-xl font-semibold text-red-600">
                  {formatCurrency(summary.totalOverdue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.overdueCount} payment{summary.overdueCount !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-xl font-semibold text-[#333]">
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

          <Button
            style={{ background: "#1caf9a" }}
            onClick={() => {
              setEditPayment(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" />
            New Payment
          </Button>
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
