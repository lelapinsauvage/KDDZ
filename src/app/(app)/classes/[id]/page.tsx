import { notFound } from "next/navigation";
import Link from "next/link";
import { getClassDashboard } from "@/lib/actions/classes";
import { StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Cake,
  FileWarning,
  FileCheck,
  FileClock,
  FileEdit,
  Stethoscope,
  HeartPulse,
  ClipboardCheck,
  ClipboardList,
  FileText,
  BookOpen,
  MapPin,
  Globe,
  Users,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassDashboardPage({ params }: Props) {
  const { id } = await params;
  const result = await getClassDashboard(id);

  if (!result.success) {
    notFound();
  }

  const { classInfo, dailyReports, medical, assessments } = result.data;

  return (
    <FadeIn className="space-y-6 sm:space-y-8 p-4 md:p-6">
      {/* ── Back link + Header ── */}
      <div className="space-y-4">
        <Link
          href="/classes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Classes
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-[1.875rem] font-extrabold tracking-[-0.01em] text-foreground font-heading leading-[2.375rem]">
              {classInfo.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {classInfo.branchName}
              </span>
              {classInfo.language && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="size-3.5" />
                  {classInfo.language}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                {classInfo.studentCount} {classInfo.studentCount === 1 ? "student" : "students"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="daily-reports">
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger value="daily-reports" className="gap-1.5">
            <BookOpen className="size-4" />
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

        {/* ── Tab 1: Daily Reports ── */}
        <TabsContent value="daily-reports" className="mt-6">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Daily Reports
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatCard
              title="Birthdays"
              value={dailyReports.birthdays}
              icon={Cake}
              color="purple"
            />
            <StatCard
              title="Without Report"
              value={dailyReports.withoutReport}
              icon={FileWarning}
              color="rose"
            />
            <StatCard
              title="Completed"
              value={dailyReports.completed}
              icon={FileCheck}
              color="emerald"
            />
            <StatCard
              title="Incomplete"
              value={dailyReports.incomplete}
              icon={FileClock}
              color="amber"
            />
            <StatCard
              title="Drafts"
              value={dailyReports.drafts}
              icon={FileEdit}
              color="sky"
            />
          </div>
        </TabsContent>

        {/* ── Tab 2: Medical Reports ── */}
        <TabsContent value="medical" className="mt-6">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Medical Reports
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
            <StatCard
              title="Published"
              value={medical.published}
              icon={Stethoscope}
              color="emerald"
            />
            <StatCard
              title="Missing"
              value={medical.missing}
              icon={HeartPulse}
              color="rose"
            />
            <StatCard
              title="Drafts"
              value={medical.drafts}
              icon={FileEdit}
              color="sky"
            />
          </div>
        </TabsContent>

        {/* ── Tab 3: Assessments ── */}
        <TabsContent value="assessments" className="mt-6">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Assessments
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
            <StatCard
              title="Completed"
              value={assessments.completed}
              icon={ClipboardCheck}
              color="emerald"
            />
            <StatCard
              title="Missing"
              value={assessments.missing}
              icon={ClipboardList}
              color="rose"
            />
            <StatCard
              title="Drafts"
              value={assessments.drafts}
              icon={FileText}
              color="sky"
            />
          </div>
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
}
