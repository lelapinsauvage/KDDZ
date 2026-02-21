"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Download, Baby, Utensils, Moon, Thermometer, Droplets, SmilePlus } from "lucide-react";
import { demoChildren } from "@/lib/demo-data";

interface Props {
  params: Promise<{ id: string }>;
}

const demoReport = {
  date: "2025-02-21",
  status: "SUBMITTED",
  createdBy: "Sara Khalil",
  breakfast: { food: "Labne & Bread", portion: "ALL", time: "08:30" },
  lunch: { food: "Rice & Chicken", portion: "MOST", time: "12:00" },
  dessert: { food: "Fruit Salad", portion: "HALF", time: "12:45" },
  sleep: { from: "13:00", to: "14:30", duration: "1.5 hrs" },
  health: {
    mood: "HAPPY",
    cough: false,
    runnyNose: false,
    vomit: false,
    diarrhea: false,
    urinePotty: 2,
    stoolPotty: 1,
    urineDiaper: 0,
    stoolDiaper: 0,
  },
  fevers: [{ temperature: "37.8", time: "11:00" }],
  milks: [
    { amountCc: "120", time: "09:00" },
    { amountCc: "100", time: "15:00" },
  ],
  remarks: "Had a great day! Played well with friends during outdoor time. Very social and cheerful.",
};

const portionColors: Record<string, string> = {
  NONE: "bg-red-100 text-red-700",
  LITTLE: "bg-orange-100 text-orange-700",
  HALF: "bg-yellow-100 text-yellow-700",
  MOST: "bg-blue-100 text-blue-700",
  ALL: "bg-green-100 text-green-700",
};

const moodEmojis: Record<string, string> = {
  HAPPY: "😊",
  CALM: "😌",
  FUSSY: "😤",
  CRYING: "😢",
  SLEEPY: "😴",
};

export default function ChildReportPage({ params }: Props) {
  const { id } = use(params);
  const child = demoChildren.find((c) => c.id === id) ?? demoChildren[0];

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
            <Select defaultValue="2025-02-21">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-02-21">Feb 21, 2025</SelectItem>
                <SelectItem value="2025-02-20">Feb 20, 2025</SelectItem>
                <SelectItem value="2025-02-19">Feb 19, 2025</SelectItem>
                <SelectItem value="2025-02-18">Feb 18, 2025</SelectItem>
              </SelectContent>
            </Select>
            <Badge className="bg-green-100 text-green-700">{demoReport.status}</Badge>
            <span className="text-sm text-muted-foreground">by {demoReport.createdBy}</span>
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
                { label: "Breakfast", data: demoReport.breakfast },
                { label: "Lunch", data: demoReport.lunch },
                { label: "Dessert", data: demoReport.dessert },
              ].map((meal) => (
                <div key={meal.label} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{meal.label}</p>
                    <p className="text-xs text-muted-foreground">{meal.data.food} · {meal.data.time}</p>
                  </div>
                  <Badge className={portionColors[meal.data.portion]}>{meal.data.portion}</Badge>
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
                <p className="text-3xl font-bold text-[#1caf9a]">{demoReport.sleep.duration}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {demoReport.sleep.from} — {demoReport.sleep.to}
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
                  <p className="text-xl font-bold">{demoReport.health.urinePotty}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Stool (Potty)</p>
                  <p className="text-xl font-bold">{demoReport.health.stoolPotty}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Urine (Diaper)</p>
                  <p className="text-xl font-bold">{demoReport.health.urineDiaper}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Stool (Diaper)</p>
                  <p className="text-xl font-bold">{demoReport.health.stoolDiaper}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {demoReport.health.cough && <Badge variant="destructive">Cough</Badge>}
                {demoReport.health.runnyNose && <Badge variant="destructive">Runny Nose</Badge>}
                {demoReport.health.vomit && <Badge variant="destructive">Vomit</Badge>}
                {demoReport.health.diarrhea && <Badge variant="destructive">Diarrhea</Badge>}
                {!demoReport.health.cough && !demoReport.health.runnyNose && !demoReport.health.vomit && !demoReport.health.diarrhea && (
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
                <p className="text-4xl">{moodEmojis[demoReport.health.mood]}</p>
                <p className="mt-1 text-sm font-medium">{demoReport.health.mood}</p>
              </div>

              {/* Fever Log */}
              {demoReport.fevers.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <Thermometer className="h-4 w-4 text-red-500" /> Fever Log
                  </p>
                  {demoReport.fevers.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{f.time}</span>
                      <Badge variant="destructive">{f.temperature}°C</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Milk Log */}
              {demoReport.milks.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <Baby className="h-4 w-4 text-blue-500" /> Milk Log
                  </p>
                  {demoReport.milks.map((m, i) => (
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
            <p className="text-sm text-muted-foreground">{demoReport.remarks}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
