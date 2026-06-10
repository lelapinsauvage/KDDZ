"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Eye,
  FileCheck,
  FileClock,
  FileEdit,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type FormStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

export interface MedicalConditionRow {
  id: string;
  legacyFormId: number | null;
  childId: string;
  childNumber: string;
  photo: string | null;
  firstName: string;
  lastName: string;
  childName: string;
  dateOfBirth: string | null;
  nationality: string;
  gender: string | null;
  assessmentDate: string;
  generalHealth: string;
  status: FormStatus;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string;
  createdAt: string;
}

interface MedicalConditionsClientProps {
  conditions: MedicalConditionRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

interface LegacyFilters {
  formId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  className: string;
  nationality: string;
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
  { header: "Nationality", key: "nationality" },
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
  { header: "General Health", key: "generalHealth" },
  { header: "Status", key: "status" },
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

function getStatusBadge(status: FormStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge className="gap-1 bg-muted text-muted-foreground border-border">
          <FileEdit className="size-3" />
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge className="gap-1 bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-[var(--color-info)]/20">
          <FileClock className="size-3" />
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="gap-1 bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20">
          <FileCheck className="size-3" />
          Reviewed
        </Badge>
      );
  }
}

function ChildPhoto({ condition }: { condition: MedicalConditionRow }) {
  const [failed, setFailed] = useState(false);
  const src = childPhotoSrc(condition.photo);

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
        alt={condition.childName}
        fill
        sizes="40px"
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

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
  const [legacyFilters, setLegacyFilters] = useState<LegacyFilters>({
    formId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    className: "",
    nationality: "",
    gender: "",
    createdFrom: "",
    createdTo: "",
  });

  const filteredData = useMemo(() => {
    const from = legacyFilters.createdFrom ? dateValue(legacyFilters.createdFrom) : null;
    const to = legacyFilters.createdTo ? addOneDay(legacyFilters.createdTo) : null;
    let data = [...conditions].sort((left, right) => {
      const rightId = right.legacyFormId ?? Number.NEGATIVE_INFINITY;
      const leftId = left.legacyFormId ?? Number.NEGATIVE_INFINITY;
      if (rightId !== leftId) return rightId - leftId;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((condition) =>
        [
          condition.legacyFormId,
          condition.childNumber,
          condition.firstName,
          condition.lastName,
          condition.dateOfBirth,
          condition.branchName,
          condition.className,
          condition.nationality,
          formatGender(condition.gender),
          condition.generalHealth,
          condition.assessmentDate,
          condition.createdAt,
        ]
          .join(" ")
          .toLowerCase()
          .includes(lower),
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((condition) => condition.status === statusFilter);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((condition) => condition.branchId === branchFilter);
    }

    data = data.filter((condition) => {
      const formId = condition.legacyFormId?.toString() ?? "";
      if (legacyFilters.formId && !formId.includes(legacyFilters.formId.trim())) return false;
      if (
        legacyFilters.firstName &&
        !condition.firstName.toLowerCase().includes(legacyFilters.firstName.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.lastName &&
        !condition.lastName.toLowerCase().includes(legacyFilters.lastName.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.dateOfBirth &&
        !formatDate(condition.dateOfBirth).toLowerCase().includes(legacyFilters.dateOfBirth.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.className &&
        !condition.className.toLowerCase().includes(legacyFilters.className.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.nationality &&
        !condition.nationality.toLowerCase().includes(legacyFilters.nationality.toLowerCase())
      ) {
        return false;
      }
      if (
        legacyFilters.gender &&
        !formatGender(condition.gender).toLowerCase().includes(legacyFilters.gender.toLowerCase())
      ) {
        return false;
      }

      const created = new Date(condition.createdAt).getTime();
      if (from !== null && created < from) return false;
      if (to !== null && created >= to) return false;
      return true;
    });

    return data;
  }, [conditions, search, statusFilter, branchFilter, legacyFilters]);

  function clearAllFilters() {
    setSearch("");
    setStatusFilter("all");
    setBranchFilter("all");
    setLegacyFilters({
      formId: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      className: "",
      nationality: "",
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
        toast.success("Suffering form deleted successfully.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete suffering form.");
      }
      setDeleteId(null);
    });
  }

  const columns: ColumnDef<MedicalConditionRow>[] = [
    {
      accessorKey: "legacyFormId",
      header: "#",
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.legacyFormId ?? "-"}</span>,
    },
    {
      accessorKey: "photo",
      header: "Image",
      cell: ({ row }) => <ChildPhoto condition={row.original} />,
      enableSorting: false,
    },
    {
      accessorKey: "firstName",
      header: "F Name",
      cell: ({ row }) => (
        <Link href={`/medical/conditions/${row.original.id}`} className="font-medium hover:underline">
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
      accessorKey: "nationality",
      header: "Nationality",
      cell: ({ row }) => <span className="text-sm">{row.original.nationality || "-"}</span>,
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
      accessorKey: "assessmentDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.assessmentDate)}</span>
      ),
    },
    {
      accessorKey: "generalHealth",
      header: "General Health",
      cell: ({ row }) => (
        <Badge className="gap-1 bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border-[var(--color-primary-700)]/20">
          <Activity className="size-3" />
          {row.original.generalHealth || "-"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Action",
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
        title="Suffering Form"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Conditions" },
        ]}
        actions={
          <Button asChild>
            <Link href="/medical/conditions/new">
              <Plus className="size-4" />
              New Child Suffering Form
            </Link>
          </Button>
        }
      />
      <div className="p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suffering Form Listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative max-w-sm flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search suffering forms..."
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
                placeholder="Nationality"
                value={legacyFilters.nationality}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, nationality: event.target.value }))}
              />
              <Input
                placeholder="Gender"
                value={legacyFilters.gender}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, gender: event.target.value }))}
              />
              <Input
                type="date"
                value={legacyFilters.createdFrom}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, createdFrom: event.target.value }))}
              />
              <Input
                type="date"
                value={legacyFilters.createdTo}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, createdTo: event.target.value }))}
              />
              <Button variant="outline" onClick={clearAllFilters}>
                Clear
              </Button>
            </div>

            {filteredData.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No suffering forms found"
                description="No suffering forms match your current filters."
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                pageSizeOptions={[...legacyPageSizeOptions]}
                exportOptions={{
                  filename: "suffering-medical-forms",
                  sheetName: "Suffering Form Listing",
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
            <AlertDialogTitle>Delete Suffering Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this suffering form? This action cannot be undone.
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
