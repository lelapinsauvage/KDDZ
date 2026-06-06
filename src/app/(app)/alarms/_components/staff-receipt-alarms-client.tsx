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
  ExternalLink,
  Cake,
  ClipboardCheck,
  Eye,
  FileClock,
  FileText,
  MailCheck,
  Pill,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import {
  generateAssessmentAlarms,
  generateBirthdayAlarms,
  generateContractAlarms,
  generateInsuranceAlarms,
  generateMedicineAlarms,
  generateVaccinationAlarms,
  markAllAssessmentAlarmsViewed,
  markAllBirthdayAlarmsViewed,
  markAllContractAlarmsViewed,
  markAllInsuranceAlarmsViewed,
  markAllMedicineAlarmsViewed,
  markAllVaccinationAlarmsViewed,
  markAssessmentAlarmViewed,
  markBirthdayAlarmViewed,
  markContractAlarmViewed,
  markInsuranceAlarmViewed,
  markMedicineAlarmViewed,
  markVaccinationAlarmViewed,
} from "@/lib/actions/alarms";

export interface StaffReceiptAlarm {
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
  legacyHref: string | null;
  actionHref: string;
  searchText: string;
}

export interface StaffReceiptAlarmHistory {
  id: string;
  legacyId: number;
  type: string;
  content: string;
  time: string;
  to: string;
  seen: "Yes" | "No";
  branch: string;
  searchText: string;
}

interface StaffReceiptAlarmsClientProps {
  family:
    | "assessment"
    | "birthday"
    | "contract"
    | "insurance"
    | "medicine"
    | "vaccination";
  alarms: StaffReceiptAlarm[];
  history: StaffReceiptAlarmHistory[];
  branches: { id: string; name: string }[];
  showHeader?: boolean;
}

interface FamilyCopy {
  title: string;
  description: string;
  breadcrumb: string;
  historyTitle: string;
  searchPlaceholder: string;
  historyPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  generationFailure: string;
  icon: LucideIcon;
  iconClass: string;
  listingLabel?: string;
}

const familyCopy: Record<StaffReceiptAlarmsClientProps["family"], FamilyCopy> = {
  assessment: {
    title: "Assessment Notifications Listing",
    description: "Assessment report reminders sent to staff",
    breadcrumb: "Assessments",
    historyTitle: "Sent Assessment Alarms",
    searchPlaceholder: "Search assessment alarms...",
    historyPlaceholder: "Search sent assessment alarms...",
    emptyTitle: "No assessment notifications",
    emptyDescription:
      "Assessment reminders matching the current filters will appear here.",
    generationFailure: "Assessment generation failed.",
    icon: ClipboardCheck,
    iconClass: "text-emerald-600",
  },
  birthday: {
    title: "Birthdays Notifications Listing",
    description: "Birthday reminders sent to staff",
    breadcrumb: "Birthdays",
    historyTitle: "Sent Birthday Alarms",
    searchPlaceholder: "Search birthday alarms...",
    historyPlaceholder: "Search sent birthday alarms...",
    emptyTitle: "No birthday notifications",
    emptyDescription:
      "Birthday reminders matching the current filters will appear here.",
    generationFailure: "Birthday generation failed.",
    icon: Cake,
    iconClass: "text-pink-500",
  },
  contract: {
    title: "Contracts Notifications Listing",
    description: "Staff document and contract expiry reminders",
    breadcrumb: "Contracts",
    historyTitle: "Sent Contracts Reminders",
    searchPlaceholder: "Search contract alarms...",
    historyPlaceholder: "Search sent contract reminders...",
    emptyTitle: "No contract notifications",
    emptyDescription:
      "Staff contract and document reminders matching the current filters will appear here.",
    generationFailure: "Contract generation failed.",
    icon: FileText,
    iconClass: "text-primary",
  },
  insurance: {
    title: "Insurance Notifications Listing",
    description: "Alerts sent concerning expiring child insurance",
    breadcrumb: "Insurance",
    historyTitle: "Sent Insurance Reminders",
    searchPlaceholder: "Search insurance alarms...",
    historyPlaceholder: "Search sent reminders...",
    emptyTitle: "No insurance notifications",
    emptyDescription:
      "Expiring child insurance reminders matching the current filters will appear here.",
    generationFailure: "Insurance generation failed.",
    icon: Shield,
    iconClass: "text-blue-500",
  },
  medicine: {
    title: "Medicine Alarms Listing",
    description: "Medication-time reminders sent to staff",
    breadcrumb: "Medicine",
    historyTitle: "Sent Medicine Alarms",
    searchPlaceholder: "Search medicine alarms...",
    historyPlaceholder: "Search sent alarms...",
    emptyTitle: "No medicine notifications",
    emptyDescription:
      "Medication reminders matching the current filters will appear here.",
    generationFailure: "Medicine generation failed.",
    icon: Pill,
    iconClass: "text-violet-500",
  },
  vaccination: {
    title: "Vaccinations Notifications Listing",
    description: "Vaccination reminders sent to staff and parents",
    breadcrumb: "Vaccinations",
    historyTitle: "Sent Vaccination Alarms",
    searchPlaceholder: "Search vaccination alarms...",
    historyPlaceholder: "Search sent vaccination alarms...",
    emptyTitle: "No vaccination notifications",
    emptyDescription:
      "Vaccination reminders matching the current filters will appear here.",
    generationFailure: "Vaccination generation failed.",
    icon: Syringe,
    iconClass: "text-sky-600",
    listingLabel: "Recipients",
  },
};

const statusClasses: Record<string, string> = {
  New: "bg-primary/10 text-primary hover:bg-primary/20",
  Viewed: "bg-muted text-muted-foreground",
  Yes: "bg-[#059669]/15 text-[#059669]",
  No: "bg-red-100 text-red-700",
  Alert: "bg-red-100 text-red-700",
  Message: "bg-blue-100 text-blue-700",
  "Alert & Message": "bg-amber-100 text-amber-700",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "", key: "" };
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

function metric(data: unknown, key: string) {
  if (!data || typeof data !== "object") return 0;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatGenerationStatus(
  family: StaffReceiptAlarmsClientProps["family"],
  data: unknown,
) {
  if (family === "assessment" || family === "birthday") {
    const alarmsCreated = metric(data, "alarmsCreated");
    const notificationsCreated = metric(data, "notificationsCreated");
    const skippedExisting = metric(data, "skippedExisting");
    return `Created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing.`;
  }

  if (family === "contract") {
    const documentsMatched = metric(data, "documentsMatched");
    const alarmsCreated = metric(data, "alarmsCreated");
    const notificationsCreated = metric(data, "notificationsCreated");
    const skippedExisting = metric(data, "skippedExisting");
    const skippedOutsideWindow = metric(data, "skippedOutsideWindow");
    return `Matched ${documentsMatched}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing, ${skippedOutsideWindow} outside window.`;
  }

  if (family === "insurance") {
    const formsMatched = metric(data, "formsMatched");
    const alarmsCreated = metric(data, "alarmsCreated");
    const notificationsCreated = metric(data, "notificationsCreated");
    const skippedExisting = metric(data, "skippedExisting");
    return `Matched ${formsMatched}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing.`;
  }

  if (family === "vaccination") {
    const remindersMatched = metric(data, "remindersMatched");
    const alarmsCreated = metric(data, "alarmsCreated");
    const notificationsCreated = metric(data, "notificationsCreated");
    const skippedExisting = metric(data, "skippedExisting");
    return `Matched ${remindersMatched}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing.`;
  }

  const entriesMatched = metric(data, "entriesMatched");
  const alarmsCreated = metric(data, "alarmsCreated");
  const notificationsCreated = metric(data, "notificationsCreated");
  const skippedExisting = metric(data, "skippedExisting");
  const skippedExpired = metric(data, "skippedExpired");
  return `Matched ${entriesMatched}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing, ${skippedExpired} expired.`;
}

async function generateForFamily(
  family: StaffReceiptAlarmsClientProps["family"],
  branchId?: string,
) {
  if (family === "assessment") return generateAssessmentAlarms(branchId);
  if (family === "birthday") return generateBirthdayAlarms(branchId);
  if (family === "contract") return generateContractAlarms(branchId);
  if (family === "insurance") return generateInsuranceAlarms(branchId);
  if (family === "vaccination") return generateVaccinationAlarms(branchId);
  return generateMedicineAlarms(branchId);
}

async function markViewedForFamily(
  family: StaffReceiptAlarmsClientProps["family"],
  alarmId: string,
) {
  if (family === "assessment") return markAssessmentAlarmViewed(alarmId);
  if (family === "birthday") return markBirthdayAlarmViewed(alarmId);
  if (family === "contract") return markContractAlarmViewed(alarmId);
  if (family === "insurance") return markInsuranceAlarmViewed(alarmId);
  if (family === "vaccination") return markVaccinationAlarmViewed(alarmId);
  return markMedicineAlarmViewed(alarmId);
}

async function markAllViewedForFamily(
  family: StaffReceiptAlarmsClientProps["family"],
) {
  if (family === "assessment") return markAllAssessmentAlarmsViewed();
  if (family === "birthday") return markAllBirthdayAlarmsViewed();
  if (family === "contract") return markAllContractAlarmsViewed();
  if (family === "insurance") return markAllInsuranceAlarmsViewed();
  if (family === "vaccination") return markAllVaccinationAlarmsViewed();
  return markAllMedicineAlarmsViewed();
}

export function StaffReceiptAlarmsClient({
  family,
  alarms,
  history,
  branches,
  showHeader = true,
}: StaffReceiptAlarmsClientProps) {
  const copy = familyCopy[family];
  const Icon = copy.icon;
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => alarms.filter((alarm) => !alarm.isRead).length,
    [alarms],
  );

  const filteredAlarms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return alarms.filter((alarm) => {
      if (statusFilter !== "ALL" && alarm.status !== statusFilter) return false;
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
  }, [alarms, branchFilter, dateFrom, dateTo, search, statusFilter]);

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

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerationStatus(null);
    const result = await generateForFamily(
      family,
      branchFilter === "ALL" ? undefined : branchFilter,
    );
    setIsGenerating(false);

    if (result.success && result.data) {
      setGenerationStatus(formatGenerationStatus(family, result.data));
      router.refresh();
      return;
    }

    setGenerationStatus(result.error ?? copy.generationFailure);
  }

  function markViewed(alarmId: string) {
    startTransition(async () => {
      const result = await markViewedForFamily(family, alarmId);
      if (!result.success) {
        toast.error(result.error ?? "Could not update notification");
        return;
      }
      toast.success(`${copy.breadcrumb} notification marked viewed`);
      router.refresh();
    });
  }

  function markSelectedViewed(rows: StaffReceiptAlarm[]) {
    const unreadIds = rows
      .filter((row) => !row.isRead)
      .map((row) => row.id);
    if (unreadIds.length === 0) return;

    startTransition(async () => {
      let updated = 0;
      for (const alarmId of unreadIds) {
        const result = await markViewedForFamily(family, alarmId);
        if (result.success) updated += result.data?.count ?? 0;
      }
      toast.success(`${updated} ${family} notification${updated === 1 ? "" : "s"} marked viewed`);
      router.refresh();
    });
  }

  function markAllViewed() {
    startTransition(async () => {
      const result = await markAllViewedForFamily(family);
      if (!result.success) {
        toast.error(result.error ?? "Could not update notifications");
        return;
      }
      const count = result.data?.count ?? 0;
      toast.success(`${count} ${family} notification${count === 1 ? "" : "s"} marked viewed`);
      router.refresh();
    });
  }

  const alarmColumns: ColumnDef<StaffReceiptAlarm>[] = [
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
          <Icon className={`mt-0.5 size-4 shrink-0 ${copy.iconClass}`} />
          <p className="font-medium text-foreground">
            {row.original.details || "-"}
          </p>
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                asChild
              >
                <Link href={row.original.actionHref}>
                  <ExternalLink className="size-4" />
                </Link>
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

  const historyColumns: ColumnDef<StaffReceiptAlarmHistory>[] = [
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
      cell: ({ row }) => (
        <Badge className={statusClasses[row.original.type] ?? ""} variant="outline">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "content",
      header: ({ column }) => (
        <SortableHeader column={column}>Content</SortableHeader>
      ),
      cell: ({ row }) => (
        <p className="min-w-[260px] font-medium text-foreground">
          {row.original.content || "-"}
        </p>
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

  const markAllViewedButton = (
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
  );

  return (
    <>
      {showHeader && (
        <PageHeader
          title={copy.title}
          description={copy.description}
          breadcrumbs={[
            { label: "Notifications", href: "/alarms" },
            { label: copy.breadcrumb },
          ]}
          actions={markAllViewedButton}
        />
      )}

      <div className={showHeader ? "space-y-4 p-4 md:p-6" : "space-y-4"}>
        <Tabs defaultValue="teachers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="teachers">
              {copy.listingLabel ?? "Teachers"}
              {unreadCount > 0 && (
                <Badge className="ml-1 bg-primary/10 text-primary">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">{copy.historyTitle}</TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div role="search" className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.searchPlaceholder}
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
              {!showHeader && markAllViewedButton}
              {generationStatus && (
                <span className="text-sm text-muted-foreground">
                  {generationStatus}
                </span>
              )}
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
                  icon={Icon}
                  title={copy.emptyTitle}
                  description={copy.emptyDescription}
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
                  placeholder={copy.historyPlaceholder}
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
                  title={`No ${family} history`}
                  description={`${copy.historyTitle} matching the current filters will appear here.`}
                />
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
