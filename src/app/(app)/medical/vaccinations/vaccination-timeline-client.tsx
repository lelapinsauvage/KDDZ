"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Syringe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  Search,
} from "lucide-react";
import { format, differenceInMonths, differenceInYears } from "date-fns";

// --- Standard vaccine schedule ---

interface DoseSchedule {
  label: string;
  ageLabel: string;
  ageMonths: number;
}

interface VaccineSchedule {
  name: string;
  shortName: string;
  doses: DoseSchedule[];
}

const STANDARD_VACCINES: VaccineSchedule[] = [
  {
    name: "Hepatitis B",
    shortName: "HepB",
    doses: [{ label: "Birth Dose", ageLabel: "Birth", ageMonths: 0 }],
  },
  {
    name: "IPV (Polio)",
    shortName: "IPV",
    doses: [{ label: "1st Dose", ageLabel: "2 mos", ageMonths: 2 }],
  },
  {
    name: "OPV (Oral Polio)",
    shortName: "OPV",
    doses: [
      { label: "1st Dose", ageLabel: "4 mos", ageMonths: 4 },
      { label: "2nd Dose", ageLabel: "6 mos", ageMonths: 6 },
      { label: "3rd Dose", ageLabel: "18 mos", ageMonths: 18 },
      { label: "4th Dose", ageLabel: "4 yrs", ageMonths: 48 },
      { label: "5th Dose", ageLabel: "10 yrs", ageMonths: 120 },
    ],
  },
  {
    name: "DPT-Hib-HepB",
    shortName: "Penta",
    doses: [
      { label: "1st Dose", ageLabel: "2 mos", ageMonths: 2 },
      { label: "2nd Dose", ageLabel: "4 mos", ageMonths: 4 },
      { label: "3rd Dose", ageLabel: "6 mos", ageMonths: 6 },
    ],
  },
  {
    name: "Measles",
    shortName: "Measles",
    doses: [{ label: "1st Dose", ageLabel: "9 mos", ageMonths: 9 }],
  },
  {
    name: "MMR",
    shortName: "MMR",
    doses: [
      { label: "1st Dose", ageLabel: "12 mos", ageMonths: 12 },
      { label: "2nd Dose", ageLabel: "18 mos", ageMonths: 18 },
    ],
  },
  {
    name: "DPT",
    shortName: "DPT",
    doses: [
      { label: "1st Booster", ageLabel: "18 mos", ageMonths: 18 },
      { label: "2nd Booster", ageLabel: "4 yrs", ageMonths: 48 },
    ],
  },
  {
    name: "DT",
    shortName: "DT",
    doses: [{ label: "Booster", ageLabel: "10 yrs", ageMonths: 120 }],
  },
];

// --- Types ---

interface VaccinationRecord {
  id: string;
  childId: string;
  childName: string;
  vaccine: string;
  dateGiven: string | null;
  nextDue: string | null;
  notes: string;
  branchId: string;
  branchName: string;
}

interface ChildInfo {
  id: string;
  name: string;
  dob: string | null;
  branchId: string;
  branchName: string;
}

type DoseStatus = "given" | "overdue" | "upcoming" | "not-due";

interface DoseWithStatus {
  schedule: DoseSchedule;
  status: DoseStatus;
  dateGiven: string | null;
  administeredBy: string;
  dueDate: Date | null;
  record: VaccinationRecord | null;
}

// --- Props ---

interface VaccinationTimelineClientProps {
  vaccinations: VaccinationRecord[];
  children: ChildInfo[];
  branches: Array<{ id: string; name: string }>;
}

// --- Helpers ---

function matchVaccineRecord(
  records: VaccinationRecord[],
  vaccineName: string,
  doseLabel: string
): VaccinationRecord | null {
  const nameVariants = [vaccineName.toLowerCase()];
  if (vaccineName.includes("(")) {
    nameVariants.push(vaccineName.split("(")[0].trim().toLowerCase());
  }

  return (
    records.find((r) => {
      const rName = r.vaccine.toLowerCase();
      const matchesName = nameVariants.some(
        (v) => rName.includes(v) || v.includes(rName.split("(")[0].trim())
      );
      if (!matchesName) return false;

      const rDose = rName.match(/\(([^)]+)\)/)?.[1] ?? "";
      return rDose.toLowerCase().includes(doseLabel.toLowerCase().replace("dose", "").trim()) ||
        doseLabel.toLowerCase().includes(rDose.toLowerCase().replace("dose", "").trim()) ||
        (!rDose && records.filter((rr) => {
          const rrName = rr.vaccine.toLowerCase();
          return nameVariants.some(
            (v) => rrName.includes(v) || v.includes(rrName.split("(")[0].trim())
          );
        }).length <= 1);
    }) ?? null
  );
}

function getDoseStatus(
  dob: Date | null,
  schedule: DoseSchedule,
  record: VaccinationRecord | null
): { status: DoseStatus; dueDate: Date | null } {
  if (record?.dateGiven) {
    return { status: "given", dueDate: null };
  }

  if (!dob) {
    return { status: "not-due", dueDate: null };
  }

  const dueDate = new Date(dob);
  dueDate.setMonth(dueDate.getMonth() + schedule.ageMonths);

  const now = new Date();
  if (dueDate < now) {
    return { status: "overdue", dueDate };
  }

  const threeMonthsAhead = new Date();
  threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

  if (dueDate <= threeMonthsAhead) {
    return { status: "upcoming", dueDate };
  }

  return { status: "not-due", dueDate };
}

function extractAdministeredBy(notes: string): string {
  const match = notes.match(/Administered by:\s*(.+?)\.?(?:\n|$)/);
  return match ? match[1].trim() : "";
}

function getChildAge(dob: string | null): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const years = differenceInYears(new Date(), birth);
  const months = differenceInMonths(new Date(), birth) % 12;
  if (years > 0) {
    return months > 0 ? `${years}y ${months}m` : `${years}y`;
  }
  return `${months}m`;
}

// --- Status badge ---

function DoseStatusIndicator({ status, small }: { status: DoseStatus; small?: boolean }) {
  const size = small ? "size-4" : "size-5";
  switch (status) {
    case "given":
      return <CheckCircle2 className={`${size} text-emerald-600`} />;
    case "overdue":
      return <AlertTriangle className={`${size} text-red-500`} />;
    case "upcoming":
      return <Clock className={`${size} text-amber-500`} />;
    case "not-due":
      return <Circle className={`${size} text-muted-foreground/30`} />;
  }
}

const statusLabel: Record<DoseStatus, string> = {
  given: "Given",
  overdue: "Overdue",
  upcoming: "Upcoming",
  "not-due": "Not Yet Due",
};

const statusBg: Record<DoseStatus, string> = {
  given: "bg-emerald-50 border-emerald-200",
  overdue: "bg-red-50 border-red-200",
  upcoming: "bg-amber-50 border-amber-200",
  "not-due": "bg-muted/30 border-border/40",
};

// --- Component ---

export function VaccinationTimelineClient({
  vaccinations,
  children,
  branches,
}: VaccinationTimelineClientProps) {
  const [selectedChild, setSelectedChild] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredChildren = useMemo(() => {
    let list = children;
    if (branchFilter !== "all") {
      list = list.filter((c) => c.branchId === branchFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(lower));
    }
    return list;
  }, [children, branchFilter, search]);

  const targetChildren = useMemo(() => {
    if (selectedChild !== "all") {
      return filteredChildren.filter((c) => c.id === selectedChild);
    }
    return filteredChildren;
  }, [filteredChildren, selectedChild]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative max-w-sm flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by child name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
            <SelectValue placeholder="All Branches" />
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

        <Select value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[200px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {filteredChildren.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          Given
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 text-red-500" />
          Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-amber-500" />
          Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <Circle className="size-3.5 text-muted-foreground/30" />
          Not Yet Due
        </span>
      </div>

      {/* Timeline per child */}
      {targetChildren.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No children match your filters.
        </div>
      ) : (
        <div className="space-y-6">
          {targetChildren.map((child) => (
            <ChildVaccinationTimeline
              key={child.id}
              child={child}
              records={vaccinations.filter((v) => v.childId === child.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Per-child timeline ---

function ChildVaccinationTimeline({
  child,
  records,
}: {
  child: ChildInfo;
  records: VaccinationRecord[];
}) {
  const dob = child.dob ? new Date(child.dob) : null;

  const vaccineRows = useMemo(() => {
    return STANDARD_VACCINES.map((vaccine) => {
      const doses: DoseWithStatus[] = vaccine.doses.map((doseSchedule) => {
        const record = matchVaccineRecord(records, vaccine.name, doseSchedule.label);
        const { status, dueDate } = getDoseStatus(dob, doseSchedule, record);
        const administeredBy = record ? extractAdministeredBy(record.notes) : "";

        return {
          schedule: doseSchedule,
          status,
          dateGiven: record?.dateGiven ?? null,
          administeredBy,
          dueDate,
          record,
        };
      });

      return { vaccine, doses };
    });
  }, [records, dob]);

  const stats = useMemo(() => {
    let given = 0;
    let overdue = 0;
    let upcoming = 0;
    let notDue = 0;
    vaccineRows.forEach((row) =>
      row.doses.forEach((d) => {
        if (d.status === "given") given++;
        else if (d.status === "overdue") overdue++;
        else if (d.status === "upcoming") upcoming++;
        else notDue++;
      })
    );
    return { given, overdue, upcoming, notDue, total: given + overdue + upcoming + notDue };
  }, [vaccineRows]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {child.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base">{child.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {child.dob ? `DOB: ${format(new Date(child.dob), "MMM d, yyyy")}` : "DOB: N/A"}
                {child.dob && ` (${getChildAge(child.dob)})`}
                {" \u00b7 "}
                {child.branchName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.given > 0 && (
              <Badge className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="size-3" />
                {stats.given}
              </Badge>
            )}
            {stats.overdue > 0 && (
              <Badge className="gap-1 bg-red-50 text-red-700 border-red-200">
                <AlertTriangle className="size-3" />
                {stats.overdue}
              </Badge>
            )}
            {stats.upcoming > 0 && (
              <Badge className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="size-3" />
                {stats.upcoming}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={200}>
          <div className="space-y-2">
            {vaccineRows.map(({ vaccine, doses }) => (
              <div
                key={vaccine.name}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
              >
                {/* Vaccine name */}
                <div className="flex items-center gap-2 w-40 shrink-0">
                  <Syringe className="size-3.5 text-primary/60 shrink-0" />
                  <span className="text-sm font-medium truncate">{vaccine.name}</span>
                </div>

                {/* Dose timeline dots */}
                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                  {doses.map((dose, i) => (
                    <Tooltip key={`${vaccine.name}-${i}`}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${statusBg[dose.status]}`}
                        >
                          <DoseStatusIndicator status={dose.status} small />
                          <span>{dose.schedule.ageLabel}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">
                            {vaccine.name} &mdash; {dose.schedule.label}
                          </p>
                          <p>
                            Status:{" "}
                            <span className="font-medium">{statusLabel[dose.status]}</span>
                          </p>
                          {dose.dateGiven && (
                            <p>
                              Date Given:{" "}
                              {format(new Date(dose.dateGiven), "MMM d, yyyy")}
                            </p>
                          )}
                          {dose.administeredBy && (
                            <p>Administered By: {dose.administeredBy}</p>
                          )}
                          {dose.dueDate && dose.status !== "given" && (
                            <p>
                              {dose.status === "overdue" ? "Was due" : "Due"}:{" "}
                              {format(dose.dueDate, "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
