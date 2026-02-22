"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, KeyRound, UserX, Eye, Loader2 } from "lucide-react";
import {
  createParentUser,
  toggleParentUserStatus,
  resetParentPassword,
} from "@/lib/actions/parent-users";

interface ParentUser {
  id: string;
  username: string;
  childName: string;
  childId: string;
  branchName: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

interface ChildOption {
  id: string;
  name: string;
}

interface ParentUsersClientProps {
  users: ParentUser[];
  childrenList: ChildOption[];
}

export function ParentUsersClient({ users: initialUsers, childrenList }: ParentUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newChild, setNewChild] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newUsername.trim() || !newChild || !newPassword) return;

    startTransition(async () => {
      const result = await createParentUser({
        username: newUsername.trim(),
        password: newPassword,
        childId: newChild,
      });

      if (result.success && result.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newUser = result.data as any;
        const childName = childrenList.find((c) => c.id === newChild)?.name ?? "—";
        setUsers([
          ...users,
          {
            id: newUser.id,
            username: newUsername.trim(),
            childName,
            childId: newChild,
            branchName: "—",
            status: "Active",
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        setCreateOpen(false);
        setNewUsername("");
        setNewChild("");
        setNewPassword("");
      }
    });
  }

  function handleToggleStatus(id: string) {
    startTransition(async () => {
      const result = await toggleParentUserStatus(id);
      if (result.success) {
        setUsers(
          users.map((u) =>
            u.id === id
              ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
              : u
          ) as ParentUser[]
        );
      }
    });
  }

  function handleResetPassword(id: string) {
    const newPw = prompt("Enter new password for this parent user:");
    if (!newPw) return;

    startTransition(async () => {
      await resetParentPassword(id, newPw);
      alert("Password has been reset.");
    });
  }

  const columns: ColumnDef<ParentUser>[] = useMemo(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => <span className="font-medium">{row.original.username}</span>,
      },
      {
        accessorKey: "childName",
        header: "Child Name",
      },
      {
        accessorKey: "branchName",
        header: "Branch",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.status === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.createdAt}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
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
              onClick={() => handleResetPassword(row.original.id)}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, isPending]
  );

  return (
    <>
      <PageHeader
        title="Parent Users"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Parent Users" },
        ]}
        actions={
          <Button className="bg-primary text-white hover:bg-primary/90" onClick={() => setCreateOpen(true)} disabled={isPending}>
            <Plus className="mr-1 size-4" />
            Create Parent Account
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <DataTable
          columns={columns}
          data={users}
          searchKey="username"
          searchPlaceholder="Search by username..."
        />
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Parent Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Username</label>
              <Input
                placeholder="e.g. lastname.parent"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Linked Child</label>
              <Select value={newChild} onValueChange={setNewChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {childrenList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={!newUsername.trim() || !newChild || !newPassword || isPending}
            >
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
