import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

interface TodayMenuWidgetProps {
  breakfast: string | null;
  lunch: string | null;
  dessert: string | null;
  snack?: string | null;
}

export function TodayMenuWidget({ breakfast, lunch, dessert, snack }: TodayMenuWidgetProps) {
  const hasMenu = breakfast || lunch || dessert;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UtensilsCrossed className="size-4 text-primary" />
          Today&apos;s Menu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasMenu ? (
          <>
            <MenuRow label="Breakfast" value={breakfast} />
            <MenuRow label="Lunch" value={lunch} />
            <MenuRow label="Dessert" value={dessert} />
            {snack && <MenuRow label="Snack" value={snack} />}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No menu set for today.{" "}
            <Link href="/food/calendar" className="text-primary hover:underline">
              Set menu
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MenuRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {value ?? <span className="text-muted-foreground/50">Not set</span>}
      </span>
    </div>
  );
}
