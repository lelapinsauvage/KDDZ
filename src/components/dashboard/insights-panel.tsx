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
    bg: "bg-[#5B7B5E]/8",
    iconColor: "text-[#5B7B5E]",
    textColor: "text-[#5B7B5E]",
  },
  neutral: {
    icon: Minus,
    bg: "bg-[#8B7355]/8",
    iconColor: "text-[#8B7355]",
    textColor: "text-[#8B7355]",
  },
  warning: {
    icon: TrendingDown,
    bg: "bg-[#C35A2C]/8",
    iconColor: "text-[#C35A2C]",
    textColor: "text-[#C35A2C]",
  },
} as const;

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Lightbulb className="size-4 text-[#B08968]" />
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
