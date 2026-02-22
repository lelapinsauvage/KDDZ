"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  ChevronRight,
  Sparkles,
  DollarSign,
  FileWarning,
  UserX,
  FileEdit,
} from "lucide-react";
import { updateAbsenceReportStatus } from "@/lib/actions/absent-reports";
import type { ActionItems } from "@/lib/actions/dashboard";

interface ActionCenterProps {
  items: ActionItems;
}

type Severity = "red" | "amber" | "yellow";

interface ActionRow {
  key: string;
  severity: Severity;
  text: string;
  actionLabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  inlineAction?: React.ReactNode;
}

const severityOrder: Record<Severity, number> = { red: 0, amber: 1, yellow: 2 };

export function ActionCenter({ items }: ActionCenterProps) {
  const rows: ActionRow[] = [];

  // Overdue payments → red
  if (items.overduePayments.length > 0) {
    const total = items.overduePayments.reduce((s, p) => s + p.totalOverdue, 0);
    rows.push({
      key: "overdue-payments",
      severity: "red",
      text: `${items.overduePayments.length} overdue invoice${items.overduePayments.length > 1 ? "s" : ""} ($${total.toFixed(0)})`,
      actionLabel: "View",
      href: "/accounting",
      icon: DollarSign,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    });
  }

  // Missing reports → amber
  const totalMissing = items.missingReportsByClass.reduce((s, c) => s + c.count, 0);
  if (totalMissing > 0) {
    rows.push({
      key: "missing-reports",
      severity: "amber",
      text: `${totalMissing} daily report${totalMissing > 1 ? "s" : ""} missing`,
      actionLabel: "Remind",
      href: "/daily-reports",
      icon: FileWarning,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    });
  }

  // Pending absences → yellow (inline approve/reject)
  for (const absence of items.pendingAbsences) {
    rows.push({
      key: `absence-${absence.id}`,
      severity: "yellow",
      text: `Absence request: ${absence.childName} (${absence.date})`,
      actionLabel: "Review",
      href: `/absent-reports?status=PENDING`,
      icon: UserX,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      inlineAction: <AbsenceInlineAction id={absence.id} />,
    });
  }

  // Draft children → yellow
  for (const draft of items.draftChildren) {
    rows.push({
      key: `draft-${draft.id}`,
      severity: "yellow",
      text: `Draft registration: ${draft.childName}`,
      actionLabel: "Complete",
      href: `/children/${draft.id}/edit`,
      icon: FileEdit,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
    });
  }

  // Sort by severity
  rows.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100">
          <Sparkles className="size-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">All clear</p>
          <p className="text-xs text-emerald-600/80">
            Nothing needs your attention right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-sm">
      <div className="px-5 py-3 border-b border-border/30">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Needs your attention
        </h3>
      </div>
      <div className="divide-y divide-border/30">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
            >
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${row.iconBg}`}>
                <Icon className={`size-4 ${row.iconColor}`} />
              </div>
              <span className="flex-1 text-sm text-foreground">{row.text}</span>
              {row.inlineAction}
              <Link
                href={row.href}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {row.actionLabel}
                <ChevronRight className="size-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Inline absence approve/reject ────────────────

function AbsenceInlineAction({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAction(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await updateAbsenceReportStatus(id, status);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="size-7 rounded-lg p-0 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
        onClick={() => handleAction("APPROVED")}
        disabled={isPending}
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="size-7 rounded-lg p-0 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
        onClick={() => handleAction("REJECTED")}
        disabled={isPending}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
