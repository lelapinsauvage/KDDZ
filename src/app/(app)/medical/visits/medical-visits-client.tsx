"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
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
  Eye,
  Pencil,
  Trash2,
  Loader2,
  CalendarCheck,
} from "lucide-react";
import { deleteMedicalForm } from "@/lib/actions/medical";
import { getInitials, getPastelAvatarColor } from "@/components/children/children-columns";

// --- Types ---

interface VisitRow {
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

function formatDate(date: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// --- Props ---

interface MedicalVisitsClientProps {
  visits: VisitRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; branchId: string }>;
  schoolYears: Array<{ id: string; label: string }>;
}

// --- Page Component ---

export function MedicalVisitsClient({
  visits,
  branches,
  classes,
  schoolYears,
}: MedicalVisitsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
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

  // --- Columns (matching old PHP: Image, F Name, L Name, DOB, Branch, Class, Year, Gender, Created Date, Action) ---

  const columns: ColumnDef<VisitRow>[] = [
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
          href={`/medical/visits/${row.original.id}`}
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
      header: ({ column }) => (
        <SortableHeader column={column}>DOB</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.dateOfBirth)}
        </span>
      ),
    },
    {
      accessorKey: "branchName",
      header: ({ column }) => (
        <SortableHeader column={column}>Branch</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.branchName || "-"}</span>
      ),
    },
    {
      accessorKey: "className",
      header: ({ column }) => (
        <SortableHeader column={column}>Class</SortableHeader>
      ),
      cell: ({ row }) => {
        const name = row.original.className;
        if (!name) return <span className="text-muted-foreground">-</span>;
        return <Badge className="bg-[#7239ea] text-white border-transparent font-normal">{name}</Badge>;
      },
    },
    {
      accessorKey: "yearLabel",
      header: ({ column }) => (
        <SortableHeader column={column}>Year</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.yearLabel || "-"}
        </span>
      ),
    },
    {
      accessorKey: "gender",
      header: ({ column }) => (
        <SortableHeader column={column}>Gender</SortableHeader>
      ),
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
      header: ({ column }) => (
        <SortableHeader column={column}>Created Date</SortableHeader>
      ),
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
        const visit = row.original;
        return (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
              <Link href={`/medical/visits/${visit.id}`}>
                <Eye className="size-4 text-muted-foreground" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
              <Link href={`/medical/visits/${visit.id}`}>
                <Pencil className="size-4 text-muted-foreground" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteId(visit.id)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
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
          v.firstName.toLowerCase().includes(lower) ||
          v.lastName.toLowerCase().includes(lower)
      );
    }

    if (branchFilter !== "all") {
      data = data.filter((v) => v.branchId === branchFilter);
    }

    if (classFilter !== "all") {
      data = data.filter((v) => v.classId === classFilter);
    }

    if (yearFilter !== "all") {
      data = data.filter((v) => v.schoolYearId === yearFilter);
    }

    if (genderFilter !== "all") {
      data = data.filter((v) => v.gender === genderFilter);
    }

    return data;
  }, [visits, search, branchFilter, classFilter, yearFilter, genderFilter]);

  return (
    <>
      <PageHeader
        title="Doctor Visits"
        breadcrumbs={[
          { label: "Health", href: "/medical/general" },
          { label: "Visits" },
        ]}
      />
      <Card className="m-4 md:m-6">
        <CardHeader>
          <CardTitle className="text-lg">Doctor Visits</CardTitle>
          <CardAction>
            <Button asChild>
              <Link href="/medical/visits/new">
                <Plus className="mr-1 size-4" />
                Add New
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
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
              icon={CalendarCheck}
              title="No doctor visits found"
              description="No doctor visit records match your current filters."
            />
          ) : (
            <DataTable columns={columns} data={filteredData} />
          )}
        </CardContent>
      </Card>

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
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
