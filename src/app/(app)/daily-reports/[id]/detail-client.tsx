"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Pencil,
  Printer,
  UtensilsCrossed,
  Moon,
  Heart,
  Smile,
  Baby,
  Thermometer,
  Paperclip,
  FileText,
} from "lucide-react";

interface FeverEntry {
  temperature: number;
  time: string;
}

interface MilkEntry {
  milkType: string | null;
  amountCc: number;
  scoops: number | null;
  time: string;
}

interface Attachment {
  id: string;
  filename: string;
  fileUrl: string;
}

interface ReportData {
  id: string;
  date: string;
  status: string;
  childName: string;
  className: string | null;
  branchName: string | null;
  breakfastFood: string | null;
  breakfastPortion: string | null;
  lunchFood: string | null;
  lunchPortion: string | null;
  dessert: string | null;
  dessertPortion: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  isSleep: boolean;
  sleepFrom: string | null;
  sleepTo: string | null;
  sleepQuality: string | null;
  activities: string | null;
  medicine: string | null;
  mood: string | null;
  diarrhea: boolean;
  cough: boolean;
  runnyNose: boolean;
  vomit: boolean;
  urinePotty: number;
  stoolPotty: number;
  urineDiaper: number;
  stoolDiaper: number;
  remarks: string | null;
  fevers: FeverEntry[];
  milks: MilkEntry[];
  attachments: Attachment[];
}

function formatPortion(portion: string | null): string {
  if (!portion) return "N/A";
  const map: Record<string, string> = {
    ALL: "All",
    MOST: "Most",
    HALF: "Half",
    LITTLE: "A Little",
    NONE: "None",
  };
  return map[portion] ?? portion;
}

function formatTime(iso: string): string {
  try {
    return format(new Date(iso), "h:mm a");
  } catch {
    return iso;
  }
}

function formatMood(mood: string): string {
  const map: Record<string, string> = {
    HAPPY: "Happy",
    CALM: "Calm",
    FUSSY: "Fussy",
    SLEEPY: "Sleepy",
    CRYING: "Crying",
  };
  return map[mood] ?? mood;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-primary/10 text-primary",
  APPROVED: "bg-green-100 text-green-800",
};

export function DailyReportDetailClient({ report }: { report: ReportData }) {
  const healthSymptoms = [
    report.diarrhea && "Diarrhea",
    report.cough && "Cough",
    report.runnyNose && "Runny Nose",
    report.vomit && "Vomit",
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="Daily Report"
        breadcrumbs={[
          { label: "Daily Reports", href: "/daily-reports" },
          { label: report.childName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/daily-reports/${report.id}/edit`}>
                <Pencil className="mr-1.5 size-3.5" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/daily-reports/${report.id}/print`}>
                <Printer className="mr-1.5 size-3.5" />
                Print
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Header info */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusColors[report.status] ?? "bg-muted text-muted-foreground"}>
            {report.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {format(new Date(report.date), "EEEE, MMMM d, yyyy")}
          </span>
          {report.className && (
            <span className="text-sm text-muted-foreground">
              &middot; {report.className}
            </span>
          )}
          {report.branchName && (
            <span className="text-sm text-muted-foreground">
              &middot; {report.branchName}
            </span>
          )}
          {(report.checkInTime || report.checkOutTime) && (
            <span className="text-sm text-muted-foreground">
              &middot;{" "}
              {report.checkInTime && <>In: {formatTime(report.checkInTime)}</>}
              {report.checkInTime && report.checkOutTime && " / "}
              {report.checkOutTime && <>Out: {formatTime(report.checkOutTime)}</>}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Meals */}
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UtensilsCrossed className="size-4 text-primary" />
                Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Breakfast</span>
                  <span className="text-muted-foreground">
                    {report.breakfastFood ?? "—"} &middot; {formatPortion(report.breakfastPortion)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Lunch</span>
                  <span className="text-muted-foreground">
                    {report.lunchFood ?? "—"} &middot; {formatPortion(report.lunchPortion)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Dessert</span>
                  <span className="text-muted-foreground">
                    {report.dessert ?? "—"} &middot; {formatPortion(report.dessertPortion)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sleep */}
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Moon className="size-4 text-primary" />
                Sleep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {report.isSleep ? (
                  <>
                    Slept
                    {report.sleepFrom && report.sleepTo && (
                      <> from {formatTime(report.sleepFrom)} to {formatTime(report.sleepTo)}</>
                    )}
                    {report.sleepQuality && (
                      <> &middot; Quality: {report.sleepQuality}</>
                    )}
                  </>
                ) : (
                  "No nap today"
                )}
              </p>
            </CardContent>
          </Card>

          {/* Health */}
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="size-4 text-primary" />
                Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {healthSymptoms.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {healthSymptoms.map((s) => (
                      <Badge key={s as string} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No symptoms</p>
                )}
                {report.fevers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="flex items-center gap-1 text-xs font-medium uppercase text-muted-foreground">
                      <Thermometer className="size-3" />
                      Fever readings
                    </span>
                    {report.fevers.map((f, i) => (
                      <p key={i} className="text-muted-foreground">
                        {f.temperature}&deg;C at {formatTime(f.time)}
                      </p>
                    ))}
                  </div>
                )}
                {report.medicine && (
                  <div className="mt-2">
                    <span className="text-xs font-medium uppercase text-muted-foreground">Medicine</span>
                    <p className="text-muted-foreground">{report.medicine}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mood */}
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Smile className="size-4 text-primary" />
                Mood
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {report.mood ? formatMood(report.mood) : "Not recorded"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Milk feedings */}
        {report.milks.length > 0 && (
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Baby className="size-4 text-primary" />
                Milk Feedings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                {report.milks.map((m, i) => (
                  <div key={i} className="flex gap-4 text-muted-foreground">
                    <span>{formatTime(m.time)}</span>
                    {m.milkType && <span>{m.milkType}</span>}
                    <span>{m.amountCc} cc</span>
                    {m.scoops != null && m.scoops > 0 && <span>{m.scoops} scoops</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Potty / Diaper */}
        {(report.urinePotty > 0 ||
          report.stoolPotty > 0 ||
          report.urineDiaper > 0 ||
          report.stoolDiaper > 0) && (
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Potty / Diaper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {report.urinePotty > 0 && <div>Urine (potty): {report.urinePotty}x</div>}
                {report.stoolPotty > 0 && <div>Stool (potty): {report.stoolPotty}x</div>}
                {report.urineDiaper > 0 && <div>Urine (diaper): {report.urineDiaper}x</div>}
                {report.stoolDiaper > 0 && <div>Stool (diaper): {report.stoolDiaper}x</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activities */}
        {report.activities && (
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {report.activities}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Remarks */}
        {report.remarks && (
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Teacher Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {report.remarks}
              </p>
            </CardContent>
          </Card>
        )}

        {report.attachments.length > 0 && (
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="size-4 text-primary" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {report.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                    >
                      <FileText className="size-3.5" />
                      {attachment.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
