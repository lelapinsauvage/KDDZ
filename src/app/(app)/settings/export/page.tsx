"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Users,
  FileText,
  HeartPulse,
  DollarSign,
  CalendarCheck,
} from "lucide-react";

interface ExportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  formats: string[];
  hasDateRange: boolean;
}

const exportCards: ExportCard[] = [
  {
    id: "children",
    title: "Children Data",
    description: "Export all children records including personal info, classes, and parent contacts.",
    icon: <Users className="size-5 text-[#1caf9a]" />,
    formats: ["CSV", "Excel"],
    hasDateRange: false,
  },
  {
    id: "daily-reports",
    title: "Daily Reports",
    description: "Export daily activity reports with meals, naps, and activities.",
    icon: <FileText className="size-5 text-blue-500" />,
    formats: ["CSV", "Excel"],
    hasDateRange: true,
  },
  {
    id: "medical",
    title: "Medical Records",
    description: "Export medical records including vaccinations, conditions, and visit history.",
    icon: <HeartPulse className="size-5 text-red-500" />,
    formats: ["PDF"],
    hasDateRange: false,
  },
  {
    id: "financial",
    title: "Financial Reports",
    description: "Export payment records, invoices, and financial summaries.",
    icon: <DollarSign className="size-5 text-amber-500" />,
    formats: ["CSV", "Excel"],
    hasDateRange: true,
  },
  {
    id: "attendance",
    title: "Attendance Records",
    description: "Export check-in/check-out logs and attendance summaries.",
    icon: <CalendarCheck className="size-5 text-purple-500" />,
    formats: ["CSV"],
    hasDateRange: true,
  },
];

export default function ExportDatabasePage() {
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({
    children: "CSV",
    "daily-reports": "CSV",
    medical: "PDF",
    financial: "CSV",
    attendance: "CSV",
  });
  const [dateRanges, setDateRanges] = useState<Record<string, { from: string; to: string }>>({
    "daily-reports": { from: "2026-02-01", to: "2026-02-21" },
    financial: { from: "2026-01-01", to: "2026-02-21" },
    attendance: { from: "2026-02-01", to: "2026-02-21" },
  });
  const [exporting, setExporting] = useState<string | null>(null);

  function handleExport(cardId: string) {
    setExporting(cardId);
    setTimeout(() => setExporting(null), 1500);
  }

  return (
    <>
      <PageHeader
        title="Export Data"
        breadcrumbs={[
          { label: "Settings", href: "/settings/export" },
          { label: "Export Data" },
        ]}
      />

      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exportCards.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {card.icon}
                  <div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <CardDescription className="mt-1">{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Format</Label>
                  <Select
                    value={selectedFormats[card.id]}
                    onValueChange={(v) =>
                      setSelectedFormats((prev) => ({ ...prev, [card.id]: v }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {card.formats.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {card.hasDateRange && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">From</Label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={dateRanges[card.id]?.from ?? ""}
                        onChange={(e) =>
                          setDateRanges((prev) => ({
                            ...prev,
                            [card.id]: { ...prev[card.id], from: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">To</Label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={dateRanges[card.id]?.to ?? ""}
                        onChange={(e) =>
                          setDateRanges((prev) => ({
                            ...prev,
                            [card.id]: { ...prev[card.id], to: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-[#1caf9a] text-white hover:bg-[#18a08d]"
                  onClick={() => handleExport(card.id)}
                  disabled={exporting === card.id}
                >
                  <Download className="mr-1 size-4" />
                  {exporting === card.id ? "Exporting..." : "Export"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
