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
  | "emerald"
  | "green";

const colorStyles: Record<
  StatCardColor,
  { bg: string; footer: string }
> = {
  blue:    { bg: "bg-[#327ad5]", footer: "bg-[#2a68b8]" },
  sky:     { bg: "bg-[#67809F]", footer: "bg-[#576d88]" },
  emerald: { bg: "bg-[#1caf9a]", footer: "bg-[#179483]" },
  green:   { bg: "bg-[#008200]", footer: "bg-[#006d00]" },
  rose:    { bg: "bg-[#d64635]", footer: "bg-[#b83b2d]" },
  amber:   { bg: "bg-[#c29d0b]", footer: "bg-[#a68709]" },
  purple:  { bg: "bg-[#8e44ad]", footer: "bg-[#783a93]" },
  teal:    { bg: "bg-[#0B9178]", footer: "bg-[#097a65]" },
  orange:  { bg: "bg-[#e7505a]", footer: "bg-[#c9444d]" },
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: StatCardColor;
  href?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: StatCardProps) {
  const styles = colorStyles[color];

  const content = (
    <div className={`group relative overflow-hidden rounded ${styles.bg} shadow-sm`}>
      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-white/80">{title}</p>
        </div>
        <Icon className="size-14 text-white/20" strokeWidth={1.2} />
      </div>

      {href && (
        <div
          className={`${styles.footer} px-4 py-2 text-center`}
        >
          <span className="text-xs font-medium text-white/90 group-hover:text-white">
            View More &rarr;
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
