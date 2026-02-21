import { type LucideIcon } from "lucide-react";
import Link from "next/link";

export type StatCardColor =
  | "blue"
  | "blue-hoki"
  | "green"
  | "red"
  | "red-pink"
  | "purple"
  | "yellow";

const colorMap: Record<StatCardColor, string> = {
  blue: "stat-card-blue",
  "blue-hoki": "stat-card-blue-hoki",
  green: "stat-card-green",
  red: "stat-card-red",
  "red-pink": "stat-card-red-pink",
  purple: "stat-card-purple",
  yellow: "stat-card-yellow",
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: StatCardColor;
  href?: string;
}

export function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const content = (
    <div className={`${colorMap[color]} rounded-md p-5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider opacity-80">
            {title}
          </p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        <Icon className="h-12 w-12 opacity-30" />
      </div>
      {href && (
        <div className="mt-3 border-t border-white/20 pt-3">
          <span className="text-xs font-medium uppercase tracking-wider opacity-80 hover:opacity-100">
            View More →
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
