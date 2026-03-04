import { Lightbulb, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Insight {
  text: string;
  type: "positive" | "neutral" | "warning";
}

interface InsightsPanelProps {
  insights: Insight[];
}

/* Design system semantic colors */
const insightStyles = {
  positive: {
    icon: TrendingUp,
    bg: "bg-[#ECFDF5]",
    iconColor: "text-[#16A34A]",
    textColor: "text-[#15803D]",
  },
  neutral: {
    icon: Minus,
    bg: "bg-[#EFF6FF]",
    iconColor: "text-[#2563EB]",
    textColor: "text-[#1D4ED8]",
  },
  warning: {
    icon: TrendingDown,
    bg: "bg-[#FEF2F2]",
    iconColor: "text-[#DC2626]",
    textColor: "text-[#B91C1C]",
  },
} as const;

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-sm border border-border bg-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        <Lightbulb className="size-4 text-[#D97706]" />
        Insights
      </h3>
      <div className="flex flex-wrap gap-2">
        {insights.map((insight, i) => {
          const style = insightStyles[insight.type];
          const Icon = style.icon;
          return (
            <div
              key={i}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 ${style.bg}`}
            >
              <Icon className={`size-3.5 shrink-0 ${style.iconColor}`} />
              <span className={`text-xs font-medium ${style.textColor}`}>
                {insight.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
