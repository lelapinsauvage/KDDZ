"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Baby,
  Heart,
  Calendar,
  DollarSign,
  FileText,
  Phone,
  AlertTriangle,
  Bus,
  Utensils,
  User,
  MessageCircle,
  PhoneIncoming,
  PhoneOutgoing,
  ShieldAlert,
  UserX,
  FileQuestion,
  Eye,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { getAvatarColor, getInitials } from "@/components/children/children-columns";
import { PageHeader } from "@/components/layout/page-header";
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
  busAttendance: boolean;
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

// ── Paginated Table Component ────────────────────

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
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
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
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

// ── PIE CHART COLORS ─────────────────────────────
const CHART_COLORS = ["#14b8a6", "#f43f5e", "#94a3b8"]; // teal-500, rose-500, slate-400

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

  // Attendance pie data
  const pieData = [
    { name: "Present", value: attendanceChart.present },
    { name: "Absent", value: attendanceChart.absent },
    { name: "No Report", value: attendanceChart.noReport },
  ].filter((d) => d.value > 0);

  // Medical year filter
  const [medicalYear, setMedicalYear] = useState<string>("all");
  const medicalYears = [...new Set(medicalList.map((m) => m.date.slice(0, 4)))].sort().reverse();
  const filteredMedical =
    medicalYear === "all" ? medicalList : medicalList.filter((m) => m.date.startsWith(medicalYear));

  // ── Stat Cards Data ──────────────────────────────

  const statCardsRow1 = [
    {
      label: "Incoming Calls",
      value: String(stats.incomingCalls),
      icon: PhoneIncoming,
      bg: "bg-teal-50",
      iconColor: "text-teal-600",
      valueColor: "text-teal-700",
      href: `/children/${id}/calls`,
    },
    {
      label: "Outgoing Calls",
      value: String(stats.outgoingCalls),
      icon: PhoneOutgoing,
      bg: "bg-sky-50",
      iconColor: "text-sky-600",
      valueColor: "text-sky-700",
      href: `/children/${id}/calls`,
    },
    {
      label: "Accident Reports",
      value: String(stats.accidentReports),
      icon: ShieldAlert,
      bg: "bg-rose-50",
      iconColor: "text-rose-500",
      valueColor: "text-rose-600",
      href: `/children/${id}/accidents`,
    },
    {
      label: "Total Payments",
      value: stats.totalPayments,
      icon: DollarSign,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
      href: `/children/${id}/accounting`,
    },
  ];

  const statCardsRow2 = [
    {
      label: "Total Attendance",
      value: String(stats.totalAttendance),
      icon: Calendar,
      bg: "bg-teal-50",
      iconColor: "text-teal-600",
      valueColor: "text-teal-700",
      href: `/children/${id}/attendance`,
    },
    {
      label: "Total Absence",
      value: String(stats.totalAbsence),
      icon: UserX,
      bg: "bg-pink-50",
      iconColor: "text-pink-500",
      valueColor: "text-pink-600",
      href: `/children/${id}/absence`,
    },
    {
      label: "Missing Reports",
      value: String(stats.missingDailyReports),
      icon: FileQuestion,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
      href: `/children/${id}/report`,
    },
    {
      label: "Missing Absent Rpt",
      value: String(stats.missingAbsentReports),
      icon: AlertTriangle,
      bg: "bg-gray-100",
      iconColor: "text-gray-500",
      valueColor: "text-gray-700",
      href: `/children/${id}/absence`,
    },
  ];

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName}`}
        breadcrumbs={[
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}` },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        {/* ─── A) Child Info Summary Card ─────────────── */}
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-teal-400 via-sky-400 to-violet-400" />
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar + status */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex size-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg ring-4 ring-white ${avatarBg}`}
                >
                  {child.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={child.photo} alt="" className="size-20 rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <Badge
                  className={
                    child.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }
                >
                  {child.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Name + number */}
                <div>
                  <h2 className="text-xl font-bold">
                    {child.firstName} {child.lastName}
                    {child.firstNameAr && (
                      <span className="ml-2 text-base font-normal text-muted-foreground">
                        ({child.firstNameAr} {child.lastNameAr})
                      </span>
                    )}
                  </h2>
                  {child.childNumber && (
                    <span className="text-xs text-muted-foreground">#{child.childNumber}</span>
                  )}
                </div>

                {/* Key details row */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {child.gender && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <span
                        className={`inline-block size-2 rounded-full ${child.gender === "MALE" ? "bg-sky-400" : "bg-pink-400"}`}
                      />
                      {child.gender === "MALE" ? "Boy" : "Girl"}
                    </Badge>
                  )}
                  {child.language && (
                    <Badge variant="outline" className="text-xs">
                      {child.language}
                    </Badge>
                  )}
                  {child.nationality && (
                    <Badge variant="outline" className="text-xs">
                      {child.nationality}
                    </Badge>
                  )}
                  {child.branchName && (
                    <Badge variant="secondary" className="text-xs">
                      {child.branchName}
                    </Badge>
                  )}
                  {child.className && (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 font-medium text-xs"
                    >
                      {child.className}
                    </Badge>
                  )}
                  {child.bloodType && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                      {child.bloodType}
                    </Badge>
                  )}
                </div>

                {/* Dates + ages */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  {child.enrollmentDate && (
                    <span>
                      <span className="font-medium text-foreground">Joining:</span>{" "}
                      {formatDate(child.enrollmentDate)}
                    </span>
                  )}
                  {child.dateOfBirth && (
                    <>
                      <span>
                        <span className="font-medium text-foreground">Current Age:</span>{" "}
                        {calculateAge(child.dateOfBirth)}
                      </span>
                      {child.enrollmentDate && (
                        <span>
                          <span className="font-medium text-foreground">Joining Age:</span>{" "}
                          {calculateAgeAtDate(child.dateOfBirth, child.enrollmentDate)}
                        </span>
                      )}
                    </>
                  )}
                  {child.dateOfBirth && (
                    <span>
                      <span className="font-medium text-foreground">DOB:</span>{" "}
                      {formatDate(child.dateOfBirth)}
                    </span>
                  )}
                </div>

                {/* Contact phones */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  {child.motherPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      <span className="font-medium text-foreground">Mother:</span>
                      <span className="text-primary">{child.motherPhone}</span>
                      <a
                        href={`tel:${child.motherPhone}`}
                        className="inline-flex size-5 items-center justify-center rounded text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Phone className="size-2.5" />
                      </a>
                      <a
                        href={formatWhatsAppUrl(child.motherPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-5 items-center justify-center rounded text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <MessageCircle className="size-2.5" />
                      </a>
                    </span>
                  )}
                  {child.fatherPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      <span className="font-medium text-foreground">Father:</span>
                      <span className="text-primary">{child.fatherPhone}</span>
                      <a
                        href={`tel:${child.fatherPhone}`}
                        className="inline-flex size-5 items-center justify-center rounded text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Phone className="size-2.5" />
                      </a>
                      <a
                        href={formatWhatsAppUrl(child.fatherPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-5 items-center justify-center rounded text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <MessageCircle className="size-2.5" />
                      </a>
                    </span>
                  )}
                </div>

                {/* Care details */}
                <div className="flex flex-wrap gap-1.5">
                  {child.milkType && (
                    <Badge variant="outline" className="gap-1 text-xs bg-blue-50 text-blue-600 border-blue-200">
                      <Baby className="size-3" /> {child.milkType}
                      {child.milkPortions ? ` (${child.milkPortions} portions)` : ""}
                    </Badge>
                  )}
                  {child.diaperType && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                      Diapers: {child.diaperType}
                    </Badge>
                  )}
                  {child.busAttendance && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-xs bg-orange-50 text-orange-600 border-orange-200"
                    >
                      <Bus className="size-3" /> Bus
                    </Badge>
                  )}
                  {child.lunchIncluded && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-xs bg-lime-50 text-lime-600 border-lime-200"
                    >
                      <Utensils className="size-3" /> Lunch
                    </Badge>
                  )}
                  {child.allergies && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <Heart className="size-3" /> Allergies: {child.allergies}
                    </Badge>
                  )}
                </div>

                {/* Authorized persons */}
                {child.relatives.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">Authorized Persons</p>
                    <div className="flex flex-wrap gap-2">
                      {child.relatives.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                        >
                          <User className="size-3 text-muted-foreground" />
                          <span className="font-medium">{r.name}</span>
                          {r.relation && (
                            <span className="text-muted-foreground">({r.relation})</span>
                          )}
                          {r.phone && <span className="text-primary">{r.phone}</span>}
                          {r.isEmergencyContact && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-red-50 text-red-600 border-red-200 px-1"
                            >
                              Emergency
                            </Badge>
                          )}
                          {r.isAuthorized && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200 px-1"
                            >
                              Authorized
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── B) Quick Action Buttons ─────────────── */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link href={`/children/${id}/calls`}>
              <Phone className="mr-1.5 size-3.5" />
              New Call Report
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/children/${id}/accidents`}>
              <ShieldAlert className="mr-1.5 size-3.5" />
              New Accident Report
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/children/${id}/attendance`}>
              <Calendar className="mr-1.5 size-3.5" />
              Child Calendar
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/daily-reports/new?childId=${id}`}>
              <FileText className="mr-1.5 size-3.5" />
              + Daily Report
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/absent-reports/new?childId=${id}`}>
              <AlertTriangle className="mr-1.5 size-3.5" />
              + Absence
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/children/${id}/edit`}>
              <Send className="mr-1.5 size-3.5" />
              Edit Profile
            </Link>
          </Button>
        </div>

        {/* ─── C) Stat Cards (2 rows) ─────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCardsRow1.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <stat.icon className={`size-4.5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-lg font-bold leading-none ${stat.valueColor}`}>
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCardsRow2.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <stat.icon className={`size-4.5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-lg font-bold leading-none ${stat.valueColor}`}>
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ─── D) Attendance Pie Chart + E) Reports Table ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* D) Attendance Statistics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Attendance Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No attendance data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={30}
                      iconSize={10}
                      formatter={(value) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
                <span>
                  <span className="inline-block size-2 rounded-full bg-teal-500 mr-1" />
                  Present: {attendanceChart.present}
                </span>
                <span>
                  <span className="inline-block size-2 rounded-full bg-rose-500 mr-1" />
                  Absent: {attendanceChart.absent}
                </span>
                <span>
                  <span className="inline-block size-2 rounded-full bg-slate-400 mr-1" />
                  No Report: {attendanceChart.noReport}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* E) Reports Summary */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Daily Reports</CardTitle>
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
        </div>

        {/* ─── F) Absence Reports ─────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Absence Reports</CardTitle>
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
                      <Link href={`/absent-reports`}>
                        <Eye className="size-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              )}
            />
          </CardContent>
        </Card>

        {/* ─── G) Medical Reports + H) Assessments ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* G) Medical Reports */}
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
                    <td className="px-3 py-2 text-xs font-medium">{m.formType}</td>
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

          {/* H) Assessments */}
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
                renderRow={(a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-3 py-2 text-xs font-medium">
                      {ASSESSMENT_TYPE_NAMES[a.assessmentType] ?? `Type ${a.assessmentType}`}
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
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
