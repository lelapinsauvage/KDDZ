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
  Syringe,
  Trash2,
  User,
} from "lucide-react";

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
import { deleteMedicalForm } from "@/lib/actions/medical";

type FormStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

export interface VaccinationFormRow {
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
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string;
  formDate: string;
  status: FormStatus;
  createdAt: string;
}

interface VaccinationsPageClientProps {
  forms: VaccinationFormRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; branchId: string }>;
}

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

function dateInRange(value: string, from: string, to: string) {
  if (!from && !to) return true;
  if (!value) return false;

  const current = new Date(`${value}T00:00:00`);
  if (Number.isNaN(current.getTime())) return true;

  if (from) {
    const min = new Date(`${from}T00:00:00`);
    if (!Number.isNaN(min.getTime()) && current < min) return false;
  }

  if (to) {
    const max = new Date(`${to}T23:59:59`);
    if (!Number.isNaN(max.getTime()) && current > max) return false;
  }

  return true;
}

function ChildPhoto({ form }: { form: VaccinationFormRow }) {
  const [failed, setFailed] = useState(false);
  const src = childPhotoSrc(form.photo);

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
        alt={form.childName}
        fill
        sizes="40px"
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function VaccinationsPageClient({
  forms,
  branches,
  classes,
}: VaccinationsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredClasses = useMemo(
    () =>
      branchFilter === "all"
        ? classes
        : classes.filter((classItem) => classItem.branchId === branchFilter),
    [branchFilter, classes],
  );

  const filteredData = useMemo(() => {
    let data = [...forms].sort((left, right) => {
      const rightId = right.legacyFormId ?? Number.NEGATIVE_INFINITY;
      const leftId = left.legacyFormId ?? Number.NEGATIVE_INFINITY;
      if (rightId !== leftId) return rightId - leftId;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((form) =>
        [
          form.legacyFormId,
          form.childNumber,
          form.firstName,
          form.lastName,
          form.dateOfBirth,
          form.branchName,
          form.className,
          form.nationality,
          formatGender(form.gender),
          form.formDate,
        ]
          .join(" ")
          .toLowerCase()
          .includes(lower),
      );
    }

    if (branchFilter !== "all") {
      data = data.filter((form) => form.branchId === branchFilter);
    }

    if (classFilter !== "all") {
      data = data.filter((form) => form.classId === classFilter);
    }

    if (genderFilter !== "all") {
      data = data.filter((form) => formatGender(form.gender).toLowerCase() === genderFilter);
    }

    data = data.filter((form) => dateInRange(form.formDate, dateFrom, dateTo));

    return data;
  }, [forms, search, branchFilter, classFilter, genderFilter, dateFrom, dateTo]);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteMedicalForm(deleteId);
      if (result.success) {
        toast.success("Vaccination form deleted successfully.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete vaccination form.");
      }
      setDeleteId(null);
    });
  }

  const columns: ColumnDef<VaccinationFormRow>[] = [
    {
      accessorKey: "legacyFormId",
      header: "#",
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.legacyFormId ?? "-"}</span>,
    },
    {
      accessorKey: "photo",
      header: "Image",
      cell: ({ row }) => <ChildPhoto form={row.original} />,
      enableSorting: false,
    },
    {
      accessorKey: "firstName",
      header: "F Name",
      cell: ({ row }) => (
        <Link href={`/medical/vaccinations/${row.original.id}`} className="font-medium hover:underline">
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
      accessorKey: "formDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.formDate)}</span>
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
                <Link href={`/medical/vaccinations/${form.id}`}>
                  <Eye className="size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/medical/vaccinations/${form.id}`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(form.id)}>
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
        title="Vaccination Form"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Vaccinations" },
        ]}
        actions={
          <Button asChild>
            <Link href="/medical/vaccinations/new">
              <Plus className="size-4" />
              New Child Vaccination Form
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative max-w-sm flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vaccination forms..."
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <CalendarCheck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                aria-label="Date from"
                onChange={(event) => setDateFrom(event.target.value)}
                className="w-[150px] pl-9"
              />
            </div>
            <Input
              type="date"
              value={dateTo}
              aria-label="Date to"
              onChange={(event) => setDateTo(event.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            icon={Syringe}
            title="No vaccination forms found"
            description="No vaccination forms match your current filters."
          />
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vaccination Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vaccination form? This action cannot be undone.
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
