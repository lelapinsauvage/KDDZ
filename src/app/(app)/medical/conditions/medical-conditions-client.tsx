"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteMedicalForm } from "@/lib/actions/medical";

// --- Types ---

type FormStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface MedicalConditionRow {
  id: string;
  childId: string;
  childName: string;
  conditionType: string;
  severity: string;
  diagnosisDate: string;
  status: FormStatus;
  branchId: string;
  branchName: string;
}

// --- Badge Helpers ---

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "Mild":
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          Mild
        </Badge>
      );
    case "Moderate":
      return (
        <Badge className="bg-orange-50 text-orange-700 border-orange-200">
          Moderate
        </Badge>
      );
    case "Severe":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          Severe
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {severity || "\u2014"}
        </Badge>
      );
  }
}

function getStatusBadge(status: FormStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Reviewed
        </Badge>
      );
  }
}

// --- Props ---

interface MedicalConditionsClientProps {
  conditions: MedicalConditionRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

// --- Page Component ---

export function MedicalConditionsClient({
  conditions,
  branches,
}: MedicalConditionsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = conditions;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (c) =>
          c.childName.toLowerCase().includes(lower) ||
          c.conditionType.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((c) => c.status === statusFilter);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((c) => c.branchId === branchFilter);
    }

    return data;
  }, [conditions, search, statusFilter, branchFilter]);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteMedicalForm(deleteId);
      if (result.success) {
        toast.success("Medical condition deleted successfully.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete medical condition.");
      }
      setDeleteId(null);
    });
  }

  // --- Column Definitions ---

  const columns: ColumnDef<MedicalConditionRow>[] = [
    {
      accessorKey: "childName",
      header: "Child Name",
      cell: ({ row }) => (
        <span className="font-medium text-[#333]">{row.original.childName}</span>
      ),
    },
    {
      accessorKey: "conditionType",
      header: "Condition Type",
      cell: ({ row }) => (
        <span className="text-sm text-[#333]">{row.original.conditionType || "\u2014"}</span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => getSeverityBadge(row.original.severity),
    },
    {
      accessorKey: "diagnosisDate",
      header: "Diagnosis Date",
      cell: ({ row }) => (
        <span className="text-sm text-[#6f7b8a]">
          {row.original.diagnosisDate
            ? format(new Date(row.original.diagnosisDate), "MMM d, yyyy")
            : "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-[#eef0f3] text-[#6f7b8a] font-normal">
          {row.original.branchName}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const condition = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/medical/conditions/${condition.id}`}>
                  <Eye className="size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/medical/conditions/${condition.id}`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteId(condition.id)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Medical Conditions"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Conditions" },
        ]}
      />
      <div className="p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative max-w-sm flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child or condition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/medical/conditions/new" className="ml-auto">
            <Button style={{ background: "#1caf9a" }} className="text-white">
              <Plus className="size-4" />
              Add New
            </Button>
          </Link>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No medical conditions found.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Condition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medical condition record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
