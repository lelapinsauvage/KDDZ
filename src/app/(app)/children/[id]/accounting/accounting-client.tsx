"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, FileText, Trash2, DollarSign } from "lucide-react";

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

interface Props {
  child: ChildData;
  entries: AccountingEntry[];
}

const typeConfig: Record<string, { color: string; sign: string }> = {
  FEE: { color: "bg-blue-100 text-blue-700", sign: "+" },
  PAYMENT: { color: "bg-green-100 text-green-700", sign: "\u2212" },
  DISCOUNT: { color: "bg-orange-100 text-orange-700", sign: "\u2212" },
  ADJUSTMENT: { color: "bg-gray-100 text-gray-700", sign: "+" },
};

const columns: ColumnDef<AccountingEntry>[] = [
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
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "ALL") return true;
      return row.original.type === filterValue;
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
  {
    id: "actions",
    header: "",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];

export function AccountingClient({ child, entries }: Props) {
  const id = child.id;

  const totalFees = entries
    .filter((e) => e.type === "FEE" || e.type === "ADJUSTMENT")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPayments = entries
    .filter((e) => e.type === "PAYMENT")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalDiscounts = entries
    .filter((e) => e.type === "DISCOUNT")
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalFees - totalPayments - totalDiscounts;

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Accounting`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
          { label: "Accounting" },
        ]}
      />

      <div className="space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
                  <p className="text-2xl font-bold text-green-600">${totalPayments.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">${totalDiscounts.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Discounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#1caf9a]" />
                <div>
                  <p className={`text-2xl font-bold ${balance > 0 ? "text-red-500" : "text-green-600"}`}>
                    ${Math.abs(balance).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {balance > 0 ? "Outstanding Balance" : balance < 0 ? "Overpaid" : "Settled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button size="sm" style={{ background: "#1caf9a" }}>
            <Plus className="mr-1 h-4 w-4" />
            Add Entry
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={entries}
          searchKey="description"
          searchPlaceholder="Search transactions..."
        />
      </div>
    </>
  );
}
