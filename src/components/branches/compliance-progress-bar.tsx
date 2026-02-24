"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { complianceSections } from "@/lib/validations/branch";

interface Props {
  branchName: string;
  overallPercent: number;
  sectionCompletion: Record<string, { filled: number; total: number; percent: number }>;
  themeColor?: string;
}

export function ComplianceProgressBar({
  branchName,
  overallPercent,
  sectionCompletion,
  themeColor = "#1caf9a",
}: Props) {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-4">
      {/* Branch identity */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">{branchName}</p>
        <p className="text-xs text-muted-foreground">Government Compliance</p>

        {/* Circular progress */}
        <div className="mx-auto mt-4 flex size-24 items-center justify-center">
          <svg className="size-24 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted/50"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={themeColor}
              strokeWidth="3"
              strokeDasharray={`${overallPercent}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-lg font-bold text-foreground">
            {overallPercent}%
          </span>
        </div>
      </div>

      {/* Section checklist */}
      <div className="rounded-2xl border bg-card p-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sections
        </p>
        <ul className="space-y-1">
          {complianceSections.map((section) => {
            const completion = sectionCompletion[section.id];
            const isDone = completion && completion.percent === 100;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/80",
                    isDone ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isDone ? (
                    <CheckCircle2
                      className="size-4 shrink-0"
                      style={{ color: themeColor }}
                    />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className="flex-1 truncate">{section.title}</span>
                  {completion && (
                    <span className="text-xs text-muted-foreground/70">
                      {completion.filled}/{completion.total}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
