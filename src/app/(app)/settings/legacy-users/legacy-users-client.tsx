"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/shared/export-button";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createLegacyAdminUser,
  deleteLegacyAdminUser,
  unlinkLegacyAdminUserSocialProvider,
  type LegacyAdminLevelOption,
  type LegacyAdminUserGroup,
  type LegacyAdminUserInput,
  type LegacyAdminUserRow,
  type LegacyAdminUsersData,
  type LegacyUserRecordType,
  updateLegacyAdminUser,
} from "@/lib/actions/legacy-users";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Database,
  History,
  Link2,
  Pencil,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  TextCursorInput,
  Trash2,
  UserCog,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import type { ExportColumn } from "@/lib/export";

const ALL_GROUPS_KEY = "__all__";
const PAGE_SIZE_ALL = "all";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 150] as const;

type LegacyUsersPageSize = (typeof PAGE_SIZE_OPTIONS)[number] | typeof PAGE_SIZE_ALL;
type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

const legacyUserExportColumns: ExportColumn[] = [
  { header: "Legacy ID", key: "legacyId" },
  { header: "Username", key: "username" },
  { header: "Name", key: "name" },
  { header: "Email", key: "email" },
  { header: "Levels", key: "levels" },
  { header: "Source", key: "source" },
  { header: "Branches", key: "branches" },
  { header: "Classes", key: "classes" },
  { header: "Social Links", key: "socialLinks" },
  { header: "Last Login", key: "lastLogin" },
  { header: "Login Count", key: "loginCount" },
  { header: "Status", key: "status" },
  { header: "Modern Account", key: "modernAccount" },
];

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type DialogMode = "create" | "edit";

type LegacyUserFormState = Omit<
  LegacyAdminUserInput,
  | "password"
  | "password2"
  | "sites"
  | "classes"
  | "isRestricted"
  | "profileValues"
> & {
  password: string;
  password2: string;
  sites: string;
  classes: string;
  isRestricted: boolean;
  profileValues: Record<string, string>;
};

type AccessOption = {
  id: string;
  legacyId: number;
  label: string;
  meta?: string | null;
};

type LegacyUsersClientProps = {
  initialData: LegacyAdminUsersData;
  initialError?: string | null;
  initialQuery?: string;
  initialCreateOpen?: boolean;
  initialEditLegacyId?: number | null;
};

function groupKey(sourceDatabase: string, recordType: LegacyUserRecordType) {
  return `${sourceDatabase}:${recordType}`;
}

function groupLabel(group: LegacyAdminUserGroup) {
  return `${group.sourceDatabase} / ${group.label}`;
}

function createEmptyForm(group: LegacyAdminUserGroup | null): LegacyUserFormState {
  return {
    sourceDatabase: group?.sourceDatabase ?? "",
    recordType: group?.recordType ?? "login_user",
    name: "",
    username: "",
    email: "",
    password: "",
    password2: "",
    levelIds: [],
    sites: "0",
    classes: "0",
    isRestricted: false,
    profileValues: {},
  };
}

function formFromUser(user: LegacyAdminUserRow): LegacyUserFormState {
  return {
    sourceDatabase: user.sourceDatabase,
    recordType: user.recordType,
    name: user.name,
    username: user.username,
    email: user.email,
    password: "",
    password2: "",
    levelIds: user.levelIds,
    sites: user.sites || "0",
    classes: user.classes || "0",
    isRestricted: user.isRestricted,
    profileValues: Object.fromEntries(
      user.profileValues.map((profile) => [
        String(profile.fieldLegacyId),
        profile.value ?? (profile.fieldType === "checkbox" ? "0" : ""),
      ]),
    ),
  };
}

function parseLegacyCsvIds(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "0") return [];

  return Array.from(
    new Set(
      trimmed
        .split(",")
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((part) => Number.isInteger(part) && part > 0),
    ),
  );
}

function serializeLegacyCsvIds(ids: number[]) {
  const normalized = Array.from(
    new Set(ids.filter((id) => Number.isInteger(id) && id > 0)),
  ).sort((a, b) => a - b);

  return normalized.length ? normalized.join(",") : "0";
}

function summarizeAccess(
  value: string,
  options: AccessOption[],
  allLabel: string,
) {
  const ids = parseLegacyCsvIds(value);
  if (ids.length === 0) return allLabel;

  return ids
    .map((id) => options.find((option) => option.legacyId === id)?.label ?? `#${id}`)
    .join(", ");
}

function formatLegacyDateTime(value: string | null) {
  if (!value) return "Never";
  return value.replace("T", " ").slice(0, 16);
}

function loginCountLabel(count: number) {
  return `${count} ${count === 1 ? "login" : "logins"}`;
}

function isCheckedProfileValue(value: string | null | undefined) {
  return ["1", "true", "yes", "on"].includes(
    value?.trim().toLowerCase() ?? "",
  );
}

function groupProfileValues(profiles: LegacyAdminUserRow["profileValues"]) {
  const grouped = new Map<string, LegacyAdminUserRow["profileValues"]>();
  for (const profile of profiles) {
    const section = profile.section || "Profile";
    const values = grouped.get(section) ?? [];
    values.push(profile);
    grouped.set(section, values);
  }

  return Array.from(grouped.entries()).map(([section, values]) => ({
    section,
    values,
  }));
}

function paginationItems(currentPage: number, totalPages: number) {
  const stages = 3;
  const items: PaginationItem[] = [];

  if (totalPages < 7 + stages * 2) {
    for (let page = 1; page <= totalPages; page += 1) items.push(page);
    return items;
  }

  if (currentPage < 1 + stages * 2) {
    for (let page = 1; page < 4 + stages * 2; page += 1) items.push(page);
    items.push("ellipsis-end", totalPages - 1, totalPages);
    return items;
  }

  if (totalPages - stages * 2 > currentPage && currentPage > stages * 2) {
    items.push(1, 2, "ellipsis-start");
    for (
      let page = currentPage - stages;
      page <= currentPage + stages;
      page += 1
    ) {
      items.push(page);
    }
    items.push("ellipsis-end", totalPages - 1, totalPages);
    return items;
  }

  items.push(1, 2, "ellipsis-start");
  for (let page = totalPages - (2 + stages * 2); page <= totalPages; page += 1) {
    items.push(page);
  }
  return items;
}

function sortUsers(users: LegacyAdminUserRow[]) {
  return [...users].sort((a, b) => {
    const source = a.sourceDatabase.localeCompare(b.sourceDatabase);
    if (source !== 0) return source;
    const type = a.recordType.localeCompare(b.recordType);
    if (type !== 0) return type;
    return a.legacyId - b.legacyId;
  });
}

function getGroupForUser(
  groups: LegacyAdminUserGroup[],
  user: LegacyAdminUserRow,
) {
  return groups.find(
    (group) =>
      group.sourceDatabase === user.sourceDatabase &&
      group.recordType === user.recordType,
  );
}

function levelOptionsForForm(
  levels: LegacyAdminLevelOption[],
  group: LegacyAdminUserGroup | null,
) {
  if (!group) return [];

  return levels.filter(
    (level) =>
      level.sourceDatabase === group.sourceDatabase &&
      level.recordType === group.levelRecordType,
  );
}

function matchesQuery(user: LegacyAdminUserRow, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    user.username,
    user.name,
    user.email,
    user.sourceDatabase,
    user.legacyTable,
    String(user.legacyId),
    user.levelLabels.join(" "),
    user.sites,
    user.classes,
    user.lastLoginAt ?? "",
    user.lastLoginIp ?? "",
    user.loginHistory
      .map((entry) => `${entry.occurredAt ?? ""} ${entry.ipAddress ?? ""}`)
      .join(" "),
    user.profileValues
      .map((profile) => `${profile.label} ${profile.value ?? ""}`)
      .join(" "),
    user.socialIntegrations
      .map((integration) => `${integration.provider} ${integration.identifier}`)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function IconButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>
          {children}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function AccessPicker({
  title,
  value,
  options,
  allLabel,
  rawLabel,
  onChange,
}: {
  title: string;
  value: string;
  options: AccessOption[];
  allLabel: string;
  rawLabel: string;
  onChange: (value: string) => void;
}) {
  const selectedIds = parseLegacyCsvIds(value);
  const selectedSet = new Set(selectedIds);

  function toggleOption(legacyId: number, selected: boolean) {
    if (selected) {
      onChange(serializeLegacyCsvIds([...selectedIds, legacyId]));
      return;
    }

    onChange(
      serializeLegacyCsvIds(selectedIds.filter((selectedId) => selectedId !== legacyId)),
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{title}</Label>
        <Button
          type="button"
          variant={selectedIds.length === 0 ? "default" : "outline"}
          size="xs"
          onClick={() => onChange("0")}
        >
          {allLabel}
        </Button>
      </div>
      {options.length > 0 ? (
        <div className="grid max-h-40 gap-2 overflow-y-auto rounded-sm border border-border p-3 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex min-w-0 items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-muted/60"
            >
              <Checkbox
                checked={selectedSet.has(option.legacyId)}
                onCheckedChange={(checked) =>
                  toggleOption(option.legacyId, checked === true)
                }
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.meta ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {option.meta}
                </span>
              ) : null}
            </label>
          ))}
        </div>
      ) : (
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={rawLabel}
        className="h-8 font-mono text-xs"
      />
    </div>
  );
}

export function LegacyUsersClient({
  initialData,
  initialError = null,
  initialQuery = "",
  initialCreateOpen = false,
  initialEditLegacyId = null,
}: LegacyUsersClientProps) {
  const sortedInitialUsers = useMemo(
    () => sortUsers(initialData.users),
    [initialData.users],
  );
  const initialEditUser =
    initialEditLegacyId !== null
      ? (sortedInitialUsers.find((user) => user.legacyId === initialEditLegacyId) ??
        null)
      : null;
  const [users, setUsers] = useState(sortedInitialUsers);
  const [query, setQuery] = useState(initialQuery);
  const [activeGroupKey, setActiveGroupKey] = useState(ALL_GROUPS_KEY);
  const [pageSize, setPageSize] = useState<LegacyUsersPageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState<MessageState>(
    initialError ? { type: "error", text: initialError } : null,
  );
  const [dialogMessage, setDialogMessage] = useState<MessageState>(null);
  const [dialogOpen, setDialogOpen] = useState(
    Boolean(initialEditUser) || (initialCreateOpen && initialData.groups.length > 0),
  );
  const [dialogMode, setDialogMode] = useState<DialogMode>(
    initialEditUser ? "edit" : "create",
  );
  const [editingUser, setEditingUser] = useState<LegacyAdminUserRow | null>(
    initialEditUser,
  );
  const [form, setForm] = useState<LegacyUserFormState>(() =>
    initialEditUser
      ? formFromUser(initialEditUser)
      : createEmptyForm(initialData.groups[0] ?? null),
  );
  const [deleteTarget, setDeleteTarget] = useState<LegacyAdminUserRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const user of users) {
      const key = groupKey(user.sourceDatabase, user.recordType);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const userGroupKey = groupKey(user.sourceDatabase, user.recordType);
      const groupMatches =
        activeGroupKey === ALL_GROUPS_KEY || userGroupKey === activeGroupKey;

      return groupMatches && matchesQuery(user, query);
    });
  }, [activeGroupKey, query, users]);
  const totalPages =
    pageSize === PAGE_SIZE_ALL
      ? 1
      : Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPageForView = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    if (pageSize === PAGE_SIZE_ALL) return filteredUsers;

    const startIndex = (currentPageForView - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [currentPageForView, filteredUsers, pageSize]);
  const pageItems = useMemo(
    () => paginationItems(currentPageForView, totalPages),
    [currentPageForView, totalPages],
  );
  const pageRange = useMemo(() => {
    if (filteredUsers.length === 0) {
      return { start: 0, end: 0 };
    }
    if (pageSize === PAGE_SIZE_ALL) {
      return { start: 1, end: filteredUsers.length };
    }

    const start = (currentPageForView - 1) * pageSize + 1;
    return {
      start,
      end: Math.min(start + pageSize - 1, filteredUsers.length),
    };
  }, [currentPageForView, filteredUsers.length, pageSize]);

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return filteredUsers.map((user) => {
      const group = getGroupForUser(initialData.groups, user);
      const branchOptions: AccessOption[] = initialData.branches
        .filter((branch) => branch.sourceDatabase === user.sourceDatabase)
        .map((branch) => ({
          id: branch.id,
          legacyId: branch.legacyId,
          label: branch.label,
        }));
      const classOptions: AccessOption[] = initialData.classes
        .filter((classRecord) => classRecord.sourceDatabase === user.sourceDatabase)
        .map((classRecord) => ({
          id: classRecord.id,
          legacyId: classRecord.legacyId,
          label: classRecord.label,
        }));

      return {
        legacyId: user.legacyId,
        username: user.username,
        name: user.name,
        email: user.email,
        levels: user.levelLabels.join(", "),
        source: group ? groupLabel(group) : user.sourceDatabase,
        branches: summarizeAccess(user.sites, branchOptions, "All"),
        classes: summarizeAccess(user.classes, classOptions, "All"),
        socialLinks: user.socialIntegrations
          .map((integration) => `${integration.provider}: ${integration.identifier}`)
          .join("; "),
        lastLogin: formatLegacyDateTime(user.lastLoginAt),
        loginCount: user.loginCount,
        status: user.isRestricted ? "Restricted" : "Active",
        modernAccount: user.userId
          ? `${user.modernRole ?? "Linked"} / ${
              user.modernActive ? "Enabled" : "Disabled"
            }`
          : "Legacy only",
      };
    });
  }, [
    filteredUsers,
    initialData.branches,
    initialData.classes,
    initialData.groups,
  ]);

  const activeFormGroup = useMemo(() => {
    return (
      initialData.groups.find(
        (group) =>
          group.sourceDatabase === form.sourceDatabase &&
          group.recordType === form.recordType,
      ) ?? null
    );
  }, [form.recordType, form.sourceDatabase, initialData.groups]);

  const formLevels = useMemo(
    () => levelOptionsForForm(initialData.levels, activeFormGroup),
    [activeFormGroup, initialData.levels],
  );

  const formBranches = useMemo(
    () =>
      initialData.branches
        .filter((branch) => branch.sourceDatabase === form.sourceDatabase)
        .map((branch) => ({
          id: branch.id,
          legacyId: branch.legacyId,
          label: branch.label,
          meta: `#${branch.legacyId}`,
        })),
    [form.sourceDatabase, initialData.branches],
  );

  const formClasses = useMemo(
    () =>
      initialData.classes
        .filter((classRecord) => classRecord.sourceDatabase === form.sourceDatabase)
        .map((classRecord) => ({
          id: classRecord.id,
          legacyId: classRecord.legacyId,
          label: classRecord.label,
          meta: classRecord.branchLabel ?? `#${classRecord.legacyId}`,
        })),
    [form.sourceDatabase, initialData.classes],
  );
  const editingProfileSections = useMemo(
    () => groupProfileValues(editingUser?.profileValues ?? []),
    [editingUser],
  );

  const totals = useMemo(
    () => ({
      users: users.length,
      restricted: users.filter((user) => user.isRestricted).length,
      linked: users.filter((user) => user.userId).length,
      social: users.filter((user) => user.socialIntegrations.length > 0).length,
      sources: new Set(users.map((user) => user.sourceDatabase)).size,
    }),
    [users],
  );

  function updateForm<K extends keyof LegacyUserFormState>(
    key: K,
    value: LegacyUserFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateProfileValue(fieldLegacyId: number, value: string) {
    setForm((current) => ({
      ...current,
      profileValues: {
        ...current.profileValues,
        [String(fieldLegacyId)]: value,
      },
    }));
  }

  function updateQuery(value: string) {
    setQuery(value);
    setCurrentPage(1);
  }

  function updateActiveGroup(key: string) {
    setActiveGroupKey(key);
    setCurrentPage(1);
  }

  function updatePageSize(value: string) {
    setPageSize(
      value === PAGE_SIZE_ALL
        ? PAGE_SIZE_ALL
        : (Number(value) as LegacyUsersPageSize),
    );
    setCurrentPage(1);
  }

  function openCreateDialog() {
    const group =
      activeGroupKey === ALL_GROUPS_KEY
        ? initialData.groups[0]
        : initialData.groups.find((item) => item.key === activeGroupKey);
    setDialogMode("create");
    setEditingUser(null);
    setForm(createEmptyForm(group ?? initialData.groups[0] ?? null));
    setMessage(null);
    setDialogMessage(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: LegacyAdminUserRow) {
    setDialogMode("edit");
    setEditingUser(user);
    setForm(formFromUser(user));
    setMessage(null);
    setDialogMessage(null);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    if (isPending) return;
    setDialogOpen(open);
  }

  function changeFormGroup(key: string) {
    const group = initialData.groups.find((item) => item.key === key);
    if (!group) return;

    setForm((current) => ({
      ...current,
      sourceDatabase: group.sourceDatabase,
      recordType: group.recordType,
      levelIds: [],
      sites: "0",
      classes: "0",
      profileValues: {},
    }));
  }

  function toggleLevel(legacyId: number, selected: boolean) {
    setForm((current) => {
      const next = selected
        ? [...current.levelIds, legacyId]
        : current.levelIds.filter((id) => id !== legacyId);

      return {
        ...current,
        levelIds: Array.from(new Set(next)).sort((a, b) => a - b),
      };
    });
  }

  function validateForm() {
    if (!form.name.trim()) return "You must enter a name.";
    if (!form.username.trim()) return "You must enter a username.";
    if (!form.email.trim()) {
      return "You have entered an invalid e-mail address, try again.";
    }
    if (dialogMode === "create" && !form.password) {
      return "You must enter a password.";
    }
    if (form.password && form.password.length < 5) {
      return "Your password must be at least 5 characters.";
    }
    if (form.password && form.password !== form.password2) {
      return "Your passwords did not match.";
    }
    if (dialogMode === "edit" && form.levelIds.length === 0) {
      return "No user level has been selected.";
    }
    return null;
  }

  function showDialogMessage(nextMessage: NonNullable<MessageState>) {
    setDialogMessage(nextMessage);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clientError = validateForm();
    if (clientError) {
      showDialogMessage({ type: "error", text: clientError });
      toast.error(clientError);
      return;
    }

    const payload: LegacyAdminUserInput = {
      sourceDatabase: form.sourceDatabase,
      recordType: form.recordType,
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password || undefined,
      password2: form.password2 || undefined,
      levelIds: form.levelIds,
      sites: form.sites.trim() || "0",
      classes: form.classes.trim() || "0",
      isRestricted: form.isRestricted,
      profileValues:
        dialogMode === "edit" && editingUser
          ? editingUser.profileValues.map((profile) => ({
              fieldLegacyId: profile.fieldLegacyId,
              value: form.profileValues[String(profile.fieldLegacyId)] ?? "",
            }))
          : undefined,
    };

    startTransition(async () => {
      setMessage(null);
      setDialogMessage(null);

      const result =
        dialogMode === "create"
          ? await createLegacyAdminUser(payload)
          : editingUser
            ? await updateLegacyAdminUser(editingUser.id, payload)
            : { success: false, error: "No such user!" };

      if (result.success && result.data) {
        const savedUser =
          dialogMode === "edit" && editingUser
            ? {
                ...result.data,
                loginHistory: result.data.loginHistory.length
                  ? result.data.loginHistory
                  : editingUser.loginHistory,
                socialIntegrations: result.data.socialIntegrations.length
                  ? result.data.socialIntegrations
                  : editingUser.socialIntegrations,
                profileValues: result.data.profileValues.length
                  ? result.data.profileValues
                  : editingUser.profileValues,
              }
            : result.data;
        setUsers((current) => {
          if (dialogMode === "create") {
            return sortUsers([...current, savedUser]);
          }

          return sortUsers(
            current.map((user) =>
              user.id === savedUser.id ? savedUser : user,
            ),
          );
        });
        if (dialogMode === "create") {
          const group =
            initialData.groups.find(
              (item) =>
                item.sourceDatabase === form.sourceDatabase &&
                item.recordType === form.recordType,
            ) ??
            initialData.groups[0] ??
            null;
          setForm(createEmptyForm(group));
          showDialogMessage({
            type: "success",
            text: `Successfully added user ${savedUser.username} to the database. Credentials sent to user.`,
          });
          toast.success("Saved!");
        } else {
          setDialogOpen(false);
          setMessage({ type: "success", text: "Saved!" });
          toast.success("Saved!");
        }
        return;
      }

      const error = result.error ?? "Failed to save legacy user";
      showDialogMessage({ type: "error", text: error });
      toast.error(error);
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteLegacyAdminUser(deleteTarget.id);
      if (result.success) {
        setUsers((current) =>
          current.filter((user) => user.id !== deleteTarget.id),
        );
        setDeleteTarget(null);
        setMessage({ type: "success", text: "Deleted!" });
        toast.success("Deleted!");
        return;
      }

      const error = result.error ?? "Failed to delete legacy user";
      setMessage({ type: "error", text: error });
      toast.error(error);
    });
  }

  function handleSocialUnlink(providerKey: string) {
    if (!editingUser) return;

    startTransition(async () => {
      const result = await unlinkLegacyAdminUserSocialProvider(
        editingUser.id,
        providerKey,
      );
      if (!result.success) {
        const error = result.error ?? "Failed to unlink social provider";
        showDialogMessage({ type: "error", text: error });
        toast.error(error);
        return;
      }

      const removeProvider = (user: LegacyAdminUserRow) => ({
        ...user,
        socialIntegrations: user.socialIntegrations.filter(
          (integration) => integration.providerKey !== providerKey,
        ),
      });

      setEditingUser((current) => (current ? removeProvider(current) : current));
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id ? removeProvider(user) : user,
        ),
      );
      showDialogMessage({ type: "success", text: "Social link removed." });
      toast.success("Social link removed");
    });
  }

  return (
    <TooltipProvider>
      <PageHeader
        title="Legacy Users"
        description="Admin, staff, and manager accounts migrated from the legacy login tables"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Legacy Users" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings/legacy-users/profile-fields">
                <TextCursorInput className="size-4" />
                Profile fields
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings/legacy-users/reports">
                <BarChart3 className="size-4" />
                Reports
              </Link>
            </Button>
            <Button
              onClick={openCreateDialog}
              disabled={initialData.groups.length === 0}
            >
              <Plus className="size-4" />
              Add user
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        {message ? (
          <div
            className={cn(
              "rounded-sm border px-3 py-2 text-sm",
              message.type === "success"
                ? "border-[#b8dfd6] bg-[#eefaf7] text-[#0f6f61]"
                : "border-[#f0c2bc] bg-[#fff3f1] text-[#9b2f24]",
            )}
          >
            {message.text}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <UsersRound className="size-4" />
              Users
            </div>
            <p className="mt-2 text-2xl font-semibold">{totals.users}</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <ShieldCheck className="size-4" />
              Linked
            </div>
            <p className="mt-2 text-2xl font-semibold">{totals.linked}</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <UserCog className="size-4" />
              Restricted
            </div>
            <p className="mt-2 text-2xl font-semibold">{totals.restricted}</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Link2 className="size-4" />
              Social
            </div>
            <p className="mt-2 text-2xl font-semibold">{totals.social}</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Database className="size-4" />
              Sources
            </div>
            <p className="mt-2 text-2xl font-semibold">{totals.sources}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-sm border border-border bg-background p-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search username, name, email, ID, level"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeGroupKey === ALL_GROUPS_KEY ? "default" : "outline"}
              onClick={() => updateActiveGroup(ALL_GROUPS_KEY)}
            >
              <UsersRound className="size-4" />
              All
              <Badge variant="secondary">{users.length}</Badge>
            </Button>
            {initialData.groups.map((group) => (
              <Button
                key={group.key}
                type="button"
                size="sm"
                variant={activeGroupKey === group.key ? "default" : "outline"}
                onClick={() => updateActiveGroup(group.key)}
              >
                <Database className="size-4" />
                {groupLabel(group)}
                <Badge variant="secondary">{groupCounts.get(group.key) ?? 0}</Badge>
              </Button>
            ))}
            <div className="flex items-center gap-2 rounded-sm border border-border px-2">
              <Label
                htmlFor="legacy-users-page-size"
                className="text-xs text-muted-foreground"
              >
                Show
              </Label>
              <Select value={String(pageSize)} onValueChange={updatePageSize}>
                <SelectTrigger
                  id="legacy-users-page-size"
                  className="h-8 w-[90px] border-0 px-1 shadow-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value={PAGE_SIZE_ALL}>All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ExportButton
              filename="legacy-users"
              sheetName="Legacy Users"
              columns={legacyUserExportColumns}
              data={exportRows}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={filteredUsers.length === 0}
              onClick={() => window.print()}
            >
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Levels</TableHead>
              <TableHead>Legacy Source</TableHead>
              <TableHead>Social Links</TableHead>
              <TableHead>Branch/Class Access</TableHead>
              <TableHead>Login Audit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Modern Account</TableHead>
              <TableHead className="w-[92px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No legacy users found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => {
                const group = getGroupForUser(initialData.groups, user);
                const branchOptions: AccessOption[] = initialData.branches
                  .filter((branch) => branch.sourceDatabase === user.sourceDatabase)
                  .map((branch) => ({
                    id: branch.id,
                    legacyId: branch.legacyId,
                    label: branch.label,
                  }));
                const classOptions: AccessOption[] = initialData.classes
                  .filter(
                    (classRecord) =>
                      classRecord.sourceDatabase === user.sourceDatabase,
                  )
                  .map((classRecord) => ({
                    id: classRecord.id,
                    legacyId: classRecord.legacyId,
                    label: classRecord.label,
                  }));

                return (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-normal">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{user.username}</span>
                          <Badge variant="outline">#{user.legacyId}</Badge>
                        </div>
                        <div className="text-sm text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email || "No email"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex max-w-[260px] flex-wrap gap-1">
                        {user.levelLabels.length > 0 ? (
                          user.levelLabels.map((level) => (
                            <Badge key={level} variant="secondary">
                              {level}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="destructive">No level</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="space-y-1 text-sm">
                        <div>{group ? groupLabel(group) : user.sourceDatabase}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {user.legacyTable}
                        </div>
                        {user.profileValues.length > 0 ? (
                          <Badge variant="outline">
                            {user.profileValues.length} profile fields
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {user.socialIntegrations.length > 0 ? (
                          user.socialIntegrations.map((integration) => (
                            <Badge
                              key={`${integration.provider}:${integration.identifier}`}
                              variant="outline"
                            >
                              <Link2 className="size-3" />
                              {integration.provider}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            None
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[320px] whitespace-normal">
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="font-medium">Branches: </span>
                          {summarizeAccess(user.sites, branchOptions, "All")}
                        </div>
                        <div>
                          <span className="font-medium">Classes: </span>
                          {summarizeAccess(user.classes, classOptions, "All")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="space-y-1 text-xs">
                        <div className="font-medium">
                          {formatLegacyDateTime(user.lastLoginAt)}
                        </div>
                        <div className="text-muted-foreground">
                          {user.lastLoginIp ?? "No IP"}
                        </div>
                        <Badge variant="outline">
                          {loginCountLabel(user.loginCount)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isRestricted ? "warning" : "success"}>
                        {user.isRestricted ? "Restricted" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-wrap gap-1">
                        {user.userId ? (
                          <>
                            <Badge variant="info">{user.modernRole ?? "Linked"}</Badge>
                            <Badge
                              variant={user.modernActive ? "success" : "warning"}
                            >
                              {user.modernActive ? "Enabled" : "Disabled"}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline">Legacy only</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          label="Edit user"
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label="Delete user"
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {filteredUsers.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-sm border border-border bg-background px-3 py-2 print:hidden md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {pageRange.start}-{pageRange.end} of {filteredUsers.length}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={currentPageForView <= 1}
                onClick={() => setCurrentPage(currentPageForView - 1)}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              {pageItems.map((item) =>
                typeof item === "number" ? (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={item === currentPageForView ? "default" : "outline"}
                    className="min-w-9 px-2"
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </Button>
                ) : (
                  <span
                    key={item}
                    className="flex h-9 min-w-8 items-center justify-center text-muted-foreground"
                  >
                    ...
                  </span>
                ),
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={currentPageForView >= totalPages}
                onClick={() => setCurrentPage(currentPageForView + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[920px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Add Legacy User" : "Edit Legacy User"}
            </DialogTitle>
            <DialogDescription>
              {activeFormGroup
                ? `${activeFormGroup.sourceDatabase} / ${activeFormGroup.label}`
                : "Legacy login user"}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div
              id="message"
              aria-live="polite"
              className="overflow-hidden"
              style={{
                marginBottom: dialogMessage ? 4 : 0,
                maxHeight: dialogMessage ? 96 : 0,
                opacity: dialogMessage ? 1 : 0,
                transition:
                  "max-height 300ms ease-out, opacity 300ms ease-out, margin-bottom 300ms ease-out",
              }}
            >
              {dialogMessage ? (
                <div
                  role={dialogMessage.type === "error" ? "alert" : "status"}
                  className={cn(
                    "rounded-sm border px-3 py-2 text-sm font-medium",
                    dialogMessage.type === "success"
                      ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
                      : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
                  )}
                >
                  {dialogMessage.text}
                </div>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legacy-user-source">Source</Label>
                <Select
                  value={groupKey(form.sourceDatabase, form.recordType)}
                  onValueChange={changeFormGroup}
                  disabled={dialogMode === "edit"}
                >
                  <SelectTrigger id="legacy-user-source" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {initialData.groups.map((group) => (
                      <SelectItem key={group.key} value={group.key}>
                        {groupLabel(group)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="legacy-user-name">Name</Label>
                <Input
                  id="legacy-user-name"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legacy-user-username">Username</Label>
                <Input
                  id="legacy-user-username"
                  value={form.username}
                  onChange={(event) => updateForm("username", event.target.value)}
                  maxLength={15}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legacy-user-email">Email</Label>
                <Input
                  id="legacy-user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legacy-user-password">Password</Label>
                <Input
                  id="legacy-user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  maxLength={15}
                  required={dialogMode === "create"}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legacy-user-password2">Confirm Password</Label>
                <Input
                  id="legacy-user-password2"
                  type="password"
                  value={form.password2}
                  onChange={(event) => updateForm("password2", event.target.value)}
                  maxLength={15}
                  required={dialogMode === "create" || Boolean(form.password)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Levels</Label>
              <div className="grid max-h-44 gap-2 overflow-y-auto rounded-sm border border-border p-3 sm:grid-cols-2 lg:grid-cols-3">
                {formLevels.length > 0 ? (
                  formLevels.map((level) => (
                    <label
                      key={level.id}
                      className="flex min-w-0 items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-muted/60"
                    >
                      <Checkbox
                        checked={form.levelIds.includes(level.legacyId)}
                        onCheckedChange={(checked) =>
                          toggleLevel(level.legacyId, checked === true)
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {level.label}
                      </span>
                      <Badge variant={level.isDisabled ? "warning" : "outline"}>
                        #{level.legacyId}
                      </Badge>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No legacy levels found.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AccessPicker
                title="Branch Access"
                value={form.sites ?? "0"}
                options={formBranches}
                allLabel="All branches"
                rawLabel="Raw branch IDs"
                onChange={(value) => updateForm("sites", value)}
              />
              <AccessPicker
                title="Class Access"
                value={form.classes ?? "0"}
                options={formClasses}
                allLabel="All classes"
                rawLabel="Raw class IDs"
                onChange={(value) => updateForm("classes", value)}
              />
            </div>

            <label className="flex items-center gap-2 rounded-sm border border-border p-3 text-sm">
              <Checkbox
                checked={form.isRestricted}
                onCheckedChange={(checked) =>
                  updateForm("isRestricted", checked === true)
                }
              />
              <span className="font-medium">Restricted</span>
            </label>

            {dialogMode === "edit" && editingProfileSections.length ? (
              <div className="space-y-3">
                <Label>Profile Values</Label>
                <div className="max-h-72 space-y-4 overflow-y-auto rounded-sm border border-border p-3">
                  {editingProfileSections.map((section) => (
                    <div key={section.section} className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground">
                        {section.section}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {section.values.map((profile) => {
                          const fieldKey = String(profile.fieldLegacyId);
                          const inputId = `profile-${profile.fieldLegacyId}`;
                          const value = form.profileValues[fieldKey] ?? "";

                          if (profile.fieldType === "checkbox") {
                            return (
                              <label
                                key={profile.id}
                                className="flex min-h-10 items-center gap-2 rounded-sm border border-border/70 px-3 py-2 text-sm"
                              >
                                <Checkbox
                                  checked={isCheckedProfileValue(value)}
                                  onCheckedChange={(checked) =>
                                    updateProfileValue(
                                      profile.fieldLegacyId,
                                      checked === true ? "1" : "0",
                                    )
                                  }
                                  disabled={isPending}
                                />
                                <span className="font-medium">{profile.label}</span>
                              </label>
                            );
                          }

                          if (profile.fieldType === "textarea") {
                            return (
                              <div
                                key={profile.id}
                                className="space-y-1 md:col-span-2"
                              >
                                <Label htmlFor={inputId}>{profile.label}</Label>
                                <Textarea
                                  id={inputId}
                                  value={value}
                                  onChange={(event) =>
                                    updateProfileValue(
                                      profile.fieldLegacyId,
                                      event.target.value,
                                    )
                                  }
                                  disabled={isPending}
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={profile.id} className="space-y-1">
                              <Label htmlFor={inputId}>{profile.label}</Label>
                              <Input
                                id={inputId}
                                value={value}
                                onChange={(event) =>
                                  updateProfileValue(
                                    profile.fieldLegacyId,
                                    event.target.value,
                                  )
                                }
                                disabled={isPending}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {dialogMode === "edit" && editingUser?.socialIntegrations.length ? (
              <div className="space-y-2">
                <Label>Social Links</Label>
                <div className="grid gap-2 rounded-sm border border-border p-3 md:grid-cols-2">
                  {editingUser.socialIntegrations.map((integration) => (
                    <div
                      key={`${integration.provider}:${integration.identifier}`}
                      className="rounded-sm border border-border/70 bg-muted/30 p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                          <Link2 className="size-3" />
                          {integration.provider}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={isPending}
                          onClick={() =>
                            handleSocialUnlink(integration.providerKey)
                          }
                        >
                          Unlink
                        </Button>
                      </div>
                      <div className="mt-1 break-all font-mono text-xs">
                        {integration.identifier}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {dialogMode === "edit" && editingUser?.loginHistory.length ? (
              <div className="space-y-2">
                <Label>Login History</Label>
                <div className="max-h-56 overflow-y-auto rounded-sm border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingUser.loginHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            <div className="flex items-center gap-2">
                              <History className="size-3 text-muted-foreground" />
                              {formatLegacyDateTime(entry.occurredAt)}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {entry.ipAddress ?? "No IP"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {entry.legacyTable} #{entry.legacyId}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Legacy User</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.username} will be disabled in the modern account table and soft-deleted from the migrated legacy login records.`
                : "This legacy user will be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
