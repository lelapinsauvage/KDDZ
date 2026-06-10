"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarCheck,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { deleteMedicalForm } from "@/lib/actions/medical";
import type { ExportColumn } from "@/lib/export";

export interface MedicalVisitRow {
  id: string;
  legacyFormId: number | null;
  childId: string;
  childNumber: string;
  photo: string | null;
  firstName: string;
  lastName: string;
  childName: string;
  dateOfBirth: string | null;
  gender: string | null;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string;
  schoolYearId: string | null;
  yearLabel: string;
  visitDate: string;
  createdAt: string;
}

interface MedicalVisitsClientProps {
  visits: MedicalVisitRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; branchId: string }>;
  schoolYears: Array<{ id: string; label: string }>;
}

interface LegacyFilters {
  formId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  className: string;
  year: string;
  gender: string;
  createdFrom: string;
  createdTo: string;
}

const legacyPageSizeOptions = [10, 20, 50, 100, 150, "all"] as const;

const exportColumns: ExportColumn[] = [
  { header: "Form #", key: "legacyFormId" },
  { header: "F Name", key: "firstName" },
  { header: "L Name", key: "lastName" },
  {
    header: "DOB",
    key: "dateOfBirth",
    transform: (value) => formatDate(value as string | null),
  },
  { header: "Branch", key: "branchName" },
  { header: "Class", key: "className" },
  { header: "Year", key: "yearLabel" },
  {
    header: "Gender",
    key: "gender",
    transform: (value) => formatGender(value as string | null),
  },
  {
    header: "Date",
    key: "createdAt",
    transform: (value) => formatDate(value as string | null),
  },
];

function childPhotoSrc(photo: string | null) {
  if (!photo || photo === "default.jpg") return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  if (photo.includes("/")) return `/${photo.replace(/^\/+/, "")}`;
  return `/images/EmpPhoto/${photo}`;
}

function formatDate(date: string | null) {
  if (!date) return "-";
  const isoDate = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const parsed = isoDate
    ? new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]))
    : new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return format(parsed, "MMM d, yyyy");
}

function formatGender(gender: string | null) {
  if (!gender) return "-";
  const normalized = gender.toLowerCase();
  if (normalized === "male" || normalized === "boy") return "Male";
  if (normalized === "female" || normalized === "girl") return "Female";
  return gender;
}

function genderBadgeClass(gender: string | null) {
  const normalized = formatGender(gender).toLowerCase();
  if (normalized === "male") return "bg-[#327ad5] text-white border-transparent";
  if (normalized === "female") return "bg-[#d64690] text-white border-transparent";
  return "bg-[#707070] text-white border-transparent";
}

function dateValue(date: string) {
  const parsed = new Date(date);
  parsed.setHours(0, 0, 0, 0);
  return parsed.getTime();
}

function addOneDay(date: string) {
  const parsed = new Date(date);
  parsed.setHours(0, 0, 0, 0);
  parsed.setDate(parsed.getDate() + 1);
  return parsed.getTime();
}

function ChildPhoto({ visit }: { visit: MedicalVisitRow }) {
  const [failed, setFailed] = useState(false);
  const src = childPhotoSrc(visit.photo);

  if (!src || failed) {
    return (
      <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
        <User className="size-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative size-10 overflow-hidden rounded-full border bg-muted">
      <Image
        src={src}
        alt={visit.childName}
        fill
        sizes="40px"
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function MedicalVisitsClient({
  visits,
  branches,
  classes,
  schoolYears,
}: MedicalVisitsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [legacyFilters, setLegacyFilters] = useState<LegacyFilters>({
    formId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    className: "",
    year: "",
    gender: "",
    createdFrom: "",
    createdTo: "",
  });

  const filteredClasses = useMemo(
    () =>
      branchFilter === "all"
        ? classes
        : classes.filter((classItem) => classItem.branchId === branchFilter),
    [branchFilter, classes],
  );

  const filteredData = useMemo(() => {
    const from = legacyFilters.createdFrom ? dateValue(legacyFilters.createdFrom) : null;
    const to = legacyFilters.createdTo ? addOneDay(legacyFilters.createdTo) : null;
    let data = [...visits].sort((left, right) => {
      const rightId = right.legacyFormId ?? Number.NEGATIVE_INFINITY;
      const leftId = left.legacyFormId ?? Number.NEGATIVE_INFINITY;
      if (rightId !== leftId) return rightId - leftId;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((visit) =>
        [
          visit.legacyFormId,
          visit.childNumber,
          visit.firstName,
          visit.lastName,
          visit.dateOfBirth,
          visit.branchName,
          visit.className,
          visit.yearLabel,
          formatGender(visit.gender),
          visit.visitDate,
          visit.createdAt,
        ]
          .join(" ")
          .toLowerCase()
          .includes(lower),
      );
    }

    if (branchFilter !== "all") {
      data = data.filter((visit) => visit.branchId === branchFilter);
    }

    if (classFilter !== "all") {
      data = data.filter((visit) => visit.classId === classFilter);
    }

    if (yearFilter !== "all") {
      data = data.filter((visit) => visit.schoolYearId === yearFilter);
    }

    if (genderFilter !== "all") {
      data = data.filter((visit) => formatGender(visit.gender).toLowerCase() === genderFilter);
    }

    data = data.filter((visit) => {
      const formId = visit.legacyFormId?.toString() ?? "";
      if (legacyFilters.formId && !formId.includes(legacyFilters.formId.trim())) return false;
      if (
        legacyFilters.firstName &&
        !visit.firstName.toLowerCase().includes(legacyFilters.firstName.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.lastName &&
        !visit.lastName.toLowerCase().includes(legacyFilters.lastName.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.dateOfBirth &&
        !formatDate(visit.dateOfBirth).toLowerCase().includes(legacyFilters.dateOfBirth.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.className &&
        !visit.className.toLowerCase().includes(legacyFilters.className.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.year &&
        !visit.yearLabel.toLowerCase().includes(legacyFilters.year.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.gender &&
        !formatGender(visit.gender).toLowerCase().includes(legacyFilters.gender.toLowerCase())
      ) {
        return false;
      }

      const created = new Date(visit.createdAt).getTime();
      if (from !== null && created < from) return false;
      if (to !== null && created >= to) return false;
      return true;
    });

    return data;
  }, [visits, search, branchFilter, classFilter, yearFilter, genderFilter, legacyFilters]);

  function clearAllFilters() {
    setSearch("");
    setBranchFilter("all");
    setClassFilter("all");
    setYearFilter("all");
    setGenderFilter("all");
    setLegacyFilters({
      formId: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      className: "",
      year: "",
      gender: "",
      createdFrom: "",
      createdTo: "",
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteMedicalForm(deleteId);
      if (result.success) {
        toast.success("Medical visit form deleted successfully.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete medical visit form.");
      }
      setDeleteId(null);
    });
  }

  const columns: ColumnDef<MedicalVisitRow>[] = [
    {
      accessorKey: "legacyFormId",
      header: "#",
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.legacyFormId ?? "-"}</span>,
    },
    {
      accessorKey: "photo",
      header: "Image",
      cell: ({ row }) => <ChildPhoto visit={row.original} />,
      enableSorting: false,
    },
    {
      accessorKey: "firstName",
      header: "F Name",
      cell: ({ row }) => (
        <Link href={`/medical/visits/${row.original.id}`} className="font-medium hover:underline">
          {row.original.firstName}
        </Link>
      ),
    },
    {
      accessorKey: "lastName",
      header: "L Name",
    },
    {
      accessorKey: "dateOfBirth",
      header: "DOB",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.dateOfBirth)}</span>
      ),
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
      accessorKey: "className",
      header: "Class",
      cell: ({ row }) => <span className="text-sm">{row.original.className || "-"}</span>,
    },
    {
      accessorKey: "yearLabel",
      header: "Year",
      cell: ({ row }) => <span className="text-sm">{row.original.yearLabel || "-"}</span>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <Badge className={genderBadgeClass(row.original.gender)}>
          {formatGender(row.original.gender)}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "Action",
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
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(visit.id)}>
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
        title="Medical Visit"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Visits" },
        ]}
        actions={
          <Button asChild>
            <Link href="/medical/visits/new">
              <Plus className="size-4" />
              New Child Medical Visit Form
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical Visit Listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative max-w-sm flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search medical visits..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {filteredClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {schoolYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <Input
                placeholder="Form #"
                value={legacyFilters.formId}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, formId: event.target.value }))}
              />
              <Input
                placeholder="F Name"
                value={legacyFilters.firstName}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, firstName: event.target.value }))}
              />
              <Input
                placeholder="L Name"
                value={legacyFilters.lastName}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, lastName: event.target.value }))}
              />
              <Input
                placeholder="DOB"
                value={legacyFilters.dateOfBirth}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, dateOfBirth: event.target.value }))}
              />
              <Input
                placeholder="Class"
                value={legacyFilters.className}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, className: event.target.value }))}
              />
              <Input
                placeholder="Year"
                value={legacyFilters.year}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, year: event.target.value }))}
              />
              <Input
                placeholder="Gender"
                value={legacyFilters.gender}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, gender: event.target.value }))}
              />
              <div className="relative">
                <CalendarCheck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={legacyFilters.createdFrom}
                  aria-label="Date from"
                  onChange={(event) => setLegacyFilters((current) => ({ ...current, createdFrom: event.target.value }))}
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={legacyFilters.createdTo}
                aria-label="Date to"
                onChange={(event) => setLegacyFilters((current) => ({ ...current, createdTo: event.target.value }))}
              />
              <Button variant="outline" onClick={clearAllFilters}>
                Clear
              </Button>
            </div>

            {filteredData.length === 0 ? (
              <EmptyState
                icon={Stethoscope}
                title="No medical visit forms found"
                description="No medical visit forms match your current filters."
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                pageSizeOptions={[...legacyPageSizeOptions]}
                exportOptions={{
                  filename: "medical-visit-forms",
                  sheetName: "Medical Visit Listing",
                  columns: exportColumns,
                }}
                printOptions={{ label: "Print" }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Visit Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medical visit form? This action cannot be undone.
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
