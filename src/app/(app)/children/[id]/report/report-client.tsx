"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import {
  Utensils,
  Moon,
  Droplets,
  SmilePlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
}

interface ReportRow {
  id: string;
  date: string;
  status: string;
  breakfastPortion: string | null;
  breakfastTime: string | null;
  lunchPortion: string | null;
  lunchTime: string | null;
  dessertPortion: string | null;
  dessertTime: string | null;
  sleepFrom: string | null;
  sleepTo: string | null;
  sleepDuration: string;
  mood: string | null;
  cough: boolean;
  runnyNose: boolean;
  vomit: boolean;
  diarrhea: boolean;
  urinePotty: number;
  stoolPotty: number;
  urineDiaper: number;
  stoolDiaper: number;
  remarks: string | null;
}

interface Props {
  child: ChildData;
  reports: ReportRow[];
  total: number;
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

const columns: ColumnDef<ReportRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-medium">{row.original.date}</span>,
  },
  {
    id: "breakfast",
    header: "Breakfast",
    cell: ({ row }) => {
      const p = row.original.breakfastPortion;
      if (!p) return "\u2014";
      return <Badge className={portionColors[p] ?? "bg-gray-100 text-gray-700"}>{p}</Badge>;
    },
  },
  {
    id: "lunch",
    header: "Lunch",
    cell: ({ row }) => {
      const p = row.original.lunchPortion;
      if (!p) return "\u2014";
      return <Badge className={portionColors[p] ?? "bg-gray-100 text-gray-700"}>{p}</Badge>;
    },
  },
  {
    id: "dessert",
    header: "Dessert",
    cell: ({ row }) => {
      const p = row.original.dessertPortion;
      if (!p) return "\u2014";
      return <Badge className={portionColors[p] ?? "bg-gray-100 text-gray-700"}>{p}</Badge>;
    },
  },
  {
    id: "sleep",
    header: "Sleep",
    cell: ({ row }) => (
      <div className="text-center">
        <div className="text-sm">{row.original.sleepDuration}</div>
        {row.original.sleepFrom && row.original.sleepTo && (
          <div className="text-xs text-muted-foreground">
            {row.original.sleepFrom} - {row.original.sleepTo}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "mood",
    header: "Mood",
    cell: ({ row }) => {
      const mood = row.original.mood;
      if (!mood) return "\u2014";
      return (
        <span title={mood}>
          {moodEmojis[mood] ?? mood}
        </span>
      );
    },
  },
  {
    id: "symptoms",
    header: "Symptoms",
    cell: ({ row }) => {
      const symptoms = [
        row.original.cough && "Cough",
        row.original.runnyNose && "Runny Nose",
        row.original.vomit && "Vomit",
        row.original.diarrhea && "Diarrhea",
      ].filter((s): s is string => Boolean(s));
      if (symptoms.length === 0) return <span className="text-green-600 text-xs">None</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {symptoms.map((s) => (
            <Badge key={s} variant="destructive" className="text-[10px] px-1 py-0">
              {s}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={row.original.status === "SUBMITTED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
        {row.original.status}
      </Badge>
    ),
  },
];

export function ReportClient({ child, reports, total }: Props) {
  const id = child.id;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const expandedReport = expandedId ? reports.find((r) => r.id === expandedId) : null;

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Daily Reports`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
          { label: "Reports" },
        ]}
      />

      <div className="space-y-4 p-4 md:space-y-6 md:p-6">
        <div className="text-sm text-muted-foreground">
          {total} daily report(s) on record
        </div>

        <DataTable
          columns={[
            ...columns,
            {
              id: "expand",
              header: "",
              cell: ({ row }) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setExpandedId(expandedId === row.original.id ? null : row.original.id)
                  }
                >
                  {expandedId === row.original.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              ),
              enableSorting: false,
            },
          ]}
          data={reports}
          searchKey="date"
          searchPlaceholder="Search by date..."
        />

        {/* Expanded detail */}
        {expandedReport && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Report Details — {expandedReport.date}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Meals */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Utensils className="h-4 w-4" /> Meals
                  </h4>
                  {[
                    { label: "Breakfast", portion: expandedReport.breakfastPortion, time: expandedReport.breakfastTime },
                    { label: "Lunch", portion: expandedReport.lunchPortion, time: expandedReport.lunchTime },
                    { label: "Dessert", portion: expandedReport.dessertPortion, time: expandedReport.dessertTime },
                  ].map((meal) => (
                    <div key={meal.label} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">{meal.label}</p>
                        <p className="text-xs text-muted-foreground">{meal.time ?? "N/A"}</p>
                      </div>
                      {meal.portion && (
                        <Badge className={portionColors[meal.portion] ?? "bg-gray-100 text-gray-700"}>
                          {meal.portion}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Sleep */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Moon className="h-4 w-4" /> Sleep
                  </h4>
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-3xl font-bold text-[#1caf9a]">{expandedReport.sleepDuration}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {expandedReport.sleepFrom ?? "\u2014"} — {expandedReport.sleepTo ?? "\u2014"}
                    </p>
                  </div>
                </div>

                {/* Health */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Droplets className="h-4 w-4" /> Health & Hygiene
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Urine (Potty)</p>
                      <p className="text-xl font-bold">{expandedReport.urinePotty}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Stool (Potty)</p>
                      <p className="text-xl font-bold">{expandedReport.stoolPotty}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Urine (Diaper)</p>
                      <p className="text-xl font-bold">{expandedReport.urineDiaper}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Stool (Diaper)</p>
                      <p className="text-xl font-bold">{expandedReport.stoolDiaper}</p>
                    </div>
                  </div>
                </div>

                {/* Mood */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <SmilePlus className="h-4 w-4" /> Mood
                  </h4>
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-4xl">
                      {expandedReport.mood ? (moodEmojis[expandedReport.mood] ?? "") : "\u2014"}
                    </p>
                    <p className="mt-1 text-sm font-medium">{expandedReport.mood ?? "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {expandedReport.remarks && (
                <div className="mt-6 rounded-md border p-4">
                  <p className="text-sm font-semibold">Remarks</p>
                  <p className="mt-1 text-sm text-muted-foreground">{expandedReport.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
