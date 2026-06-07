import {
  getAlarms,
  getPaymentAlarmHistory,
  getPaymentAlarmNotifications,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { getOverduePayments } from "@/lib/actions/payments";
import type {
  StaffReceiptAlarm,
  StaffReceiptAlarmHistory,
} from "../_components/staff-receipt-alarms-client";
import { PaymentAlarmsClient } from "./payment-alarms-client";

export default async function PaymentAlarmsPage() {
  const [
    alarmsResult,
    branchesResult,
    overdueResult,
    notificationsResult,
    historyResult,
  ] = await Promise.all([
    getAlarms({ type: "PAYMENT", pageSize: "all" }),
    getBranches(),
    getOverduePayments(),
    getPaymentAlarmNotifications({ pageSize: "all" }),
    getPaymentAlarmHistory({ pageSize: "all" }),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);
  const notificationsData = (notificationsResult.success
    ? notificationsResult.data
    : null) as { alarms?: StaffReceiptAlarm[] } | null;
  const historyData = (historyResult.success
    ? historyResult.data
    : null) as { history?: StaffReceiptAlarmHistory[] } | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = (alarmsResult.success ? (alarmsResult.data as any) : { alarms: [] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarms = (rawData.alarms ?? []) as Array<any>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const serializedAlarms = rawAlarms.map((a) => {
    const dueDate = a.dueDate ? (a.dueDate as Date).toISOString().split("T")[0] : "";
    const dueDateObj = a.dueDate ? new Date(a.dueDate as Date) : null;
    let daysLeft = 0;
    let status: "Overdue" | "Upcoming" | "Active" = "Active";

    if (dueDateObj) {
      daysLeft = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        status = "Overdue";
      } else if (daysLeft <= 30) {
        status = "Upcoming";
      }
    }

    return {
      id: a.id as string,
      message: (a.message ?? "\u2014") as string,
      dueDate,
      daysLeft,
      status,
      branchId: (a.branch?.id ?? "") as string,
      branch: (a.branch?.name ?? "\u2014") as string,
    };
  });

  // Serialize overdue payments data
  const overdueData =
    overdueResult.success && overdueResult.data
      ? (overdueResult.data as {
          overdueByChild: Array<{
            child: {
              id: string;
              firstName: string;
              lastName: string;
              branch: { id: string; name: string } | null;
              class: { id: string; name: string } | null;
            };
            payments: Array<{
              id: string;
              amount: { toString(): string };
              date: Date;
              category: string;
              method: string;
            }>;
            totalOverdue: number;
          }>;
          totalOverdue: number;
          totalCount: number;
        })
      : { overdueByChild: [], totalOverdue: 0, totalCount: 0 };

  const overdueChildren = overdueData.overdueByChild.map((item) => ({
    childId: item.child.id,
    childName: `${item.child.firstName} ${item.child.lastName}`,
    branchId: item.child.branch?.id ?? "",
    branchName: item.child.branch?.name ?? "\u2014",
    className: item.child.class?.name ?? "\u2014",
    totalOverdue: item.totalOverdue,
    paymentCount: item.payments.length,
    oldestDate: item.payments.length > 0
      ? item.payments[item.payments.length - 1].date.toISOString().split("T")[0]
      : "",
  }));

  return (
    <PaymentAlarmsClient
      alarms={serializedAlarms}
      branches={branches}
      overdueChildren={overdueChildren}
      totalOverdue={overdueData.totalOverdue}
      totalOverdueCount={overdueData.totalCount}
      notificationAlarms={notificationsData?.alarms ?? []}
      notificationHistory={historyData?.history ?? []}
    />
  );
}
