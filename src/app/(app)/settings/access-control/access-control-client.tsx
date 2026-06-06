"use client";

import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  type LegacyAccessControlGroup,
  updateLegacyAccessControlLevels,
} from "@/lib/actions/legacy-access-control";
import {
  CheckSquare,
  Database,
  Eraser,
  Save,
  Search,
  ShieldCheck,
  Square,
} from "lucide-react";

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type AccessControlClientProps = {
  initialGroups: LegacyAccessControlGroup[];
  initialError?: string | null;
};

function levelKey(groupKey: string, legacyLevelId: number) {
  return `${groupKey}:${legacyLevelId}`;
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
                                {level.isDisabled ? (
                                  <Badge variant="warning">Disabled</Badge>
                                ) : null}
                              </div>
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
    </>
  );
}
