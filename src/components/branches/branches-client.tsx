"use client";

import {
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  GraduationCap,
  GitBranch,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Branch shape coming from the server ──
export interface BranchItem {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  classCount: number;
  childrenCount: number;
  teacherCount: number;
}

interface BranchesClientProps {
  branches: BranchItem[];
}

export function BranchesClient({ branches }: BranchesClientProps) {
  const totalBranches = branches.length;
  const totalClasses = branches.reduce((sum, b) => sum + b.classCount, 0);
  const totalStudents = branches.reduce((sum, b) => sum + b.childrenCount, 0);

  return (
    <>
      <PageHeader
        title="Branches Management"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Branches Management" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <GitBranch className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Branches</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalBranches}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                <GraduationCap className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalClasses}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
                <Users className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalStudents}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Branch button */}
        <div className="flex justify-end">
          <Button>
            <Plus className="mr-1 size-4" />
            Add Branch
          </Button>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="relative">
              <CardHeader className="flex-row items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{branch.name}</CardTitle>
                </div>
                <Badge
                  className={
                    branch.isActive
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }
                >
                  {branch.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-[#555]">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {branch.address || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#555]">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  {branch.phone || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#555]">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  {branch.email || "N/A"}
                </div>

                <div className="border-t pt-3 mt-1">
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-lg font-semibold text-foreground">
                        {branch.classCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Active Classes
                      </p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center flex-1">
                      <p className="text-lg font-semibold text-foreground">
                        {branch.childrenCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Students
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
