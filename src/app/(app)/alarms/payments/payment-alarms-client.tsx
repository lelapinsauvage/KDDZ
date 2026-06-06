"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AlertTriangle, DollarSign, ExternalLink, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlarmActionsCell } from "@/components/alarms/alarm-actions-cell";
import { generatePaymentAlarms } from "@/lib/actions/alarms";
import {
  StaffReceiptAlarmsClient,
  type StaffReceiptAlarm,
  type StaffReceiptAlarmHistory,
} from "../_components/staff-receipt-alarms-client";

// ── Types ──

interface PaymentAlarm {
  id: string;
  message: string;
  dueDate: string;
  daysLeft: number;
  status: "Overdue" | "Upcoming" | "Active";
  branchId: string;
  branch: string;
}

interface OverdueChild {
  childId: string;
  childName: string;
  branchId: string;
  branchName: string;
  className: string;
  totalOverdue: number;
  paymentCount: number;
  oldestDate: string;
}

interface PaymentAlarmsClientProps {
  alarms: PaymentAlarm[];
  branches: { id: string; name: string }[];
  overdueChildren: OverdueChild[];
  totalOverdue: number;
  totalOverdueCount: number;
  notificationAlarms: StaffReceiptAlarm[];
  notificationHistory: StaffReceiptAlarmHistory[];
}

const statusColors: Record<string, string> = {
  Overdue: "bg-red-100 text-red-700",
  Upcoming: "bg-amber-100 text-amber-700",
  Active: "bg-[#059669]/15 text-[#059669]",
};

function formatDate(iso: string) {
  if (!iso) return "\u2014";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function PaymentAlarmsClient({
  alarms,
  branches,
  overdueChildren,
  totalOverdue,
  totalOverdueCount,
  notificationAlarms,
  notificationHistory,
}: PaymentAlarmsClientProps) {
  const router = useRouter();
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  const filteredAlarms = useMemo(() => {
    if (branchFilter === "ALL") return alarms;
    return alarms.filter((p) => p.branchId === branchFilter);
  }, [branchFilter, alarms]);

  const filteredOverdue = useMemo(() => {
    if (branchFilter === "ALL") return overdueChildren;
    return overdueChildren.filter((c) => c.branchId === branchFilter);
  }, [branchFilter, overdueChildren]);
  const unreadNotifications = notificationAlarms.filter((alarm) => !alarm.isRead).length;

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerationStatus(null);
    const result = await generatePaymentAlarms(
      branchFilter === "ALL" ? undefined : branchFilter,
    );
    setIsGenerating(false);

    if (result.success && result.data) {
      const {
        reminderGroupsMatched,
        remindersMatched,
        duePaymentGroupsMatched,
        duePaymentsMatched,
        alarmsCreated,
        paidAlarmsCreated,
        beforeAlarmsCreated,
        afterAlarmsCreated,
        skippedExisting,
        parentRecipientsMatched,
      } = result.data;
      setGenerationStatus(
        `Matched ${reminderGroupsMatched} paid group${reminderGroupsMatched === 1 ? "" : "s"} from ${remindersMatched} reminder${remindersMatched === 1 ? "" : "s"} and ${duePaymentGroupsMatched} due group${duePaymentGroupsMatched === 1 ? "" : "s"} from ${duePaymentsMatched} payment${duePaymentsMatched === 1 ? "" : "s"}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} (${paidAlarmsCreated} paid, ${beforeAlarmsCreated} before, ${afterAlarmsCreated} after); skipped ${skippedExisting} existing; parent recipients ${parentRecipientsMatched}.`,
      );
      router.refresh();
      return;
    }

    setGenerationStatus(result.error ?? "Payment generation failed.");
  }

  const alarmColumns: ColumnDef<PaymentAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-amber-500" />
            <span className="font-medium">{row.original.message || "\u2014"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => formatDate(row.original.dueDate),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={statusColors[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      { accessorKey: "branch", header: "Branch" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => <AlarmActionsCell id={row.original.id} />,
      },
    ],
    [],
  );

  const overdueColumns: ColumnDef<OverdueChild>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <a
            href={`/children/${row.original.childId}/accounting`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {row.original.childName}
          </a>
        ),
      },
      { accessorKey: "branchName", header: "Branch" },
      { accessorKey: "className", header: "Class" },
      {
        accessorKey: "totalOverdue",
        header: () => <div className="text-right">Overdue Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold text-red-600">
            ${row.original.totalOverdue.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "paymentCount",
        header: "Overdue Payments",
        cell: ({ row }) => (
          <Badge className="bg-red-100 text-red-700">
            {row.original.paymentCount}
          </Badge>
        ),
      },
      {
        accessorKey: "oldestDate",
        header: "Since",
        cell: ({ row }) => formatDate(row.original.oldestDate),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href={`/children/${row.original.childId}/accounting`}>
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Payment Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Payments" },
        ]}
      />

      <Tabs defaultValue="dashboard" className="space-y-4 p-4 md:p-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadNotifications > 0 && (
              <Badge className="ml-1 bg-primary/10 text-primary">
                {unreadNotifications}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="py-4">
              <CardContent className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertTriangle className="size-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Overdue</p>
                  <p className="text-xl font-semibold text-red-600">
                    ${totalOverdue.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
                  <DollarSign className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Payments</p>
                  <p className="text-xl font-semibold text-foreground">
                    {totalOverdueCount}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Children with Overdue</p>
                  <p className="text-xl font-semibold text-foreground">
                    {overdueChildren.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className={`size-4 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
            {generationStatus && (
              <span className="text-sm text-muted-foreground">{generationStatus}</span>
            )}
          </div>

          {filteredOverdue.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-red-500" />
                  Children with Overdue Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={overdueColumns}
                  data={filteredOverdue}
                  searchKey="childName"
                  searchPlaceholder="Search children..."
                />
              </CardContent>
            </Card>
          )}

          {filteredAlarms.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Alarms</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={alarmColumns}
                  data={filteredAlarms}
                  searchKey="message"
                  searchPlaceholder="Search alarms..."
                />
              </CardContent>
            </Card>
          ) : filteredOverdue.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
              No payment alarms found.
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <StaffReceiptAlarmsClient
            family="payment"
            alarms={notificationAlarms}
            history={notificationHistory}
            branches={branches}
            showHeader={false}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
