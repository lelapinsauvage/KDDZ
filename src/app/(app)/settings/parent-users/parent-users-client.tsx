"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, KeyRound, Loader2, Pencil, Printer, Search, UserPlus, UserX, X } from "lucide-react";
import { toast } from "sonner";
import type { ExportColumn } from "@/lib/export";
import {
  createParentUser,
  toggleParentUserStatus,
  resetParentPassword,
} from "@/lib/actions/parent-users";
import { getAvatarColor, getInitials } from "@/components/children/children-columns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParentUser {
  id: string;
  username: string;
  childNumber: string;
  childName: string;
  childId: string;
  childFirstName: string;
  childLastName: string;
  branchName: string;
  className: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

interface ChildWithoutAccount {
  id: string;
  childNumber: string;
  name: string;
  firstName: string;
  lastName: string;
  branchName: string;
  className: string;
}

interface ParentUsersClientProps {
  usersWithAccount: ParentUser[];
  childrenWithoutAccount: ChildWithoutAccount[];
  initialCreateChildId?: string;
}

const withAccountExportColumns: ExportColumn[] = [
  { header: "#", key: "childNumber" },
  { header: "Name", key: "childName" },
  { header: "Username", key: "username" },
  { header: "Status", key: "status" },
  { header: "Branch", key: "branchName" },
  { header: "Class", key: "className" },
];

const withoutAccountExportColumns: ExportColumn[] = [
  { header: "#", key: "childNumber" },
  { header: "Name", key: "name" },
  { header: "Branch", key: "branchName" },
  { header: "Class", key: "className" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ParentUsersClient({
  usersWithAccount: initialUsers,
  childrenWithoutAccount: initialChildrenWithout,
  initialCreateChildId,
}: ParentUsersClientProps) {
  const initialCreateChild = initialCreateChildId
    ? initialChildrenWithout.find((c) => c.id === initialCreateChildId)
    : undefined;
  const [users, setUsers] = useState(initialUsers);
  const [childrenWithout, setChildrenWithout] = useState(initialChildrenWithout);
  const [isPending, startTransition] = useTransition();

  // Search state for table 1
  const [searchWith, setSearchWith] = useState("");
  // Search state for table 2
  const [searchWithout, setSearchWithout] = useState("");

  // Create-user dialog state
  const [createOpen, setCreateOpen] = useState(Boolean(initialCreateChild));
  const [createChildId, setCreateChildId] = useState(initialCreateChild?.id ?? "");
  const [createChildName, setCreateChildName] = useState(initialCreateChild?.name ?? "");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newStatus, setNewStatus] = useState("active");

  // Reset-password dialog state
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ userId: string; childName: string } | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  // ---------- Filtering ----------

  const filteredUsers = useMemo(() => {
    if (!searchWith.trim()) return users;
    const q = searchWith.toLowerCase();
    return users.filter(
      (u) =>
        u.childNumber.toLowerCase().includes(q) ||
        u.childName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q) ||
        u.branchName.toLowerCase().includes(q) ||
        u.className.toLowerCase().includes(q)
    );
  }, [users, searchWith]);

  const filteredChildrenWithout = useMemo(() => {
    if (!searchWithout.trim()) return childrenWithout;
    const q = searchWithout.toLowerCase();
    return childrenWithout.filter(
      (c) =>
        c.childNumber.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.branchName.toLowerCase().includes(q) ||
        c.className.toLowerCase().includes(q)
    );
  }, [childrenWithout, searchWithout]);

  // ---------- Handlers ----------

  const openCreateDialog = useCallback((childId: string, childName: string) => {
    setCreateChildId(childId);
    setCreateChildName(childName);
    setNewUsername("");
    setNewPassword("");
    setNewStatus("active");
    setCreateOpen(true);
  }, []);

  function handleCreate() {
    if (!newUsername.trim() || !createChildId || !newPassword) return;

    startTransition(async () => {
      const result = await createParentUser({
        username: newUsername.trim(),
        password: newPassword,
        childId: createChildId,
        isActive: newStatus === "active",
      });

      if (result.success && result.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newUser = result.data as any;
        const child = childrenWithout.find((c) => c.id === createChildId);
        setUsers([
          ...users,
          {
            id: newUser.id,
            username: newUsername.trim(),
            childNumber: child?.childNumber ?? "—",
            childName: child?.name ?? "—",
            childId: createChildId,
            childFirstName: child?.firstName ?? "",
            childLastName: child?.lastName ?? "",
            branchName: child?.branchName ?? "—",
            className: child?.className ?? "—",
            status: newStatus === "active" ? "Active" : "Inactive",
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        // Remove from "without" list
        setChildrenWithout(childrenWithout.filter((c) => c.id !== createChildId));
        setCreateOpen(false);
        toast.success("Parent account created successfully.");
      } else {
        toast.error(result.error ?? "Failed to create parent account.");
      }
    });
  }

  const handleToggleStatus = useCallback((id: string) => {
    startTransition(async () => {
      const result = await toggleParentUserStatus(id);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
              : u
          ) as ParentUser[]
        );
      } else {
        toast.error(result.error ?? "Failed to update parent account status.");
      }
    });
  }, []);

  const openResetDialog = useCallback((userId: string, childName: string) => {
    setResetPasswordDialog({ userId, childName });
    setResetPassword("");
  }, []);

  function handleConfirmReset() {
    if (!resetPasswordDialog || !resetPassword) return;
    const { userId } = resetPasswordDialog;
    startTransition(async () => {
      const result = await resetParentPassword(userId, resetPassword);
      if (result.success) {
        toast.success("Password has been reset.");
      } else {
        toast.error(result.error ?? "Failed to reset password.");
      }
      setResetPasswordDialog(null);
      setResetPassword("");
    });
  }

  // ---------- Table 1: Children WITH parent account ----------

  const withAccountColumns: ColumnDef<ParentUser>[] = useMemo(
    () => [
      {
        accessorKey: "childNumber",
        header: "#",
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.childNumber || "—"}
          </span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const u = row.original;
          const initials = getInitials(u.childFirstName || "?", u.childLastName || "?");
          const bg = getAvatarColor(u.childName);
          return (
            <Link href={`/children/${u.childId}/dashboard`} className="flex items-center gap-2 group">
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${bg}`}>
                {initials}
              </div>
              <span className="text-sm font-medium group-hover:underline">{u.childName}</span>
            </Link>
          );
        },
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">@{row.original.username}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.status === "Active"
                ? "bg-[#059669] text-white"
                : "bg-gray-500 text-white"
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "branchName",
        header: "Branch",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: "className",
        header: "Class",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.className}</span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" asChild>
              <Link href={`/settings/parent-users/${row.original.id}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="size-8" asChild>
              <Link href={`/settings/parent-users/${row.original.id}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              title="Reset Password"
              onClick={() => openResetDialog(row.original.id, row.original.childName)}
              disabled={isPending}
            >
              <KeyRound className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 text-destructive hover:bg-destructive/10"
              title={row.original.status === "Active" ? "Deactivate" : "Activate"}
              onClick={() => handleToggleStatus(row.original.id)}
              disabled={isPending}
            >
              <UserX className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [isPending, openResetDialog, handleToggleStatus]
  );

  // ---------- Table 2: Children WITHOUT parent account ----------

  const withoutAccountColumns: ColumnDef<ChildWithoutAccount>[] = useMemo(
    () => [
      {
        accessorKey: "childNumber",
        header: "#",
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.childNumber || "—"}
          </span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const c = row.original;
          const initials = getInitials(c.firstName || "?", c.lastName || "?");
          const bg = getAvatarColor(c.name);
          return (
            <Link href={`/children/${c.id}/dashboard`} className="flex items-center gap-2 group">
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${bg}`}>
                {initials}
              </div>
              <span className="text-sm font-medium group-hover:underline">{c.name}</span>
            </Link>
          );
        },
      },
      {
        accessorKey: "branchName",
        header: "Branch",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: "className",
        header: "Class",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.className}</span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCreateDialog(row.original.id, row.original.name)}
            disabled={isPending}
          >
            <UserPlus className="mr-1.5 size-3.5" />
            Create User
          </Button>
        ),
      },
    ],
    [isPending, openCreateDialog]
  );

  // ---------- Render ----------

  return (
    <>
      <PageHeader
        title="Parent System Users Control"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Parent Users" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="hidden print:block">
          <h1 className="text-xl font-semibold">Parent System Users Control</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredUsers.length} children with parent users,{" "}
            {filteredChildrenWithout.length} children without parent users -
            Printed on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Table 1: Children WITH Parent User */}
        <Card>
          <CardContent className="space-y-3 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                1
              </div>
              <h2 className="text-base font-semibold">Children With Parent User</h2>
              <Badge className="ml-1 bg-primary text-white">
                {filteredUsers.length}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search #, name, username, status, branch, or class..."
                  value={searchWith}
                  onChange={(e) => setSearchWith(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchWith && (
                  <button
                    type="button"
                    onClick={() => setSearchWith("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear children with parent user search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <ExportButton
                filename="children-with-parent-users"
                sheetName="Children With Parent User"
                columns={withAccountExportColumns}
                data={filteredUsers as unknown as Record<string, unknown>[]}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filteredUsers.length === 0}
                onClick={() => window.print()}
              >
                <Printer className="mr-1 size-4" />
                Print
              </Button>
            </div>

            <DataTable
              columns={withAccountColumns}
              data={filteredUsers}
              pageSizeOptions={[10, 20, 50, 100, 150, "all"]}
            />
          </CardContent>
        </Card>

        {/* Table 2: Children WITHOUT Parent User */}
        <Card>
          <CardContent className="space-y-3 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-6 items-center justify-center rounded bg-amber-500 text-white text-xs font-bold">
                2
              </div>
              <h2 className="text-base font-semibold">Children without Parent Users</h2>
              <Badge className="ml-1 bg-amber-500 text-white">
                {filteredChildrenWithout.length}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search #, name, branch, or class..."
                  value={searchWithout}
                  onChange={(e) => setSearchWithout(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchWithout && (
                  <button
                    type="button"
                    onClick={() => setSearchWithout("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear children without parent users search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <ExportButton
                filename="children-without-parent-users"
                sheetName="Children without Parent Users"
                columns={withoutAccountExportColumns}
                data={filteredChildrenWithout as unknown as Record<string, unknown>[]}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filteredChildrenWithout.length === 0}
                onClick={() => window.print()}
              >
                <Printer className="mr-1 size-4" />
                Print
              </Button>
            </div>

            <DataTable
              columns={withoutAccountColumns}
              data={filteredChildrenWithout}
              pageSizeOptions={[10, 20, 50, 100, 150, "all"]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Parent Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Child</label>
              <Input value={createChildName} disabled />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Username</label>
              <Input
                placeholder="e.g. lastname.parent"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Initial password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">InActive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="text-primary-foreground"
              onClick={handleCreate}
              disabled={!newUsername.trim() || !newPassword || isPending}
            >
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResetPasswordDialog(null);
            setResetPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {resetPasswordDialog?.childName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialog(null)}>
              Cancel
            </Button>
            <Button
              className="text-primary-foreground"
              onClick={handleConfirmReset}
              disabled={!resetPassword || isPending}
            >
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
