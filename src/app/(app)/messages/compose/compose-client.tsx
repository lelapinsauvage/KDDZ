"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Search,
  Users,
  CheckSquare,
  XSquare,
  Loader2,
  UserCheck,
} from "lucide-react";
import { sendBulkChildMessage } from "@/lib/actions/messages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Branch {
  id: string;
  name: string;
}

interface ChildItem {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  branchId: string | null;
  branchName: string | null;
  classId: string | null;
  className: string | null;
}

interface ClassItem {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
}

interface ComposeClientProps {
  branches: Branch[];
  childrenList: ChildItem[];
  classes: ClassItem[];
}

// ---------------------------------------------------------------------------
// Avatar helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-orange-500",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(first: string, last: string): string {
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

// ---------------------------------------------------------------------------
// Nature types
// ---------------------------------------------------------------------------

const NATURES = [
  { value: "General", label: "General" },
  { value: "Urgent", label: "Urgent" },
  { value: "Legal", label: "Legal" },
  { value: "Event", label: "Event" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComposeClient({
  branches,
  childrenList: children,
  classes,
}: ComposeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Left pane state
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Right pane state
  const [nature, setNature] = useState("General");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  // Filtered classes based on branch
  const filteredClasses = useMemo(() => {
    if (branchFilter === "all") return classes;
    return classes.filter((c) => c.branchId === branchFilter);
  }, [classes, branchFilter]);

  // Filtered children based on branch + class + search
  const filteredChildren = useMemo(() => {
    let list = children;

    if (branchFilter !== "all") {
      list = list.filter((c) => c.branchId === branchFilter);
    }
    if (classFilter !== "all") {
      list = list.filter((c) => c.classId === classFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q),
      );
    }

    return list;
  }, [children, branchFilter, classFilter, search]);

  // Selection handlers
  function toggleChild(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of filteredChildren) next.add(c.id);
      return next;
    });
  }

  function selectAllActive() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of filteredChildren) {
        if (c.isActive) next.add(c.id);
      }
      return next;
    });
  }

  function unselectAll() {
    setSelectedIds(new Set());
  }

  // Reset class filter when branch changes
  function handleBranchChange(val: string) {
    setBranchFilter(val);
    setClassFilter("all");
  }

  // Send
  function handleSend() {
    if (selectedIds.size === 0 || !body) return;
    setError(null);

    startTransition(async () => {
      const result = await sendBulkChildMessage({
        childIds: Array.from(selectedIds),
        subject: subject || null,
        body,
        nature,
      });

      if (result.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result.data as any;
        setSentCount(data?.recipientCount ?? 0);
        setSuccess(true);
        setTimeout(() => router.push("/messages/sent"), 2000);
      } else {
        setError(result.error ?? "Failed to send messages");
      }
    });
  }

  const canSend = selectedIds.size > 0 && body && !isPending && !success;

  return (
    <>
      <PageHeader
        title="Compose Message"
        breadcrumbs={[
          { label: "Messages", href: "/messages/inbox" },
          { label: "Compose" },
        ]}
      />

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* ─── LEFT PANE: Recipient Selector ─── */}
          <Card className="lg:col-span-5">
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Recipients</h3>
                </div>
                {selectedIds.size > 0 && (
                  <Badge className="bg-primary/10 text-primary font-normal">
                    {selectedIds.size} selected
                  </Badge>
                )}
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-2 gap-2">
                <Select value={branchFilter} onValueChange={handleBranchChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Branch" />
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

                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {filteredClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search children..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              {/* Bulk actions */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={selectAllVisible}
                >
                  <CheckSquare className="mr-1 size-3" />
                  Select All Children
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={selectAllActive}
                >
                  <UserCheck className="mr-1 size-3" />
                  Select All Active
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={unselectAll}
                >
                  <XSquare className="mr-1 size-3" />
                  Unselect All
                </Button>
              </div>

              {/* Children list */}
              <div className="max-h-[420px] overflow-y-auto rounded-lg border divide-y">
                {filteredChildren.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No children found matching your filters.
                  </div>
                ) : (
                  filteredChildren.map((child) => {
                    const fullName = `${child.firstName} ${child.lastName}`;
                    const isChecked = selectedIds.has(child.id);
                    return (
                      <label
                        key={child.id}
                        className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 ${
                          isChecked ? "bg-primary/5" : ""
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleChild(child.id)}
                        />
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(fullName)}`}
                        >
                          {initials(child.firstName, child.lastName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {child.className ?? "No class"}
                            {child.branchName
                              ? ` \u00B7 ${child.branchName}`
                              : ""}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {filteredChildren.length}{" "}
                {filteredChildren.length === 1 ? "child" : "children"} shown
              </p>
            </CardContent>
          </Card>

          {/* ─── RIGHT PANE: Message Composer ─── */}
          <Card className="lg:col-span-7">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Compose</h3>
              </div>

              {/* Nature */}
              <div className="space-y-1.5">
                <Label className="text-xs">Nature</Label>
                <Select value={nature} onValueChange={setNature}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NATURES.map((n) => (
                      <SelectItem key={n.value} value={n.value}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Input
                  placeholder="Message subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <Textarea
                  placeholder="Type your message to the selected recipients..."
                  rows={12}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              {/* Error / success */}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && (
                <p className="text-sm text-green-600">
                  Message sent to {sentCount} parent
                  {sentCount !== 1 ? "s" : ""} ({selectedIds.size} children)
                  successfully! Redirecting...
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {selectedIds.size > 0
                    ? `Sending to parents of ${selectedIds.size} selected ${selectedIds.size === 1 ? "child" : "children"}`
                    : "Select at least one child to send"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/messages/inbox")}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={!canSend}
                    className="text-white"
                  >
                    {isPending ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 size-3.5" />
                    )}
                    {isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
