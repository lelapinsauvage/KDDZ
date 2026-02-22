"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  ArrowUpDown,
  Trash2,
  Calendar,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createAssessmentDate,
  deleteAssessmentDate,
} from "@/lib/actions/assessments";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";

interface AssessmentDateEntry {
  id: string;
  assessmentType: number;
  assessmentTypeName: string;
  branchId: string;
  branchName: string;
  scheduledDate: string;
}

interface BranchOption {
  id: string;
  name: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface AssessmentDatesClientProps {
  dates: AssessmentDateEntry[];
  branches: BranchOption[];
}

export default function AssessmentDatesClient({
  dates,
  branches,
}: AssessmentDatesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for new date
  const [newType, setNewType] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [newDate, setNewDate] = useState("");

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this assessment date?"))
      return;
    startTransition(async () => {
      await deleteAssessmentDate(id);
      router.refresh();
    });
  }

  function handleCreate() {
    if (!newType || !newBranch || !newDate) {
      alert("Please fill in all fields.");
      return;
    }
    startTransition(async () => {
      const result = await createAssessmentDate({
        assessmentType: parseInt(newType, 10),
        branchId: newBranch,
        scheduledDate: newDate,
      });
      if (result.error) {
        alert(result.error);
        return;
      }
      setDialogOpen(false);
      setNewType("");
      setNewBranch("");
      setNewDate("");
      router.refresh();
    });
  }

  const columns: ColumnDef<AssessmentDateEntry>[] = useMemo(
    () => [
      {
        accessorKey: "assessmentTypeName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Assessment Type
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-[#333]">
            {row.original.assessmentTypeName}
          </span>
        ),
      },
      {
        accessorKey: "branchName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Branch
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="bg-[#e8ecf1] text-[#555] font-normal"
          >
            {row.original.branchName}
          </Badge>
        ),
      },
      {
        accessorKey: "scheduledDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Scheduled Date
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-[#555]">
            <Calendar className="size-3.5" />
            {formatDate(row.original.scheduledDate)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(row.original.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="size-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Assessment Dates"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Assessments" },
          { label: "Assessment Dates" },
        ]}
      />

      <div className="space-y-4 p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[#6f7b8a]">
            {dates.length} scheduled assessment{dates.length !== 1 ? "s" : ""}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1caf9a" }}>
                <Plus className="mr-1 size-4" />
                Schedule Assessment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Assessment Date</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Assessment Type *</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ASSESSMENT_TYPE_NAMES).map(
                        ([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select value={newBranch} onValueChange={setNewBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scheduled Date *</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isPending}
                    style={{ background: "#1caf9a" }}
                  >
                    {isPending && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable columns={columns} data={dates} />
      </div>
    </>
  );
}
