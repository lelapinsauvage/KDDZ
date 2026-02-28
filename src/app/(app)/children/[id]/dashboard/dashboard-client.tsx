"use client";

import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Droplets,
  ClipboardList,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getAvatarColor, getInitials } from "@/components/children/children-columns";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";

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

function formatDate(dateStr: string): string {
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
  busAttendance: string | null;
  lunchIncluded: boolean;
  diaperType: string | null;
  milkType: string | null;
  milkPortions: number | null;
  parents: ParentInfo[];
  motherPhone: string | null;
  fatherPhone: string | null;
  relatives: RelativeInfo[];
}

interface ReportRow {
  id: string;
  date: string;
  breakfastPortion: string | null;
  lunchPortion: string | null;
  dessertPortion: string | null;
  status: string;
  mood: string | null;
}

interface AbsenceRow {
  id: string;
  date: string;
  reason: string | null;
  status: string;
}

interface MedicalRow {
  id: string;
  formType: string;
  status: string;
  date: string;
}

interface AssessmentRow {
  id: string;
  assessmentType: number;
  status: string;
  date: string;
}

interface Stats {
  incomingCalls: number;
  outgoingCalls: number;
  accidentReports: number;
  totalPayments: string;
  totalAttendance: number;
  totalAbsence: number;
  missingDailyReports: number;
  missingAbsentReports: number;
  outstandingBalance: string;
  attendanceRate: string;
  totalReports: number;
  medicalRecords: number;
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

// ── Paginated Table ──────────────────────────────

function PaginatedTable<T>({
  data,
  pageSize = 5,
  columns,
  renderRow,
  emptyMessage,
}: {
  data: T[];
  pageSize?: number;
  columns: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyMessage: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageData = data.slice(page * pageSize, (page + 1) * pageSize);

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{pageData.map((item, i) => renderRow(item, i))}</tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status Badge ─────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
    REVIEWED: "bg-sky-50 text-sky-700 border-sky-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border-red-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

// ── Donut chart colors ───────────────────────────
const DONUT_COLORS = ["#22c55e", "#ef4444"]; // green = present, red = absent

// ── Profile Info Row ─────────────────────────────

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start justify-between gap-2 py-1.5 ${className ?? ""}`}>
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{value}</span>
    </div>
  );
}

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
  const medicalYears = [...new Set(medicalList.map((m) => m.date.slice(0, 4)))].sort().reverse();
  const filteredMedical =
    medicalYear === "all" ? medicalList : medicalList.filter((m) => m.date.startsWith(medicalYear));

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
                  className={`flex size-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg ring-4 ring-background ${avatarBg}`}
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
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-gray-100 text-gray-600 border-gray-200"
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
                  <InfoRow label="Enrollment" value={formatDate(child.enrollmentDate)} />
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
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
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
                            className="inline-flex size-6 items-center justify-center rounded text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Phone className="size-3" />
                          </a>
                          <a
                            href={formatWhatsAppUrl(child.motherPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-6 items-center justify-center rounded text-green-600 hover:bg-green-50 transition-colors"
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
                            className="inline-flex size-6 items-center justify-center rounded text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Phone className="size-3" />
                          </a>
                          <a
                            href={formatWhatsAppUrl(child.fatherPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-6 items-center justify-center rounded text-green-600 hover:bg-green-50 transition-colors"
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
                        <Badge variant="outline" className="text-[9px] bg-red-50 text-red-600 border-red-200 px-1 shrink-0">
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

          {/* ─── Health & Attendance KPIs ──────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {/* Total Payments */}
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <DollarSign className="size-4.5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-emerald-700">{stats.totalPayments}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Total Payments</p>
                </div>
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <Calendar className="size-4.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-blue-700">{stats.totalAttendance}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Attendance</p>
                </div>
              </CardContent>
            </Card>

            {/* Absence */}
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                  <UserX className="size-4.5 text-pink-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-pink-700">{stats.totalAbsence}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Absence</p>
                </div>
              </CardContent>
            </Card>

            {/* Missing Daily Reports */}
            <Card className={`overflow-hidden ${stats.missingDailyReports > 0 ? "ring-1 ring-amber-300" : ""}`}>
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <FileQuestion className="size-4.5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-amber-700">{stats.missingDailyReports}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Missing Reports</p>
                </div>
              </CardContent>
            </Card>

            {/* Missing Absent Reports */}
            <Card className={`overflow-hidden ${stats.missingAbsentReports > 0 ? "ring-1 ring-red-300" : ""}`}>
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <AlertTriangle className="size-4.5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-red-600">{stats.missingAbsentReports}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Missing Absent Rpt</p>
                </div>
              </CardContent>
            </Card>

            {/* Donut Chart */}
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-2 py-2 px-3">
                <div className="size-14 shrink-0">
                  {donutData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={16}
                          outerRadius={26}
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
                  <p className="text-sm font-bold leading-none">{stats.attendanceRate}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {totalAttendanceEntries > 0
                      ? `${attendanceChart.present}P / ${attendanceChart.absent}A`
                      : "No data"}
                  </p>
                </div>
              </CardContent>
            </Card>
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
                <CardContent className="px-0">
                  <PaginatedTable
                    data={recentReports}
                    pageSize={5}
                    columns={["Date", "Breakfast", "Lunch", "Dessert", "Status", ""]}
                    emptyMessage="No daily reports yet."
                    renderRow={(r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <td className="px-3 py-2 text-xs">{formatDate(r.date)}</td>
                        <td className="px-3 py-2 text-xs">{r.breakfastPortion ?? "—"}</td>
                        <td className="px-3 py-2 text-xs">{r.lunchPortion ?? "—"}</td>
                        <td className="px-3 py-2 text-xs">{r.dessertPortion ?? "—"}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-3 py-2">
                          <Button variant="ghost" size="icon-xs" asChild>
                            <Link href={`/daily-reports/${r.id}`}>
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    )}
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
                <CardContent className="px-0">
                  <PaginatedTable
                    data={absenceList}
                    pageSize={5}
                    columns={["Date", "Reason", "Status", ""]}
                    emptyMessage="No absence reports."
                    renderRow={(a, i) => (
                      <tr key={a.id} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <td className="px-3 py-2 text-xs">{formatDate(a.date)}</td>
                        <td className="px-3 py-2 text-xs max-w-xs truncate">{a.reason ?? "—"}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-3 py-2">
                          <Button variant="ghost" size="icon-xs" asChild>
                            <Link href={`/absent-reports/${a.id}`}>
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    )}
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
                <CardContent className="px-0">
                  <PaginatedTable
                    data={filteredMedical}
                    pageSize={5}
                    columns={["Type", "Status", "Date", ""]}
                    emptyMessage="No medical reports."
                    renderRow={(m, i) => (
                      <tr key={m.id} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <td className="px-3 py-2 text-xs font-medium flex items-center gap-1.5">
                          {m.formType}
                          {m.status === "SUBMITTED" || m.status === "APPROVED" ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                          ) : m.status === "DRAFT" || m.status === "PENDING" ? (
                            <Clock className="size-3.5 text-amber-500" />
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-3 py-2 text-xs">{formatDate(m.date)}</td>
                        <td className="px-3 py-2">
                          <Button variant="ghost" size="icon-xs" asChild>
                            <Link href={`/medical/${m.formType.toLowerCase()}`}>
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    )}
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
                <CardContent className="px-0">
                  <PaginatedTable
                    data={assessmentList}
                    pageSize={5}
                    columns={["Type", "Status", "Date", ""]}
                    emptyMessage="No assessments."
                    renderRow={(a, i) => {
                      const typeName = ASSESSMENT_TYPE_NAMES[a.assessmentType] ?? `Type ${a.assessmentType}`;
                      const isCompleted = a.status === "SUBMITTED" || a.status === "APPROVED" || a.status === "COMPLETED";
                      return (
                        <tr key={a.id} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                          <td className="px-3 py-2 text-xs font-medium">
                            <div className="flex items-center gap-1.5">
                              {typeName}
                              {isCompleted ? (
                                <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 px-1">
                                  Complete
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 px-1">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="px-3 py-2 text-xs">{formatDate(a.date)}</td>
                          <td className="px-3 py-2">
                            <Button variant="ghost" size="icon-xs" asChild>
                              <Link href={`/assessments/${a.assessmentType}`}>
                                <Eye className="size-3.5" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    }}
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
