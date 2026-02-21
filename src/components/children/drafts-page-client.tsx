"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { childrenColumns, type ChildRow } from "@/components/children/children-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface DraftsPageClientProps {
  children: ChildRow[];
  branches: BranchItem[];
  classes: ClassItem[];
}

export function DraftsPageClient({
  children,
  branches,
  classes,
}: DraftsPageClientProps) {
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");

  // Classes filtered by selected branch
  const availableClasses = useMemo(() => {
    if (branchFilter === "ALL") return classes;
    return classes.filter((c) => c.branchId === branchFilter);
  }, [branchFilter, classes]);

  const effectiveClassFilter = useMemo(() => {
    if (classFilter === "ALL") return "ALL";
    const stillAvailable = availableClasses.some((c) => c.id === classFilter);
    return stillAvailable ? classFilter : "ALL";
  }, [classFilter, availableClasses]);

  // Apply toolbar filters
  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      // Search by name
      if (search) {
        const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
        if (!fullName.includes(search.toLowerCase())) return false;
      }
      // Branch
      if (branchFilter !== "ALL" && child.branchId !== branchFilter) return false;
      // Class
      if (effectiveClassFilter !== "ALL" && child.classId !== effectiveClassFilter) return false;
      return true;
    });
  }, [search, branchFilter, effectiveClassFilter, children]);

  return (
    <>
      <PageHeader
        title="Children Drafts"
        breadcrumbs={[
          { label: "Children Management", href: "/children" },
          { label: "Children Drafts" },
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
          <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setClassFilter("ALL"); }}>
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
          <Select value={effectiveClassFilter} onValueChange={setClassFilter}>
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
        <DataTable
          columns={childrenColumns}
          data={filteredChildren}
        />
      </div>
    </>
  );
}
