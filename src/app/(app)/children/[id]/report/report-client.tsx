"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Download, Baby, Utensils, Moon, Thermometer, Droplets, SmilePlus } from "lucide-react";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
}

interface ReportData {
  date: string;
  status: string;
  createdBy: string | null;
  breakfast: { food: string | null; portion: string | null; time: string | null };
  lunch: { food: string | null; portion: string | null; time: string | null };
  dessert: { food: string | null; portion: string | null; time: string | null };
  sleep: { from: string | null; to: string | null; duration: string };
  health: {
    mood: string | null;
    cough: boolean;
    runnyNose: boolean;
    vomit: boolean;
    diarrhea: boolean;
    urinePotty: number;
    stoolPotty: number;
    urineDiaper: number;
    stoolDiaper: number;
  };
  fevers: Array<{ temperature: string; time: string }>;
  milks: Array<{ amountCc: string; time: string }>;
  remarks: string | null;
}

interface Props {
  child: ChildData;
  report: ReportData | null;
}

const portionColors: Record<string, string> = {
  NONE: "bg-red-100 text-red-700",
  LITTLE: "bg-orange-100 text-orange-700",
  HALF: "bg-yellow-100 text-yellow-700",
  MOST: "bg-blue-100 text-blue-700",
  ALL: "bg-green-100 text-green-700",
};

const moodEmojis: Record<string, string> = {
  HAPPY: "\u{1F60A}",
  CALM: "\u{1F60C}",
  FUSSY: "\u{1F624}",
  CRYING: "\u{1F622}",
  SLEEPY: "\u{1F634}",
};

export function ReportClient({ child, report }: Props) {
  const id = child.id;

  if (!report) {
    return (
      <>
        <PageHeader
          title={`${child.firstName} ${child.lastName} — Daily Report`}
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Children", href: "/children" },
            { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
            { label: "Report" },
          ]}
        />
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">No daily reports found for this child.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Daily Report`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
          { label: "Report" },
        ]}
      />

      <div className="space-y-6 p-6">
        {/* Report Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{report.date}</span>
            <Badge className="bg-green-100 text-green-700">{report.status}</Badge>
            {report.createdBy && (
              <span className="text-sm text-muted-foreground">by {report.createdBy}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Meals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Utensils className="h-4 w-4" />
                Meals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Breakfast", data: report.breakfast },
                { label: "Lunch", data: report.lunch },
                { label: "Dessert", data: report.dessert },
              ].map((meal) => (
                <div key={meal.label} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{meal.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {meal.data.food ?? "N/A"} {meal.data.time ? `\u00B7 ${meal.data.time}` : ""}
                    </p>
                  </div>
                  {meal.data.portion && (
                    <Badge className={portionColors[meal.data.portion] ?? "bg-gray-100 text-gray-700"}>
                      {meal.data.portion}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sleep */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Moon className="h-4 w-4" />
                Sleep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border p-4 text-center">
                <p className="text-3xl font-bold text-[#1caf9a]">{report.sleep.duration}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.sleep.from ?? "\u2014"} \u2014 {report.sleep.to ?? "\u2014"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Health & Hygiene */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Droplets className="h-4 w-4" />
                Health & Hygiene
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Urine (Potty)</p>
                  <p className="text-xl font-bold">{report.health.urinePotty}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Stool (Potty)</p>
                  <p className="text-xl font-bold">{report.health.stoolPotty}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Urine (Diaper)</p>
                  <p className="text-xl font-bold">{report.health.urineDiaper}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Stool (Diaper)</p>
                  <p className="text-xl font-bold">{report.health.stoolDiaper}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.health.cough && <Badge variant="destructive">Cough</Badge>}
                {report.health.runnyNose && <Badge variant="destructive">Runny Nose</Badge>}
                {report.health.vomit && <Badge variant="destructive">Vomit</Badge>}
                {report.health.diarrhea && <Badge variant="destructive">Diarrhea</Badge>}
                {!report.health.cough && !report.health.runnyNose && !report.health.vomit && !report.health.diarrhea && (
                  <Badge className="bg-green-100 text-green-700">No Symptoms</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mood & Extras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <SmilePlus className="h-4 w-4" />
                Mood & Extras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mood */}
              <div className="rounded-md border p-4 text-center">
                <p className="text-4xl">{report.health.mood ? (moodEmojis[report.health.mood] ?? "") : "\u2014"}</p>
                <p className="mt-1 text-sm font-medium">{report.health.mood ?? "N/A"}</p>
              </div>

              {/* Fever Log */}
              {report.fevers.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <Thermometer className="h-4 w-4 text-red-500" /> Fever Log
                  </p>
                  {report.fevers.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{f.time}</span>
                      <Badge variant="destructive">{f.temperature}\u00B0C</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Milk Log */}
              {report.milks.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <Baby className="h-4 w-4 text-blue-500" /> Milk Log
                  </p>
                  {report.milks.map((m, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{m.time}</span>
                      <Badge variant="outline">{m.amountCc} cc</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Remarks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{report.remarks ?? "No remarks."}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
