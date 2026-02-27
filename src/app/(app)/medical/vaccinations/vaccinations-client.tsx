"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Syringe,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { deleteVaccination } from "@/lib/actions/medical";
import { toast } from "sonner";

// --- Types ---

type VaccinationStatus = "Up to date" | "Overdue" | "Upcoming";

interface VaccinationRow {
  id: string;
  childId: string;
  childName: string;
  vaccine: string;
  dateGiven: string | null;
  nextDue: string | null;
  notes: string;
  vacStatus: VaccinationStatus;
  branchId: string;
  branchName: string;
}

// --- Avatar helpers ---

const avatarColors = [
  "bg-[#8B7355]/15 text-[#8B7355]",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-[#6B8F71]/15 text-[#6B8F71]",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-[#C35A2C]/10 text-[#C35A2C]",
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

function getVaccinationStatusBadge(status: VaccinationStatus) {
  switch (status) {
    case "Up to date":
      return (
        <Badge className="gap-1 bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20">
          <CheckCircle2 className="size-3" />
          Up to date
        </Badge>
      );
    case "Upcoming":
      return (
        <Badge className="gap-1 bg-orange-50 text-orange-700 border-orange-200">
          <Clock className="size-3" />
          Upcoming
        </Badge>
      );
    case "Overdue":
      return (
        <Badge className="gap-1 bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="size-3" />
          Overdue
        </Badge>
      );
  }
}

// --- Props ---

interface VaccinationsClientProps {
  vaccinations: VaccinationRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

// --- Page Component ---

export function VaccinationsClient({
  vaccinations,
  branches,
}: VaccinationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = vaccinations;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (v) =>
          v.childName.toLowerCase().includes(lower) ||
          v.vaccine.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((v) => v.vacStatus === statusFilter);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((v) => v.branchId === branchFilter);
    }

    return data;
  }, [vaccinations, search, statusFilter, branchFilter]);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteVaccination(deleteId);
      if (result.success) {
        toast.success("Vaccination record deleted");
      } else {
        toast.error(result.error || "Failed to delete vaccination");
      }
      setDeleteId(null);
      router.refresh();
    });
  }

  const columns: ColumnDef<VaccinationRow>[] = [
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
      accessorKey: "vaccine",
      header: "Vaccine",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
          <Syringe className="size-3.5 text-[#C35A2C]" />
          {row.original.vaccine}
        </span>
      ),
    },
    {
      accessorKey: "dateGiven",
      header: "Date Given",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.dateGiven
            ? format(new Date(row.original.dateGiven), "MMM d, yyyy")
            : "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "nextDue",
      header: "Next Due",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.nextDue
            ? format(new Date(row.original.nextDue), "MMM d, yyyy")
            : "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "vacStatus",
      header: "Status",
      cell: ({ row }) => getVaccinationStatusBadge(row.original.vacStatus),
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
        const record = row.original;
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
                <Link href={`/medical/vaccinations/${record.id}`}>
                  <Eye className="size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/medical/vaccinations/${record.id}`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteId(record.id)}
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
        title="Vaccination Records"
        breadcrumbs={[
          { label: "Health", href: "/medical/general" },
          { label: "Vaccinations" },
        ]}
        actions={
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/medical/vaccinations/new">
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
              placeholder="Search by child or vaccine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Up to date">Up to date</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            icon={Syringe}
            title="No vaccination records found"
            description="No vaccination records match your current filters."
          />
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vaccination Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vaccination record? This action cannot be undone.
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
