"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ClipboardList,
  FileCheck,
  FileClock,
  FileEdit,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteMedicalForm } from "@/lib/actions/medical";

// --- Types ---

type FormStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface SufferingRow {
  id: string;
  childId: string;
  childName: string;
  conclusion: string;
  filledCount: number;
  totalCount: number;
  status: FormStatus;
  createdAt: string;
  branchId: string;
  branchName: string;
}

// --- Avatar helpers ---

const avatarColors = [
  "bg-[#8B7355]/15 text-[#8B7355]",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-[#6B8F71]/15 text-[#6B8F71]",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-[#C35A2C]/10 text-[#C35A2C]",
  "bg-orange-100 text-orange-700",
];

function getInitials(name: string) {
  const parts = name.split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// --- Badge helpers ---

function getStatusBadge(status: FormStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge className="gap-1 bg-slate-100 text-slate-600 border-slate-200">
          <FileEdit className="size-3" />
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <FileClock className="size-3" />
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="gap-1 bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20">
          <FileCheck className="size-3" />
          Reviewed
        </Badge>
      );
  }
}

// --- Props ---

interface SufferingListClientProps {
  forms: SufferingRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

// --- Component ---

export function SufferingListClient({
  forms,
  branches,
}: SufferingListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = forms;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((f) => f.childName.toLowerCase().includes(lower));
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((f) => f.status === statusFilter);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((f) => f.branchId === branchFilter);
    }

    return data;
  }, [forms, search, statusFilter, branchFilter]);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteMedicalForm(deleteId);
      if (result.success) {
        toast.success("Suffering form deleted.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete.");
      }
      setDeleteId(null);
    });
  }

  const columns: ColumnDef<SufferingRow>[] = [
    {
      accessorKey: "childName",
      header: "Child Name",
      cell: ({ row }) => {
        const name = row.original.childName;
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(name)}`}
            >
              {getInitials(name)}
            </div>
            <span className="font-medium text-foreground">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "filledCount",
      header: "Completion",
      cell: ({ row }) => {
        const { filledCount, totalCount } = row.original;
        const pct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filledCount}/{totalCount}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "conclusion",
      header: "Conclusion",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {row.original.conclusion || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
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
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const record = row.original;
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
                <Link href={`/medical/suffering/${record.id}`}>
                  <Eye className="size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/medical/suffering/${record.id}`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteId(record.id)}
              >
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
        title="Suffering Assessment Forms"
        breadcrumbs={[
          { label: "Health", href: "/medical/general" },
          { label: "Suffering Forms" },
        ]}
        actions={
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/medical/suffering/new">
              <Plus className="mr-1 size-4" />
              Add New
            </Link>
          </Button>
        }
      />
      <div className="p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative max-w-sm flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No suffering forms found"
            description="No suffering assessment forms match your current filters."
          />
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Suffering Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this suffering assessment form? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
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
