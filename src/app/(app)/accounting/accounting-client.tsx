"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Banknote,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { QuickPaymentDialog } from "@/components/accounting/quick-payment-dialog";

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

// ── Constants ──

const FEE_TABS = [
  { value: "ALL", label: "Total Payments" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "BUS", label: "Bus" },
  { value: "XTRA_TIME", label: "Xtra-time" },
  { value: "OTHER", label: "Other" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Helpers ──

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getInitials(name: string) {
  const parts = name.split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const childAvatarColors = [
  "bg-[#8B7355]/15 text-[#8B7355]",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-[#6B8F71]/15 text-[#6B8F71]",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-[#C35A2C]/10 text-[#C35A2C]",
  "bg-orange-100 text-orange-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return childAvatarColors[Math.abs(hash) % childAvatarColors.length];
}

// ── Component ──

export function AccountingClient({
  payments,
  summary,
  childrenList,
}: AccountingClientProps) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ childId: string; month: number } | null>(null);

  // Filter payments by active tab category
  const tabPayments = useMemo(() => {
    if (activeTab === "ALL") return payments;
    return payments.filter((p) => p.category === activeTab);
  }, [payments, activeTab]);

  // Build monthly grid: rows = children, columns = months 1-12
  const monthlyGrid = useMemo(() => {
    const childMap = new Map<
      string,
      { childId: string; childName: string; months: number[]; total: number }
    >();

    for (const p of tabPayments) {
      const monthNum = p.month ?? (new Date(p.date).getMonth() + 1);
      if (!childMap.has(p.childId)) {
        childMap.set(p.childId, {
          childId: p.childId,
          childName: p.childName,
          months: Array(12).fill(0) as number[],
          total: 0,
        });
      }
      const entry = childMap.get(p.childId)!;
      if (monthNum >= 1 && monthNum <= 12) {
        entry.months[monthNum - 1] += p.amount;
      }
      entry.total += p.amount;
    }

    return Array.from(childMap.values()).sort((a, b) =>
      a.childName.localeCompare(b.childName),
    );
  }, [tabPayments]);

  // Grand totals per month
  const monthTotals = useMemo(() => {
    const totals = Array(12).fill(0) as number[];
    for (const row of monthlyGrid) {
      for (let i = 0; i < 12; i++) {
        totals[i] += row.months[i];
      }
    }
    return totals;
  }, [monthlyGrid]);

  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);

  function handleCellClick(childId: string, monthIndex: number) {
    setSelectedCell({ childId, month: monthIndex + 1 });
    setQuickDialogOpen(true);
  }

  const dialogCategory = activeTab !== "ALL" ? activeTab : undefined;

  return (
    <>
      <PageHeader
        title="Accounting"
        breadcrumbs={[{ label: "Accounting" }]}
        actions={
          <Button
            onClick={() => {
              setSelectedCell(null);
              setQuickDialogOpen(true);
            }}
          >
            <Banknote className="mr-1 size-4" />
            Record Payment
          </Button>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden py-4 border-[#6B8F71]/15">
            <div className="absolute inset-y-0 left-0 w-1 bg-[#6B8F71]" />
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#6B8F71]/15">
                <DollarSign className="size-5 text-[#6B8F71]" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold tabular-nums text-[#6B8F71]">
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

        {/* ── Fee Category Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 md:-mx-6 md:px-6">
            <TabsList className="w-full">
              {FEE_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {/* ── Monthly Grid DataTable ── */}
        {monthlyGrid.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-muted/80 backdrop-blur-sm min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      Child Name
                    </th>
                    {MONTHS.map((m) => (
                      <th
                        key={m}
                        className="min-w-[100px] px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/80"
                      >
                        {m}
                      </th>
                    ))}
                    <th className="min-w-[110px] px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-foreground bg-muted/80 border-l">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyGrid.map((row) => (
                    <tr
                      key={row.childId}
                      className="border-t transition-colors hover:bg-accent/30"
                    >
                      <td className="sticky left-0 z-10 bg-card px-4 py-2.5 border-r shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                        <a
                          href={`/children/${row.childId}/accounting`}
                          className="flex items-center gap-2.5 font-medium hover:text-primary transition-colors"
                        >
                          <div
                            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${getAvatarColor(row.childName)}`}
                          >
                            {getInitials(row.childName)}
                          </div>
                          <span className="truncate max-w-[140px]">
                            {row.childName}
                          </span>
                        </a>
                      </td>
                      {row.months.map((amount, monthIdx) => (
                        <td
                          key={monthIdx}
                          className="px-3 py-2.5 text-center tabular-nums cursor-pointer transition-colors hover:bg-primary/5"
                          onClick={() => handleCellClick(row.childId, monthIdx)}
                        >
                          {amount > 0 ? (
                            <span className="font-medium text-foreground">
                              {formatCurrency(amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-center font-bold tabular-nums border-l text-foreground">
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))}

                  {/* ── Grand Total Row ── */}
                  <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                    <td className="sticky left-0 z-10 bg-muted/50 px-4 py-3 border-r shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] text-xs uppercase tracking-wide text-muted-foreground">
                      Grand Total
                    </td>
                    {monthTotals.map((total, idx) => (
                      <td
                        key={idx}
                        className="px-3 py-3 text-center tabular-nums"
                      >
                        {total > 0 ? formatCurrency(total) : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center font-bold tabular-nums border-l">
                      {formatCurrency(grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Card className="py-12">
            <CardContent>
              <EmptyState
                icon={DollarSign}
                title="No payments found"
                description={
                  activeTab === "ALL"
                    ? "No payments have been recorded yet. Click 'Record Payment' to get started."
                    : `No ${FEE_TABS.find((t) => t.value === activeTab)?.label.toLowerCase()} payments have been recorded yet.`
                }
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Quick Payment Dialog ── */}
      <QuickPaymentDialog
        open={quickDialogOpen}
        onOpenChange={(open) => {
          setQuickDialogOpen(open);
          if (!open) setSelectedCell(null);
        }}
        childrenList={childrenList}
        preselectedChildId={selectedCell?.childId}
        preselectedCategory={dialogCategory}
        preselectedMonth={selectedCell?.month}
      />
    </>
  );
}
