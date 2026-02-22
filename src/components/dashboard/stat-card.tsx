import { type LucideIcon } from "lucide-react";
import Link from "next/link";

export type StatCardColor =
  | "teal"
  | "blue"
  | "purple"
  | "rose"
  | "amber"
  | "orange"
  | "sky"
  | "emerald";

const colorStyles: Record<StatCardColor, { bg: string; icon: string; text: string }> = {
  teal: { bg: "bg-teal-50", icon: "text-teal-600 bg-teal-100", text: "text-teal-700" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600 bg-blue-100", text: "text-blue-700" },
  purple: { bg: "bg-violet-50", icon: "text-violet-600 bg-violet-100", text: "text-violet-700" },
  rose: { bg: "bg-rose-50", icon: "text-rose-600 bg-rose-100", text: "text-rose-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600 bg-amber-100", text: "text-amber-700" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600 bg-orange-100", text: "text-orange-700" },
  sky: { bg: "bg-sky-50", icon: "text-sky-600 bg-sky-100", text: "text-sky-700" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600 bg-emerald-100", text: "text-emerald-700" },
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: StatCardColor;
  href?: string;
}

export function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const styles = colorStyles[color];

  const content = (
    <div className={`rounded-2xl border border-border/50 bg-white p-5 shadow-sm transition-all hover:shadow-md ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className={`text-3xl font-bold tracking-tight ${styles.text}`}>{value}</p>
        </div>
        <div className={`flex size-11 items-center justify-center rounded-xl ${styles.icon}`}>
          <Icon className="size-5" />
        </div>
      </div>
      {href && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <span className={`text-xs font-medium ${styles.text}`}>
            View details &rarr;
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
