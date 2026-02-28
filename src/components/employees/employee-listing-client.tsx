"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import {
  createEmployeeColumns,
  type Employee,
  type EmployeeType,
} from "@/components/employees/employee-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";

const employeeExportColumns: ExportColumn[] = [
  { header: "First Name", key: "firstName" },
  { header: "Last Name", key: "lastName" },
  { header: "Email", key: "email" },
  { header: "Phone", key: "phone" },
  { header: "Mobile", key: "mobile" },
  { header: "Nationality", key: "nationality" },
  {
    header: "Date of Birth",
    key: "dateOfBirth",
    transform: (v) => {
      if (!v) return "";
      const d = new Date(v as string);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB");
    },
  },
  {
    header: "Hire Date",
    key: "hireDate",
    transform: (v) => {
      if (!v) return "";
      const d = new Date(v as string);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB");
    },
  },
  { header: "Specialization", key: "specialization" },
  { header: "Branch", key: "branchName" },
  {
    header: "Status",
    key: "isActive",
    transform: (v) => (v ? "Active" : "Inactive"),
  },
];

interface EmployeeListingClientProps {
  type: EmployeeType;
  employees: Employee[];
}

const labels: Record<EmployeeType, { singular: string; plural: string }> = {
  teacher: { singular: "Teacher", plural: "Teachers" },
  nurse: { singular: "Nurse", plural: "Nurses" },
  doctor: { singular: "Doctor", plural: "Doctors" },
  manager: { singular: "Manager", plural: "Managers" },
};

export function EmployeeListingClient({
  type,
  employees,
}: EmployeeListingClientProps) {
  const columns = useMemo(() => createEmployeeColumns(type), [type]);
  const [search, setSearch] = useState("");
  const { singular, plural } = labels[type];

  const filteredData = useMemo(() => {
    if (!search) return employees;
    const lower = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.firstName.toLowerCase().includes(lower) ||
        e.lastName.toLowerCase().includes(lower) ||
        e.email.toLowerCase().includes(lower)
    );
  }, [search, employees]);

  return (
    <>
      <PageHeader
        title={`${plural} Listing`}
        breadcrumbs={[
          { label: "Employees", href: `/employees/${plural.toLowerCase()}` },
          { label: plural },
        ]}
      />
      <div className="p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${plural.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ExportButton
            filename={plural.toLowerCase()}
            sheetName={plural}
            columns={employeeExportColumns}
            data={filteredData as unknown as Record<string, unknown>[]}
          />
          <Button asChild>
            <Link href={`/employees/${plural.toLowerCase()}/new`}>
              <Plus className="size-4" />
              Add {singular}
            </Link>
          </Button>
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={filteredData} />
      </div>
    </>
  );
}
