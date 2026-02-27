import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UtensilsCrossed,
  Coffee,
  Cake,
  Cookie,
  Pencil,
} from "lucide-react";

interface TodayMenuWidgetProps {
  breakfast: string | null;
  lunch: string | null;
  dessert: string | null;
  snack?: string | null;
}

const mealConfig = [
  { key: "breakfast" as const, label: "Breakfast", icon: Coffee, iconColor: "text-[#B08968]", iconBg: "bg-[#B08968]/10" },
  { key: "lunch" as const, label: "Lunch", icon: UtensilsCrossed, iconColor: "text-[#C35A2C]", iconBg: "bg-[#C35A2C]/10" },
  { key: "dessert" as const, label: "Dessert", icon: Cake, iconColor: "text-[#B07070]", iconBg: "bg-[#B07070]/10" },
  { key: "snack" as const, label: "Snack", icon: Cookie, iconColor: "text-[#6B8F71]", iconBg: "bg-[#6B8F71]/10" },
] as const;

export function TodayMenuWidget({ breakfast, lunch, dessert, snack }: TodayMenuWidgetProps) {
  const meals = { breakfast, lunch, dessert, snack } as Record<string, string | null | undefined>;
  const hasMenu = breakfast || lunch || dessert;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="size-4 text-primary" />
            Today&apos;s Menu
          </CardTitle>
          <Link
            href="/food/calendar"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3" />
            Edit
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {hasMenu ? (
          <>
            {mealConfig.map((meal) => {
              const value = meals[meal.key];
              if (meal.key === "snack" && !value) return null;
              return (
                <MealRow
                  key={meal.key}
                  label={meal.label}
                  value={value ?? null}
                  icon={meal.icon}
                  iconColor={meal.iconColor}
                  iconBg={meal.iconBg}
                />
              );
            })}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <UtensilsCrossed className="size-5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No menu set for today
              </p>
              <Link
                href="/food/calendar"
                className="text-xs text-primary hover:underline"
              >
                Add today&apos;s menu
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MealRow({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string | null;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
      <div className={`flex size-7 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`size-3.5 ${iconColor}`} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-16">{label}</span>
      <span className="flex-1 text-sm font-medium text-right">
        {value ?? <span className="text-muted-foreground/40 italic">Not set</span>}
      </span>
    </div>
  );
}
