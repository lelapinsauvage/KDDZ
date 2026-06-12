"use client";

import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  createLegacyAccessLevel,
  deleteLegacyAccessLevel,
  type LegacyAccessControlGroup,
  type LegacyAccessLevelUserRow,
  getLegacyAccessLevelUsers,
  updateLegacyAccessControlLevels,
  updateLegacyAccessLevel,
} from "@/lib/actions/legacy-access-control";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Database,
  Eraser,
  History,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Square,
  Trash2,
  UsersRound,
} from "lucide-react";

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type LevelDialogMode = "create" | "edit";

type DeleteLevelTarget = {
  groupKey: string;
  id: string;
  label: string;
  legacyId: number;
} | null;

type LevelUsersDialogState = {
  groupTitle: string;
  sourceDatabase: string;
  levelLabel: string;
  legacyLevelId: number;
  users: LegacyAccessLevelUserRow[];
} | null;

type AccessControlClientProps = {
  initialGroups: LegacyAccessControlGroup[];
  initialError?: string | null;
};

const LEVEL_USERS_PAGE_SIZE = 10;

function levelKey(groupKey: string, legacyLevelId: number) {
  return `${groupKey}:${legacyLevelId}`;
}

function formatLegacyDateTime(value: string | null) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

function paginationItems(currentPage: number, totalPages: number) {
  const stages = 3;
  const items: Array<number | "ellipsis-start" | "ellipsis-end"> = [];

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

function filterActions(
  actions: LegacyAccessControlGroup["actions"],
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return actions;

  return actions.filter((action) => {
    const haystack = [
      action.actionName,
      action.actionType,
      action.description,
      String(action.actionGroupId ?? ""),
      String(action.legacyActionId),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function AccessControlClient({
  initialGroups,
  initialError = null,
}: AccessControlClientProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>(
    {},
  );
  const [actionQuery, setActionQuery] = useState("");
  const [message, setMessage] = useState<MessageState>(
    initialError ? { type: "error", text: initialError } : null,
  );
  const [savingGroupKey, setSavingGroupKey] = useState<string | null>(null);
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [levelDialogMode, setLevelDialogMode] =
    useState<LevelDialogMode>("create");
  const [levelDialogGroupKey, setLevelDialogGroupKey] = useState<string | null>(
    null,
  );
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [levelName, setLevelName] = useState("");
  const [levelRedirect, setLevelRedirect] = useState("");
  const [levelWelcomeEmail, setLevelWelcomeEmail] = useState(false);
  const [levelDisabled, setLevelDisabled] = useState(false);
  const [levelSaving, setLevelSaving] = useState(false);
  const [levelDialogMessage, setLevelDialogMessage] =
    useState<MessageState>(null);
  const [deleteLevelTarget, setDeleteLevelTarget] =
    useState<DeleteLevelTarget>(null);
  const [levelUsersDialog, setLevelUsersDialog] =
    useState<LevelUsersDialogState>(null);
  const [levelUsersLoading, setLevelUsersLoading] = useState(false);
  const [levelUsersPage, setLevelUsersPage] = useState(1);
  const [, startTransition] = useTransition();

  const totals = useMemo(
    () =>
      groups.reduce(
        (acc, group) => {
          acc.levels += group.levels.length;
          acc.actions += group.actions.length;
          acc.grants += group.grantCount;
          return acc;
        },
        { levels: 0, actions: 0, grants: 0 },
      ),
    [groups],
  );
  const levelUsersTotalPages = Math.max(
    1,
    Math.ceil((levelUsersDialog?.users.length ?? 0) / LEVEL_USERS_PAGE_SIZE),
  );
  const levelUsersPageForView = Math.min(
    levelUsersPage,
    levelUsersTotalPages,
  );
  const visibleLevelUsers = useMemo(() => {
    const users = levelUsersDialog?.users ?? [];
    const startIndex = (levelUsersPageForView - 1) * LEVEL_USERS_PAGE_SIZE;

    return users.slice(startIndex, startIndex + LEVEL_USERS_PAGE_SIZE);
  }, [levelUsersDialog?.users, levelUsersPageForView]);
  const levelUserPageItems = useMemo(
    () => paginationItems(levelUsersPageForView, levelUsersTotalPages),
    [levelUsersPageForView, levelUsersTotalPages],
  );
  const levelUsersRange = useMemo(() => {
    const count = levelUsersDialog?.users.length ?? 0;
    if (count === 0) return { start: 0, end: 0 };

    const start = (levelUsersPageForView - 1) * LEVEL_USERS_PAGE_SIZE + 1;
    return {
      start,
      end: Math.min(start + LEVEL_USERS_PAGE_SIZE - 1, count),
    };
  }, [levelUsersDialog?.users.length, levelUsersPageForView]);

  function toggleSelected(groupKey: string, legacyLevelId: number) {
    const key = levelKey(groupKey, legacyLevelId);
    setSelectedLevels((current) => ({ ...current, [key]: !current[key] }));
  }

  function setGroupSelected(group: LegacyAccessControlGroup, selected: boolean) {
    setSelectedLevels((current) => {
      const next = { ...current };
      for (const level of group.levels) {
        next[levelKey(group.key, level.legacyId)] = selected;
      }
      return next;
    });
  }

  function toggleAction(
    groupKey: string,
    legacyLevelId: number,
    legacyActionId: number,
  ) {
    setGroups((current) =>
      current.map((group) => {
        if (group.key !== groupKey) return group;

        return {
          ...group,
          levels: group.levels.map((level) => {
            if (level.legacyId !== legacyLevelId) return level;

            const selected = new Set(level.selectedActionIds);
            if (selected.has(legacyActionId)) {
              selected.delete(legacyActionId);
            } else {
              selected.add(legacyActionId);
            }

            return {
              ...level,
              selectedActionIds: Array.from(selected).sort((a, b) => a - b),
            };
          }),
        };
      }),
    );
  }

  function openCreateLevel(group: LegacyAccessControlGroup) {
    setLevelDialogMode("create");
    setLevelDialogGroupKey(group.key);
    setEditingLevelId(null);
    setLevelName("");
    setLevelRedirect("");
    setLevelWelcomeEmail(false);
    setLevelDisabled(false);
    setLevelDialogMessage(null);
    setLevelDialogOpen(true);
    setMessage(null);
  }

  function openEditLevel(
    group: LegacyAccessControlGroup,
    level: LegacyAccessControlGroup["levels"][number],
  ) {
    setLevelDialogMode("edit");
    setLevelDialogGroupKey(group.key);
    setEditingLevelId(level.id);
    setLevelName(level.label);
    setLevelRedirect(level.redirect ?? "");
    setLevelWelcomeEmail(level.welcomeEmail);
    setLevelDisabled(level.isDisabled);
    setLevelDialogMessage(null);
    setLevelDialogOpen(true);
    setMessage(null);
  }

  function openLevelUsers(
    group: LegacyAccessControlGroup,
    level: LegacyAccessControlGroup["levels"][number],
  ) {
    setLevelUsersDialog({
      groupTitle: group.title,
      sourceDatabase: group.sourceDatabase,
      levelLabel: level.label,
      legacyLevelId: level.legacyId,
      users: [],
    });
    setLevelUsersPage(1);
    setLevelUsersLoading(true);
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await getLegacyAccessLevelUsers({
          sourceDatabase: group.sourceDatabase,
          levelRecordType: group.levelRecordType,
          legacyLevelId: level.legacyId,
        });

        if (result.success && result.data) {
          setLevelUsersDialog({
            groupTitle: group.title,
            sourceDatabase: group.sourceDatabase,
            levelLabel: result.data.levelLabel,
            legacyLevelId: level.legacyId,
            users: result.data.users,
          });
          return;
        }

        setLevelUsersDialog(null);
        setMessage({
          type: "error",
          text: result.error ?? "Failed to fetch users in level",
        });
      } catch (error) {
        console.error("Failed to fetch users in level:", error);
        setLevelUsersDialog(null);
        setMessage({ type: "error", text: "Failed to fetch users in level" });
      } finally {
        setLevelUsersLoading(false);
      }
    });
  }

  function closeLevelDialog() {
    if (levelSaving) return;
    setLevelDialogOpen(false);
  }

  function showLevelDialogMessage(nextMessage: NonNullable<MessageState>) {
    setLevelDialogMessage(nextMessage);
  }

  function saveLevel() {
    const group = groups.find((candidate) => candidate.key === levelDialogGroupKey);
    const trimmedName = levelName.trim();

    if (!group) {
      setMessage({ type: "error", text: "Legacy level group not found" });
      return;
    }
    if (!trimmedName) {
      showLevelDialogMessage({
        type: "error",
        text: "You must enter a level name.",
      });
      return;
    }

    setLevelSaving(true);
    setMessage(null);
    setLevelDialogMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const result =
            levelDialogMode === "create"
              ? await createLegacyAccessLevel({
                  sourceDatabase: group.sourceDatabase,
                  levelRecordType: group.levelRecordType,
                  levelName: trimmedName,
                  redirect: levelRedirect,
                })
              : await updateLegacyAccessLevel({
                  levelRecordId: editingLevelId ?? "",
                  levelName: trimmedName,
                  redirect: levelRedirect,
                  welcomeEmail: levelWelcomeEmail,
                  isDisabled: levelDisabled,
                });

          const levelData = result.data;

          if (result.success && levelData) {
            setGroups((current) =>
              current.map((candidate) => {
                if (candidate.key !== group.key) return candidate;

                const nextLevel =
                  levelDialogMode === "edit"
                    ? {
                        ...levelData,
                        selectedActionIds:
                          candidate.levels.find(
                            (level) => level.id === levelData.id,
                          )?.selectedActionIds ?? [],
                      }
                    : levelData;

                const nextLevels =
                  levelDialogMode === "create"
                    ? [...candidate.levels, nextLevel].sort(
                        (a, b) => a.legacyId - b.legacyId,
                      )
                    : candidate.levels.map((level) =>
                        level.id === nextLevel.id ? nextLevel : level,
                      );

                return { ...candidate, levels: nextLevels };
              }),
            );
            if (levelDialogMode === "create") {
              setLevelName("");
              setLevelRedirect("");
              showLevelDialogMessage({
                type: "success",
                text: `Successfully added level ${trimmedName} to the database.`,
              });
            } else {
              setLevelDialogOpen(false);
              setMessage({
                type: "success",
                text: `Information updated for level ${trimmedName}.`,
              });
            }
          } else {
            showLevelDialogMessage({
              type: "error",
              text: result.error ?? "Failed to save level",
            });
          }
        } catch (error) {
          console.error("Failed to save level:", error);
          showLevelDialogMessage({
            type: "error",
            text: "Failed to save level",
          });
        } finally {
          setLevelSaving(false);
        }
      })();
    });
  }

  function confirmDeleteLevel() {
    if (!deleteLevelTarget) return;

    setLevelSaving(true);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const result = await deleteLegacyAccessLevel({
            levelRecordId: deleteLevelTarget.id,
          });

          if (result.success) {
            setGroups((current) =>
              current.map((group) =>
                group.key === deleteLevelTarget.groupKey
                  ? {
                      ...group,
                      levels: group.levels.filter(
                        (level) => level.id !== deleteLevelTarget.id,
                      ),
                    }
                  : group,
              ),
            );
            setSelectedLevels((current) => {
              const next = { ...current };
              delete next[levelKey(deleteLevelTarget.groupKey, deleteLevelTarget.legacyId)];
              return next;
            });
            setMessage({
              type: "success",
              text: `Level ${deleteLevelTarget.label} removed from database.`,
            });
            setDeleteLevelTarget(null);
          } else {
            setMessage({
              type: "error",
              text: result.error ?? "Failed to delete level",
            });
          }
        } catch (error) {
          console.error("Failed to delete level:", error);
          setMessage({ type: "error", text: "Failed to delete level" });
        } finally {
          setLevelSaving(false);
        }
      })();
    });
  }

  function saveSelectedLevels(group: LegacyAccessControlGroup) {
    const selected = group.levels.filter(
      (level) => selectedLevels[levelKey(group.key, level.legacyId)],
    );

    if (selected.length === 0) {
      setMessage({ type: "error", text: "No level selected!" });
      return;
    }

    setSavingGroupKey(group.key);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const result = await updateLegacyAccessControlLevels({
            sourceDatabase: group.sourceDatabase,
            levelRecordType: group.levelRecordType,
            levels: selected.map((level) => ({
              legacyLevelId: level.legacyId,
              actionIds: level.selectedActionIds,
            })),
          });

          if (result.success) {
            setGroups((current) =>
              current.map((candidate) =>
                candidate.key === group.key
                  ? {
                      ...candidate,
                      grantCount: candidate.levels.reduce(
                        (total, level) =>
                          total + level.selectedActionIds.length,
                        0,
                      ),
                    }
                  : candidate,
              ),
            );
            setMessage({ type: "success", text: "Saved!" });
          } else {
            setMessage({
              type: "error",
              text: result.error ?? "Failed to save access control",
            });
          }
        } catch (error) {
          console.error("Failed to save access control:", error);
          setMessage({
            type: "error",
            text: "Failed to save access control",
          });
        } finally {
          setSavingGroupKey(null);
        }
      })();
    });
  }

  return (
    <>
      <PageHeader
        title="Access Control"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Access Control" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-sm border border-[#e5e7eb] bg-white p-3">
            <ShieldCheck className="size-5 text-[#0B9178]" />
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Levels
              </p>
              <p className="text-lg font-semibold">{totals.levels}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-sm border border-[#e5e7eb] bg-white p-3">
            <Square className="size-5 text-[#4F46E5]" />
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Actions
              </p>
              <p className="text-lg font-semibold">{totals.actions}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-sm border border-[#e5e7eb] bg-white p-3">
            <CheckSquare className="size-5 text-[#B45309]" />
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Active Grants
              </p>
              <p className="text-lg font-semibold">{totals.grants}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-sm border border-[#e5e7eb] bg-white p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <Input
              value={actionQuery}
              onChange={(event) => setActionQuery(event.target.value)}
              placeholder="Search actions"
              className="h-9 w-full md:w-80"
            />
          </div>
          {message ? (
            <div
              className={cn(
                "rounded-sm border px-3 py-2 text-sm font-medium",
                message.type === "success"
                  ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
                  : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
              )}
            >
              {message.text}
            </div>
          ) : null}
        </div>

        {groups.length === 0 ? (
          <div className="rounded-sm border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground">
            No migrated access-control records found.
          </div>
        ) : null}

        <div className="space-y-4">
          {groups.map((group) => {
            const visibleActions = filterActions(group.actions, actionQuery);
            const selectedCount = group.levels.filter(
              (level) => selectedLevels[levelKey(group.key, level.legacyId)],
            ).length;
            const isSaving = savingGroupKey === group.key;

            return (
              <section
                key={group.key}
                className="overflow-hidden rounded-sm border border-[#d7dde5] bg-white"
              >
                <div className="flex flex-col gap-3 border-b border-[#e5e7eb] bg-[#f8fafc] p-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Database className="size-4 text-[#0f766e]" />
                    <h2 className="text-sm font-semibold">{group.title}</h2>
                    <Badge variant="secondary">{group.sourceDatabase}</Badge>
                    <Badge variant="outline">{group.levels.length} levels</Badge>
                    <Badge variant="outline">{group.actions.length} actions</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateLevel(group)}
                      title="Create level"
                    >
                      <Plus className="size-4" />
                      New level
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGroupSelected(group, true)}
                      title="Select all levels"
                    >
                      <CheckSquare className="size-4" />
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGroupSelected(group, false)}
                      title="Clear selected levels"
                    >
                      <Eraser className="size-4" />
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveSelectedLevels(group)}
                      disabled={savingGroupKey !== null}
                      title="Save selected levels"
                    >
                      <Save className="size-4" />
                      {isSaving ? "Saving" : `Save selected (${selectedCount})`}
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[84px]">Update</TableHead>
                      <TableHead className="w-[220px]">Level</TableHead>
                      <TableHead className="w-[140px]">Manage</TableHead>
                      <TableHead className="min-w-[620px]">
                        Allowed Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.levels.map((level) => {
                      const selected = Boolean(
                        selectedLevels[levelKey(group.key, level.legacyId)],
                      );
                      const actionSet = new Set(level.selectedActionIds);

                      return (
                        <TableRow
                          key={level.id}
                          data-state={selected ? "selected" : undefined}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() =>
                                toggleSelected(group.key, level.legacyId)
                              }
                              aria-label={`Select ${level.label}`}
                            />
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <div className="space-y-1">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-sm font-semibold">
                                  {level.label}
                                </span>
                                <Badge variant="outline">#{level.legacyId}</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {level.legacyTable}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  className="h-6 gap-1 px-2 text-xs"
                                  onClick={() => openLevelUsers(group, level)}
                                >
                                  <UsersRound className="size-3" />
                                  {level.userCount} users
                                </Button>
                                {level.legacyId === 1 ? (
                                  <Badge variant="destructive">Admin</Badge>
                                ) : null}
                                {level.welcomeEmail ? (
                                  <Badge variant="info">Welcome</Badge>
                                ) : null}
                                {level.isDisabled ? (
                                  <Badge variant="warning">Disabled</Badge>
                                ) : null}
                              </div>
                              {level.redirect ? (
                                <p
                                  className="max-w-[260px] truncate text-xs text-muted-foreground"
                                  title={level.redirect}
                                >
                                  {level.redirect}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEditLevel(group, level)}
                                title="Edit level"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() =>
                                  setDeleteLevelTarget({
                                    groupKey: group.key,
                                    id: level.id,
                                    label: level.label,
                                    legacyId: level.legacyId,
                                  })
                                }
                                disabled={
                                  level.legacyId === 1 || level.userCount > 0
                                }
                                title={
                                  level.legacyId === 1
                                    ? "Admin level cannot be deleted"
                                    : level.userCount > 0
                                      ? "Level still has users"
                                      : "Delete level"
                                }
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            {visibleActions.length > 0 ? (
                              <div className="grid min-w-[600px] grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {visibleActions.map((action) => {
                                  const checked = actionSet.has(
                                    action.legacyActionId,
                                  );

                                  return (
                                    <label
                                      key={action.id}
                                      title={
                                        action.description ??
                                        action.actionName
                                      }
                                      className={cn(
                                        "flex min-h-10 cursor-pointer items-start gap-2 rounded-sm border p-2 text-xs transition-colors",
                                        checked
                                          ? "border-[#99f6e4] bg-[#f0fdfa]"
                                          : "border-[#e5e7eb] bg-white hover:bg-[#f8fafc]",
                                      )}
                                    >
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={() =>
                                          toggleAction(
                                            group.key,
                                            level.legacyId,
                                            action.legacyActionId,
                                          )
                                        }
                                        aria-label={`${level.label} ${action.actionName}`}
                                      />
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium text-[#111827]">
                                          {action.actionName}
                                        </span>
                                        <span className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                                          <span>#{action.legacyActionId}</span>
                                          {action.actionType ? (
                                            <span>{action.actionType}</span>
                                          ) : null}
                                          {action.actionGroupId ? (
                                            <span>G{action.actionGroupId}</span>
                                          ) : null}
                                          {!action.isActive ? (
                                            <span className="text-[#b45309]">
                                              inactive
                                            </span>
                                          ) : null}
                                        </span>
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No actions match the current search.
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </section>
            );
          })}
        </div>
      </div>

      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {levelDialogMode === "create" ? "Create level" : "Update level"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div
              id="level-message"
              aria-live="polite"
              className="overflow-hidden"
              style={{
                marginBottom: levelDialogMessage ? 4 : 0,
                maxHeight: levelDialogMessage ? 96 : 0,
                opacity: levelDialogMessage ? 1 : 0,
                transition:
                  "max-height 300ms ease-out, opacity 300ms ease-out, margin-bottom 300ms ease-out",
              }}
            >
              {levelDialogMessage ? (
                <div
                  role={levelDialogMessage.type === "error" ? "alert" : "status"}
                  className={cn(
                    "rounded-sm border px-3 py-2 text-sm font-medium",
                    levelDialogMessage.type === "success"
                      ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
                      : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
                  )}
                >
                  {levelDialogMessage.text}
                </div>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="legacy-level-name">Name</Label>
              <Input
                id="legacy-level-name"
                value={levelName}
                onChange={(event) => setLevelName(event.target.value)}
                disabled={levelSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="legacy-level-redirect">Redirect</Label>
              <Input
                id="legacy-level-redirect"
                value={levelRedirect}
                onChange={(event) => setLevelRedirect(event.target.value)}
                placeholder="eg, http://google.com"
                disabled={levelSaving}
              />
            </div>
            {levelDialogMode === "edit" ? (
              <div className="grid gap-3 rounded-sm border border-[#e5e7eb] p-3">
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={levelWelcomeEmail}
                    onCheckedChange={(checked) =>
                      setLevelWelcomeEmail(checked === true)
                    }
                    disabled={levelSaving}
                  />
                  <span>Send welcome email when users join this level</span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={levelDisabled}
                    onCheckedChange={(checked) =>
                      setLevelDisabled(checked === true)
                    }
                    disabled={levelSaving || levelName.trim() === "Admin"}
                  />
                  <span>Prevent this level from accessing secure content</span>
                </label>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeLevelDialog}
              disabled={levelSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveLevel} disabled={levelSaving}>
              <Save className="size-4" />
              {levelSaving
                ? "Saving"
                : levelDialogMode === "create"
                  ? "Create level"
                  : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(levelUsersDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setLevelUsersDialog(null);
            setLevelUsersPage(1);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {levelUsersDialog?.levelLabel ?? "Level users"}
            </DialogTitle>
            <DialogDescription>
              {levelUsersDialog
                ? `${levelUsersDialog.sourceDatabase} / ${levelUsersDialog.groupTitle} / #${levelUsersDialog.legacyLevelId}`
                : "Legacy users in this level"}
            </DialogDescription>
          </DialogHeader>

          {levelUsersLoading ? (
            <div className="rounded-sm border border-[#e5e7eb] p-6 text-sm text-muted-foreground">
              Loading users...
            </div>
          ) : levelUsersDialog?.users.length ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-sm border border-[#e5e7eb]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registered Date</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleLevelUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="whitespace-normal">
                          <div className="space-y-1">
                            <a
                              href={`/settings/legacy-users?uid=${user.legacyId}`}
                              className="font-semibold text-[#0f766e] hover:underline"
                            >
                              {user.username}
                            </a>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline">#{user.legacyId}</Badge>
                              {user.isRestricted ? (
                                <Badge variant="warning">restricted</Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          {user.name || "-"}
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          {user.email || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatLegacyDateTime(user.registeredAt)}
                        </TableCell>
                        <TableCell className="whitespace-normal text-sm">
                          <div className="flex items-center gap-2">
                            <History className="size-3 text-muted-foreground" />
                            <span>{formatLegacyDateTime(user.lastLoginAt)}</span>
                          </div>
                          {user.lastLoginIp ? (
                            <div className="mt-1 font-mono text-xs text-muted-foreground">
                              {user.lastLoginIp}
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {levelUsersRange.start}-{levelUsersRange.end} of{" "}
                  {levelUsersDialog.users.length}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={levelUsersPageForView <= 1}
                    onClick={() => setLevelUsersPage(levelUsersPageForView - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  {levelUserPageItems.map((item) =>
                    typeof item === "number" ? (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={
                          item === levelUsersPageForView ? "default" : "outline"
                        }
                        className="min-w-9 px-2"
                        onClick={() => setLevelUsersPage(item)}
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
                    disabled={levelUsersPageForView >= levelUsersTotalPages}
                    onClick={() => setLevelUsersPage(levelUsersPageForView + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-[#e5e7eb] p-6 text-sm text-muted-foreground">
              No users found!
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLevelUsersDialog(null);
                setLevelUsersPage(1);
              }}
              disabled={levelUsersLoading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteLevelTarget)}
        onOpenChange={(open) => {
          if (!open && !levelSaving) setDeleteLevelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete level</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {deleteLevelTarget?.label ?? "this level"} from the legacy
              level list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={levelSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLevel}
              disabled={levelSaving}
              className="bg-[#d64635] text-white hover:bg-[#c13d2e]"
            >
              <Trash2 className="size-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
