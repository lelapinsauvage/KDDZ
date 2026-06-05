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
import { Pill, RefreshCw } from "lucide-react";
import { AlarmActionsCell } from "@/components/alarms/alarm-actions-cell";
import { generateMedicineAlarms } from "@/lib/actions/alarms";

interface MedicineAlarm {
  id: string;
  message: string;
  dueDate: string;
  branchId: string;
  branch: string;
  isActive: boolean;
}

interface MedicineAlarmsClientProps {
  alarms: MedicineAlarm[];
  branches: { id: string; name: string }[];
}

export function MedicineAlarmsClient({ alarms, branches }: MedicineAlarmsClientProps) {
  const router = useRouter();
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return alarms;
    return alarms.filter((m) => m.branchId === branchFilter);
  }, [branchFilter, alarms]);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerationStatus(null);
    const result = await generateMedicineAlarms(
      branchFilter === "ALL" ? undefined : branchFilter,
    );
    setIsGenerating(false);

    if (result.success && result.data) {
      const {
        entriesMatched,
        alarmsCreated,
        notificationsCreated,
        skippedExisting,
        skippedExpired,
      } = result.data;
      setGenerationStatus(
        `Matched ${entriesMatched}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing, ${skippedExpired} expired.`,
      );
      router.refresh();
      return;
    }

    setGenerationStatus(result.error ?? "Medicine generation failed.");
  }

  const columns: ColumnDef<MedicineAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Pill className="size-4 text-purple-500" />
            <span className="font-medium">{row.original.message || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
          if (!row.original.dueDate) return "—";
          const dt = new Date(row.original.dueDate + "T00:00:00");
          return (
            <span className="text-sm">
              {dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={row.original.isActive ? "bg-amber-100 text-amber-700" : "bg-[#059669]/15 text-[#059669]"}>
            {row.original.isActive ? "Active" : "Resolved"}
          </Badge>
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
        title="Medicine Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Medicine" },
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
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
          {generationStatus && (
            <span className="text-sm text-muted-foreground">{generationStatus}</span>
          )}
        </div>
        {filtered.length > 0 ? (
          <DataTable columns={columns} data={filtered} searchKey="message" searchPlaceholder="Search alarms..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No medicine alarms found.
          </div>
        )}
      </div>
    </>
  );
}
