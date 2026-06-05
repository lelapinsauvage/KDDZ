"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, RefreshCw, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { generateVaccinationAlarms } from "@/lib/actions/alarms";

interface VaccinationAlarm {
  id: string;
  childId: string;
  childName: string;
  vaccine: string;
  dueDate: string;
  daysUntilDue: number;
  branchId: string;
  branch: string;
  className: string;
  message: string;
}

interface VaccinationsClientProps {
  vaccinations: VaccinationAlarm[];
  branches: { id: string; name: string }[];
}

export function VaccinationsClient({ vaccinations, branches }: VaccinationsClientProps) {
  const router = useRouter();
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return vaccinations;
    return vaccinations.filter((v) => v.branchId === branchFilter);
  }, [branchFilter, vaccinations]);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerationStatus(null);
    const result = await generateVaccinationAlarms(
      branchFilter === "ALL" ? undefined : branchFilter,
    );
    setIsGenerating(false);

    if (result.success && result.data) {
      const { remindersMatched, alarmsCreated, notificationsCreated, skippedExisting } =
        result.data;
      setGenerationStatus(
        `Matched ${remindersMatched}; created ${alarmsCreated} alarm${alarmsCreated === 1 ? "" : "s"} and ${notificationsCreated} notification${notificationsCreated === 1 ? "" : "s"}; skipped ${skippedExisting} existing.`,
      );
      router.refresh();
      return;
    }

    setGenerationStatus(result.error ?? "Vaccination generation failed.");
  }

  const columns: ColumnDef<VaccinationAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Syringe className="size-4 text-blue-500" />
            <span className="font-medium">{row.original.childName}</span>
          </div>
        ),
      },
      { accessorKey: "vaccine", header: "Vaccine" },
      { accessorKey: "message", header: "Reminder" },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) =>
          new Date(row.original.dueDate + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      },
      {
        accessorKey: "daysUntilDue",
        header: "Status",
        cell: ({ row }) => {
          const days = row.original.daysUntilDue;
          return (
            <Badge className="bg-amber-100 text-amber-700">
              {days === 1 ? "Tomorrow" : `In ${days} days`}
            </Badge>
          );
        },
      },
      { accessorKey: "branch", header: "Branch" },
      { accessorKey: "className", header: "Class" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href={`/children/${row.original.childId}/medical`}>
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
        title="Vaccination Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Vaccinations" },
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
          <DataTable columns={columns} data={filtered} searchKey="childName" searchPlaceholder="Search children..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No vaccination reminders found.
          </div>
        )}
      </div>
    </>
  );
}
