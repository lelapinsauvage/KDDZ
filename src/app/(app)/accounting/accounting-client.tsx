"use client";

import { useState, useMemo, useTransition } from "react";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Banknote,
  FileText,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { QuickPaymentDialog } from "@/components/accounting/quick-payment-dialog";
import { deletePayment } from "@/lib/actions/payments";
import { PaymentDialog } from "./payment-dialog";
import { getInitialsFromName, getPastelAvatarColor } from "@/components/children/children-columns";
import { toast } from "sonner";

// ── Types ──

interface PaymentRow {
  id: string;
  childId: string;
  childNumber: string | null;
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
  receiptFilename: string | null;
  receiptFileUrl: string | null;
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
  childNumber?: string | null;
  firstName: string;
  lastName: string;
  branchId: string;
  classId?: string | null;
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

const SCHOOL_YEAR_MONTHS = [
  { month: 10, label: "Oct" },
  { month: 11, label: "Nov" },
  { month: 12, label: "Dec" },
  { month: 1, label: "Jan" },
  { month: 2, label: "Feb" },
  { month: 3, label: "Mar" },
  { month: 4, label: "Apr" },
  { month: 5, label: "May" },
  { month: 6, label: "Jun" },
  { month: 7, label: "Jul" },
  { month: 8, label: "Aug" },
  { month: 9, label: "Sep" },
];

// ── Helpers ──

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPaymentCurrency(amount: number, currency: string) {
  if (currency === "LBP") return `LL ${amount.toLocaleString("en-US")}`;
  return formatCurrency(amount);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function currentAcademicStartYear() {
  const now = new Date();
  return now.getMonth() + 1 >= 10 ? now.getFullYear() : now.getFullYear() - 1;
}

function academicStartForPayment(payment: PaymentRow, month: number) {
  const anchor = payment.dateFrom ?? payment.date;
  const year = new Date(`${anchor}T00:00:00`).getFullYear();
  return month >= 10 ? year : year - 1;
}

function childName(child: ChildOption) {
  return `${child.firstName} ${child.lastName}`;
}

// ── Component ──

export function AccountingClient({
  payments,
  summary,
  branches,
  classes,
  childrenList,
}: AccountingClientProps) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(currentAcademicStartYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ childId: string; month: number } | null>(null);
  const [detailsCell, setDetailsCell] = useState<{ childId: string; month: number } | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<PaymentRow | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const academicYearOptions = useMemo(() => {
    const years = new Set<number>([currentAcademicStartYear()]);
    for (const payment of payments) {
      const month = payment.month ?? (new Date(`${payment.date}T00:00:00`).getMonth() + 1);
      years.add(academicStartForPayment(payment, month));
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [payments]);

  // Filter payments by active tab category
  const tabPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (activeTab !== "ALL" && payment.category !== activeTab) return false;
      const month = payment.month ?? (new Date(`${payment.date}T00:00:00`).getMonth() + 1);
      return academicStartForPayment(payment, month) === selectedAcademicYear;
    });
  }, [payments, activeTab, selectedAcademicYear]);

  const filteredChildren = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return childrenList.filter((child) => {
      if (branchFilter !== "ALL" && child.branchId !== branchFilter) return false;
      if (classFilter !== "ALL" && child.classId !== classFilter) return false;
      if (!needle) return true;
      return [
        child.childNumber ?? "",
        child.firstName,
        child.lastName,
        child.branch?.name ?? "",
        child.class?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [branchFilter, childrenList, classFilter, searchTerm]);

  // Build legacy monthly grid: rows = active children, columns = Oct-Sep.
  const monthlyGrid = useMemo(() => {
    const childMap = new Map<
      string,
      {
        childId: string;
        childNumber: string | null;
        childName: string;
        firstName: string;
        lastName: string;
        branchName: string;
        className: string;
        months: number[];
        total: number;
      }
    >();

    for (const child of filteredChildren) {
      childMap.set(child.id, {
        childId: child.id,
        childNumber: child.childNumber ?? null,
        childName: childName(child),
        firstName: child.firstName,
        lastName: child.lastName,
        branchName: child.branch?.name ?? "",
        className: child.class?.name ?? "",
        months: Array(SCHOOL_YEAR_MONTHS.length).fill(0) as number[],
        total: 0,
      });
    }

    for (const p of tabPayments) {
      const monthNum = p.month ?? (new Date(p.date).getMonth() + 1);
      if (!childMap.has(p.childId)) {
        if (branchFilter !== "ALL" && p.branchId !== branchFilter) continue;
        if (classFilter !== "ALL" && p.classId !== classFilter) continue;
        if (searchTerm.trim()) {
          const needle = searchTerm.trim().toLowerCase();
          const haystack = [p.childName, p.branchName, p.className].join(" ").toLowerCase();
          if (!haystack.includes(needle)) continue;
        }
        childMap.set(p.childId, {
          childId: p.childId,
          childNumber: null,
          childName: p.childName,
          firstName: p.childName.split(" ")[0] ?? p.childName,
          lastName: p.childName.split(" ").slice(1).join(" "),
          branchName: p.branchName,
          className: p.className,
          months: Array(SCHOOL_YEAR_MONTHS.length).fill(0) as number[],
          total: 0,
        });
      }
      const entry = childMap.get(p.childId)!;
      const monthIndex = SCHOOL_YEAR_MONTHS.findIndex((item) => item.month === monthNum);
      if (monthIndex >= 0) {
        entry.months[monthIndex] += p.amount;
      }
      entry.total += p.amount;
    }

    return Array.from(childMap.values()).sort((a, b) =>
      `${a.branchName} ${a.className} ${a.childName}`.localeCompare(
        `${b.branchName} ${b.className} ${b.childName}`,
      ),
    );
  }, [branchFilter, classFilter, filteredChildren, searchTerm, tabPayments]);

  // Grand totals per month
  const monthTotals = useMemo(() => {
    const totals = Array(SCHOOL_YEAR_MONTHS.length).fill(0) as number[];
    for (const row of monthlyGrid) {
      for (let i = 0; i < SCHOOL_YEAR_MONTHS.length; i++) {
        totals[i] += row.months[i];
      }
    }
    return totals;
  }, [monthlyGrid]);

  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);

  const detailsPayments = useMemo(() => {
    if (!detailsCell) return [];
    return tabPayments
      .filter((payment) => {
        const month = payment.month ?? (new Date(`${payment.date}T00:00:00`).getMonth() + 1);
        return payment.childId === detailsCell.childId && month === detailsCell.month;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [detailsCell, tabPayments]);

  const detailsChild = detailsCell
    ? childrenList.find((child) => child.id === detailsCell.childId)
    : null;

  function handleCellClick(childId: string, month: number, amount: number) {
    setSelectedCell({ childId, month });
    if (amount > 0) {
      setDetailsCell({ childId, month });
      return;
    }
    setQuickDialogOpen(true);
  }

  function handleEdit(payment: PaymentRow) {
    setEditingPayment(payment);
    setDetailsCell(null);
  }

  function handleDelete(payment: PaymentRow) {
    setDeletingPayment(payment);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!deletingPayment) return;
    startDeleteTransition(async () => {
      const result = await deletePayment(deletingPayment.id);
      if (result.success) {
        toast.success("Payment deleted");
        setDeleteDialogOpen(false);
        setDeletingPayment(null);
        setDetailsCell(null);
      } else {
        toast.error(result.error ?? "Failed to delete payment");
      }
    });
  }

  const dialogCategory = activeTab !== "ALL" ? activeTab : undefined;

  return (
    <>
      <PageHeader
        title="Accounting"
        breadcrumbs={[{ label: "Accounting" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1 size-4" />
              Print
            </Button>
            <Button
              onClick={() => {
                setSelectedCell(null);
                setQuickDialogOpen(true);
              }}
            >
              <Banknote className="mr-1 size-4" />
              Record Payment
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* ── Summary Cards ── */}
        <div className="hidden print:block print:text-center">
          <h1 className="text-xl font-semibold">Invoice - Receipt</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounting matrix - {selectedAcademicYear}-{selectedAcademicYear + 1} -{" "}
            {FEE_TABS.find((tab) => tab.value === activeTab)?.label ?? "Total Payments"} -{" "}
            Printed on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 print:hidden sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded bg-[#1caf9a] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(summary.totalRevenue)}</p>
                <p className="text-xs text-white/80">Total Revenue</p>
                <p className="text-[10px] text-white/60">{summary.revenueCount} payment{summary.revenueCount !== 1 ? "s" : ""}</p>
              </div>
              <DollarSign className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>

          <div className="group relative overflow-hidden rounded bg-[#c29d0b] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(summary.totalPending)}</p>
                <p className="text-xs text-white/80">Pending</p>
                <p className="text-[10px] text-white/60">{summary.pendingCount} payment{summary.pendingCount !== 1 ? "s" : ""}</p>
              </div>
              <Clock className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>

          <div className="group relative overflow-hidden rounded bg-[#d64635] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(summary.totalOverdue)}</p>
                <p className="text-xs text-white/80">Overdue</p>
                <p className="text-[10px] text-white/60">{summary.overdueCount} payment{summary.overdueCount !== 1 ? "s" : ""}</p>
              </div>
              <AlertTriangle className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>

          <div className="group relative overflow-hidden rounded bg-[#327ad5] shadow-sm">
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(summary.thisMonthCollections)}</p>
                <p className="text-xs text-white/80">This Month</p>
                <p className="text-[10px] text-white/60">{summary.thisMonthCount} payment{summary.thisMonthCount !== 1 ? "s" : ""}</p>
              </div>
              <TrendingUp className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
        </div>

        {/* ── Fee Category Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 md:-mx-6 md:px-6">
            <TabsList className="w-full print:hidden">
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

        <div className="grid grid-cols-1 gap-3 print:hidden lg:grid-cols-[180px_1fr_220px_220px]">
          <Select
            value={selectedAcademicYear.toString()}
            onValueChange={(value) => setSelectedAcademicYear(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {academicYearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}-{year + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter child, branch, or class"
          />
          <Select
            value={branchFilter}
            onValueChange={(value) => {
              setBranchFilter(value);
              setClassFilter("ALL");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All classes</SelectItem>
              {classes
                .filter(
                  (cls) =>
                    branchFilter === "ALL" ||
                    childrenList.some(
                      (child) =>
                        child.classId === cls.id &&
                        child.branchId === branchFilter,
                    ),
                )
                .map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Monthly Grid DataTable ── */}
        {monthlyGrid.length > 0 ? (
          <div className="overflow-hidden rounded-sm border bg-card print:rounded-none print:border-gray-300">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse text-sm print:text-[8px]">
                <thead>
                  <tr>
                    <th
                      colSpan={5}
                      className="sticky left-0 z-10 border-r bg-muted px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Child Info
                    </th>
                    <th
                      colSpan={3}
                      className="bg-muted px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {selectedAcademicYear}
                    </th>
                    <th
                      colSpan={9}
                      className="bg-muted px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {selectedAcademicYear + 1}
                    </th>
                    <th className="border-l bg-muted px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-foreground">
                      Total
                    </th>
                  </tr>
                  <tr>
                    <th className="sticky left-0 z-10 min-w-[92px] border-r bg-muted/80 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      #
                    </th>
                    <th className="min-w-[140px] bg-muted/80 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      First Name
                    </th>
                    <th className="min-w-[140px] bg-muted/80 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Last Name
                    </th>
                    <th className="min-w-[120px] bg-muted/80 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Branch
                    </th>
                    <th className="min-w-[120px] border-r bg-muted/80 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Class
                    </th>
                    {SCHOOL_YEAR_MONTHS.map((m) => (
                      <th
                        key={m.month}
                        className="min-w-[96px] bg-muted/80 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {m.label}
                      </th>
                    ))}
                    <th className="min-w-[110px] border-l bg-muted/80 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-foreground">
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
                      <td className="sticky left-0 z-10 border-r bg-card px-3 py-2.5 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                        <a href={`/children/${row.childId}/accounting`} className="hover:text-primary">
                          {row.childNumber ?? "—"}
                        </a>
                      </td>
                      <td className="px-3 py-2.5">
                        <a
                          href={`/children/${row.childId}/accounting`}
                          className="flex items-center gap-2.5 font-medium hover:text-primary transition-colors"
                        >
                          <div
                            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${getPastelAvatarColor(row.childName)}`}
                          >
                            {getInitialsFromName(row.childName)}
                          </div>
                          <span className="truncate max-w-[140px]">
                            {row.firstName}
                          </span>
                        </a>
                      </td>
                      <td className="px-3 py-2.5">{row.lastName || "—"}</td>
                      <td className="px-3 py-2.5">{row.branchName || "—"}</td>
                      <td className="border-r px-3 py-2.5">{row.className || "—"}</td>
                      {SCHOOL_YEAR_MONTHS.map((monthDef, monthIdx) => {
                        const amount = row.months[monthIdx] ?? 0;

                        return (
                          <td
                            key={monthDef.month}
                            className="px-3 py-2.5 text-center tabular-nums cursor-pointer transition-colors hover:bg-primary/5"
                            onClick={() => handleCellClick(row.childId, monthDef.month, amount)}
                          >
                            {amount > 0 ? (
                              <span className="font-medium text-foreground">
                                {formatCurrency(amount)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center font-bold tabular-nums border-l text-foreground">
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))}

                  {/* ── Grand Total Row ── */}
                  <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                    <td
                      colSpan={5}
                      className="sticky left-0 z-10 border-r bg-muted/50 px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                    >
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
                    ? "No active children match the current filters."
                    : `No active children match the current filters for ${FEE_TABS.find((t) => t.value === activeTab)?.label.toLowerCase()}.`
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
        preselectedYear={selectedAcademicYear}
      />

      <Dialog
        open={!!detailsCell}
        onOpenChange={(open) => {
          if (!open) setDetailsCell(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payments Details</DialogTitle>
            <DialogDescription>
              {detailsChild
                ? `${detailsChild.firstName} ${detailsChild.lastName}`
                : "Selected child"}{" "}
              - {SCHOOL_YEAR_MONTHS.find((item) => item.month === detailsCell?.month)?.label}{" "}
              {selectedAcademicYear}-{selectedAcademicYear + 1}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto rounded-sm border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/80 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Child #</th>
                  <th className="px-3 py-3">Child Name</th>
                  <th className="px-3 py-3">Class</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3">For</th>
                  <th className="px-3 py-3">Fees Type</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">From</th>
                  <th className="px-3 py-3">To</th>
                  <th className="px-3 py-3">Remarks</th>
                  <th className="px-3 py-3">Attachment</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {detailsPayments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="px-3 py-3">{formatDate(payment.date)}</td>
                    <td className="px-3 py-3">{payment.childNumber ?? "-"}</td>
                    <td className="px-3 py-3 font-medium">{payment.childName}</td>
                    <td className="px-3 py-3">{payment.className || "-"}</td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {formatPaymentCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-3 py-3">
                      {SCHOOL_YEAR_MONTHS.find((item) => item.month === payment.month)?.label ?? "-"}
                    </td>
                    <td className="px-3 py-3">
                      {FEE_TABS.find((item) => item.value === payment.category)?.label ?? payment.category}
                    </td>
                    <td className="px-3 py-3">{payment.method.replaceAll("_", " ")}</td>
                    <td className="px-3 py-3">{formatDate(payment.dateFrom)}</td>
                    <td className="px-3 py-3">{formatDate(payment.dateTo)}</td>
                    <td className="max-w-[180px] px-3 py-3">{payment.notes || "-"}</td>
                    <td className="px-3 py-3">
                      {payment.receiptFileUrl ? (
                        <a
                          href={payment.receiptFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="size-3.5" />
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                          <a href={`/accounting/invoice/${payment.id}`} target="_blank" rel="noreferrer">
                            <Printer className="size-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(payment)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(payment)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        open={!!editingPayment}
        onOpenChange={(open) => {
          if (!open) setEditingPayment(null);
        }}
        childrenList={childrenList}
        editData={
          editingPayment
            ? {
                ...editingPayment,
                branchId: editingPayment.branchId,
              }
            : null
        }
      />

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
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
