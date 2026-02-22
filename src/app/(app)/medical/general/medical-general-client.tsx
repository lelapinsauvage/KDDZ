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
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { deleteMedicalForm } from "@/lib/actions/medical";
import { toast } from "sonner";

// --- Types ---

type FormStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface GeneralMedicalFormRow {
  id: string;
  childId: string;
  childName: string;
  date: string;
  status: FormStatus;
  branchId: string;
  branchName: string;
  doctor: string;
  bloodType: string;
  hasAllergies: boolean;
}

// --- Status helpers ---

function getStatusDot(status: FormStatus) {
  if (status === "REVIEWED" || status === "SUBMITTED") {
    return <span className="inline-block size-2 rounded-full bg-emerald-500" />;
  }
  return <span className="inline-block size-2 rounded-full bg-orange-400" />;
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

interface MedicalGeneralClientProps {
  forms: GeneralMedicalFormRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

// --- Page Component ---

export function MedicalGeneralClient({
  forms,
  total,
  branches,
}: MedicalGeneralClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Filtering ---

  const filteredData = useMemo(() => {
    let data = forms;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (f) =>
          f.childName.toLowerCase().includes(lower) ||
          f.doctor.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((f) => f.status === statusFilter);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((f) => f.branchId === branchFilter);
    }

    return data;
  }, [forms, search, statusFilter, branchFilter]);

  // --- Delete handler ---

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteMedicalForm(deleteId);
      if (result.success) {
        toast.success("Medical form deleted successfully.");
        setDeleteId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete medical form.");
        setDeleteId(null);
      }
    });
  }

  // --- Columns ---

  const columns: ColumnDef<GeneralMedicalFormRow>[] = [
    {
      accessorKey: "childName",
      header: "Child Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getStatusDot(row.original.status)}
          <span className="font-medium text-[#333]">{row.original.childName}</span>
        </div>
      ),
    },
    {
      accessorKey: "doctor",
      header: "Doctor",
      cell: ({ row }) => (
        <span className="text-sm text-[#333]">{row.original.doctor || "\u2014"}</span>
      ),
    },
    {
      accessorKey: "bloodType",
      header: "Blood Type",
      cell: ({ row }) => (
        <span className="text-sm text-[#333]">{row.original.bloodType || "\u2014"}</span>
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
          {row.original.branchName || "\u2014"}
        </Badge>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-[#333]">
          {format(new Date(row.original.date), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const form = row.original;
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
                <Link href={`/medical/general/${form.id}`}>
                  <Eye className="size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/medical/general/${form.id}`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteId(form.id)}
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
        title="General Medical Forms"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "General" },
        ]}
      />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child name or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[160px]">
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
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/medical/general/new" className="ml-auto">
            <Button style={{ background: "#1caf9a" }} className="text-white">
              <Plus className="size-4" />
              Add New
            </Button>
          </Link>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No general medical forms found.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this general medical form? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
