"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  GraduationCap,
  GitBranch,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { deleteBranch } from "@/lib/actions/branches";
import { toast } from "sonner";

// ── Branch shape coming from the server ──
export interface BranchItem {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  themeColor: string | null;
  classCount: number;
  childrenCount: number;
  teacherCount: number;
  compliancePercentage: number | null;
}

interface BranchesClientProps {
  branches: BranchItem[];
}

function ComplianceBadge({ percentage }: { percentage: number | null }) {
  if (percentage === null) {
    return (
      <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
        No data
      </Badge>
    );
  }
  if (percentage >= 80) {
    return (
      <Badge className="bg-[#059669]/15 text-[#047857] border-[#059669]/25 text-[10px]">
        {percentage}% compliant
      </Badge>
    );
  }
  if (percentage >= 50) {
    return (
      <Badge className="bg-[#A0784C]/15 text-[#8B6537] border-[#A0784C]/25 text-[10px]">
        {percentage}% compliant
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#C17C5A]/15 text-[#A0613E] border-[#C17C5A]/25 text-[10px]">
      {percentage}% compliant
    </Badge>
  );
}

export function BranchesClient({ branches }: BranchesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<BranchItem | null>(null);

  const totalBranches = branches.length;
  const totalClasses = branches.reduce((sum, b) => sum + b.classCount, 0);
  const totalStudents = branches.reduce((sum, b) => sum + b.childrenCount, 0);

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteBranch(deleteTarget.id);
      if (result.success) {
        toast.success(`"${deleteTarget.name}" has been deactivated`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete branch");
      }
      setDeleteTarget(null);
    });
  }

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
          <Card className="rounded-sm py-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-sm bg-[#A0784C]/10">
                <GitBranch className="size-5 text-[#A0784C]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Branches</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalBranches}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-sm py-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-sm bg-[#C17C5A]/10">
                <GraduationCap className="size-5 text-[#C17C5A]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalClasses}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-sm py-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-sm bg-[#059669]/10">
                <Users className="size-5 text-[#059669]" />
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
          <Link href="/branches/new">
            <Button>
              <Plus className="mr-1 size-4" />
              Add Branch
            </Button>
          </Link>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => {
            const color = branch.themeColor || "#A0784C";
            return (
              <Card key={branch.id} className="relative overflow-hidden rounded-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                {/* Color stripe */}
                <div
                  className="h-1.5"
                  style={{ backgroundColor: color }}
                />
                <CardHeader className="flex-row items-center gap-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-sm"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Building2 className="size-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {branch.name}
                    </CardTitle>
                    <ComplianceBadge
                      percentage={branch.compliancePercentage}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      className={
                        branch.isActive
                          ? "bg-[#059669]/15 text-[#047857] border-[#059669]/25"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/branches/${branch.id}`)
                          }
                        >
                          <Eye className="mr-2 size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/branches/${branch.id}/edit`)
                          }
                        >
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteTarget(branch)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {branch.address || "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4 shrink-0" />
                    {branch.phone || "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4 shrink-0" />
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
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{deleteTarget?.name}</strong>? This will mark the branch
              as inactive. It can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
