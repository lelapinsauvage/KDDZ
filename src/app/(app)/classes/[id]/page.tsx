import { notFound } from "next/navigation";
import Link from "next/link";
import { getClassDashboard } from "@/lib/actions/classes";
import { StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Cake,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FileClock,
  FileEdit,
  FileText,
  FileWarning,
  HeartPulse,
  MapPin,
  PhoneCall,
  Plus,
  Stethoscope,
  Syringe,
  Users,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

function statusBadge(status: string) {
  if (status.includes("Completed") || status === "Present") {
    return <Badge variant="success">{status}</Badge>;
  }
  if (status.includes("Draft") || status.includes("Pending") || status.includes("Incomplete")) {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (status.includes("No ") || status.includes("Missing") || status.includes("Rejected")) {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center justify-center rounded-sm border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
    >
      {label}
    </Link>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-6 text-center text-sm text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

export default async function ClassDashboardPage({ params }: Props) {
  const { id } = await params;
  const result = await getClassDashboard(id);

  if (!result.success) {
    notFound();
  }

  const { classInfo, dailyReports, medical, assessments } = result.data;

  return (
    <FadeIn className="space-y-6 p-4 md:p-6">
      <div className="space-y-4">
        <Link
          href="/classes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Classes
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-heading text-[1.875rem] font-extrabold leading-[2.375rem] tracking-normal text-foreground">
              {classInfo.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {classInfo.branchName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                {classInfo.studentCount} / {classInfo.maxStudents || "-"} children
              </span>
              <span>Males {classInfo.maleCount}</span>
              <span>Females {classInfo.femaleCount}</span>
              {classInfo.language && <span>{classInfo.language}</span>}
            </div>
          </div>
          <Link
            href={`/messages/compose/class?classId=${classInfo.id}`}
            className="inline-flex h-9 items-center justify-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Message Portal
          </Link>
        </div>
      </div>

      <Tabs defaultValue="daily-reports">
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger value="daily-reports" className="gap-1.5">
            <CalendarDays className="size-4" />
            Daily Reports
          </TabsTrigger>
          <TabsTrigger value="medical" className="gap-1.5">
            <Stethoscope className="size-4" />
            Medical Reports
          </TabsTrigger>
          <TabsTrigger value="assessments" className="gap-1.5">
            <ClipboardCheck className="size-4" />
            Assessments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-reports" className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatCard title="Birthdays" value={dailyReports.birthdays} icon={Cake} color="purple" />
            <StatCard
              title="Without Report"
              value={dailyReports.withoutReport}
              icon={FileWarning}
              color="rose"
            />
            <StatCard title="Completed" value={dailyReports.completed} icon={FileCheck} color="emerald" />
            <StatCard title="Incomplete" value={dailyReports.incomplete} icon={FileClock} color="amber" />
            <StatCard title="Drafts" value={dailyReports.drafts} icon={FileEdit} color="sky" />
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Reports Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child #</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Report</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyReports.rows.length === 0 ? (
                    <EmptyRow colSpan={6} label="No children in this class." />
                  ) : (
                    dailyReports.rows.map((row) => (
                      <TableRow key={row.childId}>
                        <TableCell>{row.childNumber ?? "-"}</TableCell>
                        <TableCell>{row.firstName}</TableCell>
                        <TableCell>{row.lastName}</TableCell>
                        <TableCell>{statusBadge(row.attendanceStatus)}</TableCell>
                        <TableCell>{statusBadge(row.reportStatus)}</TableCell>
                        <TableCell>
                          <ActionLink
                            href={row.actionHref}
                            label={row.reportId ? "Open Report" : "Create Report"}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Absent Reports</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child #</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Cause</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Report</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyReports.absentRows.length === 0 ? (
                    <EmptyRow colSpan={8} label="No absent reports for today." />
                  ) : (
                    dailyReports.absentRows.map((row) => (
                      <TableRow key={row.reportId}>
                        <TableCell>{row.childNumber ?? "-"}</TableCell>
                        <TableCell>{row.firstName}</TableCell>
                        <TableCell>{row.lastName}</TableCell>
                        <TableCell>{row.reason ?? "-"}</TableCell>
                        <TableCell>{row.from ?? "-"}</TableCell>
                        <TableCell>{row.to ?? "-"}</TableCell>
                        <TableCell>{statusBadge(row.reportStatus)}</TableCell>
                        <TableCell>
                          <ActionLink href={row.actionHref} label="Open Report" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
            <StatCard title="Published" value={medical.published} icon={Stethoscope} color="emerald" />
            <StatCard title="Missing" value={medical.missing} icon={HeartPulse} color="rose" />
            <StatCard title="Drafts" value={medical.drafts} icon={FileEdit} color="sky" />
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Medical And Calls Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Missing</TableHead>
                    <TableHead>Drafts</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medical.categories.map((category) => (
                    <TableRow key={category.key}>
                      <TableCell className="font-medium">{category.label}</TableCell>
                      <TableCell>{statusBadge(String(category.completed))}</TableCell>
                      <TableCell>{category.missing === null ? "-" : statusBadge(String(category.missing))}</TableCell>
                      <TableCell>{statusBadge(String(category.drafts))}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <ActionLink href={category.href} label="View More" />
                          {category.createHref && (
                            <Link
                              href={category.createHref}
                              className="inline-flex h-8 items-center justify-center gap-1 rounded-sm bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                              <Plus className="size-3.5" />
                              New
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard title="Accidents Today" value={medical.categories.find((c) => c.key === "accidents")?.completed ?? 0} icon={FileWarning} color="rose" href="/medical/accidents" />
            <StatCard title="Calls Today" value={medical.categories.find((c) => c.key === "calls")?.completed ?? 0} icon={PhoneCall} color="purple" href="/calls" />
            <StatCard title="Vaccination Reports" value={medical.categories.find((c) => c.key === "vaccinations")?.completed ?? 0} icon={Syringe} color="green" href="/medical/vaccinations" />
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard title="Completed" value={assessments.completed} icon={ClipboardCheck} color="emerald" />
            <StatCard title="Missing" value={assessments.missing} icon={ClipboardList} color="rose" />
            <StatCard title="Incomplete" value={assessments.incomplete} icon={FileClock} color="amber" />
            <StatCard title="Drafts" value={assessments.drafts} icon={FileText} color="sky" />
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Age Band</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Missing</TableHead>
                    <TableHead>Incomplete</TableHead>
                    <TableHead>Drafts</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.categories.map((category) => (
                    <TableRow key={category.type}>
                      <TableCell className="font-medium">{category.label}</TableCell>
                      <TableCell>{statusBadge(String(category.completed))}</TableCell>
                      <TableCell>{statusBadge(String(category.missing))}</TableCell>
                      <TableCell>{statusBadge(String(category.incomplete))}</TableCell>
                      <TableCell>{statusBadge(String(category.drafts))}</TableCell>
                      <TableCell>
                        <ActionLink href={category.href} label="View More" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {assessments.categories.map((category) => (
            <Card key={category.type}>
              <CardHeader className="border-b">
                <CardTitle className="text-base">{category.label} Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Child #</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Current Age</TableHead>
                      <TableHead>Joining Age</TableHead>
                      <TableHead>Report</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.rows.length === 0 ? (
                      <EmptyRow colSpan={7} label="No eligible children for this assessment band." />
                    ) : (
                      category.rows.map((row) => (
                        <TableRow key={`${category.type}-${row.childId}-${row.assessmentId ?? "missing"}`}>
                          <TableCell>{row.childNumber ?? "-"}</TableCell>
                          <TableCell>{row.firstName}</TableCell>
                          <TableCell>{row.lastName}</TableCell>
                          <TableCell>{row.currentAge}</TableCell>
                          <TableCell>{row.joiningAge}</TableCell>
                          <TableCell>{statusBadge(row.reportStatus)}</TableCell>
                          <TableCell>
                            <ActionLink
                              href={row.actionHref}
                              label={row.assessmentId ? "Open Assessment" : "Create Assessment"}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
}
