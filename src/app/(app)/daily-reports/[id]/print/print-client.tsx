"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { format } from "date-fns";

interface FeverEntry {
  temperature: number;
  time: string;
}

interface MilkEntry {
  amountCc: number;
  time: string;
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
  isSleep: boolean;
  sleepFrom: string | null;
  sleepTo: string | null;
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
}

function formatPortion(portion: string | null): string {
  if (!portion) return "N/A";
  const map: Record<string, string> = {
    ALL: "All",
    MOST: "Most",
    HALF: "Half",
    LITTLE: "Little",
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

export function DailyReportPrintClient({ report }: { report: ReportData }) {
  const healthSymptoms = [
    report.diarrhea && "Diarrhea",
    report.cough && "Cough",
    report.runnyNose && "Runny Nose",
    report.vomit && "Vomit",
  ].filter(Boolean);

  return (
    <>
      {/* Screen-only header */}
      <div className="print:hidden">
        <PageHeader
          title="Print Daily Report"
          breadcrumbs={[
            { label: "Daily Reports", href: "/daily-reports" },
            { label: "Print" },
          ]}
          actions={
            <Button
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => window.print()}
            >
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          }
        />
      </div>

      {/* Printable content */}
      <div className="mx-auto max-w-2xl p-6 print:max-w-none print:p-0 print:text-black">
        {/* Nursery branding */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground print:text-black">
            KiddzOnline
          </h1>
          <p className="text-sm text-muted-foreground print:text-gray-600">
            Daily Report
          </p>
        </div>

        {/* Child & Date info */}
        <div className="mb-6 rounded-lg border border-border p-4 print:border-gray-300 print:rounded-none" style={{ breakInside: "avoid" }}>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div>
              <span className="font-semibold">Child:</span>{" "}
              {report.childName}
            </div>
            <div>
              <span className="font-semibold">Date:</span>{" "}
              {format(new Date(report.date), "EEEE, MMMM d, yyyy")}
            </div>
            {report.className && (
              <div>
                <span className="font-semibold">Class:</span>{" "}
                {report.className}
              </div>
            )}
            {report.branchName && (
              <div>
                <span className="font-semibold">Branch:</span>{" "}
                {report.branchName}
              </div>
            )}
            <div>
              <span className="font-semibold">Status:</span>{" "}
              {report.status}
            </div>
          </div>
        </div>

        {/* Meals */}
        <div className="mb-5" style={{ breakInside: "avoid" }}>
          <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
            Meals
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs font-semibold uppercase text-muted-foreground print:border-gray-200 print:text-gray-500">
                <th className="pb-1.5 pr-4">Meal</th>
                <th className="pb-1.5 pr-4">Food</th>
                <th className="pb-1.5">Portion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 print:divide-gray-200">
              <tr>
                <td className="py-1.5 pr-4 font-medium">Breakfast</td>
                <td className="py-1.5 pr-4">{report.breakfastFood ?? "—"}</td>
                <td className="py-1.5">{formatPortion(report.breakfastPortion)}</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4 font-medium">Lunch</td>
                <td className="py-1.5 pr-4">{report.lunchFood ?? "—"}</td>
                <td className="py-1.5">{formatPortion(report.lunchPortion)}</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4 font-medium">Dessert</td>
                <td className="py-1.5 pr-4">{report.dessert ?? "—"}</td>
                <td className="py-1.5">{formatPortion(report.dessertPortion)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Milk feedings */}
        {report.milks.length > 0 && (
          <div className="mb-5" style={{ breakInside: "avoid" }}>
            <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
              Milk Feedings
            </h2>
            <div className="space-y-1 text-sm">
              {report.milks.map((m, i) => (
                <div key={i} className="flex gap-4">
                  <span>{formatTime(m.time)}</span>
                  <span>{m.amountCc} cc</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sleep */}
        <div className="mb-5" style={{ breakInside: "avoid" }}>
          <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
            Sleep
          </h2>
          <p className="text-sm">
            {report.isSleep ? (
              <>
                Slept
                {report.sleepFrom && report.sleepTo && (
                  <> from {formatTime(report.sleepFrom)} to {formatTime(report.sleepTo)}</>
                )}
              </>
            ) : (
              "No nap today"
            )}
          </p>
        </div>

        {/* Health / Mood */}
        <div className="mb-5" style={{ breakInside: "avoid" }}>
          <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
            Health &amp; Mood
          </h2>
          <div className="space-y-1.5 text-sm">
            {report.mood && (
              <div>
                <span className="font-semibold">Mood:</span>{" "}
                {formatMood(report.mood)}
              </div>
            )}
            {healthSymptoms.length > 0 ? (
              <div>
                <span className="font-semibold">Symptoms:</span>{" "}
                {healthSymptoms.join(", ")}
              </div>
            ) : (
              <div>
                <span className="font-semibold">Symptoms:</span> None
              </div>
            )}
            {report.fevers.length > 0 && (
              <div>
                <span className="font-semibold">Fever readings:</span>
                {report.fevers.map((f, i) => (
                  <span key={i} className="ml-2">
                    {f.temperature}°C at {formatTime(f.time)}
                    {i < report.fevers.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Potty / Diaper */}
        {(report.urinePotty > 0 || report.stoolPotty > 0 || report.urineDiaper > 0 || report.stoolDiaper > 0) && (
          <div className="mb-5" style={{ breakInside: "avoid" }}>
            <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
              Potty / Diaper
            </h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {report.urinePotty > 0 && <div>Urine (potty): {report.urinePotty}x</div>}
              {report.stoolPotty > 0 && <div>Stool (potty): {report.stoolPotty}x</div>}
              {report.urineDiaper > 0 && <div>Urine (diaper): {report.urineDiaper}x</div>}
              {report.stoolDiaper > 0 && <div>Stool (diaper): {report.stoolDiaper}x</div>}
            </div>
          </div>
        )}

        {/* Remarks */}
        {report.remarks && (
          <div className="mb-5" style={{ breakInside: "avoid" }}>
            <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
              Teacher Remarks
            </h2>
            <p className="whitespace-pre-wrap text-sm">{report.remarks}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground print:border-gray-300 print:text-gray-500">
          <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
      </div>
    </>
  );
}
