"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileText,
  Pencil,
  Plus,
  Printer,
  Search,
  Stethoscope,
  User,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/shared/export-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ExportColumn } from "@/lib/export";

export interface GeneralMedicalFormRow {
  id: string;
  legacyFormId: number | null;
  childId: string;
  childNumber: string;
  photo: string | null;
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

interface MedicalGeneralClientProps {
  forms: GeneralMedicalFormRow[];
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

const PAGE_SIZES = ["10", "20", "50", "100", "150", "ALL"] as const;

const exportColumns: ExportColumn[] = [
  { header: "Form #", key: "legacyFormId" },
  { header: "F Name", key: "firstName" },
  { header: "L Name", key: "lastName" },
  {
    header: "DOB",
    key: "dateOfBirth",
    transform: (value) => formatDateOnly(value as string | null),
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
    transform: (value) => formatDateTime(value as string | null),
  },
];

function childPhotoSrc(photo: string | null) {
  if (!photo || photo === "default.jpg") return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  if (photo.includes("/")) return `/${photo.replace(/^\/+/, "")}`;
  return `/images/EmpPhoto/${photo}`;
}

function formatDateOnly(date: string | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: string | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  if (normalized === "boy") return "Male";
  if (normalized === "girl") return "Female";
  return gender;
}

function genderBadgeClass(gender: string | null) {
  const normalized = formatGender(gender).toLowerCase();
  if (normalized === "male") return "bg-[#327ad5] text-white border-transparent";
  if (normalized === "female") return "bg-[#d64690] text-white border-transparent";
  return "bg-[#707070] text-white border-transparent";
}

function ChildPhoto({ form }: { form: GeneralMedicalFormRow }) {
  const [failed, setFailed] = useState(false);
  const src = childPhotoSrc(form.photo);

  if (!src || failed) {
    return (
      <div className="flex size-14 items-center justify-center rounded-full border bg-muted">
        <User className="size-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative size-14 overflow-hidden rounded-full border bg-muted">
      <Image
        src={src}
        alt={`${form.firstName} ${form.lastName}`}
        fill
        sizes="56px"
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function MedicalGeneralClient({
  forms,
  total,
  branches,
  classes,
  schoolYears,
}: MedicalGeneralClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>("10");
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

  const sortedForms = useMemo(
    () =>
      [...forms].sort((left, right) => {
        const rightId = right.legacyFormId ?? Number.NEGATIVE_INFINITY;
        const leftId = left.legacyFormId ?? Number.NEGATIVE_INFINITY;
        if (rightId !== leftId) return rightId - leftId;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [forms],
  );

  const filteredClasses = useMemo(
    () => (branchFilter === "ALL" ? classes : classes.filter((item) => item.branchId === branchFilter)),
    [branchFilter, classes],
  );

  const filteredForms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const from = legacyFilters.createdFrom ? dateValue(legacyFilters.createdFrom) : null;
    const to = legacyFilters.createdTo ? addOneDay(legacyFilters.createdTo) : null;
    const selectedYearLabel =
      yearFilter === "ALL"
        ? ""
        : schoolYears.find((year) => year.id === yearFilter)?.label ?? "";

    return sortedForms.filter((form) => {
      if (branchFilter !== "ALL" && form.branchId !== branchFilter) return false;
      if (classFilter !== "ALL" && form.classId !== classFilter) return false;
      if (yearFilter !== "ALL" && form.schoolYearId !== yearFilter && form.yearLabel !== selectedYearLabel) return false;
      if (genderFilter !== "ALL" && formatGender(form.gender).toLowerCase() !== genderFilter.toLowerCase()) return false;

      if (query) {
        const haystack = [
          form.legacyFormId,
          form.childNumber,
          form.firstName,
          form.lastName,
          form.dateOfBirth,
          form.branchName,
          form.className,
          form.yearLabel,
          formatGender(form.gender),
        ].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      const formId = form.legacyFormId?.toString() ?? "";
      if (legacyFilters.formId && !formId.includes(legacyFilters.formId.trim())) return false;
      if (legacyFilters.firstName && !form.firstName.toLowerCase().includes(legacyFilters.firstName.toLowerCase())) return false;
      if (legacyFilters.lastName && !form.lastName.toLowerCase().includes(legacyFilters.lastName.toLowerCase())) return false;
      if (legacyFilters.dateOfBirth && !formatDateOnly(form.dateOfBirth).includes(legacyFilters.dateOfBirth.trim())) return false;
      if (legacyFilters.className && !form.className.toLowerCase().includes(legacyFilters.className.toLowerCase())) return false;
      if (legacyFilters.year && !form.yearLabel.toLowerCase().includes(legacyFilters.year.toLowerCase())) return false;
      if (legacyFilters.gender && !formatGender(form.gender).toLowerCase().includes(legacyFilters.gender.toLowerCase())) return false;

      const created = new Date(form.createdAt).getTime();
      if (from !== null && created < from) return false;
      if (to !== null && created >= to) return false;

      return true;
    });
  }, [branchFilter, classFilter, genderFilter, legacyFilters, schoolYears, searchQuery, sortedForms, yearFilter]);

  const effectivePageSize = pageSize === "ALL" ? Math.max(filteredForms.length, 1) : Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredForms.length / effectivePageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedForms =
    pageSize === "ALL"
      ? filteredForms
      : filteredForms.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; value: string }[] = [];
    if (searchQuery) pills.push({ key: "search", label: "Search", value: searchQuery });
    if (branchFilter !== "ALL") {
      pills.push({ key: "branch", label: "Branch", value: branches.find((branch) => branch.id === branchFilter)?.name ?? branchFilter });
    }
    if (classFilter !== "ALL") {
      pills.push({ key: "class", label: "Class", value: classes.find((item) => item.id === classFilter)?.name ?? classFilter });
    }
    if (yearFilter !== "ALL") {
      pills.push({ key: "yearSelect", label: "Year", value: schoolYears.find((item) => item.id === yearFilter)?.label ?? yearFilter });
    }
    if (genderFilter !== "ALL") pills.push({ key: "genderSelect", label: "Gender", value: genderFilter });
    if (legacyFilters.formId) pills.push({ key: "formId", label: "Form #", value: legacyFilters.formId });
    if (legacyFilters.firstName) pills.push({ key: "firstName", label: "F Name", value: legacyFilters.firstName });
    if (legacyFilters.lastName) pills.push({ key: "lastName", label: "L Name", value: legacyFilters.lastName });
    if (legacyFilters.dateOfBirth) pills.push({ key: "dateOfBirth", label: "DOB", value: legacyFilters.dateOfBirth });
    if (legacyFilters.className) pills.push({ key: "className", label: "Class", value: legacyFilters.className });
    if (legacyFilters.year) pills.push({ key: "year", label: "Year", value: legacyFilters.year });
    if (legacyFilters.gender) pills.push({ key: "gender", label: "Gender", value: legacyFilters.gender });
    if (legacyFilters.createdFrom) pills.push({ key: "createdFrom", label: "Created from", value: legacyFilters.createdFrom });
    if (legacyFilters.createdTo) pills.push({ key: "createdTo", label: "Created to", value: legacyFilters.createdTo });
    return pills;
  }, [branchFilter, branches, classFilter, classes, genderFilter, legacyFilters, schoolYears, searchQuery, yearFilter]);

  function clearFilter(key: string) {
    if (key === "search") setSearchQuery("");
    if (key === "branch") setBranchFilter("ALL");
    if (key === "class") setClassFilter("ALL");
    if (key === "yearSelect") setYearFilter("ALL");
    if (key === "genderSelect") setGenderFilter("ALL");
    if (key in legacyFilters) {
      setLegacyFilters((current) => ({ ...current, [key]: "" }));
    }
    setPage(1);
  }

  function clearAllFilters() {
    setSearchQuery("");
    setBranchFilter("ALL");
    setClassFilter("ALL");
    setYearFilter("ALL");
    setGenderFilter("ALL");
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
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="General Info"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "General Info" },
        ]}
        actions={
          <Button asChild>
            <Link href="/medical/general/new">
              <Plus className="size-4" />
              New Child General Form
            </Link>
          </Button>
        }
      />

      <div className="hidden print:block print:mb-4 print:text-center">
        <h1 className="text-2xl font-bold text-black">General Form Listing</h1>
        <p className="text-sm text-gray-500">
          {filteredForms.length} forms - Printed on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-6 p-4 md:p-6 print:p-0">
        <div className="grid grid-cols-1 gap-4 print:hidden sm:grid-cols-3">
          <div className="overflow-hidden rounded bg-[#327ad5] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-xs text-white/80">Total Forms</p>
              </div>
              <FileText className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="overflow-hidden rounded bg-[#1caf9a] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">{filteredForms.length}</p>
                <p className="text-xs text-white/80">Filtered Rows</p>
              </div>
              <Search className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="overflow-hidden rounded bg-[#d64635] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">
                  {forms.filter((form) => !form.yearLabel).length}
                </p>
                <p className="text-xs text-white/80">Missing Year</p>
              </div>
              <Stethoscope className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
        </div>

        <Card className="print:border-none print:shadow-none">
          <CardHeader className="print:hidden">
            <CardTitle className="text-lg">General Form Listing</CardTitle>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/medical/general/new">
                  <Plus className="size-4" />
                  New Child General Form
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4 print:p-0 print:space-y-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={branchFilter}
                onValueChange={(value) => {
                  setBranchFilter(value);
                  setClassFilter("ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={classFilter}
                onValueChange={(value) => {
                  setClassFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {filteredClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={yearFilter}
                onValueChange={(value) => {
                  setYearFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Years</SelectItem>
                  {schoolYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={genderFilter}
                onValueChange={(value) => {
                  setGenderFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                <ExportButton
                  filename="general-medical-forms"
                  sheetName="General Form Listing"
                  columns={exportColumns}
                  data={filteredForms as unknown as Record<string, unknown>[]}
                />
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 print:hidden sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <Input
                placeholder="Form #"
                value={legacyFilters.formId}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, formId: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="F Name"
                value={legacyFilters.firstName}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, firstName: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="L Name"
                value={legacyFilters.lastName}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, lastName: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="DOB"
                value={legacyFilters.dateOfBirth}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, dateOfBirth: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="Class"
                value={legacyFilters.className}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, className: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="Year"
                value={legacyFilters.year}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, year: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="Gender"
                value={legacyFilters.gender}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, gender: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={legacyFilters.createdFrom}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, createdFrom: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={legacyFilters.createdTo}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, createdTo: event.target.value }));
                  setPage(1);
                }}
              />
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="size-4" />
                Clear
              </Button>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                <span className="text-xs text-muted-foreground">Filters:</span>
                {activeFilters.map((filter) => (
                  <Badge key={filter.key} variant="secondary" className="gap-1 pl-2.5 pr-1 text-xs font-normal">
                    {filter.label}: <span className="font-medium">{filter.value}</span>
                    <button
                      type="button"
                      onClick={() => clearFilter(filter.key)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={clearAllFilters}>
                  Clear all
                </Button>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm print:rounded-none print:border-gray-300 print:shadow-none">
              <div className="overflow-x-auto print:overflow-visible">
                <Table className="min-w-[1180px] print:min-w-0 print:w-full print:text-[11px]">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Form #</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Image</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">F Name</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">L Name</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">DOB</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Branch</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Class</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Year</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gender</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground print:hidden">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedForms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                          No general forms found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedForms.map((form) => (
                        <TableRow key={form.id} className="group border-border/40 transition-colors hover:bg-accent/40">
                          <TableCell className="px-3 py-3 text-sm font-medium">{form.legacyFormId ?? "—"}</TableCell>
                          <TableCell className="px-3 py-3">
                            <ChildPhoto form={form} />
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm font-medium">{form.firstName}</TableCell>
                          <TableCell className="px-3 py-3 text-sm font-medium">{form.lastName}</TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{formatDateOnly(form.dateOfBirth)}</TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{form.branchName || "-"}</TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{form.className || "-"}</TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{form.yearLabel || "-"}</TableCell>
                          <TableCell className="px-3 py-3">
                            <Badge className={`text-[10px] ${genderBadgeClass(form.gender)}`}>
                              {formatGender(form.gender)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{formatDateTime(form.createdAt)}</TableCell>
                          <TableCell className="px-3 py-3 text-right print:hidden">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button asChild variant="ghost" size="icon-sm">
                                <Link href={`/medical/general/${form.id}`}>
                                  <Pencil className="size-4 text-muted-foreground" />
                                </Link>
                              </Button>
                              <Button asChild variant="ghost" size="icon-sm">
                                <Link href={`/medical/general/${form.id}`}>
                                  <Download className="size-4 text-muted-foreground" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {filteredForms.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{Math.min((currentPage - 1) * effectivePageSize + 1, filteredForms.length)}</span>
                  {" "}-{" "}
                  <span className="font-medium text-foreground">{Math.min(currentPage * effectivePageSize, filteredForms.length)}</span>
                  {" "}of <span className="font-medium text-foreground">{filteredForms.length}</span> forms
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows:</span>
                  <Select
                    value={pageSize}
                    onValueChange={(value) => {
                      setPageSize(value as (typeof PAGE_SIZES)[number]);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[82px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size === "ALL" ? "All" : size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(1)} disabled={currentPage <= 1}>
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="min-w-[5rem] text-center text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{currentPage}</span> / {pageCount}
                    </span>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount}>
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(pageCount)} disabled={currentPage >= pageCount}>
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
