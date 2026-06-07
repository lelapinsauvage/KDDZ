import { requireRole } from "@/lib/require-role";
import { getPayments, getPaymentsSummary, getChildrenForPayment } from "@/lib/actions/payments";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { AccountingClient } from "./accounting-client";

export default async function AccountingPage() {
  await requireRole("ADMIN", "MANAGER");
  const [paymentsResult, summaryResult, branchesResult, classesResult, childrenResult] =
    await Promise.all([
      getPayments({ pageSize: "all" }),
      getPaymentsSummary(),
      getBranches(),
      getClasses(),
      getChildrenForPayment(),
    ]);

  const payments = paymentsResult.success && paymentsResult.data
    ? (paymentsResult.data as { payments: Array<{
        id: string;
        childId: string;
        amount: { toString(): string };
        currency: string;
        date: Date;
        dateFrom: Date | null;
        dateTo: Date | null;
        month: number | null;
        method: string;
        category: string;
        status: string;
        reference: string | null;
        notes: string | null;
        receiptFilename: string | null;
        receiptFileUrl: string | null;
        createdAt: Date;
        child: {
          childNumber: string | null;
          firstName: string;
          lastName: string;
          branch: { id: string; name: string } | null;
          class: { id: string; name: string } | null;
        };
        createdBy: { id: string; name: string | null } | null;
      }> }).payments
    : [];

  const serializedPayments = payments.map((p) => ({
    id: p.id,
    childId: p.childId,
    childNumber: p.child.childNumber,
    childName: `${p.child.firstName} ${p.child.lastName}`,
    branchName: p.child.branch?.name ?? "",
    branchId: p.child.branch?.id ?? "",
    className: p.child.class?.name ?? "",
    classId: p.child.class?.id ?? "",
    amount: Number(p.amount),
    currency: p.currency,
    date: p.date.toISOString().split("T")[0],
    dateFrom: p.dateFrom?.toISOString().split("T")[0] ?? null,
    dateTo: p.dateTo?.toISOString().split("T")[0] ?? null,
    month: p.month,
    method: p.method,
    category: p.category,
    status: p.status,
    reference: p.reference,
    notes: p.notes,
    receiptFilename: p.receiptFilename,
    receiptFileUrl: p.receiptFileUrl,
    createdBy: p.createdBy?.name ?? null,
    createdAt: p.createdAt.toISOString().split("T")[0],
  }));

  const summary = summaryResult.success && summaryResult.data
    ? (summaryResult.data as {
        totalRevenue: number;
        revenueCount: number;
        totalPending: number;
        pendingCount: number;
        totalOverdue: number;
        overdueCount: number;
        thisMonthCollections: number;
        thisMonthCount: number;
      })
    : {
        totalRevenue: 0,
        revenueCount: 0,
        totalPending: 0,
        pendingCount: 0,
        totalOverdue: 0,
        overdueCount: 0,
        thisMonthCollections: 0,
        thisMonthCount: 0,
      };

  const branches =
    branchesResult.success && branchesResult.data
      ? (branchesResult.data as Array<{ id: string; name: string }>)
      : [];

  const classes =
    classesResult.success && classesResult.data
      ? (classesResult.data as Array<{ id: string; name: string }>)
      : [];

  const children =
    childrenResult.success && childrenResult.data
      ? (childrenResult.data as Array<{
          id: string;
          childNumber: string | null;
          firstName: string;
          lastName: string;
          branchId: string;
          classId: string | null;
          branch: { name: string } | null;
          class: { name: string } | null;
        }>)
      : [];

  return (
    <AccountingClient
      payments={serializedPayments}
      summary={summary}
      branches={branches}
      classes={classes}
      childrenList={children}
    />
  );
}
