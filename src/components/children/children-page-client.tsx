"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { getChildrenColumns, type ChildRow } from "@/components/children/children-columns";
import { deleteChild } from "@/lib/actions/children";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Props types matching what the server actions return ──

interface BranchItem {
  id: string;
  name: string;
}

interface ClassItem {
  id: string;
  name: string;
  branchId: string;
}

interface ChildrenPageClientProps {
  children: ChildRow[];
  branches: BranchItem[];
  classes: ClassItem[];
}

export function ChildrenPageClient({
  children,
  branches,
  classes,
}: ChildrenPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Classes filtered by selected branch (for cascading filter)
  const availableClasses = useMemo(() => {
    if (branchFilter === "ALL") return classes;
    return classes.filter((c) => c.branchId === branchFilter);
  }, [branchFilter, classes]);

  // Reset class filter when branch changes and selected class is no longer available
  const effectiveClassFilter = useMemo(() => {
    if (classFilter === "ALL") return "ALL";
    const stillAvailable = availableClasses.some((c) => c.id === classFilter);
    return stillAvailable ? classFilter : "ALL";
  }, [classFilter, availableClasses]);

  // Derive status from isActive / isDraft
  function getStatus(child: ChildRow): "ACTIVE" | "DRAFT" | "INACTIVE" {
    if (child.isDraft) return "DRAFT";
    if (child.isActive) return "ACTIVE";
    return "INACTIVE";
  }

  // Filter children based on toolbar selections
  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      // Search by name
      if (search) {
        const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
        if (!fullName.includes(search.toLowerCase())) return false;
      }
      // Branch
      if (branchFilter !== "ALL" && child.branchId !== branchFilter)
        return false;
      // Class
      if (
        effectiveClassFilter !== "ALL" &&
        child.classId !== effectiveClassFilter
      )
        return false;
      // Gender
      if (genderFilter !== "ALL" && child.gender !== genderFilter) return false;
      // Status
      if (statusFilter !== "ALL" && getStatus(child) !== statusFilter)
        return false;
      return true;
    });
  }, [
    search,
    branchFilter,
    effectiveClassFilter,
    genderFilter,
    statusFilter,
    children,
  ]);

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await deleteChild(id);
      if (result.success) {
        toast.success(`${name} has been deactivated.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }, [deleteTarget, router]);

  const columns = useMemo(
    () => getChildrenColumns({ onDelete: handleDeleteRequest }),
    [handleDeleteRequest],
  );

  return (
    <>
      <PageHeader
        title="Children Listing"
        breadcrumbs={[
          { label: "Children Management", href: "/children" },
          { label: "Children Listing" },
        ]}
      />

      <div className="space-y-4 p-6">
        {/* ── Toolbar ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Branch filter */}
          <Select
            value={branchFilter}
            onValueChange={(v) => {
              setBranchFilter(v);
              setClassFilter("ALL");
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Class filter */}
          <Select
            value={effectiveClassFilter}
            onValueChange={setClassFilter}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {availableClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Gender filter */}
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Genders</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Add Child button */}
          <Button
            asChild
            className="bg-[#1caf9a] text-white hover:bg-[#18a08d]"
          >
            <Link href="/children/new">
              <Plus className="mr-1 size-4" />
              Add Child
            </Link>
          </Button>
        </div>

        {/* ── Data Table ──────────────────────────── */}
        <DataTable columns={columns} data={filteredChildren} />
      </div>

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
              <strong>{deleteTarget?.name}</strong>? This will mark the child as
              inactive.
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
