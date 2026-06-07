"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
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
import {
  createLegacyProfileField,
  deleteLegacyProfileField,
  type LegacyAdminProfileFieldInput,
  type LegacyAdminProfileFieldRow,
  type LegacyAdminProfileFieldsData,
  type LegacyAdminUserGroup,
  type LegacyProfileFieldRecordType,
  type LegacyProfileFieldType,
  type LegacyProfileSignupMode,
  updateLegacyProfileField,
} from "@/lib/actions/legacy-users";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Database,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  TextCursorInput,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const ALL_GROUPS_KEY = "__all__";

const FIELD_TYPE_LABELS: Record<LegacyProfileFieldType, string> = {
  text_input: "Text Input",
  textarea: "Textarea",
  checkbox: "Checkbox",
};

const SIGNUP_LABELS: Record<LegacyProfileSignupMode, string> = {
  hide: "Hide",
  require: "Require",
  optional: "Optional",
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type DialogMode = "create" | "edit";

type DeleteTarget = {
  id: string;
  label: string;
  valueCount: number;
} | null;

type LegacyProfileFieldsClientProps = {
  initialData: LegacyAdminProfileFieldsData;
  initialError?: string | null;
};

function fieldRecordTypeForGroup(
  recordType: LegacyAdminUserGroup["recordType"],
): LegacyProfileFieldRecordType {
  return recordType === "manager_login_user"
    ? "manager_profile_field"
    : "profile_field";
}

function userRecordTypeForField(
  recordType: LegacyProfileFieldRecordType,
): LegacyAdminUserGroup["recordType"] {
  return recordType === "manager_profile_field"
    ? "manager_login_user"
    : "login_user";
}

function sourceGroupKey(
  sourceDatabase: string,
  recordType: LegacyAdminUserGroup["recordType"],
) {
  return `${sourceDatabase}:${recordType}`;
}

function groupKeyForField(field: LegacyAdminProfileFieldRow) {
  return sourceGroupKey(
    field.sourceDatabase,
    userRecordTypeForField(field.recordType),
  );
}

function groupLabel(group: LegacyAdminUserGroup) {
  return `${group.sourceDatabase} / ${group.label}`;
}

function createEmptyForm(
  group: LegacyAdminUserGroup | null,
): LegacyAdminProfileFieldInput {
  return {
    sourceDatabase: group?.sourceDatabase ?? "",
    recordType: fieldRecordTypeForGroup(group?.recordType ?? "login_user"),
    section: "Profile",
    fieldType: "text_input",
    label: "",
    signup: "hide",
    isPublic: false,
  };
}

function formFromField(
  field: LegacyAdminProfileFieldRow,
): LegacyAdminProfileFieldInput {
  return {
    sourceDatabase: field.sourceDatabase,
    recordType: field.recordType,
    section: field.section,
    fieldType: field.fieldType,
    label: field.label,
    signup: field.signup,
    isPublic: field.isPublic,
  };
}

function sortProfileFields(fields: LegacyAdminProfileFieldRow[]) {
  return [...fields].sort((a, b) => {
    const source = a.sourceDatabase.localeCompare(b.sourceDatabase);
    if (source !== 0) return source;
    const type = a.recordType.localeCompare(b.recordType);
    if (type !== 0) return type;
    const section = a.section.localeCompare(b.section);
    if (section !== 0) return section;
    return a.legacyId - b.legacyId;
  });
}

function statusMessageClass(message: MessageState) {
  if (!message) return "";
  return message.type === "success"
    ? "border-[#b8dfd6] bg-[#eefaf7] text-[#0f6f61]"
    : "border-[#f0c2bc] bg-[#fff3f1] text-[#9b2f24]";
}

export function LegacyProfileFieldsClient({
  initialData,
  initialError,
}: LegacyProfileFieldsClientProps) {
  const [fields, setFields] = useState(initialData.fields);
  const [selectedGroupKey, setSelectedGroupKey] = useState(ALL_GROUPS_KEY);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<MessageState>(
    initialError ? { type: "error", text: initialError } : null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingField, setEditingField] =
    useState<LegacyAdminProfileFieldRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [form, setForm] = useState<LegacyAdminProfileFieldInput>(() =>
    createEmptyForm(initialData.groups[0] ?? null),
  );
  const [isPending, startTransition] = useTransition();

  const groupsByKey = useMemo(
    () =>
      new Map(
        initialData.groups.map((group) => [
          sourceGroupKey(group.sourceDatabase, group.recordType),
          group,
        ]),
      ),
    [initialData.groups],
  );

  const selectedGroup =
    selectedGroupKey === ALL_GROUPS_KEY
      ? null
      : groupsByKey.get(selectedGroupKey) ?? null;

  const filteredFields = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return fields.filter((field) => {
      if (
        selectedGroupKey !== ALL_GROUPS_KEY &&
        groupKeyForField(field) !== selectedGroupKey
      ) {
        return false;
      }

      if (!needle) return true;

      return [
        field.legacyId,
        field.section,
        field.label,
        FIELD_TYPE_LABELS[field.fieldType],
        SIGNUP_LABELS[field.signup],
        field.sourceDatabase,
        field.legacyTable,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [fields, query, selectedGroupKey]);

  const totals = useMemo(
    () => ({
      fields: fields.length,
      publicFields: fields.filter((field) => field.isPublic).length,
      signupFields: fields.filter((field) => field.signup !== "hide").length,
      profileValues: fields.reduce((sum, field) => sum + field.valueCount, 0),
    }),
    [fields],
  );

  function updateForm<K extends keyof LegacyAdminProfileFieldInput>(
    key: K,
    value: LegacyAdminProfileFieldInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeFormGroup(groupKey: string) {
    const group = groupsByKey.get(groupKey);
    if (!group) return;

    setForm((current) => ({
      ...current,
      sourceDatabase: group.sourceDatabase,
      recordType: fieldRecordTypeForGroup(group.recordType),
    }));
  }

  function openCreateDialog() {
    const group = selectedGroup ?? initialData.groups[0] ?? null;
    setDialogMode("create");
    setEditingField(null);
    setForm(createEmptyForm(group));
    setDialogOpen(true);
  }

  function openEditDialog(field: LegacyAdminProfileFieldRow) {
    setDialogMode("edit");
    setEditingField(field);
    setForm(formFromField(field));
    setDialogOpen(true);
  }

  function saveField() {
    setMessage(null);
    startTransition(async () => {
      const result =
        dialogMode === "edit" && editingField
          ? await updateLegacyProfileField(editingField.id, form)
          : await createLegacyProfileField(form);

      const savedField = result.data;
      if (result.success && savedField) {
        setFields((current) => {
          const next =
            dialogMode === "edit"
              ? current.map((field) =>
                  field.id === savedField.id ? savedField : field,
                )
              : [...current, savedField];
          return sortProfileFields(next);
        });
        setDialogOpen(false);
        setEditingField(null);
        setMessage({ type: "success", text: "Settings updated." });
        toast.success("Settings updated.");
        return;
      }

      const error = result.error ?? "Failed to save profile field";
      setMessage({ type: "error", text: error });
      toast.error(error);
    });
  }

  function confirmDelete(field: LegacyAdminProfileFieldRow) {
    setDeleteTarget({
      id: field.id,
      label: field.label,
      valueCount: field.valueCount,
    });
  }

  function deleteField() {
    if (!deleteTarget) return;

    setMessage(null);
    startTransition(async () => {
      const result = await deleteLegacyProfileField(deleteTarget.id);

      if (result.success) {
        setFields((current) =>
          current.filter((field) => field.id !== deleteTarget.id),
        );
        setDeleteTarget(null);
        setMessage({ type: "success", text: "Settings updated." });
        toast.success("Settings updated.");
        return;
      }

      const error = result.error ?? "Failed to delete profile field";
      setMessage({ type: "error", text: error });
      toast.error(error);
    });
  }

  return (
    <>
      <PageHeader
        title="Profile Fields"
        description="Legacy user profile sections, labels, input types, signup visibility, and public profile flags"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Legacy Users", href: "/settings/legacy-users" },
          { label: "Profile Fields" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings/legacy-users">
                <ArrowLeft className="size-4" />
                Legacy Users
              </Link>
            </Button>
            <Button
              onClick={openCreateDialog}
              disabled={initialData.groups.length === 0}
            >
              <Plus className="size-4" />
              Add field
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        {message ? (
          <div
            className={cn(
              "rounded-sm border px-3 py-2 text-sm",
              statusMessageClass(message),
            )}
          >
            {message.text}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <TextCursorInput className="size-4" />
              Fields
            </div>
            <p className="mt-2 text-2xl font-semibold">{totals.fields}</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Eye className="size-4" />
              Public
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {totals.publicFields}
            </p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Plus className="size-4" />
              Sign Up
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {totals.signupFields}
            </p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Database className="size-4" />
              Values
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {totals.profileValues}
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-background">
          <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,320px)_minmax(220px,1fr)]">
              <Select
                value={selectedGroupKey}
                onValueChange={setSelectedGroupKey}
              >
                <SelectTrigger id="legacy-profile-field-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_GROUPS_KEY}>All sources</SelectItem>
                  {initialData.groups.map((group) => (
                    <SelectItem
                      key={sourceGroupKey(group.sourceDatabase, group.recordType)}
                      value={sourceGroupKey(group.sourceDatabase, group.recordType)}
                    >
                      {groupLabel(group)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search profile fields"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredFields.length} of {fields.length} fields
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Input type</TableHead>
                  <TableHead>Input label</TableHead>
                  <TableHead>Sign Up</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead className="text-right">Values</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-28 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFields.length ? (
                  filteredFields.map((field) => {
                    const group = groupsByKey.get(groupKeyForField(field));

                    return (
                      <TableRow key={field.id}>
                        <TableCell className="font-mono text-xs">
                          {field.legacyId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {field.section}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {FIELD_TYPE_LABELS[field.fieldType]}
                          </Badge>
                        </TableCell>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              field.signup === "require"
                                ? "default"
                                : "outline"
                            }
                          >
                            {SIGNUP_LABELS[field.signup]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {field.isPublic ? (
                              <Eye className="size-4 text-[#0B9178]" />
                            ) : (
                              <EyeOff className="size-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">
                              {field.isPublic ? "Public" : "Private"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {field.valueCount}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{group?.label ?? field.recordType}</div>
                            <div className="text-xs text-muted-foreground">
                              {field.sourceDatabase} / {field.legacyTable}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog(field)}
                              title={`Update ${field.label}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => confirmDelete(field)}
                              title={`Delete ${field.label}`}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-28 text-center text-sm text-muted-foreground"
                    >
                      No legacy profile fields found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Add field" : "Update field"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Create a legacy profile field definition."
                : `${editingField?.sourceDatabase ?? ""} / #${editingField?.legacyId ?? ""}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-field-source">Source</Label>
              <Select
                value={sourceGroupKey(
                  form.sourceDatabase,
                  userRecordTypeForField(form.recordType),
                )}
                onValueChange={changeFormGroup}
                disabled={dialogMode === "edit" || isPending}
              >
                <SelectTrigger id="profile-field-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {initialData.groups.map((group) => (
                    <SelectItem
                      key={sourceGroupKey(group.sourceDatabase, group.recordType)}
                      value={sourceGroupKey(group.sourceDatabase, group.recordType)}
                    >
                      {groupLabel(group)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-field-section">Section</Label>
                <Input
                  id="profile-field-section"
                  value={form.section}
                  onChange={(event) => updateForm("section", event.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-field-label">Input label</Label>
                <Input
                  id="profile-field-label"
                  value={form.label}
                  onChange={(event) => updateForm("label", event.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-field-type">Input type</Label>
                <Select
                  value={form.fieldType}
                  onValueChange={(value) =>
                    updateForm("fieldType", value as LegacyProfileFieldType)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="profile-field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text_input">Text Input</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-field-signup">Sign Up</Label>
                <Select
                  value={form.signup}
                  onValueChange={(value) =>
                    updateForm("signup", value as LegacyProfileSignupMode)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="profile-field-signup">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hide">Hide</SelectItem>
                    <SelectItem value="require">Require</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex min-h-10 items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm">
              <Checkbox
                checked={form.isPublic}
                onCheckedChange={(checked) =>
                  updateForm("isPublic", checked === true)
                }
                disabled={isPending}
              />
              <span className="font-medium">Public</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveField} disabled={isPending}>
              {isPending
                ? "Saving..."
                : dialogMode === "create"
                  ? "Add field"
                  : "Update field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile field</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleteTarget?.label ?? "this field"} from legacy profile
              definitions. {deleteTarget?.valueCount ?? 0} stored values will
              remain preserved as legacy profile values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={deleteField}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
