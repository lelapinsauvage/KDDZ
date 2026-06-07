"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import {
  createEmployeeColumns,
  type Employee,
  type EmployeeType,
} from "@/components/employees/employee-columns";
import { deleteEmployee } from "@/lib/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Plus, Printer, Search, Trash2, X } from "lucide-react";
import { useState, useMemo, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";
import type { LegacyTeacherActionPermissions } from "@/lib/legacy-teacher-action-permissions";

function formatExportDate(v: unknown) {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB");
}

function createEmployeeExportColumns(type: EmployeeType): ExportColumn[] {
  return [
    { header: "#", key: "legacyId" },
    { header: "F Name", key: "firstName" },
    { header: "L Name", key: "lastName" },
    {
      header: "DOB",
      key: "dateOfBirth",
      transform: formatExportDate,
    },
    { header: "Branch", key: "branch" },
    type === "teacher"
      ? { header: "Class", key: "className" }
      : { header: "Mobile", key: "mobile" },
    { header: "Nationality", key: "nationality" },
    { header: "Gender", key: "gender" },
    {
      header: "Date",
      key: "createdAt",
      transform: formatExportDate,
    },
    {
      header: "Status",
      key: "status",
    },
  ];
}

interface EmployeeListingClientProps {
  type: EmployeeType;
  employees: Employee[];
  initialSearchQuery?: string;
  actionPermissions?: LegacyTeacherActionPermissions;
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
  initialSearchQuery = "",
  actionPermissions,
}: EmployeeListingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState(initialSearchQuery);
  const { singular, plural } = labels[type];
  const teacherActionPermissions = actionPermissions ?? {
    canAddTeacher: true,
    canUpdateTeacher: true,
    canDeleteTeacher: true,
  };
  const canAdd = type !== "teacher" || teacherActionPermissions.canAddTeacher;
  const canUpdate = type !== "teacher" || teacherActionPermissions.canUpdateTeacher;
  const canDelete = type !== "teacher" || teacherActionPermissions.canDeleteTeacher;

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    if (!canDelete) {
      toast.error("Access denied");
      return;
    }
    setDeleteTarget({ id, name });
  }, [canDelete]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    if (!canDelete) {
      toast.error("Access denied");
      setDeleteTarget(null);
      return;
    }
    const { id, name } = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await deleteEmployee(type, id);
      if (result.success) {
        toast.success(`${name} has been deactivated.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }, [canDelete, deleteTarget, type, router]);

  const handleBulkDeactivate = useCallback((selectedEmployees: Employee[]) => {
    if (selectedEmployees.length === 0 || isPending) return;
    if (!canDelete) {
      toast.error("Access denied");
      return;
    }

    startTransition(async () => {
      const results = await Promise.all(
        selectedEmployees.map((employee) => deleteEmployee(type, employee.id))
      );
      const failed = results.filter((result) => !result.success);

      if (failed.length) {
        toast.error(
          `${failed.length} ${failed.length === 1 ? "employee" : "employees"} could not be deactivated.`
        );
      } else {
        toast.success(
          `${selectedEmployees.length} ${selectedEmployees.length === 1 ? singular.toLowerCase() : plural.toLowerCase()} deactivated.`
        );
      }
      router.refresh();
    });
  }, [canDelete, isPending, plural, router, singular, type]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const columns = useMemo(
    () =>
      createEmployeeColumns(type, {
        onDelete: handleDeleteRequest,
        canUpdate,
        canDelete,
      }),
    [type, handleDeleteRequest, canUpdate, canDelete]
  );
  const exportColumns = useMemo(() => createEmployeeExportColumns(type), [type]);

  const filteredData = useMemo(() => {
    if (!search) return employees;
    const lower = search.toLowerCase();
    return employees.filter((employee) =>
      [
        employee.legacyId,
        employee.firstName,
        employee.lastName,
        employee.dateOfBirth,
        employee.branch,
        employee.className,
        employee.mobile,
        employee.nationality,
        employee.gender,
        employee.createdAt,
        employee.status,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(lower)
      )
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
      <Card className="m-4 md:m-6">
        <CardHeader>
          <CardTitle className="text-lg">{plural}</CardTitle>
          <CardAction>
            {canAdd ? (
              <Button asChild>
                <Link href={`/employees/${plural.toLowerCase()}/new`}>
                  <Plus className="mr-1 size-4" />
                  Add {singular}
                </Link>
              </Button>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${plural.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <ExportButton
              filename={plural.toLowerCase()}
              sheetName={plural}
              columns={exportColumns}
              data={filteredData as unknown as Record<string, unknown>[]}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredData.length === 0}
              onClick={handlePrint}
            >
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredData}
            bulkActions={
              canDelete
                ? [
                    {
                      label: "Deactivate Selected",
                      icon: Trash2,
                      variant: "destructive",
                      onClick: handleBulkDeactivate,
                    },
                  ]
                : []
            }
            pageSizeOptions={[10, 20, 50, 100, 150, "all"]}
          />
        </CardContent>
      </Card>

      {/* ── Delete Confirmation Dialog ──────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deactivation</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{deleteTarget?.name}</strong>? This will mark the{" "}
              {singular.toLowerCase()} as inactive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
