"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Heart,
  Calendar,
  DollarSign,
  FileText,
  Phone,
  AlertTriangle,
  User,
  MessageCircle,
  ShieldAlert,
  UserX,
  FileQuestion,
  Eye,
  Send,
  Droplets,
  ClipboardList,
  CheckCircle2,
  Clock,
  Stethoscope,
  FilePenLine,
  GraduationCap,
  CircleDashed,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getAvatarColor, getInitials } from "@/components/children/children-columns";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/shared/data-table";
import { ATTENDANCE_COLORS } from "@/components/dashboard/demographics-section";

// ── Helpers ──────────────────────────────────────

function formatWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.+]/g, "");
  return `https://wa.me/${cleaned}`;
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  if (years === 0) return `${months}m`;
  return `${years}y ${months}m`;
}

function calculateAgeAtDate(dob: string, atDate: string): string {
  const birth = new Date(dob);
  const target = new Date(atDate);
  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (target.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  if (years === 0) return `${months}m`;
  return `${years}y ${months}m`;
}

function calculateDurationSince(dateStr: string): string {
  const start = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (now.getDate() < start.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  if (years === 0) return `${months}m`;
  return `${years}y ${months}m`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Types ────────────────────────────────────────

interface ParentInfo {
  type: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface RelativeInfo {
  name: string;
  relation: string | null;
  phone: string | null;
  isAuthorized: boolean;
  isEmergencyContact: boolean;
}

interface ChildData {
  id: string;
  firstName: string;
  firstNameAr: string | null;
  lastName: string;
  lastNameAr: string | null;
  photo: string | null;
  childNumber: string | null;
  className: string | null;
  branchName: string | null;
  dateOfBirth: string | null;
  enrollmentDate: string | null;
  bloodType: string | null;
  isActive: boolean;
  gender: string | null;
  nationality: string | null;
  language: string | null;
  allergies: string | null;
  busAttendance: string | null | boolean;
  lunchIncluded: boolean;
  diaperType: string | null;
  milkType: string | null;
  milkPortions: number | null;
  milkScoop: number | null;
  parents: ParentInfo[];
  motherPhone: string | null;
  fatherPhone: string | null;
  relatives: RelativeInfo[];
}

interface ReportRow {
  id: string;
  date: string;
  breakfast: string | null;
  lunch: string | null;
  dessert: string | null;
  status: string;
  mood: string | null;
}

interface AbsenceRow {
  id: string;
  date: string;
  reason: string | null;
  absentFrom: string | null;
  absentTo: string | null;
  status: string;
}

interface MedicalRow {
  id: string;
  formType: string;
  status: string;
  date: string | null;
  href: string;
}

interface AssessmentRow {
  id: string;
  assessmentType: number;
  status: string;
  date: string;
}

interface Stats {
  callsInOut: number;
  accidentReports: number;
  totalPayments: string;
  totalAttendance: number;
  totalAbsence: number;
  missingDailyReports: number;
  missingAbsentReports: number;
  attendanceRate: string;
  totalReports: number;
  medicalPublished: number;
  medicalMissing: number;
  medicalDrafts: number;
  assessmentsCompleted: number;
  assessmentsMissing: number;
  assessmentsIncomplete: number;
  assessmentsDrafts: number;
}

interface AttendanceChart {
  present: number;
  absent: number;
  draft: number;
  noReport: number;
}

interface Props {
  child: ChildData;
  stats: Stats;
  attendanceChart: AttendanceChart;
  recentReports: ReportRow[];
  absenceList: AbsenceRow[];
  medicalList: MedicalRow[];
  assessmentList: AssessmentRow[];
}

// ── Status Badge ─────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED: "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20",
    DRAFT: "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20",
    REVIEWED: "bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-[var(--color-info)]/20",
    PENDING: "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20",
    APPROVED: "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20",
    REJECTED: "bg-[var(--color-error-light)] text-[var(--color-error-dark)] border-[var(--color-error)]/20",
    COMPLETED: "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20",
    IN_PROGRESS: "bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-[var(--color-info)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

// ── Donut chart colors ───────────────────────────
const DONUT_COLORS = ATTENDANCE_COLORS.slice(0, 2); // green = present, red = absent

// ── Profile Info Row ─────────────────────────────

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start justify-between gap-2 py-1.5 ${className ?? ""}`}>
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{value}</span>
    </div>
  );
}

// ── Column Definitions ───────────────────────────

const dailyReportColumns: ColumnDef<ReportRow>[] = [
  { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
  { accessorKey: "breakfast", header: "Breakfast", cell: ({ row }) => row.original.breakfast ?? "—" },
  { accessorKey: "lunch", header: "Lunch", cell: ({ row }) => row.original.lunch ?? "—" },
  { accessorKey: "dessert", header: "Dessert", cell: ({ row }) => row.original.dessert ?? "—" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <Button variant="ghost" size="icon-xs" asChild>
        <Link href={`/daily-reports/${row.original.id}`}>
          <Eye className="size-3.5" />
        </Link>
      </Button>
    ),
  },
];

const absenceColumns: ColumnDef<AbsenceRow>[] = [
  { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
  { accessorKey: "reason", header: "Reason", cell: ({ row }) => <span className="max-w-xs truncate block text-xs">{row.original.reason ?? "—"}</span> },
  { accessorKey: "absentFrom", header: "From", cell: ({ row }) => formatDate(row.original.absentFrom) },
  { accessorKey: "absentTo", header: "To", cell: ({ row }) => formatDate(row.original.absentTo) },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <Button variant="ghost" size="icon-xs" asChild>
        <Link href={`/absent-reports/${row.original.id}`}>
          <Eye className="size-3.5" />
        </Link>
      </Button>
    ),
  },
];

const medicalColumns: ColumnDef<MedicalRow>[] = [
  {
    accessorKey: "formType",
    header: "Type",
    cell: ({ row }) => {
      const m = row.original;
      return (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {m.formType}
          {m.status === "SUBMITTED" || m.status === "APPROVED" ? (
            <CheckCircle2 className="size-3.5 text-[var(--color-success)]" />
          ) : m.status === "DRAFT" || m.status === "PENDING" ? (
            <Clock className="size-3.5 text-[var(--color-warning)]" />
          ) : null}
        </div>
      );
    },
  },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <Button variant="ghost" size="icon-xs" asChild>
        <Link href={row.original.href}>
          <Eye className="size-3.5" />
        </Link>
      </Button>
    ),
  },
];

const assessmentColumns: ColumnDef<AssessmentRow>[] = [
  {
    accessorKey: "assessmentType",
    header: "Type",
    cell: ({ row }) => {
      const a = row.original;
      const typeName = ASSESSMENT_TYPE_NAMES[a.assessmentType] ?? `Type ${a.assessmentType}`;
      const isCompleted = a.status === "SUBMITTED" || a.status === "APPROVED" || a.status === "COMPLETED";
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium">{typeName}</span>
          {isCompleted ? (
            <Badge variant="outline" className="text-[9px] bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20 px-1">
              Complete
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20 px-1">
              Pending
            </Badge>
          )}
        </div>
      );
    },
  },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <Button variant="ghost" size="icon-xs" asChild>
        <Link href={`/assessments/${row.original.assessmentType}`}>
          <Eye className="size-3.5" />
        </Link>
      </Button>
    ),
  },
];

// ── Main Dashboard Component ─────────────────────

export function DashboardClient({
  child,
  stats,
  attendanceChart,
  recentReports,
  absenceList,
  medicalList,
  assessmentList,
}: Props) {
  const id = child.id;
  const initials = getInitials(child.firstName, child.lastName);
  const avatarBg = getAvatarColor(`${child.firstName} ${child.lastName}`);

  // Donut data (present vs absent only)
  const donutData = [
    { name: "Present", value: attendanceChart.present },
    { name: "Absent", value: attendanceChart.absent },
  ].filter((d) => d.value > 0);
  const totalAttendanceEntries = attendanceChart.present + attendanceChart.absent;

  // Medical year filter
  const [medicalYear, setMedicalYear] = useState<string>("all");
  const medicalYears = [
    ...new Set(
      medicalList
        .map((m) => m.date?.slice(0, 4))
        .filter((year): year is string => Boolean(year))
    ),
  ].sort().reverse();
  const filteredMedical =
    medicalYear === "all"
      ? medicalList
      : medicalList.filter((m) => m.date?.startsWith(medicalYear));

  // Parent names
  const mother = child.parents.find((p) => p.type === "MOTHER");
  const father = child.parents.find((p) => p.type === "FATHER");
  const authorizedPickups = child.relatives.filter((r) => r.isAuthorized);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ═══ LEFT SIDEBAR — Profile Card ═══ */}
        <aside className="w-full shrink-0 lg:w-80">
          <Card className="sticky top-4 overflow-hidden">
            {/* Gradient top bar */}
            <div className="h-20 bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40 relative">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div
                  className={`flex size-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-sm ring-4 ring-background ${avatarBg}`}
                >
                  {child.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={child.photo} alt="" className="size-20 rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
              </div>
            </div>

            <CardContent className="pt-14 pb-4">
              {/* Name + Status */}
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold leading-tight">
                  {child.firstName} {child.lastName}
                </h2>
                {child.firstNameAr && (
                  <p className="text-sm text-muted-foreground">
                    {child.firstNameAr} {child.lastNameAr}
                  </p>
                )}
                {child.childNumber && (
                  <p className="text-xs text-muted-foreground mt-0.5">#{child.childNumber}</p>
                )}
                <div className="mt-2 flex items-center justify-center gap-2">
                  <Badge
                    className={
                      child.isActive
                        ? "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20"
                        : "bg-muted text-muted-foreground border-muted"
                    }
                  >
                    {child.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {child.className && (
                    <Badge variant="secondary" className="text-xs">
                      {child.className}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="divide-y divide-border/50">
                {child.dateOfBirth && (
                  <InfoRow label="Age" value={calculateAge(child.dateOfBirth)} />
                )}
                {child.dateOfBirth && child.enrollmentDate && (
                  <InfoRow label="Joining Age" value={calculateAgeAtDate(child.dateOfBirth, child.enrollmentDate)} />
                )}
                {child.dateOfBirth && (
                  <InfoRow label="Date of Birth" value={formatDate(child.dateOfBirth)} />
                )}
                {child.enrollmentDate && (
                  <InfoRow label="Joining Date" value={formatDate(child.enrollmentDate)} />
                )}
                {child.enrollmentDate && (
                  <InfoRow label="Joined From" value={calculateDurationSince(child.enrollmentDate)} />
                )}
                {child.gender && (
                  <InfoRow
                    label="Gender"
                    value={
                      <span className="flex items-center gap-1">
                        <span className={`inline-block size-2 rounded-full ${child.gender === "MALE" ? "bg-sky-400" : "bg-pink-400"}`} />
                        {child.gender === "MALE" ? "Boy" : "Girl"}
                      </span>
                    }
                  />
                )}
                {child.bloodType && (
                  <InfoRow
                    label="Blood Type"
                    value={
                      <Badge variant="outline" className="text-xs bg-[var(--color-error-light)] text-[var(--color-error-dark)] border-[var(--color-error)]/20">
                        <Droplets className="size-3 mr-1" />
                        {child.bloodType}
                      </Badge>
                    }
                  />
                )}
                {child.allergies && (
                  <InfoRow
                    label="Allergies"
                    value={
                      <Badge variant="destructive" className="text-xs">
                        <Heart className="size-3 mr-1" />
                        {child.allergies}
                      </Badge>
                    }
                    className="bg-red-50/50"
                  />
                )}
                {child.branchName && (
                  <InfoRow label="Branch" value={child.branchName} />
                )}
                {child.nationality && (
                  <InfoRow label="Nationality" value={child.nationality} />
                )}
                {child.language && (
                  <InfoRow label="Language" value={child.language} />
                )}
                {child.busAttendance != null && (
                  <InfoRow
                    label="Bus"
                    value={
                      String(child.busAttendance) === "true" || String(child.busAttendance) === "1"
                        ? "Yes"
                        : String(child.busAttendance) === "false" || String(child.busAttendance) === "0"
                          ? "No"
                          : String(child.busAttendance)
                    }
                  />
                )}
                {child.milkType && (
                  <InfoRow
                    label="Milk"
                    value={
                      <span>
                        {child.milkType}
                        {child.milkPortions != null && (
                          <span className="text-muted-foreground ml-1">({child.milkPortions} portions)</span>
                        )}
                        {child.milkScoop != null && (
                          <span className="text-muted-foreground ml-1">({child.milkScoop} scoop)</span>
                        )}
                      </span>
                    }
                  />
                )}
                <InfoRow label="Lunch" value={child.lunchIncluded ? "Yes" : "No"} />
                {child.diaperType && (
                  <InfoRow label="Diapers" value={child.diaperType} />
                )}
              </div>

              {/* Parents */}
              {(mother || father) && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Parents</p>
                  {mother && (
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium">{mother.name ?? "Mother"}</span>
                        {child.motherPhone && (
                          <span className="ml-1 text-muted-foreground">{child.motherPhone}</span>
                        )}
                      </div>
                      {child.motherPhone && (
                        <div className="flex gap-0.5">
                          <a
                            href={`tel:${child.motherPhone}`}
                            className="inline-flex size-6 items-center justify-center rounded text-primary hover:bg-primary/5 transition-colors"
                          >
                            <Phone className="size-3" />
                          </a>
                          <a
                            href={formatWhatsAppUrl(child.motherPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-6 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <MessageCircle className="size-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  {father && (
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium">{father.name ?? "Father"}</span>
                        {child.fatherPhone && (
                          <span className="ml-1 text-muted-foreground">{child.fatherPhone}</span>
                        )}
                      </div>
                      {child.fatherPhone && (
                        <div className="flex gap-0.5">
                          <a
                            href={`tel:${child.fatherPhone}`}
                            className="inline-flex size-6 items-center justify-center rounded text-primary hover:bg-primary/5 transition-colors"
                          >
                            <Phone className="size-3" />
                          </a>
                          <a
                            href={formatWhatsAppUrl(child.fatherPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-6 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <MessageCircle className="size-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Authorized Pickups */}
              {authorizedPickups.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Authorized Pickups</p>
                  {authorizedPickups.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs">
                      <User className="size-3 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{r.name}</span>
                        {r.relation && <span className="text-muted-foreground ml-1">({r.relation})</span>}
                        {r.phone && <span className="text-primary ml-1">{r.phone}</span>}
                      </div>
                      {r.isEmergencyContact && (
                        <Badge variant="outline" className="text-[9px] bg-[var(--color-error-light)] text-[var(--color-error-dark)] border-[var(--color-error)]/20 px-1 shrink-0">
                          SOS
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* ═══ RIGHT MAIN CONTENT ═══ */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* ─── Quick Actions Bar ─────────────────── */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href={`/children/${id}/calls`}>
                <Phone className="mr-1.5 size-3.5" />
                + New Call Report
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/children/${id}/accidents`}>
                <ShieldAlert className="mr-1.5 size-3.5" />
                + New Accident Report
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/children/${id}/attendance`}>
                <Calendar className="mr-1.5 size-3.5" />
                Child Calendar
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/messages/compose?childId=${id}`}>
                <Send className="mr-1.5 size-3.5" />
                Send Message
              </Link>
            </Button>
          </div>

          {/* ─── Row 1: Calls, Accidents, Payments ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard title="Calls In/Out" value={stats.callsInOut} icon={Phone} color="purple" href={`/children/${id}/calls`} />
            <StatCard title="Accident Reports" value={stats.accidentReports} icon={ShieldAlert} color="rose" href={`/children/${id}/accidents`} />
            <StatCard title="Total Payments" value={stats.totalPayments} icon={DollarSign} color="emerald" href={`/children/${id}/accounting`} />
          </div>

          {/* ─── Row 2: Attendance Stats ───────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard title="Attendance" value={stats.totalAttendance} icon={Calendar} color="emerald" href={`/children/${id}/report`} />
            <StatCard title="Absence" value={stats.totalAbsence} icon={UserX} color="rose" href={`/children/${id}/absence`} />
            <StatCard title="Missing Daily Rpt" value={stats.missingDailyReports} icon={FileQuestion} color="amber" href={`/children/${id}/report`} />
            <StatCard title="Missing Absent Rpt" value={stats.missingAbsentReports} icon={AlertTriangle} color="amber" href={`/children/${id}/absence`} />
          </div>

          {/* ─── Attendance Pie Chart ──────────────── */}
          <div className="rounded border border-border/40 bg-card">
            <div className="flex items-center gap-4 py-3 px-4">
              <div className="size-16 shrink-0">
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={18}
                        outerRadius={30}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map((_, idx) => (
                          <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">N/A</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-none">Attendance: {stats.attendanceRate}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {totalAttendanceEntries > 0
                    ? `${attendanceChart.present} Present / ${attendanceChart.absent} Absent`
                    : "No data"}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Row 3: Medical Stats ──────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard title="Medical Published" value={stats.medicalPublished} icon={Stethoscope} color="emerald" />
            <StatCard title="Medical Missing" value={stats.medicalMissing} icon={Stethoscope} color="rose" />
            <StatCard title="Medical Drafts" value={stats.medicalDrafts} icon={FilePenLine} color="sky" />
          </div>

          {/* ─── Row 4: Assessment Stats ───────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard title="Assessments Done" value={stats.assessmentsCompleted} icon={GraduationCap} color="emerald" />
            <StatCard title="Assessments Missing" value={stats.assessmentsMissing} icon={GraduationCap} color="rose" />
            <StatCard title="Assessments Incomplete" value={stats.assessmentsIncomplete} icon={CircleDashed} color="orange" />
            <StatCard title="Assessment Drafts" value={stats.assessmentsDrafts} icon={FilePenLine} color="sky" />
          </div>

          {/* ─── Tabbed Historical Data ───────────── */}
          <Tabs defaultValue="daily-reports">
            <TabsList variant="line" className="w-full justify-start border-b border-border/40 pb-0">
              <TabsTrigger value="daily-reports" className="gap-1.5">
                <FileText className="size-3.5" />
                Daily Reports
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{stats.totalReports}</Badge>
              </TabsTrigger>
              <TabsTrigger value="absence" className="gap-1.5">
                <AlertTriangle className="size-3.5" />
                Absence
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{absenceList.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="medical" className="gap-1.5">
                <ClipboardList className="size-3.5" />
                Medical
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{medicalList.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="assessments" className="gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Assessments
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{assessmentList.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Daily Reports Tab */}
            <TabsContent value="daily-reports">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Daily Reports</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/daily-reports/new?childId=${id}`}>
                      <FileText className="mr-1.5 size-3.5" />
                      + Daily Report
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={dailyReportColumns}
                    data={recentReports}
                    emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No daily reports yet.</p>}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Absence Reports Tab */}
            <TabsContent value="absence">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Absence Reports</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/absent-reports/new?childId=${id}`}>
                      <AlertTriangle className="mr-1.5 size-3.5" />
                      + Absence Report
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={absenceColumns}
                    data={absenceList}
                    emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No absence reports.</p>}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Medical Reports Tab */}
            <TabsContent value="medical">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Medical Reports</CardTitle>
                  {medicalYears.length > 1 && (
                    <select
                      value={medicalYear}
                      onChange={(e) => setMedicalYear(e.target.value)}
                      className="rounded-md border px-2 py-1 text-xs"
                    >
                      <option value="all">All Years</option>
                      {medicalYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  )}
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={medicalColumns}
                    data={filteredMedical}
                    emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No medical reports.</p>}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assessments">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={assessmentColumns}
                    data={assessmentList}
                    emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No assessments.</p>}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
