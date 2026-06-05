"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Baby, CheckSquare, GraduationCap, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { createNewAcademicYear } from "@/lib/actions/new-year";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

interface SetupData {
  activeYear: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
  } | null;
  suggestedYear: {
    label: string;
    startDate: string;
    endDate: string;
  };
  schoolYears: Array<{
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    childCount: number;
  }>;
  classes: ClassOption[];
  teachers: Array<{
    id: string;
    name: string;
    branchName: string;
    currentClassId: string | null;
    currentClassName: string | null;
  }>;
  children: Array<{
    id: string;
    name: string;
    branchName: string;
    currentClassId: string | null;
    currentClassName: string | null;
    currentSchoolYear: string | null;
    currentChildNumber: string | null;
    suggestedChildNumber: string;
  }>;
}

interface ClassOption {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  branchPrefix: string | null;
  legacyBranchId: number | null;
  childCount: number;
  teacherCount: number;
}

interface TeacherRow {
  id: string;
  selected: boolean;
  targetClassId: string;
}

interface ChildRow {
  id: string;
  selected: boolean;
  targetClassId: string;
}

interface Props {
  setup: SetupData;
}

const optionalImports = [
  { id: "GF", label: "General Forms", defaultChecked: true },
  { id: "VF", label: "Vaccination Forms", defaultChecked: true },
  { id: "SF", label: "Suffering Forms", defaultChecked: true },
  { id: "Tch", label: "Teachers", defaultChecked: true },
  { id: "nrses", label: "Nurses", defaultChecked: false },
  { id: "mngrs", label: "Managers", defaultChecked: false },
  { id: "drs", label: "Doctors (Garderie Drs)", defaultChecked: false },
  { id: "hldays", label: "Holidays (Only Fixed Holidays)", defaultChecked: false },
] as const;

const mandatoryImports = [
  { id: "cls", label: "Classes" },
  { id: "brs", label: "Branches" },
  { id: "chls", label: "Children" },
  { id: "prts", label: "Parents" },
];

function labelYears(label: string) {
  const match = label.match(/(\d{4})\D+(\d{4})/);
  if (!match) return null;
  return {
    start: match[1].slice(-2),
    end: match[2].slice(-2),
  };
}

function generateChildNumber(classInfo: ClassOption | undefined, label: string, index: number) {
  const years = labelYears(label);
  const prefix = classInfo?.branchPrefix ?? "";
  const branchCode = classInfo?.legacyBranchId ? String(classInfo.legacyBranchId) : "";
  return `${prefix}${years?.start ?? ""}${years?.end ?? ""}${branchCode}${String(index + 1).padStart(3, "0")}`;
}

export function NewYearClient({ setup }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(setup.suggestedYear.label);
  const [startDate, setStartDate] = useState(setup.suggestedYear.startDate);
  const [endDate, setEndDate] = useState(setup.suggestedYear.endDate);
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedImports, setSelectedImports] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(optionalImports.map((option) => [option.id, option.defaultChecked])),
  );

  const firstClassId = setup.classes[0]?.id ?? "";
  const classById = useMemo(
    () => new Map(setup.classes.map((classInfo) => [classInfo.id, classInfo])),
    [setup.classes],
  );

  const [teacherRows, setTeacherRows] = useState<TeacherRow[]>(() =>
    setup.teachers.map((teacher) => ({
      id: teacher.id,
      selected: false,
      targetClassId: teacher.currentClassId ?? firstClassId,
    })),
  );
  const [childRows, setChildRows] = useState<ChildRow[]>(() =>
    setup.children.map((child) => ({
      id: child.id,
      selected: false,
      targetClassId: child.currentClassId ?? firstClassId,
    })),
  );

  const teacherById = useMemo(
    () => new Map(setup.teachers.map((teacher) => [teacher.id, teacher])),
    [setup.teachers],
  );
  const childById = useMemo(
    () => new Map(setup.children.map((child) => [child.id, child])),
    [setup.children],
  );
  const selectedTeacherCount = teacherRows.filter((row) => row.selected).length;
  const selectedChildCount = childRows.filter((row) => row.selected).length;
  const teachersRequired = selectedImports.Tch;
  const canSubmit =
    acknowledged &&
    !!label &&
    !!startDate &&
    !!endDate &&
    selectedChildCount > 0 &&
    (!teachersRequired || selectedTeacherCount > 0) &&
    !isPending;

  function toggleImport(id: string) {
    setSelectedImports((current) => ({ ...current, [id]: !current[id] }));
  }

  function setAllTeachers(selected: boolean) {
    setTeacherRows((rows) => rows.map((row) => ({ ...row, selected })));
  }

  function setAllChildren(selected: boolean) {
    setChildRows((rows) => rows.map((row) => ({ ...row, selected })));
  }

  function updateTeacher(id: string, updates: Partial<TeacherRow>) {
    setTeacherRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  }

  function updateChild(id: string, updates: Partial<ChildRow>) {
    setChildRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...updates } : row)),
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createNewAcademicYear({
        label,
        startDate,
        endDate,
        optionalImports: optionalImports
          .filter((option) => selectedImports[option.id])
          .map((option) => option.id),
        teachers: teacherRows
          .filter((row) => row.selected)
          .map((row) => ({ teacherId: row.id, classId: row.targetClassId })),
        children: childRows.flatMap((row, index) =>
          row.selected
            ? [
                {
                  childId: row.id,
                  classId: row.targetClassId,
                  childNumber: generateChildNumber(classById.get(row.targetClassId), label, index),
                },
              ]
            : [],
        ),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Created ${label}: ${result.data.childrenUpdated} children, ${result.data.teachersUpdated} teachers`,
      );
      setAcknowledged(false);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="New Academic Year Setup"
        description="Archive the current academic context and carry selected children and staff forward"
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "New Academic Year" }]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Warning</p>
            <p className="mt-1">
              This creates a new active school year, deactivates the previous active year, updates
              selected teacher and child class assignments, and records child history snapshots.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Garderie Year</CardTitle>
            <CardDescription>
              Active year: {setup.activeYear?.label ?? "None"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-year-label">Year Label</Label>
                <Input id="new-year-label" value={label} onChange={(event) => setLabel(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-year-start">Start Date</Label>
                <Input
                  id="new-year-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-year-end">End Date</Label>
                <Input
                  id="new-year-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>
            {setup.schoolYears.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {setup.schoolYears.slice(0, 5).map((year) => (
                  <Badge key={year.id} variant={year.isActive ? "default" : "secondary"}>
                    {year.label} - {year.childCount}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imports</CardTitle>
            <CardDescription>Legacy import selections preserved from newyear.php</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Optional Imports</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {optionalImports.map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <Checkbox
                        checked={selectedImports[option.id]}
                        onCheckedChange={() => toggleImport(option.id)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Mandatory Imports</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mandatoryImports.map((option) => (
                    <div key={option.id} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Checkbox checked disabled />
                      <span>{option.label}</span>
                      <Lock className="size-3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-5 text-muted-foreground" />
                  <CardTitle>Teacher Reassignment</CardTitle>
                </div>
                <CardDescription>
                  {selectedTeacherCount} of {teacherRows.length} selected
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAllTeachers(true)}>
                  <CheckSquare className="mr-1.5 size-4" />
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAllTeachers(false)}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Teacher Name</TableHead>
                    <TableHead>Current Class</TableHead>
                    <TableHead>New Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherRows.map((row) => {
                    const teacher = teacherById.get(row.id);
                    if (!teacher) return null;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Checkbox
                            checked={row.selected}
                            onCheckedChange={() => updateTeacher(row.id, { selected: !row.selected })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell>
                          <div>{teacher.currentClassName ?? "-"}</div>
                          <div className="text-xs text-muted-foreground">{teacher.branchName}</div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.targetClassId}
                            onValueChange={(value) => updateTeacher(row.id, { targetClassId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {setup.classes.map((classInfo) => (
                                <SelectItem key={classInfo.id} value={classInfo.id}>
                                  {classInfo.name} - {classInfo.branchName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Baby className="size-5 text-muted-foreground" />
                  <CardTitle>Child Class Progression</CardTitle>
                </div>
                <CardDescription>
                  {selectedChildCount} of {childRows.length} selected
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAllChildren(true)}>
                  <CheckSquare className="mr-1.5 size-4" />
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAllChildren(false)}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Child Name</TableHead>
                    <TableHead>Current Class</TableHead>
                    <TableHead>New Class</TableHead>
                    <TableHead>New S.N.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childRows.map((row, index) => {
                    const child = childById.get(row.id);
                    if (!child) return null;
                    const childNumber = generateChildNumber(classById.get(row.targetClassId), label, index);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Checkbox
                            checked={row.selected}
                            onCheckedChange={() => updateChild(row.id, { selected: !row.selected })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>{child.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {child.currentChildNumber ?? "-"} / {child.currentSchoolYear ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{child.currentClassName ?? "-"}</div>
                          <div className="text-xs text-muted-foreground">{child.branchName}</div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.targetClassId}
                            onValueChange={(value) => updateChild(row.id, { targetClassId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {setup.classes.map((classInfo) => (
                                <SelectItem key={classInfo.id} value={classInfo.id}>
                                  {classInfo.name} - {classInfo.branchName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input value={childNumber} readOnly />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 z-20 rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={acknowledged} onCheckedChange={(value) => setAcknowledged(value === true)} />
              <span>
                I confirm the selected children and teachers should be carried into {label || "the new year"}.
              </span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {teachersRequired && selectedTeacherCount === 0 && (
                <span className="text-sm text-destructive">Select at least one teacher</span>
              )}
              {selectedChildCount === 0 && (
                <span className="text-sm text-destructive">Select at least one child</span>
              )}
              <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
                <RefreshCw className="mr-1.5 size-4" />
                {isPending ? "Creating..." : "Create New Academic Year"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
