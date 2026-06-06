"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AlarmActionsCell } from "@/components/alarms/alarm-actions-cell";
import { generateHolidayAlarms } from "@/lib/actions/alarms";

interface EventAlarm {
  id: string;
  title: string;
  message: string;
  date: string;
  type: string;
  typeColor: string;
  source: "Holiday Alarm" | "Scheduled Event";
  branchId: string;
  branch: string;
}

interface EventAlarmsClientProps {
  events: EventAlarm[];
  branches: { id: string; name: string }[];
}

export function EventAlarmsClient({ events, branches }: EventAlarmsClientProps) {
  const router = useRouter();
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return events;
    return events.filter((e) => e.branchId === branchFilter || e.branch === "All Branches");
  }, [branchFilter, events]);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerationStatus(null);
    const result = await generateHolidayAlarms(
      branchFilter === "ALL" ? undefined : branchFilter,
    );
    setIsGenerating(false);

    if (result.success && result.data) {
      const {
        holidaysMatched,
        holidaysScanned,
        alarmsCreated,
        notificationsCreated,
        skippedExisting,
      } = result.data;
      setGenerationStatus(
        `Matched ${holidaysMatched} of ${holidaysScanned} holiday${holidaysScanned === 1 ? "" : "s"}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing.`,
      );
      router.refresh();
      return;
    }

    setGenerationStatus(result.error ?? "Holiday alarm generation failed.");
  }

  const columns: ColumnDef<EventAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Event Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span className="font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: "message",
        header: "Details",
        cell: ({ row }) => row.original.message || "\u2014",
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) =>
          new Date(row.original.date + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            style={{ backgroundColor: row.original.typeColor + "20", color: row.original.typeColor }}
          >
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.source}</Badge>
        ),
      },
      { accessorKey: "branch", header: "Branch" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          row.original.source === "Holiday Alarm" ? (
            <AlarmActionsCell id={row.original.id} />
          ) : (
            <Button asChild variant="ghost" size="icon" className="size-8">
              <Link href="/settings/events">
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Event Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Events" },
        ]}
      />
      <div className="space-y-4 p-4 md:p-6">
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
            {isGenerating ? "Generating..." : "Generate Holiday Alarms"}
          </Button>
          {generationStatus && (
            <span className="text-sm text-muted-foreground">{generationStatus}</span>
          )}
        </div>
        {filtered.length > 0 ? (
          <DataTable columns={columns} data={filtered} searchKey="title" searchPlaceholder="Search events..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No upcoming events found.
          </div>
        )}
      </div>
    </>
  );
}
