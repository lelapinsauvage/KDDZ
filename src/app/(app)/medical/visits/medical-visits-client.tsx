"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
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
  CalendarCheck,
  Stethoscope,
  CalendarClock,
  FileCheck,
  FileClock,
  FileEdit,
} from "lucide-react";
import { format } from "date-fns";
import { deleteMedicalForm } from "@/lib/actions/medical";

// --- Types ---

type VisitStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface DoctorVisitRow {
  id: string;
  childId: string;
  childName: string;
  visitDate: string;
  doctor: string;
  reason: string;
  followUpDate: string | null;
  status: VisitStatus;
  branchId: string;
  branchName: string;
}

// --- Avatar helpers ---

const avatarColors = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-teal-100 text-teal-700",
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

function getStatusBadge(status: VisitStatus) {
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
        <Badge className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
          <FileCheck className="size-3" />
          Reviewed
        </Badge>
      );
  }
}

// --- Props ---

interface MedicalVisitsClientProps {
  visits: DoctorVisitRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

// --- Page Component ---

export function MedicalVisitsClient({
  visits,
  branches,
}: MedicalVisitsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const result = await deleteMedicalForm(deleteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Visit record deleted successfully.");
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete visit record.");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // --- Column Definitions ---

  const columns: ColumnDef<DoctorVisitRow>[] = [
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
      accessorKey: "visitDate",
      header: "Visit Date",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
          <CalendarCheck className="size-3.5 text-emerald-500" />
          {row.original.visitDate
            ? format(new Date(row.original.visitDate), "MMM d, yyyy")
            : "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "doctor",
      header: "Doctor",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Stethoscope className="size-3.5 text-blue-500" />
          {row.original.doctor || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
          {row.original.reason || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "followUpDate",
      header: "Follow-up Date",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          {row.original.followUpDate ? (
            <>
              <CalendarClock className="size-3.5 text-amber-500" />
              {format(new Date(row.original.followUpDate), "MMM d, yyyy")}
            </>
          ) : (
            "\u2014"
          )}
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
        const visit = row.original;
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
                <Link href={`/medical/visits/${visit.id}`}>
                  <Eye className="size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/medical/visits/${visit.id}`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteId(visit.id)}
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

  const filteredData = useMemo(() => {
    let data = visits;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (v) =>
          v.childName.toLowerCase().includes(lower) ||
          v.doctor.toLowerCase().includes(lower) ||
          v.reason.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((v) => v.status === statusFilter);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((v) => v.branchId === branchFilter);
    }

    return data;
  }, [visits, search, statusFilter, branchFilter]);

  return (
    <>
      <PageHeader
        title="Doctor Visits"
        breadcrumbs={[
          { label: "Health", href: "/medical/general" },
          { label: "Visits" },
        ]}
        actions={
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/medical/visits/new">
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
              placeholder="Search by child, doctor or reason..."
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
            icon={CalendarCheck}
            title="No doctor visits found"
            description="No doctor visit records match your current filters."
          />
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visit Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this visit record? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
