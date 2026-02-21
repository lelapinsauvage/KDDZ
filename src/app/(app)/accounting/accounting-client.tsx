"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  DollarSign,
  CreditCard,
  Tag,
  AlertCircle,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

// ── Types ──
type EntryType = "FEE" | "PAYMENT" | "DISCOUNT" | "ADJUSTMENT";

interface AccountingEntry {
  id: string;
  childId: string;
  childName: string;
  type: EntryType;
  description: string;
  amount: number;
  date: string;
}

interface AccountingSummaryData {
  totalFees: number;
  totalPayments: number;
  totalDiscounts: number;
  totalAdjustments: number;
  balance: number;
}

interface AccountingClientProps {
  entries: AccountingEntry[];
  summary: AccountingSummaryData;
}

// ── Helpers ──
function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const typeBadgeStyles: Record<EntryType, string> = {
  FEE: "bg-blue-100 text-blue-700 border-blue-200",
  PAYMENT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DISCOUNT: "bg-orange-100 text-orange-700 border-orange-200",
  ADJUSTMENT: "bg-gray-100 text-gray-600 border-gray-200",
};

// ── Column definitions ──
const accountingColumns: ColumnDef<AccountingEntry>[] = [
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
      <span className="font-medium text-[#333]">{row.original.childName}</span>
    ),
  },
  {
    accessorKey: "type",
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
      const type = row.original.type;
      return (
        <Badge className={typeBadgeStyles[type]}>
          {type}
        </Badge>
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "ALL") return true;
      return row.original.type === filterValue;
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Description
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-[#555]">{row.original.description}</span>
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
    cell: ({ row }) => {
      const { type, amount } = row.original;
      const isCredit = type === "PAYMENT" || type === "DISCOUNT";
      return (
        <span className={isCredit ? "text-emerald-600 font-medium" : "text-[#333] font-medium"}>
          {isCredit ? "-" : "+"}{formatCurrency(amount)}
        </span>
      );
    },
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
    cell: ({ row }) => (
      <span className="text-[#555]">{formatDate(row.original.date)}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log("View entry:", entry.id)}>
              <Eye className="mr-2 size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Edit entry:", entry.id)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => console.log("Delete entry:", entry.id)}
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

export function AccountingClient({ entries, summary }: AccountingClientProps) {
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredEntries = useMemo(() => {
    if (typeFilter === "ALL") return entries;
    return entries.filter((e) => e.type === typeFilter);
  }, [typeFilter, entries]);

  // Outstanding balance = fees + adjustments - payments - discounts
  const outstanding = summary.totalFees + summary.totalAdjustments - summary.totalPayments - summary.totalDiscounts;

  return (
    <>
      <PageHeader
        title="Accounting Management"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Accounting Management" },
        ]}
      />

      <div className="space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                <DollarSign className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-xl font-semibold text-[#333]">{formatCurrency(summary.totalFees + summary.totalAdjustments)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100">
                <CreditCard className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-xl font-semibold text-[#333]">{formatCurrency(summary.totalPayments)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100">
                <Tag className="size-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Discounts</p>
                <p className="text-xl font-semibold text-[#333]">{formatCurrency(summary.totalDiscounts)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                <p className="text-xl font-semibold text-red-600">{formatCurrency(outstanding)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="FEE">Fee</SelectItem>
              <SelectItem value="PAYMENT">Payment</SelectItem>
              <SelectItem value="DISCOUNT">Discount</SelectItem>
              <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button style={{ background: "#1caf9a" }}>
            <Plus className="mr-1 size-4" />
            Add Entry
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={accountingColumns}
          data={filteredEntries}
          searchKey="childName"
          searchPlaceholder="Search by child name..."
        />
      </div>
    </>
  );
}
