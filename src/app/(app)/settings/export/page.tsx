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
import { getChildren } from "@/lib/actions/children";
import { getEmployees } from "@/lib/actions/employees";
import { getDailyReports } from "@/lib/actions/daily-reports";
import { getPayments } from "@/lib/actions/payments";
import { getMedicalForms } from "@/lib/actions/medical";

// ── Export-specific row types ────────────────────
interface ExportChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string | null;
  gender: string | null;
  branch?: { name: string } | null;
  class?: { name: string } | null;
  isActive: boolean;
  enrollmentDate: Date | string | null;
}

interface ExportEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  branch?: { name: string } | null;
  isActive: boolean;
  type?: string;
}

interface ExportDailyReport {
  id: string;
  child?: { firstName: string; lastName: string } | null;
  reportDate: Date | string | null;
  status: string | null;
  mood: string | null;
  remarks: string | null;
}

interface ExportMedicalForm {
  id: string;
  child?: { firstName: string; lastName: string } | null;
  formType: string | null;
  status: string | null;
  createdAt: Date | string | null;
}

interface ExportPayment {
  id: string;
  child?: { firstName: string; lastName: string } | null;
  amount: number | null;
  date: Date | string | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
}

interface ExportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  formats: string[];
  hasDateRange: boolean;
}

const exportCards: ExportCard[] = [
  {
    id: "children",
    title: "Children Data",
    description: "All children records including personal info, classes, and parent contacts.",
    icon: <Users className="size-5 text-primary" />,
    iconBg: "bg-primary/10",
    formats: ["CSV", "Excel"],
    hasDateRange: false,
  },
  {
    id: "daily-reports",
    title: "Daily Reports",
    description: "Daily activity reports with meals, naps, and activities.",
    icon: <FileText className="size-5 text-blue-600" />,
    iconBg: "bg-blue-50",
    formats: ["CSV", "Excel"],
    hasDateRange: true,
  },
  {
    id: "medical",
    title: "Medical Records",
    description: "Medical records including vaccinations, conditions, and visit history.",
    icon: <HeartPulse className="size-5 text-rose-600" />,
    iconBg: "bg-rose-50",
    formats: ["CSV"],
    hasDateRange: false,
  },
  {
    id: "financial",
    title: "Financial Reports",
    description: "Payment records, invoices, and financial summaries.",
    icon: <DollarSign className="size-5 text-amber-600" />,
    iconBg: "bg-amber-50",
    formats: ["CSV", "Excel"],
    hasDateRange: true,
  },
  {
    id: "employees",
    title: "Employee Records",
    description: "All employee records (teachers, nurses, doctors, managers).",
    icon: <CalendarCheck className="size-5 text-[#4F46E5]" />,
    iconBg: "bg-[#4F46E5]/10",
    formats: ["CSV"],
    hasDateRange: false,
  },
];

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportDatabasePage() {
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({
    children: "CSV",
    "daily-reports": "CSV",
    medical: "CSV",
    financial: "CSV",
    employees: "CSV",
  });
  const [dateRanges, setDateRanges] = useState<Record<string, { from: string; to: string }>>({
    "daily-reports": { from: "2026-02-01", to: "2026-02-21" },
    financial: { from: "2026-01-01", to: "2026-02-21" },
  });
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExport(cardId: string) {
    setExporting(cardId);
    try {
      switch (cardId) {
        case "children": {
          const result = await getChildren({ pageSize: 10000 });
          const children = result.children ?? [];
          const headers = ["ID", "First Name", "Last Name", "Date of Birth", "Gender", "Branch", "Class", "Active", "Enrollment Date"];
          const rows = children.map((c: ExportChild) => [
            escapeCSV(c.id),
            escapeCSV(c.firstName),
            escapeCSV(c.lastName),
            escapeCSV(c.dateOfBirth ? new Date(c.dateOfBirth).toISOString().split("T")[0] : ""),
            escapeCSV(c.gender),
            escapeCSV(c.branch?.name),
            escapeCSV(c.class?.name),
            escapeCSV(c.isActive ? "Yes" : "No"),
            escapeCSV(c.enrollmentDate ? new Date(c.enrollmentDate).toISOString().split("T")[0] : ""),
          ].join(","));
          const csv = [headers.join(","), ...rows].join("\n");
          triggerDownload("children-export.csv", csv);
          break;
        }
        case "employees": {
          const types = ["teacher", "nurse", "doctor", "manager"] as const;
          const allEmployees: ExportEmployee[] = [];
          for (const type of types) {
            const result = await getEmployees(type, { pageSize: 10000 });
            const data = result.data as Record<string, unknown> | undefined;
            const employees = (data?.employees ?? []) as ExportEmployee[];
            for (const emp of employees) {
              allEmployees.push({ ...emp, type });
            }
          }
          const headers = ["ID", "Type", "First Name", "Last Name", "Email", "Phone", "Branch", "Active"];
          const rows = allEmployees.map((e) => [
            escapeCSV(e.id),
            escapeCSV(e.type),
            escapeCSV(e.firstName),
            escapeCSV(e.lastName),
            escapeCSV(e.email),
            escapeCSV(e.phone),
            escapeCSV(e.branch?.name),
            escapeCSV(e.isActive ? "Yes" : "No"),
          ].join(","));
          const csv = [headers.join(","), ...rows].join("\n");
          triggerDownload("employees-export.csv", csv);
          break;
        }
        case "daily-reports": {
          const range = dateRanges["daily-reports"];
          const result = await getDailyReports({
            dateFrom: range?.from,
            dateTo: range?.to,
            pageSize: 10000,
          });
          const reports = result.reports ?? [];
          const headers = ["ID", "Child", "Date", "Status", "Mood", "Remarks"];
          const rows = reports.map((r: ExportDailyReport) => [
            escapeCSV(r.id),
            escapeCSV(`${r.child?.firstName ?? ""} ${r.child?.lastName ?? ""}`),
            escapeCSV(r.reportDate ? new Date(r.reportDate).toISOString().split("T")[0] : ""),
            escapeCSV(r.status),
            escapeCSV(r.mood),
            escapeCSV(r.remarks),
          ].join(","));
          const csv = [headers.join(","), ...rows].join("\n");
          triggerDownload("daily-reports-export.csv", csv);
          break;
        }
        case "medical": {
          const result = await getMedicalForms({ pageSize: 10000 });
          const forms = result.forms ?? [];
          const headers = ["ID", "Child", "Form Type", "Status", "Created At"];
          const rows = forms.map((f: ExportMedicalForm) => [
            escapeCSV(f.id),
            escapeCSV(`${f.child?.firstName ?? ""} ${f.child?.lastName ?? ""}`),
            escapeCSV(f.formType),
            escapeCSV(f.status),
            escapeCSV(f.createdAt ? new Date(f.createdAt).toISOString().split("T")[0] : ""),
          ].join(","));
          const csv = [headers.join(","), ...rows].join("\n");
          triggerDownload("medical-records-export.csv", csv);
          break;
        }
        case "financial": {
          const range = dateRanges["financial"];
          const result = await getPayments({
            dateFrom: range?.from,
            dateTo: range?.to,
            pageSize: 10000,
          });
          const data = result.data as Record<string, unknown> | undefined;
          const payments = (data?.payments ?? []) as ExportPayment[];
          const headers = ["ID", "Child", "Amount", "Date", "Method", "Reference", "Notes"];
          const rows = payments.map((p: ExportPayment) => [
            escapeCSV(p.id),
            escapeCSV(`${p.child?.firstName ?? ""} ${p.child?.lastName ?? ""}`),
            escapeCSV(p.amount),
            escapeCSV(p.date ? new Date(p.date).toISOString().split("T")[0] : ""),
            escapeCSV(p.method),
            escapeCSV(p.reference),
            escapeCSV(p.notes),
          ].join(","));
          const csv = [headers.join(","), ...rows].join("\n");
          triggerDownload("financial-export.csv", csv);
          break;
        }
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Export Data"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Export" },
        ]}
      />

      <div className="p-4 md:p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exportCards.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                    {card.icon}
                  </div>
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
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
