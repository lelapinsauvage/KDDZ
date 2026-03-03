"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import Link from "next/link";
import { type ColumnDef} from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, KeyRound, UserX, Eye, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
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
  name: string;
  firstName: string;
  lastName: string;
  branchName: string;
  className: string;
}

interface ParentUsersClientProps {
  usersWithAccount: ParentUser[];
  childrenWithoutAccount: ChildWithoutAccount[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ParentUsersClient({
  usersWithAccount: initialUsers,
  childrenWithoutAccount: initialChildrenWithout,
}: ParentUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [childrenWithout, setChildrenWithout] = useState(initialChildrenWithout);
  const [isPending, startTransition] = useTransition();

  // Search state for table 1
  const [searchWith, setSearchWith] = useState("");
  // Search state for table 2
  const [searchWithout, setSearchWithout] = useState("");

  // Create-user dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createChildId, setCreateChildId] = useState("");
  const [createChildName, setCreateChildName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Reset-password dialog state
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ userId: string; childName: string } | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  // ---------- Filtering ----------

  const filteredUsers = useMemo(() => {
    if (!searchWith.trim()) return users;
    const q = searchWith.toLowerCase();
    return users.filter(
      (u) =>
        u.childName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.branchName.toLowerCase().includes(q) ||
        u.className.toLowerCase().includes(q)
    );
  }, [users, searchWith]);

  const filteredChildrenWithout = useMemo(() => {
    if (!searchWithout.trim()) return childrenWithout;
    const q = searchWithout.toLowerCase();
    return childrenWithout.filter(
      (c) =>
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
    setCreateOpen(true);
  }, []);

  function handleCreate() {
    if (!newUsername.trim() || !createChildId || !newPassword) return;

    startTransition(async () => {
      const result = await createParentUser({
        username: newUsername.trim(),
        password: newPassword,
        childId: createChildId,
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
            childName: child?.name ?? "—",
            childId: createChildId,
            childFirstName: child?.firstName ?? "",
            childLastName: child?.lastName ?? "",
            branchName: child?.branchName ?? "—",
            className: child?.className ?? "—",
            status: "Active",
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        // Remove from "without" list
        setChildrenWithout(childrenWithout.filter((c) => c.id !== createChildId));
        setCreateOpen(false);
        toast.success("Parent account created successfully.");
      } else {
        toast.error("Failed to create parent account.");
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
      try {
        await resetParentPassword(userId, resetPassword);
        toast.success("Password has been reset.");
      } catch {
        toast.error("Failed to reset password.");
      }
      setResetPasswordDialog(null);
      setResetPassword("");
    });
  }

  // ---------- Table 1: Children WITH parent account ----------

  const withAccountColumns: ColumnDef<ParentUser>[] = useMemo(
    () => [
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
                ? "bg-[#059669]/15 text-[#059669]"
                : "bg-gray-100 text-gray-600"
            }
          >
            <span className={`mr-1.5 inline-block size-1.5 rounded-full ${row.original.status === "Active" ? "bg-[#059669]" : "bg-gray-400"}`} />
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
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link href={`/settings/parent-users/${row.original.id}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link href={`/settings/parent-users/${row.original.id}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Reset Password"
              onClick={() => openResetDialog(row.original.id, row.original.childName)}
              disabled={isPending}
            >
              <KeyRound className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
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
        title="Parent Users"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Parent Users" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Table 1: Children WITH Parent User */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
              1
            </div>
            <h2 className="text-base font-semibold">Children with Parent Account</h2>
            <Badge variant="secondary" className="ml-1">
              {filteredUsers.length}
            </Badge>
          </div>

          <Input
            placeholder="Search by name, username, branch, or class..."
            value={searchWith}
            onChange={(e) => setSearchWith(e.target.value)}
            className="max-w-sm"
          />

          <DataTable columns={withAccountColumns} data={filteredUsers} />
        </div>

        {/* Table 2: Children WITHOUT Parent User */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-6 items-center justify-center rounded bg-amber-500 text-white text-xs font-bold">
              2
            </div>
            <h2 className="text-base font-semibold">Children without Parent Account</h2>
            <Badge variant="secondary" className="ml-1">
              {filteredChildrenWithout.length}
            </Badge>
          </div>

          <Input
            placeholder="Search by name, branch, or class..."
            value={searchWithout}
            onChange={(e) => setSearchWithout(e.target.value)}
            className="max-w-sm"
          />

          <DataTable columns={withoutAccountColumns} data={filteredChildrenWithout} />
        </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="text-white"
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
              className="text-white"
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
