"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cake,
  ClipboardCheck,
  Syringe,
  Stethoscope,
  Pill,
  CalendarDays,
  Shield,
  DollarSign,
  MessageSquare,
  FileText,
  Bell,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { AlarmCountItem } from "@/lib/actions/alarms";

const iconMap: Record<string, LucideIcon> = {
  Cake,
  ClipboardCheck,
  Syringe,
  Stethoscope,
  Pill,
  CalendarDays,
  Shield,
  DollarSign,
  MessageSquare,
  FileText,
  Bell,
};

interface AlarmsOverviewClientProps {
  counts: AlarmCountItem[];
  totalActive: number;
}

export function AlarmsOverviewClient({
  counts,
  totalActive,
}: AlarmsOverviewClientProps) {
  return (
    <>
      <PageHeader
        title="Alarms & Notifications"
        breadcrumbs={[{ label: "Alarms" }]}
      />
      <div className="space-y-6 p-4 md:p-6">
        {/* Total summary */}
        <Card className="py-4">
          <CardContent className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="size-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Active Alerts
              </p>
              <p className="text-2xl font-semibold text-[#333]">
                {totalActive}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alarm type cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {counts.map((item) => {
            const Icon = iconMap[item.icon] ?? Bell;
            const [bgClass, textClass] = item.color.split(" ");

            return (
              <Link key={item.type} href={item.href}>
                <Card className="group cursor-pointer py-4 transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4">
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg ${bgClass}`}
                    >
                      <Icon className={`size-5 ${textClass}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#333] group-hover:text-[#1caf9a]">
                        {item.label}
                      </p>
                      <div className="flex items-center gap-2">
                        {item.count > 0 ? (
                          <Badge className="bg-red-100 text-red-700">
                            {item.count} active
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No active alerts
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
