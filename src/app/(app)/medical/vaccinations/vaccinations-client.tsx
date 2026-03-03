"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
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
} from "lucide-react";
import { deleteVaccination } from "@/lib/actions/medical";
import { toast } from "sonner";
import { getInitials, getPastelAvatarColor } from "@/components/children/children-columns";

// --- Types ---

type VaccinationStatus = "Up to date" | "Overdue" | "Upcoming";

interface VaccinationRow {
  id: string;
  childId: string;
  childName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  nationality: string;
  gender: string | null;
  vaccine: string;
  dateGiven: string | null;
  nextDue: string | null;
  notes: string;
  vacStatus: VaccinationStatus;
  branchId: string;
  branchName: string;
  className: string;
}

function formatDate(date: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// --- Props ---

interface VaccinationsClientProps {
  vaccinations: VaccinationRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  hideHeader?: boolean;
}

// --- Page Component ---

export function VaccinationsClient({
  vaccinations,
  branches,
  hideHeader,
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

  // --- Columns (matching old PHP: Image, F Name, L Name, DOB, Branch, Class, Nationality, Gender, Date, Action) ---

  const columns: ColumnDef<VaccinationRow>[] = [
    {
      id: "avatar",
      header: "Image",
      cell: ({ row }) => {
        const { firstName, lastName } = row.original;
        const fullName = `${firstName} ${lastName}`;
        return (
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getPastelAvatarColor(fullName)}`}>
            {getInitials(firstName, lastName)}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <SortableHeader column={column}>First Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <Link
          href={`/medical/vaccinations/${row.original.id}`}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {row.original.firstName}
        </Link>
      ),
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <SortableHeader column={column}>Last Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.lastName}</span>
      ),
    },
    {
      accessorKey: "dateOfBirth",
      header: "DOB",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.dateOfBirth)}
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
      accessorKey: "nationality",
      header: "Nationality",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.nationality || "-"}
        </span>
      ),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => {
        const gender = row.original.gender;
        if (!gender) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full ${
                gender === "MALE" ? "bg-[#4F46E5]" : "bg-[#E11D48]"
              }`}
            />
            <span className="text-sm">{gender === "MALE" ? "Boy" : "Girl"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "dateGiven",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.dateGiven)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
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
      {!hideHeader && (
        <PageHeader
          title="Vaccination Records"
          breadcrumbs={[
            { label: "Health", href: "/medical/general" },
            { label: "Vaccinations" },
          ]}
          actions={
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/medical/vaccinations/new">
                <Plus className="mr-1 size-4" />
                Add New
              </Link>
            </Button>
          }
        />
      )}
      <div className={hideHeader ? "space-y-4" : "p-4 md:p-6 space-y-4"}>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
