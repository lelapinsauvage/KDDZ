"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  FileClock,
  MailCheck,
  RotateCcw,
  Search,
  Stethoscope,
} from "lucide-react";
import {
  markAllMedicalAlarmsViewed,
  markMedicalAlarmViewed,
} from "@/lib/actions/alarms";

interface MedicalAlarm {
  id: string;
  receiptId: string;
  legacyId: number;
  details: string;
  datetime: string;
  dueDate: string | null;
  branchId: string | null;
  branch: string;
  status: "Viewed" | "New";
  isRead: boolean;
  legacyType: string | null;
  legacyStatus: string;
  legacyHref: string | null;
  actionHref: string;
  searchText: string;
}

interface MedicalAlarmHistory {
  id: string;
  legacyId: number;
  type: string;
  content: string;
  time: string;
  to: string;
  seen: "Yes" | "No";
  branch: string;
  legacyStatus: string;
  searchText: string;
}

interface MedicalAlarmsClientProps {
  alarms: MedicalAlarm[];
  history: MedicalAlarmHistory[];
}

const statusClasses: Record<string, string> = {
  New: "bg-primary/10 text-primary hover:bg-primary/20",
  Viewed: "bg-muted text-muted-foreground",
  Missing: "bg-red-100 text-red-700",
  Incomplete: "bg-amber-100 text-amber-700",
  Draft: "bg-blue-100 text-blue-700",
  Alert: "bg-muted text-muted-foreground",
  Yes: "bg-[#059669]/15 text-[#059669]",
  No: "bg-red-100 text-red-700",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "" };
  return {
    date: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    key: date.toISOString().slice(0, 10),
  };
}

function inDateRange(value: string, from: string, to: string) {
  const key = formatDateTime(value).key;
  if (!key) return true;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

export function MedicalAlarmsClient({
  alarms,
  history,
}: MedicalAlarmsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [legacyStatusFilter, setLegacyStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const branches = useMemo(() => {
    const branchMap = new Map<string, string>();
    for (const alarm of alarms) {
      if (alarm.branchId) branchMap.set(alarm.branchId, alarm.branch);
    }
    return Array.from(branchMap, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [alarms]);

  const legacyStatuses = useMemo(
    () => Array.from(new Set(alarms.map((alarm) => alarm.legacyStatus))).sort(),
    [alarms],
  );

  const unreadCount = useMemo(
    () => alarms.filter((alarm) => !alarm.isRead).length,
    [alarms],
  );

  const filteredAlarms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return alarms.filter((alarm) => {
      if (statusFilter !== "ALL" && alarm.status !== statusFilter) return false;
      if (
        legacyStatusFilter !== "ALL" &&
        alarm.legacyStatus !== legacyStatusFilter
      ) {
        return false;
      }
      if (branchFilter !== "ALL" && alarm.branchId !== branchFilter) {
        return false;
      }
      if (!inDateRange(alarm.datetime, dateFrom, dateTo)) return false;
      if (
        normalizedSearch &&
        !alarm.searchText.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [
    alarms,
    branchFilter,
    dateFrom,
    dateTo,
    legacyStatusFilter,
    search,
    statusFilter,
  ]);

  const filteredHistory = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLowerCase();
    return history.filter((item) => {
      if (!inDateRange(item.time, historyDateFrom, historyDateTo)) {
        return false;
      }
      if (
        normalizedSearch &&
        !item.searchText.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [history, historyDateFrom, historyDateTo, historySearch]);

  function resetAlarmFilters() {
    setStatusFilter("ALL");
    setLegacyStatusFilter("ALL");
    setBranchFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  function resetHistoryFilters() {
    setHistoryDateFrom("");
    setHistoryDateTo("");
    setHistorySearch("");
  }

  function markViewed(alarmId: string) {
    startTransition(async () => {
      const result = await markMedicalAlarmViewed(alarmId);
      if (!result.success) {
        toast.error(result.error ?? "Could not update notification");
        return;
      }
      toast.success("Medical notification marked viewed");
      router.refresh();
    });
  }

  function markSelectedViewed(rows: MedicalAlarm[]) {
    const unreadIds = rows
      .filter((row) => !row.isRead)
      .map((row) => row.id);
    if (unreadIds.length === 0) return;

    startTransition(async () => {
      let updated = 0;
      for (const alarmId of unreadIds) {
        const result = await markMedicalAlarmViewed(alarmId);
        if (result.success) updated += result.data?.count ?? 0;
      }
      toast.success(`${updated} medical notification${updated === 1 ? "" : "s"} marked viewed`);
      router.refresh();
    });
  }

  function markAllViewed() {
    startTransition(async () => {
      const result = await markAllMedicalAlarmsViewed();
      if (!result.success) {
        toast.error(result.error ?? "Could not update notifications");
        return;
      }
      const count = result.data?.count ?? 0;
      toast.success(`${count} medical notification${count === 1 ? "" : "s"} marked viewed`);
      router.refresh();
    });
  }

  const alarmColumns: ColumnDef<MedicalAlarm>[] = [
    {
      accessorKey: "legacyId",
      header: ({ column }) => <SortableHeader column={column}>#</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.legacyId}
        </span>
      ),
    },
    {
      accessorKey: "details",
      header: ({ column }) => (
        <SortableHeader column={column}>Alarm Details</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex min-w-[260px] items-start gap-2">
          <Stethoscope className="mt-0.5 size-4 shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-foreground">
              {row.original.details || "-"}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge
                variant="secondary"
                className={statusClasses[row.original.legacyStatus]}
              >
                {row.original.legacyStatus}
              </Badge>
              {row.original.legacyType && (
                <Badge variant="outline" className="font-normal">
                  {row.original.legacyType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "datetime",
      header: ({ column }) => (
        <SortableHeader column={column}>Alarm Time</SortableHeader>
      ),
      cell: ({ row }) => {
        const formatted = formatDateTime(row.original.datetime);
        return (
          <div className="whitespace-nowrap text-sm">
            <p>{formatted.date}</p>
            <p className="text-xs text-muted-foreground">{formatted.time}</p>
          </div>
        );
      },
      sortingFn: (a, b) =>
        new Date(a.original.datetime).getTime() -
        new Date(b.original.datetime).getTime(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusClasses[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "branch",
      header: "Branch",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" asChild>
                <Link href={row.original.actionHref}>Go</Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {row.original.legacyHref ?? row.original.actionHref}
            </TooltipContent>
          </Tooltip>
          {!row.original.isRead && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={isPending}
                  onClick={() => markViewed(row.original.id)}
                >
                  <Eye className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark viewed</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const historyColumns: ColumnDef<MedicalAlarmHistory>[] = [
    {
      accessorKey: "legacyId",
      header: ({ column }) => <SortableHeader column={column}>#</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.legacyId}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      accessorKey: "content",
      header: ({ column }) => (
        <SortableHeader column={column}>Content</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="min-w-[260px]">
          <p className="font-medium text-foreground">
            {row.original.content || "-"}
          </p>
          <Badge
            variant="secondary"
            className={`mt-1 ${statusClasses[row.original.legacyStatus]}`}
          >
            {row.original.legacyStatus}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "time",
      header: ({ column }) => <SortableHeader column={column}>Time</SortableHeader>,
      cell: ({ row }) => {
        const formatted = formatDateTime(row.original.time);
        return (
          <div className="whitespace-nowrap text-sm">
            <p>{formatted.date}</p>
            <p className="text-xs text-muted-foreground">{formatted.time}</p>
          </div>
        );
      },
      sortingFn: (a, b) =>
        new Date(a.original.time).getTime() -
        new Date(b.original.time).getTime(),
    },
    {
      accessorKey: "to",
      header: "To",
    },
    {
      accessorKey: "seen",
      header: "Seen",
      cell: ({ row }) => (
        <Badge className={statusClasses[row.original.seen]}>
          {row.original.seen}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Medical Notifications Listing"
        description="Missing and incomplete medical report reminders"
        breadcrumbs={[
          { label: "Notifications", href: "/alarms" },
          { label: "Medical" },
        ]}
        actions={
          <Button
            type="button"
            size="sm"
            onClick={markAllViewed}
            disabled={isPending || unreadCount === 0}
            className="gap-2"
          >
            <MailCheck className="size-4" />
            Set All As Viewed
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <Tabs defaultValue="teachers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="teachers">
              Teachers
              {unreadCount > 0 && (
                <Badge className="ml-1 bg-primary/10 text-primary">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Sent Reports Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div role="search" className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search medical alarms..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="New">New ({unreadCount})</SelectItem>
                  <SelectItem value="Viewed">Viewed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={legacyStatusFilter}
                onValueChange={setLegacyStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {legacyStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                aria-label="Alarm date from"
                className="w-full sm:w-[155px]"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                aria-label="Alarm date to"
                className="w-full sm:w-[155px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={resetAlarmFilters}
                className="gap-2"
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>

            <DataTable
              columns={alarmColumns}
              data={filteredAlarms}
              bulkActions={[
                {
                  label: "Mark as Viewed",
                  icon: MailCheck,
                  onClick: markSelectedViewed,
                },
              ]}
              emptyState={
                <EmptyState
                  icon={Stethoscope}
                  title="No medical notifications"
                  description="Missing or incomplete medical report reminders matching the current filters will appear here."
                />
              }
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div role="search" className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Search sent reminders..."
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={historyDateFrom}
                onChange={(event) => setHistoryDateFrom(event.target.value)}
                aria-label="History date from"
                className="w-full sm:w-[155px]"
              />
              <Input
                type="date"
                value={historyDateTo}
                onChange={(event) => setHistoryDateTo(event.target.value)}
                aria-label="History date to"
                className="w-full sm:w-[155px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={resetHistoryFilters}
                className="gap-2"
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>

            <DataTable
              columns={historyColumns}
              data={filteredHistory}
              emptyState={
                <EmptyState
                  icon={FileClock}
                  title="No sent reminders"
                  description="Medical report reminder history matching the current filters will appear here."
                />
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
