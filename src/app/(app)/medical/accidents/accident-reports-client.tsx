"use client";

import { useState, useMemo } from "react";
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
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  FileClock,
  FileEdit,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { deleteMedicalForm } from "@/lib/actions/medical";

// --- Types ---

type AccidentStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface AccidentReportRow {
  id: string;
  childId: string;
  childName: string;
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
}

// --- Avatar helpers ---

const avatarColors = [
  "bg-[#4F46E5]/15 text-[#4F46E5]",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-[#059669]/15 text-[#059669]",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-[#0B9178]/10 text-[#0B9178]",
  "bg-orange-100 text-orange-700",
];

function getInitials(name: string) {
  const parts = name.split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// --- Badge Helpers ---

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "Minor":
      return (
        <Badge className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <ShieldCheck className="size-3" />
          Minor
        </Badge>
      );
    case "Moderate":
      return (
        <Badge className="gap-1 bg-orange-50 text-orange-700 border-orange-200">
          <ShieldAlert className="size-3" />
          Moderate
        </Badge>
      );
    case "Severe":
      return (
        <Badge className="gap-1 bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="size-3" />
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

function getStatusBadge(status: AccidentStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge className="gap-1 bg-slate-100 text-slate-600 border-slate-200">
          <FileEdit className="size-3" />
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <FileClock className="size-3" />
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="gap-1 bg-[#059669]/10 text-[#059669] border-[#059669]/20">
          <FileCheck className="size-3" />
          Reviewed
        </Badge>
      );
  }
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<AccidentReportRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Delete handler ---

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteMedicalForm(deleteTarget.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Accident report for ${deleteTarget.childName} deleted.`);
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete accident report.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  // --- Column Definitions ---

  const columns: ColumnDef<AccidentReportRow>[] = [
    {
      accessorKey: "childName",
      header: "Child Name",
      cell: ({ row }) => {
        const name = row.original.childName;
        return (
          <div className="flex items-center gap-2.5">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(name)}`}>
              {getInitials(name)}
            </div>
            <span className="font-medium text-foreground">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {format(new Date(row.original.date), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 text-orange-400" />
          {row.original.location || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "injuryType",
      header: "Injury Type",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.injuryType || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => getSeverityBadge(row.original.severity),
    },
    {
      accessorKey: "firstAidGiven",
      header: "First Aid",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
          {row.original.firstAidGiven || "\u2014"}
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
        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-normal">
          {row.original.branchName}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
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
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
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
