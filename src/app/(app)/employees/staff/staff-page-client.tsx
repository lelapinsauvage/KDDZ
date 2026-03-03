"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createEmployeeColumns,
  roleColors,
  avatarColors,
  type Employee,
  type EmployeeType,
} from "@/components/employees/employee-columns";
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
import { Plus, Search, Users } from "lucide-react";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";

const employeeExportColumns: ExportColumn[] = [
  { header: "First Name", key: "firstName" },
  { header: "Last Name", key: "lastName" },
  { header: "Email", key: "email" },
  { header: "Phone", key: "phone" },
  { header: "Role", key: "type", transform: (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1) },
  { header: "Branch", key: "branch" },
  {
    header: "Hire Date",
    key: "hireDate",
    transform: (v) => {
      if (!v) return "";
      const d = new Date(v as string);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB");
    },
  },
  {
    header: "Status",
    key: "status",
  },
];

const newEmployeeLinks: Record<EmployeeType, string> = {
  teacher: "/employees/teachers/new",
  nurse: "/employees/nurses/new",
  doctor: "/employees/doctors/new",
  manager: "/employees/managers/new",
};

interface StaffPageClientProps {
  employees: Employee[];
}

export function StaffPageClient({ employees }: StaffPageClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredData = useMemo(() => {
    let data = employees;

    if (roleFilter !== "all") {
      data = data.filter((e) => e.type === roleFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.firstName.toLowerCase().includes(lower) ||
          e.lastName.toLowerCase().includes(lower) ||
          (e.mobile && e.mobile.toLowerCase().includes(lower)) ||
          (e.nationality && e.nationality.toLowerCase().includes(lower))
      );
    }

    return data;
  }, [employees, search, roleFilter]);

  // Role counts for the toolbar
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { teacher: 0, nurse: 0, doctor: 0, manager: 0 };
    for (const e of employees) counts[e.type] = (counts[e.type] || 0) + 1;
    return counts;
  }, [employees]);

  // Use a generic column set that includes the role badge
  const columns = useMemo(() => {
    // Use "teacher" columns as base since they include specialization
    const baseCols = createEmployeeColumns("teacher");
    // Insert a Role column after the fullName column (index 2)
    const rolCol = {
      accessorKey: "type" as const,
      header: "Role",
      cell: ({ row }: { row: { original: Employee } }) => {
        const type = row.original.type;
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        const color = roleColors[type] || "bg-muted text-muted-foreground";
        return (
          <Badge className={color}>
            {label}
          </Badge>
        );
      },
    };
    // Insert after avatar, firstName, and lastName columns
    const result = [...baseCols];
    result.splice(3, 0, rolCol);
    return result;
  }, []);

  const currentRole = roleFilter as EmployeeType;
  const newLink = roleFilter === "all"
    ? "/employees/teachers/new"
    : newEmployeeLinks[currentRole];

  return (
    <>
      <PageHeader
        title="Staff"
        breadcrumbs={[{ label: "Employees", href: "/employees/staff" }, { label: "Staff" }]}
        actions={
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={newLink}>
              <Plus className="size-4" />
              Add Staff
            </Link>
          </Button>
        }
      />
      <div className="p-4 md:p-6 space-y-4">
        {/* Role summary chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm py-1 px-3">
            <Users className="mr-1.5 size-3.5" />
            {employees.length} Total
          </Badge>
          {(["teacher", "nurse", "doctor", "manager"] as EmployeeType[]).map((role) => (
            <Badge
              key={role}
              className={`text-sm py-1 px-3 cursor-pointer transition-opacity ${avatarColors[role]} ${roleFilter !== "all" && roleFilter !== role ? "opacity-50" : ""}`}
              onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
            >
              {roleCounts[role]} {role.charAt(0).toUpperCase() + role.slice(1)}{roleCounts[role] !== 1 ? "s" : ""}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="nurse">Nurses</SelectItem>
              <SelectItem value="doctor">Doctors</SelectItem>
              <SelectItem value="manager">Managers</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <ExportButton
            filename="staff"
            sheetName="Staff"
            columns={employeeExportColumns}
            data={filteredData as unknown as Record<string, unknown>[]}
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          emptyState={
            <EmptyState
              icon={Users}
              title="No staff members"
              description="No staff members match your current filters. Add your first team member to get started."
              action={{ label: "Add Staff", href: "/employees/staff/new", icon: Plus }}
            />
          }
        />
      </div>
    </>
  );
}
