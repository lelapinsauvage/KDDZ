import { Lightbulb, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Insight {
  text: string;
  type: "positive" | "neutral" | "warning";
}

interface InsightsPanelProps {
  insights: Insight[];
}

const insightStyles = {
  positive: {
    icon: TrendingUp,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    textColor: "text-emerald-800",
  },
  neutral: {
    icon: Minus,
    bg: "bg-slate-50",
    iconColor: "text-slate-500",
    textColor: "text-slate-700",
  },
  warning: {
    icon: TrendingDown,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    textColor: "text-amber-800",
  },
} as const;

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Lightbulb className="size-4 text-amber-500" />
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
