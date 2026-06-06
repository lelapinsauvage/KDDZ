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
import { FileText, RefreshCw } from "lucide-react";
import { AlarmActionsCell } from "@/components/alarms/alarm-actions-cell";
import { generateContractAlarms } from "@/lib/actions/alarms";

interface ContractAlarm {
  id: string;
  message: string;
  dueDate: string;
  daysLeft: number;
  status: "Expired" | "Expiring Soon" | "Active";
  branchId: string;
  branch: string;
}

interface ContractAlarmsClientProps {
  alarms: ContractAlarm[];
  branches: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  Expired: "bg-red-100 text-red-700",
  "Expiring Soon": "bg-amber-100 text-amber-700",
  Active: "bg-[#059669]/15 text-[#059669]",
};

export function ContractAlarmsClient({ alarms, branches }: ContractAlarmsClientProps) {
  const router = useRouter();
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return alarms.filter((c) => {
      if (branchFilter !== "ALL" && c.branchId !== branchFilter) return false;
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      return true;
    });
  }, [branchFilter, statusFilter, alarms]);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerationStatus(null);
    const result = await generateContractAlarms(
      branchFilter === "ALL" ? undefined : branchFilter,
    );
    setIsGenerating(false);

    if (result.success && result.data) {
      const {
        documentsMatched,
        alarmsCreated,
        notificationsCreated,
        skippedExisting,
        skippedOutsideWindow,
      } = result.data;
      setGenerationStatus(
        `Matched ${documentsMatched}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing, ${skippedOutsideWindow} outside window.`,
      );
      router.refresh();
      return;
    }

    setGenerationStatus(result.error ?? "Contract generation failed.");
  }

  const columns: ColumnDef<ContractAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="font-medium">{row.original.message || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Contract End",
        cell: ({ row }) => {
          if (!row.original.dueDate) return "—";
          return new Date(row.original.dueDate + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        },
      },
      {
        accessorKey: "daysLeft",
        header: "Days Left",
        cell: ({ row }) => {
          const d = row.original.daysLeft;
          return (
            <span className={d < 0 ? "font-medium text-red-600" : ""}>
              {d < 0 ? `${Math.abs(d)} overdue` : `${d} days`}
            </span>
          );
        },
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
    []
  );

  return (
    <>
      <PageHeader
        title="Contract Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Contracts" },
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
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
        {filtered.length > 0 ? (
          <DataTable columns={columns} data={filtered} searchKey="message" searchPlaceholder="Search contracts..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No contract alarms found.
          </div>
        )}
      </div>
    </>
  );
}
