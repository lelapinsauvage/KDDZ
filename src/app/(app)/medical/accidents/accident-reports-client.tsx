"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
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
  AlertTriangle,
} from "lucide-react";
import { deleteAccidentReport } from "@/lib/actions/medical";
import { getAvatarColor, getInitials } from "@/components/children/children-columns";

// --- Types ---

type AccidentStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface AccidentReportRow {
  id: string;
  childId: string;
  childName: string;
  firstName: string;
  lastName: string;
  accidentCause: string;
  date: string;
  time: string;
  location: string;
  description: string;
  injuryType: string;
  severity: string;
  firstAidGiven: string;
  parentNotified: boolean;
  status: AccidentStatus;
  branchId: string;
  branchName: string;
  className: string;
}

// --- Helpers ---

function formatDate(date: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// --- Props ---

interface AccidentReportsClientProps {
  reports: AccidentReportRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

// --- Page Component ---

export function AccidentReportsClient({
  reports,
  branches,
}: AccidentReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<AccidentReportRow | null>(null);

  // --- Delete handler ---

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteAccidentReport(deleteTarget.id);
      if (result.success) {
        toast.success(`Accident report for ${deleteTarget.childName} deleted.`);
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete accident report.");
        setDeleteTarget(null);
      }
    });
  }

  // --- Columns (matching old PHP: Image, F Name, L Name, Cause, Branch, Class, Place, First Aid, Date, Action) ---

  const columns: ColumnDef<AccidentReportRow>[] = [
    {
      id: "avatar",
      header: "Image",
      cell: ({ row }) => {
        const { firstName, lastName } = row.original;
        const fullName = `${firstName} ${lastName}`;
        return (
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(fullName)}`}>
            {getInitials(firstName, lastName)}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "firstName",
      header: "F Name",
      cell: ({ row }) => (
        <Link
          href={`/medical/accidents/${row.original.id}`}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {row.original.firstName}
        </Link>
      ),
    },
    {
      accessorKey: "lastName",
      header: "L Name",
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.lastName}</span>
      ),
    },
    {
      accessorKey: "accidentCause",
      header: "Cause",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
          {row.original.accidentCause || "-"}
        </span>
      ),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.branchName || "-"}</span>
      ),
    },
    {
      accessorKey: "className",
      header: "Class",
      cell: ({ row }) => {
        const name = row.original.className;
        if (!name) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="secondary" className="font-normal">{name}</Badge>;
      },
    },
    {
      accessorKey: "location",
      header: "Place",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.location || "-"}
        </span>
      ),
    },
    {
      accessorKey: "firstAidGiven",
      header: "First Aid",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
          {row.original.firstAidGiven || "-"}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.date)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const report = row.original;
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
                <Link href={`/medical/accidents/${report.id}`}>
                  <Eye className="size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/medical/accidents/${report.id}`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteTarget(report)}
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

  // --- Filtering ---

  const filteredData = useMemo(() => {
    let data = reports;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.childName.toLowerCase().includes(lower) ||
          r.description.toLowerCase().includes(lower) ||
          r.location.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((r) => r.branchId === branchFilter);
    }

    return data;
  }, [reports, search, statusFilter, branchFilter]);

  return (
    <>
      <PageHeader
        title="Accident Reports"
        breadcrumbs={[
          { label: "Health", href: "/medical/general" },
          { label: "Accidents" },
        ]}
        actions={
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/medical/accidents/new">
              <Plus className="mr-1 size-4" />
              Add New
            </Link>
          </Button>
        }
      />
      <div className="p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative max-w-sm flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child, description or location..."
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

        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No accident reports found"
            description="No accident reports match your current filters."
          />
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Accident Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the accident report for{" "}
              <strong>{deleteTarget?.childName}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
