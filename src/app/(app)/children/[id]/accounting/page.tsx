"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, FileText, Trash2, DollarSign } from "lucide-react";
import { demoChildren } from "@/lib/demo-data";

interface Props {
  params: Promise<{ id: string }>;
}

const demoEntries = [
  { id: "e1", date: "2025-02-01", type: "FEE", description: "February Tuition", amount: 800.00 },
  { id: "e2", date: "2025-02-05", type: "PAYMENT", description: "Bank Transfer #2845", amount: 800.00 },
  { id: "e3", date: "2025-02-01", type: "FEE", description: "Bus Service — February", amount: 150.00 },
  { id: "e4", date: "2025-01-15", type: "DISCOUNT", description: "Sibling Discount", amount: 100.00 },
  { id: "e5", date: "2025-01-01", type: "FEE", description: "January Tuition", amount: 800.00 },
  { id: "e6", date: "2025-01-03", type: "PAYMENT", description: "Cash Payment", amount: 800.00 },
  { id: "e7", date: "2025-01-01", type: "FEE", description: "Registration Fee", amount: 200.00 },
  { id: "e8", date: "2025-01-01", type: "FEE", description: "Materials Fee", amount: 100.00 },
  { id: "e9", date: "2025-01-10", type: "PAYMENT", description: "Check #1205", amount: 300.00 },
  { id: "e10", date: "2024-12-15", type: "ADJUSTMENT", description: "Late pickup charge", amount: 25.00 },
];

const typeConfig: Record<string, { color: string; sign: string }> = {
  FEE: { color: "bg-blue-100 text-blue-700", sign: "+" },
  PAYMENT: { color: "bg-green-100 text-green-700", sign: "−" },
  DISCOUNT: { color: "bg-orange-100 text-orange-700", sign: "−" },
  ADJUSTMENT: { color: "bg-gray-100 text-gray-700", sign: "+" },
};

export default function ChildAccountingPage({ params }: Props) {
  const { id } = use(params);
  const child = demoChildren.find((c) => c.id === id) ?? demoChildren[0];

  const totalFees = demoEntries
    .filter((e) => e.type === "FEE" || e.type === "ADJUSTMENT")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPayments = demoEntries
    .filter((e) => e.type === "PAYMENT")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalDiscounts = demoEntries
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
                    {balance > 0 ? "Outstanding Balance" : "Overpaid"}
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

        {/* Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Date</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Type</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Description</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a] text-right">Amount</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a] w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoEntries.map((entry) => {
                  const cfg = typeConfig[entry.type];
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm font-medium">{entry.date}</TableCell>
                      <TableCell>
                        <Badge className={cfg.color}>{entry.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{entry.description}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {cfg.sign}${entry.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
