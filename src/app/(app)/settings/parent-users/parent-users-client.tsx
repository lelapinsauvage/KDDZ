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
import { Plus, Pencil, KeyRound, UserX, Eye, Loader2, Phone, Mail, MessageCircle } from "lucide-react";
import {
  createParentUser,
  toggleParentUserStatus,
  resetParentPassword,
} from "@/lib/actions/parent-users";
import { getAvatarColor, getInitials } from "@/components/children/children-columns";

interface ParentContact {
  type: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface ParentUser {
  id: string;
  username: string;
  childName: string;
  childId: string;
  childFirstName: string;
  childLastName: string;
  branchName: string;
  status: "Active" | "Inactive";
  createdAt: string;
  parents: ParentContact[];
}

interface ChildOption {
  id: string;
  name: string;
}

interface ParentUsersClientProps {
  users: ParentUser[];
  childrenList: ChildOption[];
}

function formatWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.+]/g, "");
  return `https://wa.me/${cleaned}`;
}

function WhatsAppButton({ phone }: { phone: string }) {
  return (
    <a
      href={formatWhatsAppUrl(phone)}
      target="_blank"
      rel="noopener noreferrer"
      title={`WhatsApp ${phone}`}
      className="inline-flex size-7 items-center justify-center rounded-md text-green-600 hover:bg-green-50 transition-colors"
    >
      <MessageCircle className="size-3.5" />
    </a>
  );
}

function PhoneButton({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone}`}
      title={`Call ${phone}`}
      className="inline-flex size-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
    >
      <Phone className="size-3.5" />
    </a>
  );
}

export function ParentUsersClient({ users: initialUsers, childrenList }: ParentUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newChild, setNewChild] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.childName.toLowerCase().includes(q) ||
        u.parents.some((p) => p.name?.toLowerCase().includes(q))
    );
  }, [users, search]);

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
        const child = childrenList.find((c) => c.id === newChild);
        const childName = child?.name ?? "—";
        const names = childName.split(" ");
        setUsers([
          ...users,
          {
            id: newUser.id,
            username: newUsername.trim(),
            childName,
            childId: newChild,
            childFirstName: names[0] ?? "",
            childLastName: names.slice(1).join(" ") ?? "",
            branchName: "—",
            status: "Active",
            createdAt: new Date().toISOString().split("T")[0],
            parents: [],
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
        id: "parent",
        header: "Parent / Guardian",
        cell: ({ row }) => {
          const u = row.original;
          const primaryParent = u.parents[0];
          const parentName = primaryParent?.name ?? u.username;
          const phone = primaryParent?.phone ?? null;
          const email = primaryParent?.email ?? null;
          return (
            <div className="flex flex-col gap-0.5">
              <Link href={`/settings/parent-users/${u.id}`} className="font-medium hover:underline">
                {parentName}
              </Link>
              <span className="text-xs text-muted-foreground">@{u.username}</span>
              {(phone || email) && (
                <div className="flex items-center gap-1 mt-0.5">
                  {phone && (
                    <span className="text-xs text-muted-foreground">{phone}</span>
                  )}
                  {email && (
                    <span className="text-xs text-muted-foreground">{phone ? ` · ${email}` : email}</span>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "child",
        header: "Linked Child",
        cell: ({ row }) => {
          const u = row.original;
          const initials = getInitials(u.childFirstName || "?", u.childLastName || "?");
          const bg = getAvatarColor(u.childName);
          return (
            <Link href={`/children/${u.childId}/dashboard`} className="flex items-center gap-2 group">
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${bg}`}>
                {initials}
              </div>
              <span className="text-sm group-hover:underline">{u.childName}</span>
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
        id: "contact",
        header: "Quick Contact",
        cell: ({ row }) => {
          const u = row.original;
          const phone = u.parents[0]?.phone ?? null;
          const email = u.parents[0]?.email ?? null;
          if (!phone && !email) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-0.5">
              {phone && <PhoneButton phone={phone} />}
              {phone && <WhatsAppButton phone={phone} />}
              {email && (
                <a
                  href={`mailto:${email}`}
                  title={`Email ${email}`}
                  className="inline-flex size-7 items-center justify-center rounded-md text-[#4F46E5] hover:bg-[#4F46E5]/10 transition-colors"
                >
                  <Mail className="size-3.5" />
                </a>
              )}
            </div>
          );
        },
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
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by parent name, username, or child name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-sm text-muted-foreground">
            {filteredUsers.length} account{filteredUsers.length !== 1 ? "s" : ""}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
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
