"use client";

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
      <div className="p-6 space-y-4">
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
          <Button className="bg-[#1caf9a] hover:bg-[#18a08d] text-white">
            <Plus className="size-4" />
            Add {singular}
          </Button>
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={filteredData} />
      </div>
    </>
  );
}
