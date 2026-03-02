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
  Loader2,
  Stethoscope,
} from "lucide-react";
import { deleteMedicalForm } from "@/lib/actions/medical";
import { toast } from "sonner";

// --- Types ---

interface GeneralFormRow {
  id: string;
  childId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string;
  schoolYearId: string | null;
  yearLabel: string;
  createdAt: string;
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

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
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

interface MedicalGeneralClientProps {
  forms: GeneralFormRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; branchId: string }>;
  schoolYears: Array<{ id: string; label: string }>;
}

// --- Page Component ---

export function MedicalGeneralClient({
  forms,
  branches,
  classes,
  schoolYears,
}: MedicalGeneralClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Filtering ---

  const filteredData = useMemo(() => {
    let data = forms;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (f) =>
          f.firstName.toLowerCase().includes(lower) ||
          f.lastName.toLowerCase().includes(lower)
      );
    }

    if (branchFilter !== "all") {
      data = data.filter((f) => f.branchId === branchFilter);
    }

    if (classFilter !== "all") {
      data = data.filter((f) => f.classId === classFilter);
    }

    if (yearFilter !== "all") {
      data = data.filter((f) => f.schoolYearId === yearFilter);
    }

    if (genderFilter !== "all") {
      data = data.filter((f) => f.gender === genderFilter);
    }

    return data;
  }, [forms, search, branchFilter, classFilter, yearFilter, genderFilter]);

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

  // --- Columns (matching old PHP: Image, F Name, L Name, DOB, Branch, Class, Year, Gender, Created Date, Action) ---

  const columns: ColumnDef<GeneralFormRow>[] = [
    {
      id: "avatar",
      header: "Image",
      cell: ({ row }) => {
        const { firstName, lastName } = row.original;
        const fullName = `${firstName} ${lastName}`;
        return (
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(fullName)}`}>
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
          href={`/medical/general/${row.original.id}`}
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
      accessorKey: "yearLabel",
      header: "Year",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.yearLabel || "-"}
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
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
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
          { label: "Health", href: "/medical/general" },
          { label: "General" },
        ]}
        actions={
          <Button asChild>
            <Link href="/medical/general/new">
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
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {schoolYears.map((y) => (
                <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="MALE">Boy</SelectItem>
              <SelectItem value="FEMALE">Girl</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No general medical forms found"
            description="No general medical forms match your current filters."
          />
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
